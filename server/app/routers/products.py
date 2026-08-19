"""产品管理：CRUD + 上下架 + 批量上下架。"""
import json
from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import fail, ok
from app.models import Product, ProductCategory
from app.schemas import (
    BatchStatusRequest,
    ProductCreate,
    ProductStatusRequest,
    ProductUpdate,
)

router = APIRouter(prefix="/api/v1/admin/products", tags=["产品管理"])


def _serialize(p: Product, cat_names: dict | None = None):
    try:
        images = json.loads(p.images) if p.images else []
        params = json.loads(p.params) if p.params else []
    except (TypeError, json.JSONDecodeError):
        images, params = [], []
    return {
        "id": p.id, "category_id": p.category_id,
        "category_name": cat_names.get(p.category_id, "") if cat_names else "",
        "name": p.name, "cover_image": p.cover_image, "images": images,
        "price_min": float(p.price_min) if p.price_min is not None else None,
        "price_max": float(p.price_max) if p.price_max is not None else None,
        "show_price": p.show_price, "brief": p.brief, "params": params,
        "detail_content": p.detail_content, "sort": p.sort, "status": p.status,
        "is_activate": p.is_activate, "created_date": p.created_date,
        "updated_date": p.updated_date,
    }


@router.get("")
def list_products(
    db: DbDep,
    _user: CurrentUser = Depends(require("product", "view")),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=200),
    keyword: str | None = Query(default=None, max_length=50),
    category_id: int | None = Query(default=None),
    status: int | None = Query(default=None, ge=0, le=1),
):
    q = db.query(Product)
    if keyword:
        q = q.filter(Product.name.like(f"%{keyword}%"))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if status is not None:
        q = q.filter(Product.status == status)
    total = q.count()
    items = (
        q.order_by(Product.sort.asc(), Product.id.desc())
        .offset((page - 1) * page_size).limit(page_size).all()
    )
    cat_names = {c.id: c.name for c in db.query(ProductCategory).all()}
    return ok(data={
        "items": [_serialize(p, cat_names) for p in items],
        "total": total, "page": page, "page_size": page_size,
    })


@router.put("/batch-status")
def batch_status(
    body: BatchStatusRequest,
    db: DbDep,
    user: CurrentUser = Depends(require("product", "edit")),
):
    """批量上下架（注意：必须定义在 /{product_id} 之前）。"""
    products = db.query(Product).filter(Product.id.in_(body.ids)).all()
    if not products:
        return fail("未找到产品", code=400)
    for p in products:
        p.status = body.status
        p.updated_at = user.username
        p.updated_date = datetime.now()
    db.commit()
    return ok(message=f"已更新 {len(products)} 个产品")


@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: DbDep,
    _user: CurrentUser = Depends(require("product", "view")),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if p is None:
        return fail("产品不存在", code=404)
    cat_names = {c.id: c.name for c in db.query(ProductCategory).all()}
    return ok(data=_serialize(p, cat_names))


@router.post("")
def create_product(
    body: ProductCreate,
    db: DbDep,
    user: CurrentUser = Depends(require("product", "edit")),
):
    if db.query(ProductCategory).filter(ProductCategory.id == body.category_id).first() is None:
        return fail("所属分类不存在", code=400)
    data = body.model_dump()
    data["images"] = json.dumps(data["images"], ensure_ascii=False)
    data["params"] = json.dumps(data["params"], ensure_ascii=False)
    p = Product(
        **data, is_activate=1,
        created_at=user.username, updated_at=user.username,
    )
    db.add(p)
    db.commit()
    return ok(data={"id": p.id}, message="新增成功")


@router.put("/{product_id}")
def update_product(
    product_id: int,
    body: ProductUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("product", "edit")),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if p is None:
        return fail("产品不存在", code=404)
    if db.query(ProductCategory).filter(ProductCategory.id == body.category_id).first() is None:
        return fail("所属分类不存在", code=400)
    data = body.model_dump()
    data["images"] = json.dumps(data["images"], ensure_ascii=False)
    data["params"] = json.dumps(data["params"], ensure_ascii=False)
    for k, v in data.items():
        setattr(p, k, v)
    p.updated_at = user.username
    p.updated_date = datetime.now()
    db.commit()
    return ok(message="修改成功")


@router.put("/{product_id}/status")
def product_status(
    product_id: int,
    body: ProductStatusRequest,
    db: DbDep,
    user: CurrentUser = Depends(require("product", "edit")),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if p is None:
        return fail("产品不存在", code=404)
    p.status = body.status
    p.updated_at = user.username
    p.updated_date = datetime.now()
    db.commit()
    return ok(message="状态已更新")


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: DbDep,
    user: CurrentUser = Depends(require("product", "edit")),
):
    """删除产品（精选关联由 ON DELETE RESTRICT 保护，须先解除）。"""
    p = db.query(Product).filter(Product.id == product_id).first()
    if p is None:
        return fail("产品不存在", code=404)
    from app.models import HomeFeaturedProduct
    db.query(HomeFeaturedProduct).filter(
        HomeFeaturedProduct.product_id == product_id
    ).delete()  # 先解除精选关联，避免外键限制
    db.delete(p)
    db.commit()
    return ok(message="删除成功")
