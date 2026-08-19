"""M4 后台联调冒烟测试：用 admin/123456 走完整前端契约（验证码→登录→me→各模块只读）。"""
import json
import re
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"


def req(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}


def main():
    fails = []

    # 1) 验证码
    st, cap = req("POST", "/api/v1/admin/auth/captcha")
    assert st == 200 and cap.get("code") == 0, f"captcha failed: {st} {cap}"
    svg = cap["data"]["svg"]
    code = "".join(re.findall(r"<text[^>]*>([^<])</text>", svg))
    cid = cap["data"]["captcha_id"]
    print(f"[ok] captcha svg, extracted code={code}")

    # 2) 登录
    st, login = req("POST", "/api/v1/admin/auth/login", {
        "username": "admin", "password": "123456",
        "captcha_id": cid, "captcha": code,
    })
    assert st == 200 and login.get("code") == 0, f"login failed: {st} {login}"
    token = login["data"]["token"]
    print(f"[ok] login, must_change_pwd={login['data']['must_change_pwd']}, "
          f"perms_modules={len(login['data']['permissions'])}")

    # 3) me
    st, me = req("GET", "/api/v1/admin/auth/me", token=token)
    assert st == 200 and me.get("code") == 0, f"me failed: {st} {me}"
    print(f"[ok] me username={me['data']['username']}")

    # 4) 各模块只读
    endpoints = [
        "/api/v1/admin/banners",
        "/api/v1/admin/news",
        "/api/v1/admin/products",
        "/api/v1/admin/categories",
        "/api/v1/admin/messages",
        "/api/v1/admin/departments",
        "/api/v1/admin/roles",
        "/api/v1/admin/users",
        "/api/v1/admin/logs",
        "/api/v1/admin/home/config",
        "/api/v1/admin/home/featured",
        "/api/v1/admin/about",
        "/api/v1/admin/contact",
    ]
    for ep in endpoints:
        st, resp = req("GET", ep, token=token)
        ok = st == 200 and resp.get("code") == 0
        print(f"[{'ok' if ok else 'FAIL'}] GET {ep} -> {st} code={resp.get('code')}")
        if not ok:
            fails.append(ep)

    # 5) 写操作验证：新增轮播再软删除
    st, cr = req("POST", "/api/v1/admin/banners", {
        "image_url": "/uploads/test.png", "title": "冒烟测试轮播",
        "link_type": "none", "sort": 1,
    }, token=token)
    ok = st == 200 and cr.get("code") == 0
    print(f"[{'ok' if ok else 'FAIL'}] POST /banners -> {st} code={cr.get('code')}")
    if ok:
        bid = cr["data"]["id"]
        st, dl = req("DELETE", f"/api/v1/admin/banners/{bid}", token=token)
        print(f"[{'ok' if st==200 and dl.get('code')==0 else 'FAIL'}] DELETE /banners/{bid}")
        if st != 200 or dl.get("code") != 0:
            fails.append(f"DELETE /banners/{bid}")
    else:
        fails.append("POST /banners")

    if fails:
        print("\nFAILURES:", fails)
        raise SystemExit(1)
    print("\nALL ADMIN ENDPOINTS OK")


if __name__ == "__main__":
    main()
