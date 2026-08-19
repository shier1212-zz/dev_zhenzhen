"""前台公开接口测试：只读 + 留言提交限流。"""
from conftest import _extract_captcha


def test_public_banners(client):
    r = client.get("/api/v1/public/banners")
    assert r.status_code == 200 and r.json()["code"] == 0
    data = r.json()["data"]
    assert data["total"] >= 5  # 演示数据补足 5 张
    assert all(it["image_url"] for it in data["items"])


def test_public_home_config(client):
    r = client.get("/api/v1/public/home-config")
    data = r.json()["data"]
    assert data["brand_slogan"]
    assert isinstance(data["advantages"], list)
    assert isinstance(data["featured_products"], list)
    assert len(data["featured_products"]) >= 1


def test_public_categories(client):
    data = client.get("/api/v1/public/categories").json()["data"]
    assert data["total"] >= 2
    assert all(it["name"] for it in data["items"])


def test_public_products(client):
    data = client.get("/api/v1/public/products").json()["data"]
    assert data["total"] >= 8
    # 公开接口不含 status 字段，服务端已保证仅返回上架产品
    assert all(it["name"] for it in data["items"])


def test_public_products_filter_by_category(client):
    cats = client.get("/api/v1/public/categories").json()["data"]["items"]
    cid = cats[0]["id"]
    data = client.get(f"/api/v1/public/products?category_id={cid}").json()["data"]
    assert all(it["category_id"] == cid for it in data["items"])


def test_public_product_detail(client):
    data = client.get("/api/v1/public/products/1").json()["data"]
    assert data["id"] == 1
    assert isinstance(data["images"], list)
    assert isinstance(data["params"], list)
    assert isinstance(data["related_products"], list)
    assert data["category_name"]


def test_public_product_detail_not_found(client):
    r = client.get("/api/v1/public/products/99999")
    assert r.json()["code"] == 404


def test_public_news(client):
    data = client.get("/api/v1/public/news").json()["data"]
    assert data["total"] >= 4
    assert all(it["published_at"] for it in data["items"])


def test_public_news_detail(client):
    data = client.get("/api/v1/public/news/1").json()["data"]
    assert data["content"]
    assert "prev" in data and "next" in data


def test_public_about(client):
    data = client.get("/api/v1/public/about").json()["data"]
    assert data["brand_story"]
    assert isinstance(data["vision"], dict)
    assert isinstance(data["milestones"], list)
    assert len(data["milestones"]) >= 1


def test_public_contact(client):
    data = client.get("/api/v1/public/contact").json()["data"]
    assert data["phone"]
    assert data["company_name"]


def test_message_create_and_rate_limit(client, clear_message_limit):
    """留言提交：3 条正常，第 4 条触发 429 限流。"""
    for i in range(3):
        r = client.post(
            "/api/v1/public/messages",
            json={"name": f"访客{i}", "phone": "13800000000", "content": f"留言内容{i}"},
        )
        assert r.json()["code"] == 0, r.text
    r = client.post(
        "/api/v1/public/messages",
        json={"name": "访客X", "phone": "13800000000", "content": "超限留言"},
    )
    assert r.status_code == 429 and r.json()["code"] == 429


def test_message_requires_name_phone_content(client):
    r = client.post("/api/v1/public/messages", json={"name": ""})
    assert r.status_code == 422
