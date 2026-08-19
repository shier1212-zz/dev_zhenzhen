"""权限矩阵测试：三角色对 11 个模块的 view/edit 访问控制。

注意：401/403 由 deps.HTTPException 抛出，响应体为 {"detail": ...}（无 code 字段）；
成功响应才是统一包装 {code:0,...}。
"""
from conftest import make_user

# 角色：1 超管（11 模块）/ 2 内容运营（6 模块）/ 3 产品运营（仅 product）
CONTENT_MODS = ["banner", "news", "home", "about", "contact", "message"]
ALL_MODS = [
    "banner", "news", "home", "about", "contact", "product",
    "message", "dept", "role", "user", "log",
]

URLS = {
    "banner": "/api/v1/admin/banners",
    "news": "/api/v1/admin/news",
    "home": "/api/v1/admin/home/config",
    "about": "/api/v1/admin/about",
    "contact": "/api/v1/admin/contact",
    "product": "/api/v1/admin/products",
    "message": "/api/v1/admin/messages",
    "dept": "/api/v1/admin/departments",
    "role": "/api/v1/admin/roles",
    "user": "/api/v1/admin/users",
    "log": "/api/v1/admin/logs",
}


def test_super_admin_all_modules(client, auth):
    for mod, url in URLS.items():
        r = client.get(url, headers=auth("admin", "123456"))
        assert r.status_code == 200 and r.json()["code"] == 0, f"{mod}: {r.text[:120]}"


def test_content_operator(client, auth):
    make_user("contentop", role_id=2)
    h = auth("contentop", "op123456")
    for mod in CONTENT_MODS:
        r = client.get(URLS[mod], headers=h)
        assert r.json()["code"] == 0, f"{mod}: {r.text[:120]}"
    for mod in set(ALL_MODS) - set(CONTENT_MODS):
        r = client.get(URLS[mod], headers=h)
        assert r.status_code == 403, f"{mod} 应 403: {r.text[:120]}"


def test_product_operator(client, auth):
    make_user("productop", role_id=3)
    h = auth("productop", "op123456")
    r = client.get(URLS["product"], headers=h)
    assert r.json()["code"] == 0
    for mod in ["banner", "news", "log"]:
        r = client.get(URLS[mod], headers=h)
        assert r.status_code == 403, f"{mod} 应 403: {r.text[:120]}"


def test_edit_requires_edit_action(client, auth):
    """产品运营有 product:view+edit，但无 message 权限 → 处理留言 403。"""
    make_user("productop2", role_id=3)
    h = auth("productop2", "op123456")
    r = client.put("/api/v1/admin/messages/1", json={"status": 1, "handle_note": "x"}, headers=h)
    assert r.status_code == 403


def test_anonymous_forbidden(client):
    r = client.get("/api/v1/admin/banners")
    assert r.status_code == 401
