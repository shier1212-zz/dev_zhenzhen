"""M2 冒烟测试：公开接口 + 后台各模块 CRUD + 权限矩阵 + 留言限流。

用法：先启动 uvicorn（`uvicorn app.main:app --port 8000`），再运行本脚本。
测试创建的临时数据会在最后清理；home/about/contact 配置保留测试写入值（演示用途）。
"""
import re
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

BASE = "http://127.0.0.1:8000"
PASS = FAIL = 0
CLEANUP_IDS = {"category": [], "product": [], "news": [], "banner": [],
               "message": [], "dept": [], "role": [], "user": []}


def check(name, cond, extra=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  [PASS] {name} {extra}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name} {extra}")


def extract_code(svg: str) -> str:
    texts = re.findall(r'<text[^>]*x="(\d+)"[^>]*>([A-Z2-9])</text>', svg)
    texts.sort(key=lambda t: int(t[0]))
    return "".join(ch for _, ch in texts).lower()


def get_captcha(client):
    r = client.post("/api/v1/admin/auth/captcha")
    d = r.json()["data"]
    return d["captcha_id"], extract_code(d["svg"])


def login(client, username="admin", password="123456"):
    cid, code = get_captcha(client)
    r = client.post("/api/v1/admin/auth/login", json={
        "username": username, "password": password,
        "captcha_id": cid, "captcha": code,
    })
    return r.json()["data"]["token"] if r.json()["code"] == 0 else None


def main():
    client = httpx.Client(base_url=BASE, timeout=15)

    # ========== 0. 登录 admin ==========
    token = login(client)
    check("admin 登录", bool(token))
    if not token:
        print("  中止：无法登录")
        sys.exit(1)
    H = {"Authorization": f"Bearer {token}"}

    # ========== 1. 公开接口（初始） ==========
    r = client.get("/api/v1/public/banners")
    check("公开 banners", r.json()["code"] == 0 and "items" in r.json()["data"])
    r = client.get("/api/v1/public/home-config")
    check("公开 home-config", r.json()["data"]["brand_slogan"] == "让家更懂你")
    r = client.get("/api/v1/public/categories")
    check("公开 categories", r.json()["code"] == 0)
    r = client.get("/api/v1/public/about")
    check("公开 about", r.json()["code"] == 0)
    r = client.get("/api/v1/public/contact")
    check("公开 contact", r.json()["data"]["company_name"] == "蓁蓁智能家居")

    # ========== 2. 分类 CRUD ==========
    r = client.post("/api/v1/admin/categories", headers=H,
                    json={"name": "智能门锁", "sort": 10})
    check("创建分类", r.json()["code"] == 0, f"msg={r.json()['message']}")
    cat_id = r.json()["data"]["id"]
    CLEANUP_IDS["category"].append(cat_id)
    r = client.post("/api/v1/admin/categories", headers=H, json={"name": "智能门锁"})
    check("重复分类名→409", r.json()["code"] == 409)
    r = client.get("/api/v1/admin/categories", headers=H)
    check("分类列表", any(c["id"] == cat_id for c in r.json()["data"]["items"]))
    r = client.put(f"/api/v1/admin/categories/{cat_id}", headers=H,
                   json={"name": "智能门锁系列", "sort": 10})
    check("更新分类", r.json()["code"] == 0)

    # ========== 3. 产品 CRUD ==========
    def make_product(name, cid, price=100.0):
        r = client.post("/api/v1/admin/products", headers=H, json={
            "category_id": cid, "name": name, "cover_image": "/uploads/p.jpg",
            "images": ["/uploads/p1.jpg"], "price_min": price, "price_max": price,
            "show_price": 1, "brief": f"{name}简介", "params": [{"key": "材质", "value": "金属"}],
            "detail_content": f"<p>{name}详情</p>", "sort": 1, "status": 1,
        })
        return r.json()

    r = make_product("智能门锁A", cat_id)
    check("创建产品A", r["code"] == 0)
    pid_a = r["data"]["id"]
    CLEANUP_IDS["product"].append(pid_a)
    r = make_product("智能门锁B", cat_id, 200)
    pid_b = r["data"]["id"]
    CLEANUP_IDS["product"].append(pid_b)

    r = client.get("/api/v1/admin/products", headers=H, params={"category_id": cat_id})
    check("产品列表", r.json()["data"]["total"] == 2 and r.json()["data"]["items"][0]["category_name"] == "智能门锁系列")
    r = client.put(f"/api/v1/admin/products/{pid_a}/status", headers=H, json={"status": 0})
    check("产品下架", r.json()["code"] == 0)
    r = client.get("/api/v1/admin/products", headers=H, params={"status": 0})
    check("下架筛选", r.json()["data"]["total"] == 1)
    r = client.put("/api/v1/admin/products/batch-status", headers=H,
                   json={"ids": [pid_a, pid_b], "status": 1})
    check("批量上架", r.json()["code"] == 0)
    r = client.get(f"/api/v1/admin/products/{pid_a}", headers=H)
    check("产品详情", r.json()["data"]["params"][0]["key"] == "材质")

    # ========== 4. 首页精选 ==========
    r = client.put("/api/v1/admin/home/featured", headers=H, json={"product_ids": [pid_a, pid_b]})
    check("设置精选", r.json()["code"] == 0)
    r = client.get("/api/v1/admin/home/featured", headers=H)
    check("精选列表", r.json()["data"]["items"][0]["product_id"] == pid_a)
    r = client.get("/api/v1/public/home-config")
    check("公开精选生效", len(r.json()["data"]["featured_products"]) == 2)

    # ========== 5. Banner CRUD + 软删除 ==========
    r = client.post("/api/v1/admin/banners", headers=H, json={
        "image_url": "/uploads/b1.jpg", "title": "全屋智能新品", "sort": 1,
    })
    check("创建Banner", r.json()["code"] == 0)
    bid = r.json()["data"]["id"]
    CLEANUP_IDS["banner"].append(bid)
    r = client.put(f"/api/v1/admin/banners/{bid}/status", headers=H, json={"is_activate": 1})
    check("Banner启用", r.json()["code"] == 0)
    r = client.get("/api/v1/public/banners")
    check("公开Banner生效", len(r.json()["data"]["items"]) == 1)
    r = client.delete(f"/api/v1/admin/banners/{bid}", headers=H)
    check("Banner软删除", r.json()["code"] == 0)
    r = client.get("/api/v1/public/banners")
    check("软删除后公开不可见", len(r.json()["data"]["items"]) == 0)
    r = client.get("/api/v1/admin/banners", headers=H)
    check("后台列表过滤软删除", len(r.json()["data"]["items"]) == 0)

    # ========== 6. 新闻 CRUD（草稿→发布） ==========
    r = client.post("/api/v1/admin/news", headers=H, json={
        "title": "测试新闻", "category": "公司动态", "summary": "摘要", "content": "<p>正文</p>", "status": 0,
    })
    check("创建新闻(草稿)", r.json()["code"] == 0)
    nid = r.json()["data"]["id"]
    CLEANUP_IDS["news"].append(nid)
    r = client.get("/api/v1/public/news")
    check("草稿不出现在公开", r.json()["data"]["total"] == 0)
    r = client.put(f"/api/v1/admin/news/{nid}", headers=H, json={
        "title": "测试新闻", "category": "公司动态", "summary": "摘要",
        "content": "<p>正文</p>", "status": 1,
    })
    check("发布新闻", r.json()["code"] == 0)
    r = client.get("/api/v1/public/news")
    check("已发布出现在公开", r.json()["data"]["total"] == 1)
    r = client.get(f"/api/v1/public/news/{nid}")
    check("公开新闻详情", r.json()["code"] == 0 and r.json()["data"]["title"] == "测试新闻")

    # ========== 7. 配置单行表 ==========
    r = client.put("/api/v1/admin/home/config", headers=H, json={
        "brand_slogan": "让家更懂你", "brand_desc": "以科技重塑居家体验。",
        "brand_image": "/uploads/brand.jpg",
        "advantages": [{"icon": "shield", "title": "安全", "desc": "全屋安防"}],
    })
    check("更新首页配置", r.json()["code"] == 0)
    r = client.put("/api/v1/admin/about", headers=H, json={
        "brand_story": "我们的故事", "vision": {"mission": "让家更智能"},
        "milestones": [{"year": 2020, "event": "成立", "sort": 1}],
        "honors": [],
    })
    check("更新关于我们", r.json()["code"] == 0)
    r = client.get("/api/v1/public/about")
    check("公开关于生效", r.json()["data"]["milestones"][0]["year"] == 2020)
    r = client.put("/api/v1/admin/contact", headers=H, json={
        "phone": "400-000-0000", "email": "hi@example.com", "address": "深圳",
        "work_time": "9:00-18:00", "company_name": "蓁蓁智能家居", "icp_no": "粤ICP备00000000号",
    })
    check("更新联系信息", r.json()["code"] == 0)

    # ========== 8. 留言（公开提交 + 限流 + 后台处理） ==========
    for i in range(3):
        r = client.post("/api/v1/public/messages", json={
            "name": f"访客{i}", "phone": "1380000000", "content": "想了解产品",
        })
        check(f"留言{i+1}成功", r.json()["code"] == 0)
    r = client.post("/api/v1/public/messages", json={
        "name": "访客4", "phone": "1380000000", "content": "第四条",
    })
    check("第4条留言→429限流", r.json()["code"] == 429, f"msg={r.json()['message']}")
    r = client.get("/api/v1/admin/messages", headers=H)
    check("后台留言列表", r.json()["data"]["total"] == 3)
    mid = r.json()["data"]["items"][0]["id"]
    CLEANUP_IDS["message"].append(mid)
    r = client.put(f"/api/v1/admin/messages/{mid}", headers=H,
                   json={"status": 1, "handle_note": "已电话回复"})
    check("处理留言", r.json()["code"] == 0)
    r = client.put(f"/api/v1/admin/messages/{mid}", headers=H, json={"status": 0, "handle_note": ""})
    check("留言回退", r.json()["code"] == 0)

    # ========== 9. 部门/角色/账号 ==========
    r = client.post("/api/v1/admin/departments", headers=H,
                    json={"name": "测试部门", "parent_id": 1, "code": "TST", "sort": 99})
    check("创建部门", r.json()["code"] == 0)
    dept_id = r.json()["data"]["id"]
    CLEANUP_IDS["dept"].append(dept_id)
    r = client.get("/api/v1/admin/departments", headers=H)
    check("部门树", any(c["id"] == dept_id for c in r.json()["data"]["items"][0]["children"]))

    r = client.post("/api/v1/admin/roles", headers=H, json={
        "name": "测试角色",
        "permissions": {"banner": ["view"], "news": ["view", "edit"]},
    })
    check("创建角色", r.json()["code"] == 0)
    role_id = r.json()["data"]["id"]
    CLEANUP_IDS["role"].append(role_id)
    r = client.put(f"/api/v1/admin/roles/{role_id}", headers=H, json={
        "name": "测试角色", "permissions": {"banner": ["view"], "news": ["view", "edit"]},
    })
    check("更新角色", r.json()["code"] == 0)

    r = client.post("/api/v1/admin/users", headers=H, json={
        "username": "testop", "password": "test123456", "real_name": "测试运营",
        "dept_id": dept_id, "role_id": role_id, "is_activate": 1,
    })
    check("创建账号", r.json()["code"] == 0)
    uid = r.json()["data"]["id"]
    CLEANUP_IDS["user"].append(uid)

    # 新账号登录 → 权限矩阵验证（无 product 权限 → 403）
    token2 = login(client, "testop", "test123456")
    check("新账号登录", bool(token2))
    H2 = {"Authorization": f"Bearer {token2}"}
    if token2:
        r = client.get("/api/v1/admin/products", headers=H2)
        check("无产品权限→403", r.status_code == 403 or r.json().get("detail"), "")
        r = client.get("/api/v1/admin/news", headers=H2)
        check("有新闻权限→200", r.json()["code"] == 0)
    # 停用后登录态失效
    r = client.put(f"/api/v1/admin/users/{uid}/status", headers=H, json={"is_activate": 0})
    check("停用账号", r.json()["code"] == 0)
    if token2:
        r = client.get("/api/v1/admin/news", headers=H2)
        check("停用后401", r.status_code == 401)

    # ========== 10. 操作日志 ==========
    r = client.get("/api/v1/admin/logs", headers=H, params={"page_size": 5})
    check("操作日志列表", r.json()["code"] == 0 and r.json()["data"]["total"] >= 1,
          f"total={r.json()['data']['total']}")

    # ========== 11. 删除约束 ==========
    r = client.delete(f"/api/v1/admin/categories/{cat_id}", headers=H)
    check("分类下有产品删除→409", r.json()["code"] == 409)
    r = client.delete(f"/api/v1/admin/departments/{dept_id}", headers=H)
    check("部门下有账号删除→409", r.json()["code"] == 409)

    # ========== 12. 清理测试数据 ==========
    for pid in CLEANUP_IDS["product"]:
        client.delete(f"/api/v1/admin/products/{pid}", headers=H)
    for cid in CLEANUP_IDS["category"]:
        client.delete(f"/api/v1/admin/categories/{cid}", headers=H)
    for nid in CLEANUP_IDS["news"]:
        client.delete(f"/api/v1/admin/news/{nid}", headers=H)
    for mid in CLEANUP_IDS["message"]:
        client.delete(f"/api/v1/admin/messages/{mid}", headers=H)
    for uid in CLEANUP_IDS["user"]:
        client.delete(f"/api/v1/admin/users/{uid}", headers=H)
    for rid in CLEANUP_IDS["role"]:
        client.delete(f"/api/v1/admin/roles/{rid}", headers=H)
    for did in CLEANUP_IDS["dept"]:
        client.delete(f"/api/v1/admin/departments/{did}", headers=H)
    print("  [INFO] 测试数据已清理")

    print(f"\n=== M2 结果：{PASS} 通过 / {FAIL} 失败 ===")
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
