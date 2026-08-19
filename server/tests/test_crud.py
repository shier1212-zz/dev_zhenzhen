"""后台 CRUD 测试：轮播软删/新闻/产品/分类约束/留言/账号。"""
from conftest import make_user
from app.core.database import SessionLocal
from app.models import Banner, Message, SysUser

B = "/api/v1/admin"


def test_banner_crud_and_soft_delete(client, auth):
    h = auth()
    # 新增
    r = client.post(B + "/banners", json={"image_url": "/uploads/demo/banner-1.svg", "title": "测试轮播", "subtitle": "副标题", "link_type": "none", "sort": 99}, headers=h)
    assert r.json()["code"] == 0
    bid = r.json()["data"]["id"]
    # 列表包含
    lst = client.get(B + "/banners?keyword=测试轮播", headers=h).json()["data"]
    assert lst["total"] >= 1
    # 详情
    assert client.get(f"{B}/banners/{bid}", headers=h).json()["data"]["title"] == "测试轮播"
    # 修改
    r = client.put(f"{B}/banners/{bid}", json={"image_url": "/uploads/demo/banner-1.svg", "title": "测试轮播-改", "subtitle": "副", "link_type": "none", "sort": 88}, headers=h)
    assert r.json()["code"] == 0
    # 停用
    r = client.put(f"{B}/banners/{bid}/status", json={"is_activate": 0}, headers=h)
    assert r.json()["code"] == 0
    assert client.get(f"{B}/banners/{bid}", headers=h).json()["data"]["is_activate"] == 0
    # 软删除：列表不再返回，详情 404
    assert client.delete(f"{B}/banners/{bid}", headers=h).json()["code"] == 0
    assert client.get(f"{B}/banners/{bid}", headers=h).json()["code"] == 404
    # 数据库行仍在（软删）
    db = SessionLocal()
    try:
        assert db.query(Banner).filter(Banner.id == bid).first() is not None
    finally:
        db.close()


def test_news_crud_with_publish(client, auth):
    h = auth()
    r = client.post(B + "/news", json={"title": "测试新闻", "category": "公司动态", "summary": "摘要", "content": "<p>正文</p>", "status": 1}, headers=h)
    assert r.json()["code"] == 0
    nid = r.json()["data"]["id"]
    d = client.get(f"{B}/news/{nid}", headers=h).json()["data"]
    assert d["published_at"] is not None  # 发布即记录时间
    # 草稿修改后发布时间保留
    client.put(f"{B}/news/{nid}", json={"title": "测试新闻2", "category": "公司动态", "summary": "s", "content": "<p>x</p>", "status": 0}, headers=h)
    d2 = client.get(f"{B}/news/{nid}", headers=h).json()["data"]
    assert d2["status"] == 0 and d2["published_at"] is not None
    assert client.delete(f"{B}/news/{nid}", headers=h).json()["code"] == 0


def test_product_crud_batch_and_params(client, auth):
    h = auth()
    cats = client.get(B + "/categories", headers=h).json()["data"]["items"]
    cid = cats[0]["id"]
    r = client.post(B + "/products", json={
        "category_id": cid, "name": "测试产品", "cover_image": "/uploads/demo/product-1.svg",
        "images": ["/uploads/demo/product-1.svg", "/uploads/demo/product-2.svg"],
        "price_min": 100, "price_max": 200, "show_price": 1, "brief": "简介",
        "params": [{"key": "尺寸", "value": "10cm"}], "detail_content": "<p>详情</p>",
        "sort": 1, "status": 1,
    }, headers=h)
    assert r.json()["code"] == 0, r.text
    pid = r.json()["data"]["id"]
    d = client.get(f"{B}/products/{pid}", headers=h).json()["data"]
    assert d["images"] == ["/uploads/demo/product-1.svg", "/uploads/demo/product-2.svg"]
    assert d["params"] == [{"key": "尺寸", "value": "10cm"}]
    assert d["category_name"]
    # 上下架 + 批量
    client.put(f"{B}/products/{pid}/status", json={"status": 0}, headers=h)
    assert client.get(f"{B}/products/{pid}", headers=h).json()["data"]["status"] == 0
    r = client.put(B + "/products/batch-status", json={"ids": [pid], "status": 1}, headers=h)
    assert r.json()["code"] == 0
    assert client.get(f"{B}/products/{pid}", headers=h).json()["data"]["status"] == 1
    # 删除
    assert client.delete(f"{B}/products/{pid}", headers=h).json()["code"] == 0


def test_category_delete_constraint(client, auth):
    h = auth()
    cats = client.get(B + "/categories", headers=h).json()["data"]["items"]
    # 有产品的分类删除 → 409
    with_products = next((c for c in cats if c["product_count"] > 0), None)
    assert with_products is not None
    r = client.delete(f"{B}/categories/{with_products['id']}", headers=h)
    assert r.json()["code"] == 409
    # 空分类可删除
    r = client.post(B + "/categories", json={"name": "临时分类", "sort": 999}, headers=h)
    cid = r.json()["data"]["id"]
    assert client.delete(f"{B}/categories/{cid}", headers=h).json()["code"] == 0


def test_message_handle_and_delete(client, auth):
    h = auth()
    # 造一条留言
    client.post("/api/v1/public/messages", json={"name": "询价", "phone": "13900000000", "content": "请报价"})
    m = client.get(B + "/messages?keyword=询价", headers=h).json()["data"]["items"][0]
    mid = m["id"]
    # 处理（已处理 + 备注）
    r = client.put(f"{B}/messages/{mid}", json={"status": 1, "handle_note": "已电话回访"}, headers=h)
    assert r.json()["code"] == 0
    d = client.get(f"{B}/messages/{mid}", headers=h).json()["data"]
    assert d["status"] == 1 and d["handle_note"] == "已电话回访"
    # 回退待处理
    r = client.put(f"{B}/messages/{mid}", json={"status": 0, "handle_note": ""}, headers=h)
    assert "回退" in r.json()["message"]
    assert client.delete(f"{B}/messages/{mid}", headers=h).json()["code"] == 0


def test_user_crud_reset_and_delete(client, auth):
    h = auth()
    # 新增
    r = client.post(B + "/users", json={
        "username": "crmuser", "password": "123456", "real_name": "测试", "gender": 1,
        "dept_id": 2, "role_id": 3, "is_activate": 1,
    }, headers=h)
    assert r.json()["code"] == 0
    uid = r.json()["data"]["id"]
    # 停用当前登录账号 → 400
    r = client.put(f"{B}/users/1/status", json={"is_activate": 0}, headers=h)
    assert r.json()["code"] == 400
    # 重置密码
    r = client.put(f"{B}/users/{uid}/password", json={"new_password": "newpass456"}, headers=h)
    assert r.json()["code"] == 0
    # 新密码可登录（must_change_pwd=1 仍签发 token；登录产生操作日志）
    from conftest import _login
    assert _login(client, "crmuser", "newpass456")
    # 已有操作日志（登录）→ 删除应 409（审计保留）
    r = client.delete(f"{B}/users/{uid}", headers=h)
    assert r.json()["code"] == 409
    # admin 有登录日志 → 删除 400/409
    r = client.delete(f"{B}/users/1", headers=h)
    assert r.json()["code"] in (400, 409)


def test_user_duplicate_username(client, auth):
    r = client.post(B + "/users", json={"username": "admin", "password": "123456", "role_id": 1}, headers=auth())
    assert r.json()["code"] == 409
