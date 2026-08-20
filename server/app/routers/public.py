"""前台公开接口（只读 + 留言提交限流）。

清单（开发技术文档 §5.4）：/banners /home-config /products /products/{id}
/categories /news /news/{id} /about /contact /messages(POST, 限流)
"""
import json

from fastapi import APIRouter, Query, Request
from sqlalchemy import case, func

from app.core import captcha
from app.core.deps import DbDep
from app.core.ratelimit import message_limiter
from app.core.response import fail, ok
from app.models import (
    AboutContent,
    Banner,
    ContactConfig,
    HomeConfig,
    HomeFeaturedProduct,
    Message,
    News,
    Product,
    ProductCategory,
)
from app.schemas import MessageCreate

router = APIRouter(prefix="/api/v1/public", tags=["前台公开"])


def _j(obj: str, default=None):
    """安全解析 JSON 字段。"""
    try:
        return json.loads(obj) if obj else (default if default is not None else [])
    except (TypeError, json.JSONDecodeError):
        return default if default is not None else []


@router.get("/banners")
def public_banners(db: DbDep):
    """轮播图：仅启用、未删除、按 sort 升序。"""
    items = (
        db.query(Banner)
        .filter(Banner.is_activate == 1, Banner.deleted_at.is_(None))
        .order_by(Banner.sort.asc(), Banner.id.asc())
        .all()
    )
    return ok(data={
        "items": [
            {
                "id": b.id, "image_url": b.image_url, "title": b.title,
                "subtitle": b.subtitle, "link_type": b.link_type,
                "link_target": b.link_target, "sort": b.sort,
            }
            for b in items
        ],
        "total": len(items), "page": 1, "page_size": len(items) or 1,
    })


@router.get("/home-config")
def public_home_config(db: DbDep):
    """首页品牌展示区 + 精选产品（未配置精选时兜底最新上架 4 个）。"""
    cfg = db.query(HomeConfig).filter(HomeConfig.id == 1).first()
    featured = (
        db.query(HomeFeaturedProduct, Product)
        .join(Product, HomeFeaturedProduct.product_id == Product.id)
        .filter(Product.is_activate == 1, Product.status == 1)
        .order_by(HomeFeaturedProduct.sort.asc(), HomeFeaturedProduct.id.asc())
        .limit(8)
        .all()
    )
    products = [
        {
            "id": p.id, "name": p.name, "cover_image": p.cover_image,
            "brief": p.brief, "price_min": float(p.price_min) if p.price_min else None,
            "price_max": float(p.price_max) if p.price_max else None,
            "show_price": p.show_price,
        }
        for _, p in featured
    ]
    if not products:  # 兜底：最新上架 4 个
        fallback = (
            db.query(Product)
            .filter(Product.is_activate == 1, Product.status == 1)
            .order_by(Product.created_date.desc())
            .limit(4)
            .all()
        )
        products = [
            {
                "id": p.id, "name": p.name, "cover_image": p.cover_image,
                "brief": p.brief,
                "price_min": float(p.price_min) if p.price_min else None,
                "price_max": float(p.price_max) if p.price_max else None,
                "show_price": p.show_price,
            }
            for p in fallback
        ]
    return ok(data={
        "brand_slogan": cfg.brand_slogan if cfg else "",
        "brand_desc": cfg.brand_desc if cfg else "",
        "brand_image": cfg.brand_image if cfg else "",
        "advantages": _j(cfg.advantages) if cfg else [],
        "featured_products": products,
    })


@router.get("/categories")
def public_categories(db: DbDep):
    """产品分类：启用分类 + 每个分类下上架产品数量。"""
    items = (
        db.query(ProductCategory)
        .filter(ProductCategory.is_activate == 1)
        .order_by(ProductCategory.sort.asc(), ProductCategory.id.asc())
        .all()
    )
    counts = dict(
        db.query(Product.category_id, func.count(Product.id))
        .filter(Product.is_activate == 1, Product.status == 1)
        .group_by(Product.category_id)
        .all()
    )
    return ok(data={
        "items": [
            {"id": c.id, "name": c.name, "sort": c.sort, "count": counts.get(c.id, 0)}
            for c in items
        ],
        "total": len(items), "page": 1, "page_size": len(items) or 1,
    })


@router.get("/products")
def public_products(
    db: DbDep,
    category_id: int | None = Query(default=None),
    keyword: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    sort: str = Query(default="default", max_length=20),
):
    """产品列表：仅上架；category_id 筛选；keyword 模糊匹配名称/简介；支持 default/price_asc/price_desc/newest/oldest 排序。"""
    q = db.query(Product).filter(Product.is_activate == 1, Product.status == 1)
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if keyword:
        kw = keyword.strip()
        if kw:
            q = q.filter(Product.name.contains(kw) | Product.brief.contains(kw))

    # 价格排序时把无价格记录放最后
    price_null_last = case((Product.price_min.is_(None), 1), else_=0)
    if sort == "price_asc":
        q = q.order_by(price_null_last, Product.price_min.asc(), Product.id.desc())
    elif sort == "price_desc":
        q = q.order_by(price_null_last, Product.price_min.desc(), Product.id.desc())
    elif sort == "newest":
        q = q.order_by(Product.created_date.desc(), Product.id.desc())
    elif sort == "oldest":
        q = q.order_by(Product.created_date.asc(), Product.id.desc())
    else:
        q = q.order_by(Product.sort.asc(), Product.created_date.desc())

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    cat_names = {c.id: c.name for c in db.query(ProductCategory).all()}
    return ok(data={
        "items": [
            {
                "id": p.id, "name": p.name, "brief": p.brief,
                "category_id": p.category_id,
                "category_name": cat_names.get(p.category_id, ""),
                "cover_image": p.cover_image,
                "price_min": float(p.price_min) if p.price_min else None,
                "price_max": float(p.price_max) if p.price_max else None,
                "show_price": p.show_price,
            }
            for p in items
        ],
        "total": total, "page": page, "page_size": page_size,
    })


@router.get("/products/{product_id}")
def public_product_detail(product_id: int, db: DbDep):
    """产品详情：仅上架；含多图/参数/富文本/同分类推荐 4 个。"""
    p = (
        db.query(Product)
        .filter(Product.id == product_id, Product.is_activate == 1, Product.status == 1)
        .first()
    )
    if p is None:
        return fail("产品不存在或已下架", code=404)
    cat = db.query(ProductCategory).filter(ProductCategory.id == p.category_id).first()
    related = (
        db.query(Product)
        .filter(
            Product.category_id == p.category_id,
            Product.id != p.id,
            Product.is_activate == 1,
            Product.status == 1,
        )
        .order_by(Product.sort.asc())
        .limit(4)
        .all()
    )
    return ok(data={
        "id": p.id, "name": p.name, "cover_image": p.cover_image,
        "images": _j(p.images), "category_id": p.category_id,
        "category_name": cat.name if cat else "",
        "price_min": float(p.price_min) if p.price_min else None,
        "price_max": float(p.price_max) if p.price_max else None,
        "show_price": p.show_price, "brief": p.brief,
        "params": _j(p.params), "detail_content": p.detail_content,
        "related_products": [
            {
                "id": r.id, "name": r.name, "cover_image": r.cover_image,
                "brief": r.brief,
                "price_min": float(r.price_min) if r.price_min else None,
                "price_max": float(r.price_max) if r.price_max else None,
            }
            for r in related
        ],
    })


@router.get("/news")
def public_news(
    db: DbDep,
    category: str | None = Query(default=None, max_length=50),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    """新闻列表：仅已发布；category 筛选；按发布时间倒序。"""
    q = db.query(News).filter(News.is_activate == 1, News.status == 1)
    if category:
        q = q.filter(News.category == category)
    total = q.count()
    items = (
        q.order_by(News.published_at.desc(), News.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return ok(data={
        "items": [
            {
                "id": n.id, "title": n.title, "category": n.category,
                "cover_image": n.cover_image, "summary": n.summary,
                "published_at": n.published_at.isoformat() if n.published_at else None,
            }
            for n in items
        ],
        "total": total, "page": page, "page_size": page_size,
    })


@router.get("/news/{news_id}")
def public_news_detail(news_id: int, db: DbDep):
    """新闻详情：仅已发布；附上一篇/下一篇。"""
    n = (
        db.query(News)
        .filter(News.id == news_id, News.is_activate == 1, News.status == 1)
        .first()
    )
    if n is None:
        return fail("新闻不存在", code=404)
    prev_n = (
        db.query(News)
        .filter(
            News.id < news_id, News.is_activate == 1, News.status == 1
        )
        .order_by(News.id.desc()).first()
    )
    next_n = (
        db.query(News)
        .filter(
            News.id > news_id, News.is_activate == 1, News.status == 1
        )
        .order_by(News.id.asc()).first()
    )
    return ok(data={
        "id": n.id, "title": n.title, "category": n.category,
        "cover_image": n.cover_image, "summary": n.summary,
        "content": n.content,
        "published_at": n.published_at.isoformat() if n.published_at else None,
        "prev": {"id": prev_n.id, "title": prev_n.title} if prev_n else None,
        "next": {"id": next_n.id, "title": next_n.title} if next_n else None,
    })


@router.get("/about")
def public_about(db: DbDep):
    """关于我们（单行配置）。"""
    a = db.query(AboutContent).filter(AboutContent.id == 1).first()
    if a is None:
        return ok(data={
            "brand_story": "", "brand_image": "", "vision": {},
            "milestones": [], "honors": [],
        })
    return ok(data={
        "brand_story": a.brand_story,
        "brand_image": a.brand_image or "",
        "vision": _j(a.vision, {}),
        "milestones": _j(a.milestones),
        "honors": _j(a.honors),
    })


@router.get("/contact")
def public_contact(db: DbDep):
    """联系信息（单行配置）。"""
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


@router.post("/messages")
def public_message_create(body: MessageCreate, request: Request, db: DbDep):
    """提交留言：可选图形验证码校验 + 单 IP 5 分钟内最多 3 条（超限 429）。"""
    # 图形验证码（可选：提交即校验）
    if body.captcha_id and body.captcha:
        if not captcha.verify(body.captcha_id, body.captcha):
            return fail("验证码错误或已过期", code=400)

    ip = request.client.host if request.client else ""
    if not message_limiter.allow(f"msg:{ip}", limit=3, window_seconds=300):
        return fail("提交过于频繁，请 5 分钟后再试", code=429, status_code=429)

    db.add(
        Message(
            name=body.name, phone=body.phone, company=body.company,
            content=body.content, status=0, ip=ip,
            created_at=body.name, updated_at=body.name,
        )
    )
    db.commit()
    return ok(message="留言提交成功，我们会尽快与您联系")
