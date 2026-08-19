"""操作日志查询（仅具备 log:view 权限的角色可访问，默认仅超级管理员）。"""
from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import ok
from app.models import OperationLog, SysUser

router = APIRouter(prefix="/api/v1/admin/logs", tags=["操作日志"])


@router.get("")
def list_logs(
    db: DbDep,
    _user: CurrentUser = Depends(require("log", "view")),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    module: str | None = Query(default=None, max_length=50),
    username: str | None = Query(default=None, max_length=50),
    action: str | None = Query(default=None, max_length=50),
):
    q = db.query(OperationLog, SysUser.username).join(
        SysUser, OperationLog.user_id == SysUser.id
    )
    if module:
        q = q.filter(OperationLog.module == module)
    if username:
        q = q.filter(SysUser.username.like(f"%{username}%"))
    if action:
        q = q.filter(OperationLog.action == action)
    total = q.count()
    rows = (
        q.order_by(OperationLog.id.desc())
        .offset((page - 1) * page_size).limit(page_size).all()
    )
    return ok(data={
        "items": [
            {
                "id": log.id, "user_id": log.user_id, "username": uname,
                "module": log.module, "action": log.action,
                "target": log.target, "ip": log.ip,
                "created_date": log.created_date,
            }
            for log, uname in rows
        ],
        "total": total, "page": page, "page_size": page_size,
    })
