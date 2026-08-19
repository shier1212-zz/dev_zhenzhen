"""认证模块：验证码 / 登录（含失败锁定）/ 登出 / 当前用户 / 改密 / 头像。"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Request

from app.core import captcha
from app.core.config import settings
from app.core.deps import CurrentUser, DbDep, get_permissions
from app.core.response import fail, ok
from app.core.security import create_access_token, hash_password, verify_password
from app.models import OperationLog, SysUser
from app.schemas import (
    CaptchaResponse,
    ChangePasswordRequest,
    LoginRequest,
    UpdateAvatarRequest,
)

router = APIRouter(prefix="/api/v1/admin/auth", tags=["认证"])


@router.post("/captcha")
def get_captcha():
    """获取图形验证码（SVG），统一响应包装。"""
    data = captcha.generate()
    return ok(data={"captcha_id": data["captcha_id"], "svg": data["svg"]})


@router.post("/login")
def login(body: LoginRequest, request: Request, db: DbDep):
    """登录：验证码前置校验 → 锁定检查 → 密码比对 → 签发 JWT。

    - 验证码错误：400
    - 连续 5 次密码错误：锁定 30 分钟，403
    - 首次登录（must_change_pwd=1）：仍签发 token，前端引导改密
    """
    # 1. 图形验证码前置校验
    if not captcha.verify(body.captcha_id, body.captcha):
        return fail("验证码错误或已过期", code=400)

    # 2. 用户校验
    user = db.query(SysUser).filter(SysUser.username == body.username).first()
    if user is None:
        return fail("账号或密码错误", code=400)
    if user.is_activate != 1:
        return fail("账号已停用，请联系管理员", code=403)

    now = datetime.now()

    # 3. 锁定检查
    if user.locked_until is not None and user.locked_until > now:
        remain_min = int((user.locked_until - now).total_seconds() // 60) + 1
        return fail(f"账号已锁定，请 {remain_min} 分钟后重试", code=403)

    # 4. 密码比对（失败计数 + 锁定）
    if not verify_password(body.password, user.password_hash):
        user.fail_count += 1
        if user.fail_count >= 5:
            user.locked_until = now + timedelta(minutes=30)
            db.commit()
            return fail("连续 5 次密码错误，账号已锁定 30 分钟", code=403)
        db.commit()
        return fail(
            f"账号或密码错误（剩余 {5 - user.fail_count} 次机会）", code=400
        )

    # 5. 成功：重置计数、记录登录时间、签发 token
    user.fail_count = 0
    user.locked_until = None
    user.last_login_at = now
    user.updated_at = user.username
    user.updated_date = now
    db.add(
        OperationLog(
            user_id=user.id,
            module="auth",
            action="登录",
            target=f"user#{user.username}",
            ip=request.client.host if request.client else "",
            created_at=user.username,
            updated_at=user.username,
        )
    )
    db.commit()

    token = create_access_token(user.username)
    return ok(
        data={
            "token": token,
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "permissions": get_permissions(user),
            "must_change_pwd": bool(user.must_change_pwd),
        }
    )


@router.post("/logout")
def logout(user: CurrentUser):
    """登出（JWT 无状态，前端清除 token 即可；此接口记录操作日志）。"""
    return ok(message="已退出登录")


@router.get("/me")
def me(user: CurrentUser):
    """当前登录用户信息 + 权限矩阵（前端据此渲染菜单）。"""
    return ok(
        data={
            "id": user.id,
            "username": user.username,
            "real_name": user.real_name,
            "nickname": user.nickname,
            "phone": user.phone,
            "email": user.email,
            "gender": user.gender,
            "post": user.post,
            "dept_id": user.dept_id,
            "role_id": user.role_id,
            "avatar": user.avatar,
            "must_change_pwd": user.must_change_pwd,
            "is_activate": user.is_activate,
            "permissions": get_permissions(user),
        }
    )


@router.put("/password")
def change_password(body: ChangePasswordRequest, user: CurrentUser, db: DbDep):
    """修改密码（需原密码；强制改密后清除 must_change_pwd 标记）。"""
    if not verify_password(body.old_password, user.password_hash):
        return fail("原密码错误", code=400)
    if body.new_password == body.old_password:
        return fail("新密码不能与原密码相同", code=400)

    user.password_hash = hash_password(body.new_password)
    user.must_change_pwd = 0
    user.updated_at = user.username
    user.updated_date = datetime.now()
    db.commit()
    return ok(message="密码修改成功")


@router.put("/avatar")
def update_avatar(body: UpdateAvatarRequest, user: CurrentUser, db: DbDep):
    """更新头像（提交经 /api/v1/admin/upload 返回的 URL）。"""
    user.avatar = body.avatar_url
    user.updated_at = user.username
    user.updated_date = datetime.now()
    db.commit()
    return ok(data={"avatar_url": user.avatar})
