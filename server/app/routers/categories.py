"""产品分类管理：CRUD（删除约束：分类下有产品 → 409）。"""
from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import fail, ok
from app.models import Product, ProductCategory
from app.schemas import CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/api/v1/admin/categories", tags=["产品分类"])


@router.get("")
def list_categories(
    db: DbDep,
    _user: CurrentUser = Depends(require("product", "view")),
    keyword: str | None = Query(default=None, max_length=50),
):
    q = db.query(ProductCategory)
    if keyword:
        q = q.filter(ProductCategory.name.like(f"%{keyword}%"))
    items = q.order_by(ProductCategory.sort.asc(), ProductCategory.id.asc()).all()
    counts = {
        cid: cnt
        for cid, cnt in db.query(Product.category_id, Product.id)
        .group_by(Product.category_id).all()
    }
    # 简单计数（含禁用产品，足够用于删除约束提示）
    from sqlalchemy import func
    cnt_rows = (
        db.query(Product.category_id, func.count(Product.id))
        .group_by(Product.category_id).all()
    )
    counts = {cid: c for cid, c in cnt_rows}
    return ok(data={
        "items": [
            {
                "id": c.id, "name": c.name, "sort": c.sort,
                "is_activate": c.is_activate, "product_count": counts.get(c.id, 0),
            }
            for c in items
        ],
        "total": len(items), "page": 1, "page_size": len(items) or 1,
    })


@router.post("")
def create_category(
    body: CategoryCreate,
    db: DbDep,
    user: CurrentUser = Depends(require("product", "edit")),
):
    if db.query(ProductCategory).filter(ProductCategory.name == body.name).first():
        return fail("分类名已存在", code=409)
    c = ProductCategory(
        **body.model_dump(), is_activate=1,
        created_at=user.username, updated_at=user.username,
    )
    db.add(c)
    db.commit()
    return ok(data={"id": c.id}, message="新增成功")


@router.put("/{category_id}")
def update_category(
    category_id: int,
    body: CategoryUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("product", "edit")),
):
    c = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if c is None:
        return fail("分类不存在", code=404)
    dup = (
        db.query(ProductCategory)
        .filter(ProductCategory.name == body.name, ProductCategory.id != category_id)
        .first()
    )
    if dup:
        return fail("分类名已存在", code=409)
    c.name = body.name
    c.sort = body.sort
    c.updated_at = user.username
    c.updated_date = datetime.now()
    db.commit()
    return ok(message="修改成功")


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: DbDep,
    user: CurrentUser = Depends(require("product", "edit")),
):
    c = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if c is None:
        return fail("分类不存在", code=404)
    if db.query(Product).filter(Product.category_id == category_id).count() > 0:
        return fail("该分类下存在产品，请先移走产品再删除", code=409)
    db.delete(c)
    db.commit()
    return ok(message="删除成功")
