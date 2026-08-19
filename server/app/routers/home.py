"""首页配置：品牌展示区 GET/PUT + 精选产品查询/批量设置。"""
import json
from datetime import datetime

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import fail, ok
from app.models import HomeConfig, HomeFeaturedProduct, Product
from app.schemas import FeaturedUpdate, HomeConfigUpdate

router = APIRouter(prefix="/api/v1/admin/home", tags=["首页配置"])


@router.get("/config")
def get_home_config(
    db: DbDep,
    _user: CurrentUser = Depends(require("home", "view")),
):
    cfg = db.query(HomeConfig).filter(HomeConfig.id == 1).first()
    if cfg is None:
        return ok(data={
            "brand_slogan": "", "brand_desc": "", "brand_image": "", "advantages": [],
        })
    try:
        advantages = json.loads(cfg.advantages) if cfg.advantages else []
    except (TypeError, json.JSONDecodeError):
        advantages = []
    return ok(data={
        "brand_slogan": cfg.brand_slogan, "brand_desc": cfg.brand_desc,
        "brand_image": cfg.brand_image, "advantages": advantages,
    })


@router.put("/config")
def update_home_config(
    body: HomeConfigUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("home", "edit")),
):
    cfg = db.query(HomeConfig).filter(HomeConfig.id == 1).first()
    if cfg is None:
        cfg = HomeConfig(id=1, is_activate=1)
        db.add(cfg)
    cfg.brand_slogan = body.brand_slogan
    cfg.brand_desc = body.brand_desc
    cfg.brand_image = body.brand_image
    cfg.advantages = json.dumps(
        [a.model_dump() for a in body.advantages], ensure_ascii=False
    )
    cfg.updated_at = user.username
    cfg.updated_date = datetime.now()
    db.commit()
    return ok(message="保存成功")


@router.get("/featured")
def get_featured(
    db: DbDep,
    _user: CurrentUser = Depends(require("home", "view")),
):
    """当前精选产品列表。"""
    rows = (
        db.query(HomeFeaturedProduct, Product)
        .join(Product, HomeFeaturedProduct.product_id == Product.id)
        .order_by(HomeFeaturedProduct.sort.asc(), HomeFeaturedProduct.id.asc())
        .all()
    )
    return ok(data={
        "items": [
            {
                "id": h.id, "product_id": h.product_id,
                "product_name": p.name, "cover_image": p.cover_image,
                "sort": h.sort,
            }
            for h, p in rows
        ]
    })


@router.put("/featured")
def update_featured(
    body: FeaturedUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("home", "edit")),
):
    """批量设置精选产品（全量覆盖，1~8 个）。"""
    ids = body.product_ids
    if len(ids) > 8:
        return fail("精选产品最多 8 个", code=400)
    # 校验产品存在且上架
    products = (
        db.query(Product)
        .filter(Product.id.in_(ids), Product.is_activate == 1, Product.status == 1)
        .all()
    )
    if len(products) != len(ids):
        return fail("存在无效或未上架的产品", code=400)

    db.query(HomeFeaturedProduct).delete()  # 全量覆盖
    now = datetime.now()
    for sort, pid in enumerate(ids, start=1):
        db.add(
            HomeFeaturedProduct(
                product_id=pid, sort=sort, is_activate=1,
                created_at=user.username, updated_at=user.username,
            )
        )
    db.commit()
    return ok(message="精选配置已更新")
