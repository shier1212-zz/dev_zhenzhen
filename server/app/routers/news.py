"""新闻管理：CRUD（草稿/发布）。"""
from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import fail, ok
from app.models import News
from app.schemas import NewsCreate, NewsUpdate

router = APIRouter(prefix="/api/v1/admin/news", tags=["新闻管理"])


@router.get("")
def list_news(
    db: DbDep,
    _user: CurrentUser = Depends(require("news", "view")),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    keyword: str | None = Query(default=None, max_length=50),
    status: int | None = Query(default=None, ge=0, le=1),
):
    q = db.query(News)
    if keyword:
        q = q.filter(News.title.like(f"%{keyword}%"))
    if status is not None:
        q = q.filter(News.status == status)
    total = q.count()
    items = (
        q.order_by(News.id.desc())
        .offset((page - 1) * page_size).limit(page_size).all()
    )
    return ok(data={
        "items": [
            {
                "id": n.id, "title": n.title, "category": n.category,
                "cover_image": n.cover_image, "summary": n.summary,
                "status": n.status, "is_activate": n.is_activate,
                "published_at": n.published_at,
                "created_date": n.created_date, "updated_date": n.updated_date,
            }
            for n in items
        ],
        "total": total, "page": page, "page_size": page_size,
    })


@router.get("/{news_id}")
def get_news(
    news_id: int,
    db: DbDep,
    _user: CurrentUser = Depends(require("news", "view")),
):
    n = db.query(News).filter(News.id == news_id).first()
    if n is None:
        return fail("新闻不存在", code=404)
    return ok(data={
        "id": n.id, "title": n.title, "category": n.category,
        "cover_image": n.cover_image, "summary": n.summary,
        "content": n.content, "status": n.status, "is_activate": n.is_activate,
        "published_at": n.published_at,
    })


@router.post("")
def create_news(
    body: NewsCreate,
    db: DbDep,
    user: CurrentUser = Depends(require("news", "edit")),
):
    data = body.model_dump()
    published_at = datetime.now() if data.get("status") == 1 else None
    n = News(
        **data, published_at=published_at, is_activate=1,
        created_at=user.username, updated_at=user.username,
    )
    db.add(n)
    db.commit()
    return ok(data={"id": n.id}, message="新增成功")


@router.put("/{news_id}")
def update_news(
    news_id: int,
    body: NewsUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("news", "edit")),
):
    n = db.query(News).filter(News.id == news_id).first()
    if n is None:
        return fail("新闻不存在", code=404)
    data = body.model_dump()
    for k, v in data.items():
        setattr(n, k, v)
    if data.get("status") == 1 and n.published_at is None:
        n.published_at = datetime.now()  # 发布时记录发布时间
    n.updated_at = user.username
    n.updated_date = datetime.now()
    db.commit()
    return ok(message="修改成功")


@router.delete("/{news_id}")
def delete_news(
    news_id: int,
    db: DbDep,
    user: CurrentUser = Depends(require("news", "edit")),
):
    n = db.query(News).filter(News.id == news_id).first()
    if n is None:
        return fail("新闻不存在", code=404)
    db.delete(n)
    db.commit()
    return ok(message="删除成功")
