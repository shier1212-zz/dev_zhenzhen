"""pytest 共享夹具：隔离测试库 + 种子数据 + TestClient + 登录助手。

注意：必须在导入任何 app 模块前设置 DB_URL（settings 有 lru_cache）。
"""
import os
import re
import tempfile

# ---------- 在导入 app 之前指向临时测试库 ----------
_TEST_DIR = tempfile.mkdtemp(prefix="zhz_test_")
os.environ["DB_URL"] = f"sqlite:///{os.path.join(_TEST_DIR, 'test.db')}"
os.environ["JWT_SECRET"] = "test-secret"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import Base, engine  # noqa: E402
from app.core.ratelimit import message_limiter  # noqa: E402
import app.models  # noqa: E402, F401
from seed import seed  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """会话级：建表 + 种子（角色/部门/admin/单行配置）+ 演示内容。"""
    Base.metadata.create_all(engine)
    seed()
    import sys

    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
    from seed_demo import seed_demo

    seed_demo()
    yield


@pytest.fixture()
def client():
    """API 测试客户端。"""
    from app.main import app

    with TestClient(app) as c:
        yield c


def _extract_captcha(svg: str) -> str:
    """从 SVG 中提取验证码明文（<text> 节点按序拼接）。"""
    return "".join(re.findall(r"<text[^>]*>([^<])</text>", svg))


def _login(client: TestClient, username: str, password: str) -> str:
    """走完整登录链路（验证码→登录），返回 token。"""
    data = client.post("/api/v1/admin/auth/captcha").json()["data"]
    code = _extract_captcha(data["svg"])
    r = client.post(
        "/api/v1/admin/auth/login",
        json={
            "username": username,
            "password": password,
            "captcha_id": data["captcha_id"],
            "captcha": code,
        },
    )
    assert r.status_code == 200 and r.json()["code"] == 0, r.text
    return r.json()["data"]["token"]


@pytest.fixture()
def login(client):
    """登录助手：login(username, password) -> token。"""
    return lambda username="admin", password="123456": _login(client, username, password)


@pytest.fixture()
def auth(client, login):
    """授权头助手：auth(username, password) -> {"Authorization": ...}。"""
    def _auth(username="admin", password="123456"):
        return {"Authorization": f"Bearer {login(username, password)}"}
    return _auth


def make_user(username: str, role_id: int, password: str = "op123456", dept_id: int = 2):
    """直接 ORM 造一个后台账号（must_change_pwd=1）。"""
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models import SysUser

    db = SessionLocal()
    try:
        if db.query(SysUser).filter(SysUser.username == username).first():
            return
        db.add(
            SysUser(
                username=username,
                password_hash=hash_password(password),
                real_name=username,
                gender=0,
                dept_id=dept_id,
                role_id=role_id,
                must_change_pwd=1,
                is_activate=1,
                created_at="admin", updated_at="admin",
            )
        )
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def clear_message_limit():
    """清空留言限流计数（便于限流测试）。"""
    message_limiter._store.clear()
    yield
    message_limiter._store.clear()
