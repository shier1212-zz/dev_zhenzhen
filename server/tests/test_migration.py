"""Alembic 迁移校验：全新数据库 upgrade head 后应存在 13 张业务表。"""
import os
import sqlite3
import subprocess
import sys

SERVER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXPECTED_TABLES = {
    "sys_user", "department", "role",
    "banner", "home_config", "home_featured_product",
    "news", "about_content", "contact_config",
    "product_category", "product", "message", "operation_log",
}


def test_alembic_upgrade_head_creates_13_tables(tmp_path):
    db = tmp_path / "migrate.db"
    env = dict(os.environ, DB_URL=f"sqlite:///{db}")
    r = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=SERVER_DIR, env=env, capture_output=True, text=True, timeout=120,
    )
    assert r.returncode == 0, f"alembic 失败: {r.stderr[-1500:]}"

    con = sqlite3.connect(db)
    try:
        tables = {row[0] for row in con.execute(
            "SELECT name FROM sqlite_master WHERE type='table'")}
    finally:
        con.close()

    missing = EXPECTED_TABLES - tables
    assert not missing, f"迁移后缺少表: {missing}"
    assert tables.issuperset(EXPECTED_TABLES)
