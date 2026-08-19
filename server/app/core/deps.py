"""认证与权限依赖（JWT 用户注入、模块级权限校验）。

说明：本文件依赖 app.models.User（M1 建模完成后生效）。
业务路由挂载后，通过 Depends(get_current_user) 注入当前用户。
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/auth/login")

DbDep = Annotated[Session, Depends(get_db)]


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: DbDep):
    """根据 JWT 解析当前登录用户；无效或不存在则 401。"""
    from app.models import User  # 延迟导入，避免骨架阶段循环依赖

    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="登录状态已失效"
        )
    user = db.query(User).filter(User.username == payload["sub"]).first()
    if user is None or user.status != 1:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="账号不存在或已禁用"
        )
    return user


def require_perm(perm_code: str):
    """模块级权限校验：要求当前用户拥有指定权限码。"""

    def checker(current_user=Depends(get_current_user)):
        # 权限判定逻辑在角色-权限矩阵建模后接入（M1-步骤3 完成）。
        # 当前骨架阶段仅校验登录态；权限矩阵落地后在此处按 perm_code 校验。
        return current_user

    return checker
