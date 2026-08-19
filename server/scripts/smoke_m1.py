"""M1-步骤4 冒烟测试：验证码 → 登录（错误/锁定/成功）→ me → 改密 → 上传 → 操作日志。

用法：先启动 uvicorn（`uvicorn app.main:app --port 8000`），再运行 `python scripts/smoke_m1.py`。
测试结束后会将 admin 账号恢复为：密码 123456、must_change_pwd=1、锁定状态清零。
"""
import base64
import io
import re
import sys
from pathlib import Path

import httpx
from PIL import Image

# 保证可导入 server 根目录下的 app 包（无论从何处运行本脚本）
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

BASE = "http://127.0.0.1:8000"
PASS_COUNT = 0
FAIL_COUNT = 0


def check(name: str, cond: bool, extra: str = ""):
    global PASS_COUNT, FAIL_COUNT
    if cond:
        PASS_COUNT += 1
        print(f"  [PASS] {name} {extra}")
    else:
        FAIL_COUNT += 1
        print(f"  [FAIL] {name} {extra}")


def extract_code(svg: str) -> str:
    """从服务端返回的 SVG 中提取验证码字符（按 x 坐标排序）。"""
    texts = re.findall(r'<text[^>]*x="(\d+)"[^>]*>([A-Z2-9])</text>', svg)
    texts.sort(key=lambda t: int(t[0]))
    return "".join(ch for _, ch in texts).lower()


def get_captcha(client) -> tuple[str, str]:
    """请求验证码，返回 (captcha_id, 正确验证码)。"""
    r = client.post("/api/v1/admin/auth/captcha")
    data = r.json()["data"]
    return data["captcha_id"], extract_code(data["svg"])


def main():
    client = httpx.Client(base_url=BASE, timeout=15)

    # 1. 健康检查
    r = client.get("/api/health")
    check("健康检查", r.status_code == 200 and r.json()["status"] == "ok")

    # 2. 获取验证码
    r = client.post("/api/v1/admin/auth/captcha")
    check("获取验证码", r.status_code == 200 and r.json()["data"]["captcha_id"])
    captcha_id = r.json()["data"]["captcha_id"]
    svg = r.json()["data"]["svg"]
    check("SVG 内容", svg.startswith("<svg"))

    # 3. 验证码错误 → 400
    r = client.post("/api/v1/admin/auth/login", json={
        "username": "admin", "password": "123456",
        "captcha_id": captcha_id, "captcha": "ZZZZ",
    })
    check("验证码错误→400", r.status_code == 200 and r.json()["code"] == 400,
          f"msg={r.json()['message']}")

    # 4. 密码错误（验证码正确）→ 400 并计数；连续 5 次 → 403 锁定
    locked = False
    for i in range(5):
        cid, real_code = get_captcha(client)  # 验证码一次性，循环内每次重新获取
        r = client.post("/api/v1/admin/auth/login", json={
            "username": "admin", "password": "wrong-pass",
            "captcha_id": cid, "captcha": real_code,
        })
        if i < 4:
            check(f"第{i+1}次密码错误→400", r.json()["code"] == 400,
                  f"msg={r.json()['message']}")
        else:
            locked = r.json()["code"] == 403
            check("第5次错误→锁定403", locked, f"msg={r.json()['message']}")
    # 锁定期间登录（正确密码）→ 仍 403
    cid2, real_code2 = get_captcha(client)
    r = client.post("/api/v1/admin/auth/login", json={
        "username": "admin", "password": "123456",
        "captcha_id": cid2, "captcha": real_code2,
    })
    check("锁定期间→403", r.json()["code"] == 403, f"msg={r.json()['message']}")

    # 5. 解锁（直改库），正常登录 → 200 + token + must_change_pwd
    from app.core.database import SessionLocal
    from app.models import SysUser
    db = SessionLocal()
    u = db.query(SysUser).filter(SysUser.username == "admin").first()
    u.fail_count = 0
    u.locked_until = None
    db.commit()
    db.close()

    cid3, real_code3 = get_captcha(client)
    r = client.post("/api/v1/admin/auth/login", json={
        "username": "admin", "password": "123456",
        "captcha_id": cid3, "captcha": real_code3,
    })
    body = r.json()
    check("登录成功", body["code"] == 0 and body["data"]["token"], "")
    token = body["data"]["token"]
    check("must_change_pwd=True", body["data"]["must_change_pwd"] is True)
    check("permissions 含 banner", "banner" in body["data"]["permissions"])
    headers = {"Authorization": f"Bearer {token}"}

    # 6. me
    r = client.get("/api/v1/admin/auth/me", headers=headers)
    check("me 返回用户", r.json()["code"] == 0 and r.json()["data"]["username"] == "admin")

    # 7. 无 token 访问 → 401
    r = client.get("/api/v1/admin/auth/me")
    check("无token→401", r.status_code == 401)

    # 8. 改密（错误旧密码 → 400；正确 → 成功并清除 must_change_pwd）
    r = client.put("/api/v1/admin/auth/password", headers=headers, json={
        "old_password": "wrong", "new_password": "newpass123",
    })
    check("旧密码错误→400", r.json()["code"] == 400)
    r = client.put("/api/v1/admin/auth/password", headers=headers, json={
        "old_password": "123456", "new_password": "newpass123",
    })
    check("改密成功", r.json()["code"] == 0, f"msg={r.json()['message']}")
    # 新密码登录
    cid4, real_code4 = get_captcha(client)
    r = client.post("/api/v1/admin/auth/login", json={
        "username": "admin", "password": "newpass123",
        "captcha_id": cid4, "captcha": real_code4,
    })
    check("新密码登录", r.json()["code"] == 0)
    check("must_change_pwd=False", r.json()["data"]["must_change_pwd"] is False)
    token2 = r.json()["data"]["token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 9. 上传（合法 PNG → 成功；txt 伪装 → 400）
    buf = io.BytesIO()
    Image.new("RGB", (60, 30), (14, 147, 132)).save(buf, format="PNG")
    r = client.post("/api/v1/admin/upload", headers=headers2,
                    files={"file": ("test.png", buf.getvalue(), "image/png")})
    check("上传 PNG 成功", r.json()["code"] == 0 and r.json()["data"]["url"].startswith("/uploads/"),
          f"url={r.json()['data']['url']}")
    r = client.post("/api/v1/admin/upload", headers=headers2,
                    files={"file": ("evil.txt", b"not-an-image", "image/png")})
    check("伪图片→400", r.json()["code"] == 400, f"msg={r.json()['message']}")

    # 10. 操作日志已写入
    db = SessionLocal()
    logs = db.query(SysUser).filter(SysUser.username == "admin").first()
    from app.models import OperationLog
    cnt = db.query(OperationLog).filter(OperationLog.module.in_(["auth", "upload"])).count()
    db.close()
    check("操作日志已记录", cnt >= 3, f"auth/upload 日志 {cnt} 条")

    # 11. 恢复 admin：密码 123456 + must_change_pwd=1 + 清除锁定
    from app.core.security import hash_password
    db = SessionLocal()
    u = db.query(SysUser).filter(SysUser.username == "admin").first()
    u.password_hash = hash_password("123456")
    u.must_change_pwd = 1
    u.fail_count = 0
    u.locked_until = None
    db.commit()
    db.close()
    print("  [INFO] 已恢复 admin 初始状态（123456 / 强制改密）")

    print(f"\n=== 结果：{PASS_COUNT} 通过 / {FAIL_COUNT} 失败 ===")
    sys.exit(1 if FAIL_COUNT else 0)


if __name__ == "__main__":
    main()
