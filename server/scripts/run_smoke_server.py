"""M5 冒烟专用：同一进程内完成建表+种子+演示数据，再以 uvicorn 提供服务。

背景：沙箱环境 E:/C: 盘均出现「文件被进程 A 写入后，进程 B 打开即只读」的
云同步行为（SQLite 报 attempt to write a readonly database）。
本脚本把「写库」与「serve」合并到同一进程，规避跨进程只读问题。

用法：DB_URL=sqlite:///C:/Users/lzl13145/zhz_smoke.db python scripts/run_smoke_server.py
"""
import os
import sys

DB_URL = os.environ.get("DB_URL", "sqlite:///C:/Users/lzl13145/zhz_smoke.db")
os.environ["DB_URL"] = DB_URL

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)                 # scripts/
sys.path.insert(0, os.path.dirname(HERE))  # server/

import app.models  # noqa: F401  (注册 13 张表)
from app.core.database import Base, SessionLocal, engine  # noqa: E402
from seed import seed  # noqa: E402
from seed_demo import seed_demo  # noqa: E402

print(f"[smoke] DB_URL={DB_URL}", flush=True)
Base.metadata.create_all(engine)
seed()
seed_demo()

db = SessionLocal()
try:
    from app.models import HomeFeaturedProduct, SysUser

    if db.query(HomeFeaturedProduct).count() == 0:
        from app.models import Product

        for sort, p in enumerate(
            db.query(Product).order_by(Product.id.desc()).limit(4).all(), start=1
        ):
            db.add(
                HomeFeaturedProduct(
                    product_id=p.id, sort=sort, is_activate=1,
                    created_at="admin", updated_at="admin",
                )
            )
    u = db.query(SysUser).filter(SysUser.username == "admin").first()
    if u:
        u.must_change_pwd = 0  # 冒烟测试免强制改密
    db.commit()
finally:
    db.close()

print("[smoke] seed ready, starting uvicorn on :8000", flush=True)
from app.main import app  # noqa: E402
import uvicorn  # noqa: E402

uvicorn.run(app, host="127.0.0.1", port=8000)
