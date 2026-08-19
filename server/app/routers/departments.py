"""部门管理：CRUD（树形；删除约束：有子部门或账号 → 409）。"""
from datetime import datetime

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import fail, ok
from app.models import Department, SysUser
from app.schemas import DepartmentCreate, DepartmentUpdate

router = APIRouter(prefix="/api/v1/admin/departments", tags=["部门管理"])


def _build_tree(depts: list, parent_id: int | None = None) -> list:
    nodes = []
    for d in sorted(
        [x for x in depts if x.parent_id == parent_id],
        key=lambda x: (x.sort, x.id),
    ):
        nodes.append({
            "id": d.id, "name": d.name, "parent_id": d.parent_id,
            "code": d.code, "sort": d.sort, "is_activate": d.is_activate,
            "children": _build_tree(depts, d.id),
        })
    return nodes


@router.get("")
def list_departments(
    db: DbDep,
    _user: CurrentUser = Depends(require("dept", "view")),
):
    depts = db.query(Department).order_by(Department.sort.asc()).all()
    return ok(data={"items": _build_tree(list(depts))})


@router.post("")
def create_department(
    body: DepartmentCreate,
    db: DbDep,
    user: CurrentUser = Depends(require("dept", "edit")),
):
    if body.parent_id:
        if db.query(Department).filter(Department.id == body.parent_id).first() is None:
            return fail("上级部门不存在", code=400)
    if body.code and db.query(Department).filter(Department.code == body.code).first():
        return fail("部门编码已存在", code=409)
    d = Department(
        **body.model_dump(), is_activate=1,
        created_at=user.username, updated_at=user.username,
    )
    db.add(d)
    db.commit()
    return ok(data={"id": d.id}, message="新增成功")


@router.put("/{dept_id}")
def update_department(
    dept_id: int,
    body: DepartmentUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("dept", "edit")),
):
    d = db.query(Department).filter(Department.id == dept_id).first()
    if d is None:
        return fail("部门不存在", code=404)
    if body.parent_id == dept_id:
        return fail("上级部门不能是自身", code=400)
    if body.parent_id:
        if db.query(Department).filter(Department.id == body.parent_id).first() is None:
            return fail("上级部门不存在", code=400)
    if body.code:
        dup = (
            db.query(Department)
            .filter(Department.code == body.code, Department.id != dept_id).first()
        )
        if dup:
            return fail("部门编码已存在", code=409)
    for k, v in body.model_dump().items():
        setattr(d, k, v)
    d.updated_at = user.username
    d.updated_date = datetime.now()
    db.commit()
    return ok(message="修改成功")


@router.delete("/{dept_id}")
def delete_department(
    dept_id: int,
    db: DbDep,
    user: CurrentUser = Depends(require("dept", "edit")),
):
    d = db.query(Department).filter(Department.id == dept_id).first()
    if d is None:
        return fail("部门不存在", code=404)
    if db.query(Department).filter(Department.parent_id == dept_id).count() > 0:
        return fail("该部门存在下级部门，请先迁移子部门", code=409)
    if db.query(SysUser).filter(SysUser.dept_id == dept_id).count() > 0:
        return fail("该部门下存在账号，请先迁移账号", code=409)
    db.delete(d)
    db.commit()
    return ok(message="删除成功")
