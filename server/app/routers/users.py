"""账号管理：CRUD + 启停 + 重置密码（删除约束：存在操作日志 → 409 建议停用）。"""
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.exc import IntegrityError

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import fail, ok
from app.core.security import hash_password
from app.models import Department, OperationLog, Role, SysUser
from app.schemas import UserCreate, UserUpdate

router = APIRouter(prefix="/api/v1/admin/users", tags=["账号管理"])


def _serialize(u: SysUser, dept_names: dict, role_names: dict) -> dict:
    return {
        "id": u.id, "username": u.username, "real_name": u.real_name,
        "nickname": u.nickname, "phone": u.phone, "email": u.email,
        "gender": u.gender, "post": u.post, "dept_id": u.dept_id,
        "dept_name": dept_names.get(u.dept_id, ""), "role_id": u.role_id,
        "role_name": role_names.get(u.role_id, ""),
        "must_change_pwd": u.must_change_pwd, "is_activate": u.is_activate,
        "last_login_at": u.last_login_at, "avatar": u.avatar,
        "created_date": u.created_date, "updated_date": u.updated_date,
    }


@router.get("")
def list_users(
    db: DbDep,
    _user: CurrentUser = Depends(require("user", "view")),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    keyword: str | None = Query(default=None, max_length=50),
    dept_id: int | None = Query(default=None),
    role_id: int | None = Query(default=None),
    is_activate: int | None = Query(default=None, ge=0, le=1),
):
    q = db.query(SysUser)
    if keyword:
        q = q.filter(
            (SysUser.username.like(f"%{keyword}%"))
            | (SysUser.real_name.like(f"%{keyword}%"))
            | (SysUser.phone.like(f"%{keyword}%"))
        )
    if dept_id:
        q = q.filter(SysUser.dept_id == dept_id)
    if role_id:
        q = q.filter(SysUser.role_id == role_id)
    if is_activate is not None:
        q = q.filter(SysUser.is_activate == is_activate)
    total = q.count()
    items = (
        q.order_by(SysUser.id.desc())
        .offset((page - 1) * page_size).limit(page_size).all()
    )
    dept_names = {d.id: d.name for d in db.query(Department).all()}
    role_names = {r.id: r.name for r in db.query(Role).all()}
    return ok(data={
        "items": [_serialize(u, dept_names, role_names) for u in items],
        "total": total, "page": page, "page_size": page_size,
    })


@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: DbDep,
    _user: CurrentUser = Depends(require("user", "view")),
):
    u = db.query(SysUser).filter(SysUser.id == user_id).first()
    if u is None:
        return fail("账号不存在", code=404)
    dept_names = {d.id: d.name for d in db.query(Department).all()}
    role_names = {r.id: r.name for r in db.query(Role).all()}
    return ok(data=_serialize(u, dept_names, role_names))


@router.post("")
def create_user(
    body: UserCreate,
    db: DbDep,
    user: CurrentUser = Depends(require("user", "edit")),
):
    if db.query(SysUser).filter(SysUser.username == body.username).first():
        return fail("登录名已存在", code=409)
    if body.dept_id and db.query(Department).filter(Department.id == body.dept_id).first() is None:
        return fail("部门不存在", code=400)
    if body.role_id and db.query(Role).filter(Role.id == body.role_id).first() is None:
        return fail("角色不存在", code=400)
    u = SysUser(
        username=body.username,
        password_hash=hash_password(body.password),
        real_name=body.real_name, nickname=body.nickname,
        phone=body.phone, email=body.email, gender=body.gender,
        post=body.post, dept_id=body.dept_id, role_id=body.role_id,
        must_change_pwd=1, is_activate=body.is_activate,
        created_at=user.username, updated_at=user.username,
    )
    db.add(u)
    db.commit()
    return ok(data={"id": u.id}, message="新增成功（首次登录需修改密码）")


@router.put("/{user_id}")
def update_user(
    user_id: int,
    body: UserUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("user", "edit")),
):
    u = db.query(SysUser).filter(SysUser.id == user_id).first()
    if u is None:
        return fail("账号不存在", code=404)
    if body.dept_id and db.query(Department).filter(Department.id == body.dept_id).first() is None:
        return fail("部门不存在", code=400)
    if body.role_id and db.query(Role).filter(Role.id == body.role_id).first() is None:
        return fail("角色不存在", code=400)
    for k, v in body.model_dump().items():
        setattr(u, k, v)
    u.updated_at = user.username
    u.updated_date = datetime.now()
    db.commit()
    return ok(message="修改成功")


@router.put("/{user_id}/status")
def user_status(
    user_id: int,
    body: dict,
    db: DbDep,
    user: CurrentUser = Depends(require("user", "edit")),
):
    """启用/停用账号（body: {"is_activate": 0|1}）。"""
    is_activate = body.get("is_activate")
    if is_activate not in (0, 1):
        return fail("参数不合法", code=400)
    u = db.query(SysUser).filter(SysUser.id == user_id).first()
    if u is None:
        return fail("账号不存在", code=404)
    if u.id == user.id and is_activate == 0:
        return fail("不能停用当前登录账号", code=400)
    u.is_activate = is_activate
    u.updated_at = user.username
    u.updated_date = datetime.now()
    db.commit()
    return ok(message="状态已更新")


@router.put("/{user_id}/password")
def reset_user_password(
    user_id: int,
    body: dict,
    db: DbDep,
    user: CurrentUser = Depends(require("user", "edit")),
):
    """重置账号密码（重置后强制首登改密）。"""
    new_password = body.get("new_password", "")
    if len(new_password) < 6:
        return fail("新密码至少 6 位", code=400)
    u = db.query(SysUser).filter(SysUser.id == user_id).first()
    if u is None:
        return fail("账号不存在", code=404)
    u.password_hash = hash_password(new_password)
    u.must_change_pwd = 1
    u.updated_at = user.username
    u.updated_date = datetime.now()
    db.commit()
    return ok(message="密码已重置（该账号下次登录需修改密码）")


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: DbDep,
    user: CurrentUser = Depends(require("user", "edit")),
):
    u = db.query(SysUser).filter(SysUser.id == user_id).first()
    if u is None:
        return fail("账号不存在", code=404)
    if u.id == user.id:
        return fail("不能删除当前登录账号", code=400)
    if db.query(OperationLog).filter(OperationLog.user_id == user_id).count() > 0:
        return fail("该账号存在操作日志（审计保留），不可删除，建议停用", code=409)
    try:
        db.delete(u)
        db.commit()
    except IntegrityError:
        db.rollback()
        return fail("该账号存在关联数据，不可删除，建议停用", code=409)
    return ok(message="删除成功")
