"""留言管理：列表（搜索/状态筛选/分页）/详情/处理（可回退）/删除。"""
from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import fail, ok
from app.models import Message
from app.schemas import MessageUpdate

router = APIRouter(prefix="/api/v1/admin/messages", tags=["留言管理"])


@router.get("")
def list_messages(
    db: DbDep,
    _user: CurrentUser = Depends(require("message", "view")),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    keyword: str | None = Query(default=None, max_length=50),
    status: int | None = Query(default=None, ge=0, le=1),
):
    q = db.query(Message)
    if keyword:
        q = q.filter(
            (Message.name.like(f"%{keyword}%")) | (Message.phone.like(f"%{keyword}%"))
        )
    if status is not None:
        q = q.filter(Message.status == status)
    total = q.count()
    items = (
        q.order_by(Message.id.desc())
        .offset((page - 1) * page_size).limit(page_size).all()
    )
    return ok(data={
        "items": [
            {
                "id": m.id, "name": m.name, "phone": m.phone,
                "company": m.company, "content": m.content,
                "status": m.status, "handle_note": m.handle_note, "ip": m.ip,
                "created_date": m.created_date, "updated_date": m.updated_date,
            }
            for m in items
        ],
        "total": total, "page": page, "page_size": page_size,
    })


@router.get("/{message_id}")
def get_message(
    message_id: int,
    db: DbDep,
    _user: CurrentUser = Depends(require("message", "view")),
):
    m = db.query(Message).filter(Message.id == message_id).first()
    if m is None:
        return fail("留言不存在", code=404)
    return ok(data={
        "id": m.id, "name": m.name, "phone": m.phone, "company": m.company,
        "content": m.content, "status": m.status, "handle_note": m.handle_note,
        "ip": m.ip, "created_date": m.created_date, "updated_date": m.updated_date,
    })


@router.put("/{message_id}")
def handle_message(
    message_id: int,
    body: MessageUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("message", "edit")),
):
    """处理留言（0 待处理 ↔ 1 已处理，支持状态回退）。"""
    m = db.query(Message).filter(Message.id == message_id).first()
    if m is None:
        return fail("留言不存在", code=404)
    m.status = body.status
    m.handle_note = body.handle_note
    m.updated_at = user.username
    m.updated_date = datetime.now()
    db.commit()
    return ok(message="处理完成" if body.status == 1 else "已回退为待处理")


@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    db: DbDep,
    user: CurrentUser = Depends(require("message", "edit")),
):
    m = db.query(Message).filter(Message.id == message_id).first()
    if m is None:
        return fail("留言不存在", code=404)
    db.delete(m)
    db.commit()
    return ok(message="删除成功")
