"""联系信息配置（单行 GET/PUT）。"""
from datetime import datetime

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import ok
from app.models import ContactConfig
from app.schemas import ContactUpdate

router = APIRouter(prefix="/api/v1/admin/contact", tags=["联系信息"])


@router.get("")
def get_contact(
    db: DbDep,
    _user: CurrentUser = Depends(require("contact", "view")),
):
    c = db.query(ContactConfig).filter(ContactConfig.id == 1).first()
    if c is None:
        return ok(data={
            "phone": "", "email": "", "address": "", "work_time": "",
            "company_name": "", "icp_no": "",
        })
    return ok(data={
        "phone": c.phone, "email": c.email, "address": c.address,
        "work_time": c.work_time, "company_name": c.company_name,
        "icp_no": c.icp_no,
    })


@router.put("")
def update_contact(
    body: ContactUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("contact", "edit")),
):
    c = db.query(ContactConfig).filter(ContactConfig.id == 1).first()
    if c is None:
        c = ContactConfig(id=1, is_activate=1)
        db.add(c)
    for k, v in body.model_dump().items():
        setattr(c, k, v)
    c.updated_at = user.username
    c.updated_date = datetime.now()
    db.commit()
    return ok(message="保存成功")
