"""测试后将 admin 账号还原为 admin/123456（must_change_pwd=1）。"""
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import SysUser

db = SessionLocal()
try:
    u = db.query(SysUser).filter(SysUser.username == "admin").first()
    if u is None:
        print("admin not found")
    else:
        u.password_hash = hash_password("123456")
        u.must_change_pwd = 1
        u.fail_count = 0
        u.locked_until = None
        db.commit()
        print("ok: admin password reset to 123456, must_change_pwd=1")
finally:
    db.close()
