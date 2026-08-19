"""轮播图管理：CRUD + 启停 + 软删除。"""
from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import fail, ok
from app.models import Banner
from app.schemas import BannerCreate, BannerUpdate, StatusRequest

router = APIRouter(prefix="/api/v1/admin/banners", tags=["轮播管理"])


@router.get("")
def list_banners(
    db: DbDep,
    _user: CurrentUser = Depends(require("banner", "view")),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    keyword: str | None = Query(default=None, max_length=50),
    is_activate: int | None = Query(default=None, ge=0, le=1),
):
    """轮播列表（不含软删除）。"""
    q = db.query(Banner).filter(Banner.deleted_at.is_(None))
    if keyword:
        q = q.filter(Banner.title.like(f"%{keyword}%"))
    if is_activate is not None:
        q = q.filter(Banner.is_activate == is_activate)
    total = q.count()
    items = (
        q.order_by(Banner.sort.asc(), Banner.id.asc())
        .offset((page - 1) * page_size).limit(page_size).all()
    )
    return ok(data={
        "items": [
            {
                "id": b.id, "image_url": b.image_url, "title": b.title,
                "subtitle": b.subtitle, "link_type": b.link_type,
                "link_target": b.link_target, "sort": b.sort,
                "is_activate": b.is_activate, "created_date": b.created_date,
                "updated_date": b.updated_date,
            }
            for b in items
        ],
        "total": total, "page": page, "page_size": page_size,
    })


@router.get("/{banner_id}")
def get_banner(
    banner_id: int,
    db: DbDep,
    _user: CurrentUser = Depends(require("banner", "view")),
):
    b = db.query(Banner).filter(
        Banner.id == banner_id, Banner.deleted_at.is_(None)
    ).first()
    if b is None:
        return fail("轮播不存在", code=404)
    return ok(data={
        "id": b.id, "image_url": b.image_url, "title": b.title,
        "subtitle": b.subtitle, "link_type": b.link_type,
        "link_target": b.link_target, "sort": b.sort, "is_activate": b.is_activate,
    })


@router.post("")
def create_banner(
    body: BannerCreate,
    db: DbDep,
    user: CurrentUser = Depends(require("banner", "edit")),
):
    b = Banner(
        **body.model_dump(), is_activate=1,
        created_at=user.username, updated_at=user.username,
    )
    db.add(b)
    db.commit()
    return ok(data={"id": b.id}, message="新增成功")


@router.put("/{banner_id}")
def update_banner(
    banner_id: int,
    body: BannerUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("banner", "edit")),
):
    b = db.query(Banner).filter(
        Banner.id == banner_id, Banner.deleted_at.is_(None)
    ).first()
    if b is None:
        return fail("轮播不存在", code=404)
    for k, v in body.model_dump().items():
        setattr(b, k, v)
    b.updated_at = user.username
    b.updated_date = datetime.now()
    db.commit()
    return ok(message="修改成功")


@router.put("/{banner_id}/status")
def banner_status(
    banner_id: int,
    body: StatusRequest,
    db: DbDep,
    user: CurrentUser = Depends(require("banner", "edit")),
):
    b = db.query(Banner).filter(
        Banner.id == banner_id, Banner.deleted_at.is_(None)
    ).first()
    if b is None:
        return fail("轮播不存在", code=404)
    b.is_activate = body.is_activate
    b.updated_at = user.username
    b.updated_date = datetime.now()
    db.commit()
    return ok(message="状态已更新")


@router.delete("/{banner_id}")
def delete_banner(
    banner_id: int,
    db: DbDep,
    user: CurrentUser = Depends(require("banner", "edit")),
):
    """软删除（唯一启用软删除的表）。"""
    b = db.query(Banner).filter(
        Banner.id == banner_id, Banner.deleted_at.is_(None)
    ).first()
    if b is None:
        return fail("轮播不存在", code=404)
    b.deleted_at = datetime.now()
    b.updated_at = user.username
    b.updated_date = datetime.now()
    db.commit()
    return ok(message="删除成功")
