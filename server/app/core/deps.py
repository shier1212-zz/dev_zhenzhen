"""认证与权限依赖（JWT 用户注入、模块级权限校验）。"""
import json
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import SysUser  # models 不依赖 deps，无循环

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/admin/auth/login")

DbDep = Annotated[Session, Depends(get_db)]


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: DbDep) -> SysUser:
    """根据 JWT 解析当前登录用户；无效 / 不存在 / 停用则 401。"""
    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="登录状态已失效"
        )
    user = db.query(SysUser).filter(SysUser.username == payload["sub"]).first()
    if user is None or user.is_activate != 1:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="账号不存在或已停用"
        )
    return user


# 纯类型别名（配合默认值 Depends 使用，见 require）
CurrentUser = SysUser


def get_permissions(user) -> dict:
    """解析用户角色的模块级权限矩阵（JSON）。"""
    role = getattr(user, "role", None)
    if role is None or not getattr(role, "permissions", None):
        return {}
    try:
        perms = json.loads(role.permissions)
        return perms if isinstance(perms, dict) else {}
    except (TypeError, json.JSONDecodeError):
        return {}


def require(module: str, action: str = "view"):
    """模块级权限依赖：要求当前用户角色拥有 {module: [action]} 权限。

    用法：def list_banners(_user: SysUser = Depends(require("banner", "view"))): ...
    """

    def checker(user: SysUser = Depends(get_current_user)):
        perms = get_permissions(user)
        actions = perms.get(module, [])
        if action not in actions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"无权限：模块 {module} 缺少 {action} 操作",
            )
        return user

    return checker
