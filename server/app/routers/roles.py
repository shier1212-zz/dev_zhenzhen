"""角色管理：CRUD（权限矩阵；删除约束：有绑定账号 → 409）。"""
import json
from datetime import datetime

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import fail, ok
from app.models import Role, SysUser
from app.schemas import RoleCreate, RoleUpdate

router = APIRouter(prefix="/api/v1/admin/roles", tags=["角色管理"])


@router.get("")
def list_roles(
    db: DbDep,
    _user: CurrentUser = Depends(require("role", "view")),
):
    roles = db.query(Role).order_by(Role.id.asc()).all()
    counts = {
        rid: cnt for rid, cnt in
        db.query(SysUser.role_id, SysUser.id).group_by(SysUser.role_id).all()
    }
    return ok(data={
        "items": [
            {
                "id": r.id, "name": r.name,
                "permissions": _perms(r.permissions),
                "is_activate": r.is_activate,
                "user_count": counts.get(r.id, 0),
            }
            for r in roles
        ]
    })


def _perms(raw: str) -> dict:
    try:
        p = json.loads(raw) if raw else {}
        return p if isinstance(p, dict) else {}
    except (TypeError, json.JSONDecodeError):
        return {}


@router.post("")
def create_role(
    body: RoleCreate,
    db: DbDep,
    user: CurrentUser = Depends(require("role", "edit")),
):
    if db.query(Role).filter(Role.name == body.name).first():
        return fail("角色名已存在", code=409)
    r = Role(
        name=body.name,
        permissions=json.dumps(body.permissions, ensure_ascii=False),
        is_activate=1, created_at=user.username, updated_at=user.username,
    )
    db.add(r)
    db.commit()
    return ok(data={"id": r.id}, message="新增成功")


@router.put("/{role_id}")
def update_role(
    role_id: int,
    body: RoleUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("role", "edit")),
):
    r = db.query(Role).filter(Role.id == role_id).first()
    if r is None:
        return fail("角色不存在", code=404)
    dup = (
        db.query(Role).filter(Role.name == body.name, Role.id != role_id).first()
    )
    if dup:
        return fail("角色名已存在", code=409)
    r.name = body.name
    r.permissions = json.dumps(body.permissions, ensure_ascii=False)
    r.updated_at = user.username
    r.updated_date = datetime.now()
    db.commit()
    return ok(message="修改成功")


@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: DbDep,
    user: CurrentUser = Depends(require("role", "edit")),
):
    r = db.query(Role).filter(Role.id == role_id).first()
    if r is None:
        return fail("角色不存在", code=404)
    if db.query(SysUser).filter(SysUser.role_id == role_id).count() > 0:
        return fail("该角色存在绑定账号，请先解绑", code=409)
    db.delete(r)
    db.commit()
    return ok(message="删除成功")
