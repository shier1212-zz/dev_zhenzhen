"""演示内容填充（幂等，可重复执行）。

目标（PRD/方案 §10 内容运营闭环）：
- 轮播图 5 张、产品 8 个（2 分类）、新闻 4 篇
- 单行配置：home_config（标语/理念/配图/4 优势）、about_content（故事/愿景三卡/时间轴/荣誉）、contact_config
- 首页精选 4 个

占位图：本地生成 SVG 写入 uploads/demo/，不依赖外部网络。
用法：在 server 目录下执行 `python scripts/seed_demo.py`
"""
import json
import os
from datetime import datetime

from app.core.database import SessionLocal
from app.core.security import hash_password  # noqa: F401  仅确保依赖可导入
from app.models import (
    AboutContent,
    Banner,
    ContactConfig,
    HomeConfig,
    HomeFeaturedProduct,
    News,
    Product,
    ProductCategory,
)

NOW = datetime.now()
DEMO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "demo")
BRAND = "#0E9384"


def _svg(path: str, w: int, h: int, bg: str, title: str, sub: str = "") -> str:
    """生成一张占位 SVG 并返回 URL（文件已存在则跳过，便于在只读目录下复用）。"""
    if os.path.exists(path):
        return f"/uploads/demo/{os.path.basename(path)}"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    text = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
        f'<rect width="{w}" height="{h}" fill="{bg}"/>'
        f'<rect x="12" y="12" width="{w-24}" height="{h-24}" fill="none" stroke="#ffffff" '
        f'stroke-opacity="0.5" stroke-width="2" rx="10"/>'
        f'<text x="50%" y="48%" text-anchor="middle" fill="#ffffff" font-size="{int(w*0.05)}" '
        f'font-family="Arial, sans-serif" font-weight="bold">{title}</text>'
    )
    if sub:
        text += (
            f'<text x="50%" y="60%" text-anchor="middle" fill="#ffffff" fill-opacity="0.85" '
            f'font-size="{int(w*0.024)}" font-family="Arial, sans-serif">{sub}</text>'
        )
    text += "</svg>"
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return f"/uploads/demo/{os.path.basename(path)}"


def _img(name: str, w: int, h: int, bg: str, title: str, sub: str = "") -> str:
    return _svg(os.path.join(DEMO_DIR, name), w, h, bg, title, sub)


BANNERS = [
    ("智能全屋，一键掌控", "AIoT 家居解决方案", "product", 1),
    ("让家更懂你", "蓁蓁智能家居 品牌理念", "url", 2),
    ("新品上市：智能门锁 3.0", "安全从未如此简单", "news", 3),
    ("全屋智能灯光系统", "场景随心，氛围随行", "product", 4),
    ("智能安防守护每一夜", "7×24 小时安心守护", "product", 5),
]

PRODUCTS = [
    ("智能中控屏 Z1", "7 英寸触控，全屋设备一屏掌控", 1999, 2599, [("屏幕", "7 英寸 IPS"), ("系统", "蓁睿 OS"), ("协议", "Zigbee/Wi-Fi/蓝牙")]),
    ("智能音箱 Pro", "语音控制全屋设备，音质升级", 399, 599, [("功率", "30W"), ("麦克风", "6 麦阵列"), ("协议", "Wi-Fi/蓝牙")]),
    ("智能门锁 3.0", "指纹/密码/人脸三合一，安全便捷", 1299, 1699, [("解锁", "指纹/密码/NFC/人脸"), ("锁体", "全自动静音锁体"), ("供电", "8 节 AA 电池")]),
    ("智能摄像头 2K", "360° 云台，AI 人形侦测", 299, 399, [("画质", "2K 超清"), ("云台", "360° 水平"), ("存储", "SD/云存储")]),
    ("智能灯光套装", "色温亮度无极调节，氛围随心", 699, 899, [("色温", "2700K-6500K"), ("调光", "0-100% 无级"), ("数量", "8 盏起步")]),
    ("智能窗帘电机", "定时开合，语音/APP 远程控制", 399, 499, [("行程", "自动记忆限位"), ("静音", "≤35dB"), ("供电", "AC 100-240V")]),
    ("环境传感器套装", "温湿度/PM2.5/光照多维感知", 199, 299, [("类型", "温湿度/PM2.5/光照"), ("联动", "自动触发场景"), ("供电", "CR2477 电池")]),
    ("智能开关面板", "零火/单火通用，颜值与实用兼得", 89, 129, [("类型", "1-4 键可选"), ("负载", "≤1600W"), ("安装", "86 底盒标准")]),
]

NEWS = [
    ("蓁蓁智能家居发布新一代全屋智能中控系统", "公司动态", "全新 Z1 中控屏搭载蓁睿 OS，实现全屋设备一屏统管。"),
    ("智能家居行业观察：从单品智能走向全屋智能", "行业资讯", "AIoT 时代，全屋智能解决方案成为行业新赛道。"),
    ("蓁蓁智能灯光系统获多项设计大奖", "公司动态", "无级调光与多场景联动赢得专业评审认可。"),
    ("新品上市：智能门锁 3.0 开启无感开门体验", "产品资讯", "指纹/密码/人脸三合一，安全与便捷兼得。"),
]

ABOUT_MILESTONES = [
    {"year": "2019", "title": "公司成立", "desc": "蓁蓁智能家居于深圳成立，专注 AIoT 全屋智能"},
    {"year": "2020", "title": "首款产品发布", "desc": "智能中控屏 Z1 上市，开启全屋智能新体验"},
    {"year": "2022", "title": "生态初成", "desc": "灯光/安防/环境等多品类矩阵成型"},
    {"year": "2024", "title": "服务升级", "desc": "全国 30+ 城市落地全屋智能整装服务"},
]

ABOUT_HONORS = [
    {"title": "国家高新技术企业", "desc": "2021"},
    {"title": "智能家居十大品牌", "desc": "2023"},
    {"title": "ISO9001 质量体系认证", "desc": "2022"},
    {"title": "AAA 级信用企业", "desc": "2022"},
]

ADVANTAGES = [
    {"icon": "home", "title": "全屋互联", "desc": "中控/灯光/安防/窗帘多品类一屏统管"},
    {"icon": "shield", "title": "安全可靠", "desc": "本地化边缘计算，数据不出家门"},
    {"icon": "zap", "title": "场景随心", "desc": "回家/离家/睡眠等场景一键切换"},
    {"icon": "wrench", "title": "省心服务", "desc": "免费上门设计，全国安装售后"},
]


def seed_demo() -> None:
    db = SessionLocal()
    try:
        # ---------- 回填：历史数据空图片 URL 补占位图 ----------
        colors = ["#0E9384", "#1D7A8C", "#5B6CBF", "#B96F2C", "#7A5BA8"]
        for b in db.query(Banner).filter(Banner.deleted_at.is_(None)).all():
            if not b.image_url:
                b.image_url = _img(f"banner-{b.id}.svg", 1600, 600,
                                   colors[b.id % len(colors)], b.title or "轮播", b.subtitle or "")
                b.updated_at = "admin"
                b.updated_date = NOW
        for p in db.query(Product).all():
            if not p.cover_image:
                url = _img(f"product-{p.id}.svg", 800, 600,
                           colors[p.id % len(colors)], p.name, (p.brief or "")[:14])
                p.cover_image = url
                p.images = json.dumps([url], ensure_ascii=False)
                p.updated_at = "admin"
                p.updated_date = NOW
        for n in db.query(News).all():
            if not n.cover_image:
                n.cover_image = _img(f"news-{n.id}.svg", 640, 360,
                                     colors[n.id % len(colors)], n.title[:12], "")
                n.updated_at = "admin"
                n.updated_date = NOW
        db.flush()

        # ---------- 轮播（补足 5 张） ----------
        cur_banners = db.query(Banner).filter(Banner.deleted_at.is_(None)).count()
        for i in range(cur_banners, 5):
            title, sub, link_type, sort = BANNERS[i]
            url = _img(f"banner-{i+1}.svg", 1600, 600, "#0E9384", title, sub)
            db.add(Banner(
                image_url=url, title=title, subtitle=sub, link_type=link_type,
                link_target="", sort=sort, is_activate=1,
                created_at="admin", updated_at="admin",
            ))

        # ---------- 分类（不足 2 个则创建） ----------
        cats = db.query(ProductCategory).order_by(ProductCategory.id.asc()).all()
        if len(cats) < 2:
            need = 2 - len(cats)
            for i, name in enumerate(["智能控制", "智能安防"][:need], start=len(cats) + 1):
                db.add(ProductCategory(name=name, sort=i * 10, is_activate=1,
                                       created_at="admin", updated_at="admin"))
            db.flush()
            cats = db.query(ProductCategory).order_by(ProductCategory.id.asc()).all()

        # ---------- 产品（补足 8 个） ----------
        cur_products = db.query(Product).count()
        for i in range(cur_products, 8):
            name, brief, pmin, pmax, params = PRODUCTS[i]
            cat = cats[i % len(cats)]
            cover = _img(f"product-{i+1}.svg", 800, 600, ["#0E9384", "#1D7A8C", "#5B6CBF", "#B96F2C"][i % 4], name, brief[:14])
            detail = (
                f"<h3>{name}</h3><p>{brief}。蓁蓁智能家居以用户体验为核心，"
                f"将稳定可靠的硬件与智能场景算法相结合。</p><p>支持 APP/语音/中控屏多端控制，"
                f"可与全屋其他智能设备自由联动，为家庭带来便捷、舒适、安全的智能生活体验。</p>"
            )
            db.add(Product(
                category_id=cat.id, name=name, cover_image=cover,
                images=json.dumps([cover], ensure_ascii=False), price_min=pmin, price_max=pmax, show_price=1,
                brief=brief, params=json.dumps(
                    [{"key": k, "value": v} for k, v in params], ensure_ascii=False),
                detail_content=detail, sort=(i + 1) * 10, status=1, is_activate=1,
                created_at="admin", updated_at="admin",
            ))

        # ---------- 新闻（补足 4 篇） ----------
        cur_news = db.query(News).count()
        for i in range(cur_news, 4):
            title, cat, summary = NEWS[i]
            cover = _img(f"news-{i+1}.svg", 640, 360, ["#0E9384", "#1D7A8C", "#5B6CBF", "#B96F2C"][i % 4], title[:12])
            content = (
                f"<p>{summary}</p><p>蓁蓁智能家居持续深耕 AIoT 全屋智能领域，"
                f"以「让家更懂你」为品牌理念，为万千家庭提供从设计、安装到售后的全链路服务。</p>"
                f"<p>未来，我们将继续围绕场景化智能、数据安全与本地化服务，打造更懂中国家庭的智能家居体验。</p>"
            )
            db.add(News(
                title=title, category=cat, cover_image=cover, summary=summary,
                content=content, status=1, is_activate=1,
                published_at=NOW, created_at="admin", updated_at="admin",
            ))

        # ---------- 单行配置 ----------
        home = db.query(HomeConfig).filter(HomeConfig.id == 1).first()
        if home:
            home.brand_slogan = "让家更懂你"
            home.brand_desc = "以 AIoT 技术重塑居家体验，用智能连接美好生活。全屋智能，一站到位。"
            home.brand_image = _img("about-banner.svg", 1200, 600, "#0E9384", "让家更懂你")
            home.advantages = json.dumps(ADVANTAGES, ensure_ascii=False)
            home.updated_at = "admin"
            home.updated_date = NOW

        about = db.query(AboutContent).filter(AboutContent.id == 1).first()
        if about:
            about.brand_story = (
                "<p>蓁蓁智能家居成立于 2019 年，是一家专注 AIoT 全屋智能的国家高新技术企业。</p>"
                "<p>我们相信，科技的价值在于让生活更简单、更温暖。从第一块智能中控屏开始，"
                "我们始终坚持自主研发，将稳定可靠的硬件与智能场景算法深度融合，"
                "为家庭打造「懂你」的智能生活空间。</p>"
            )
            about.vision = json.dumps({
                "mission": "以科技温暖每个家庭",
                "vision": "成为最懂中国家庭的全屋智能品牌",
                "values": "用户为本 · 匠心品质 · 长期主义",
            }, ensure_ascii=False)
            about.milestones = json.dumps(ABOUT_MILESTONES, ensure_ascii=False)
            about.honors = json.dumps(ABOUT_HONORS, ensure_ascii=False)
            about.updated_at = "admin"
            about.updated_date = NOW

        contact = db.query(ContactConfig).filter(ContactConfig.id == 1).first()
        if contact:
            contact.phone = "400-888-6666"
            contact.email = "service@zhenzhen.home"
            contact.address = "广东省深圳市南山区科技园蓁蓁大厦 18F"
            contact.work_time = "周一至周五 9:00 - 18:00（法定节假日除外）"
            contact.company_name = "蓁蓁智能家居"
            contact.icp_no = "粤ICP备2026XXXXXX号"
            contact.updated_at = "admin"
            contact.updated_date = NOW

        # ---------- 首页精选（4 个，取最新上架 4 个） ----------
        db.query(HomeFeaturedProduct).delete()
        products = (
            db.query(Product)
            .filter(Product.is_activate == 1, Product.status == 1)
            .order_by(Product.id.desc())
            .limit(4)
            .all()
        )
        for sort, p in enumerate(products, start=1):
            db.add(HomeFeaturedProduct(
                product_id=p.id, sort=sort, is_activate=1,
                created_at="admin", updated_at="admin",
            ))

        db.commit()
        print("[ok] 演示内容填充完成：")
        print(f"  轮播 {min(cur_banners, 5)} -> 5")
        print(f"  产品 {min(cur_products, 8)} -> 8")
        print(f"  新闻 {min(cur_news, 4)} -> 4")
        print("  home/about/contact 配置已更新，精选 4 个已设置")
        print(f"  占位图目录: {DEMO_DIR}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo()
