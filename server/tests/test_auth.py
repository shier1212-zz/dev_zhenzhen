"""认证模块测试：验证码/登录/锁定/改密/me/上传校验。"""
from conftest import _extract_captcha, make_user
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import SysUser


def _captcha_code(client):
    data = client.post("/api/v1/admin/auth/captcha").json()["data"]
    return data["captcha_id"], _extract_captcha(data["svg"])


def test_captcha(client):
    r = client.post("/api/v1/admin/auth/captcha")
    assert r.status_code == 200 and r.json()["code"] == 0
    data = r.json()["data"]
    assert data["captcha_id"] and "<svg" in data["svg"]


def test_login_success(client):
    cid, code = _captcha_code(client)
    r = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "123456", "captcha_id": cid, "captcha": code},
    )
    assert r.status_code == 200 and r.json()["code"] == 0
    data = r.json()["data"]
    assert data["token"]
    assert data["must_change_pwd"] is True  # 种子 admin 强制首登改密
    assert len(data["permissions"]) == 11  # 超管 11 模块


def test_login_wrong_captcha(client):
    cid, _ = _captcha_code(client)
    r = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "123456", "captcha_id": cid, "captcha": "ZZZZ"},
    )
    assert r.json()["code"] == 400
    assert "验证码" in r.json()["message"]


def test_login_wrong_password(client):
    cid, code = _captcha_code(client)
    r = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "wrong-pwd", "captcha_id": cid, "captcha": code},
    )
    assert r.json()["code"] == 400
    assert "剩余" in r.json()["message"] or "账号或密码错误" in r.json()["message"]


def test_login_lockout_after_5_failures(client):
    """连续 5 次密码错误锁定 30 分钟（用独立账号避免影响 admin）。"""
    make_user("lockuser", role_id=1, password="123456")
    for i in range(4):  # 前 4 次：仅计数，400
        cid, code = _captcha_code(client)
        r = client.post(
            "/api/v1/admin/auth/login",
            json={"username": "lockuser", "password": "bad-pass", "captcha_id": cid, "captcha": code},
        )
        assert r.json()["code"] == 400
    # 第 5 次：触发锁定
    cid, code = _captcha_code(client)
    r = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "lockuser", "password": "bad-pass", "captcha_id": cid, "captcha": code},
    )
    assert r.json()["code"] == 403
    assert "锁定" in r.json()["message"]
    # 锁定期间正确密码也被拒
    cid, code = _captcha_code(client)
    r = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "lockuser", "password": "123456", "captcha_id": cid, "captcha": code},
    )
    assert r.json()["code"] == 403
    assert "锁定" in r.json()["message"]
    # 复位锁定，避免影响其他用例
    db = SessionLocal()
    try:
        u = db.query(SysUser).filter(SysUser.username == "lockuser").first()
        u.fail_count = 0
        u.locked_until = None
        db.commit()
    finally:
        db.close()


def test_login_disabled_account(client):
    make_user("disableduser", role_id=2)
    db = SessionLocal()
    try:
        u = db.query(SysUser).filter(SysUser.username == "disableduser").first()
        u.is_activate = 0
        db.commit()
    finally:
        db.close()
    cid, code = _captcha_code(client)
    r = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "disableduser", "password": "op123456", "captcha_id": cid, "captcha": code},
    )
    assert r.json()["code"] == 403
    assert "停用" in r.json()["message"]


def test_me(client, auth):
    r = client.get("/api/v1/admin/auth/me", headers=auth())
    data = r.json()["data"]
    assert data["username"] == "admin"
    assert data["permissions"]["banner"] == ["view", "edit"]


def test_me_requires_token(client):
    r = client.get("/api/v1/admin/auth/me")
    assert r.status_code == 401


def test_change_password_flow(client):
    """独立账号走完整改密链路：错误旧密码→正确旧密码→新密码登录→must_change_pwd 清零。"""
    make_user("chguser", role_id=1, password="123456")
    h = {"Authorization": f"Bearer {_login(client, 'chguser', '123456')}"}

    # 旧密码错误
    r = client.put("/api/v1/admin/auth/password", json={"old_password": "wrong", "new_password": "newpass123"}, headers=h)
    assert r.json()["code"] == 400

    # 新密码 == 旧密码
    r = client.put("/api/v1/admin/auth/password", json={"old_password": "123456", "new_password": "123456"}, headers=h)
    assert r.json()["code"] == 400

    # 正确修改
    r = client.put("/api/v1/admin/auth/password", json={"old_password": "123456", "new_password": "newpass123"}, headers=h)
    assert r.json()["code"] == 0

    # me 显示 must_change_pwd=0
    assert client.get("/api/v1/admin/auth/me", headers=h).json()["data"]["must_change_pwd"] == 0

    # 新密码可登录
    assert _login(client, "chguser", "newpass123")


def _login(client, username, password):
    from conftest import _login as _l
    return _l(client, username, password)


def test_upload_rejects_non_image(client, auth):
    r = client.post(
        "/api/v1/admin/upload",
        headers=auth(),
        files={"file": ("evil.txt", b"hello", "text/plain")},
    )
    assert r.json()["code"] == 400
