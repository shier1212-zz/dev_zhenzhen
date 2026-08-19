"""数据库引擎与会话管理（SQLite + WAL）。"""
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

if settings.DB_URL.startswith("sqlite"):
    _db_path = settings.DB_URL.replace("sqlite:///", "", 1)
    if _db_path != ":memory:":
        Path(_db_path).parent.mkdir(parents=True, exist_ok=True)

connect_args = (
    {"check_same_thread": False} if settings.DB_URL.startswith("sqlite") else {}
)

engine = create_engine(settings.DB_URL, connect_args=connect_args, pool_pre_ping=True)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    """SQLite 连接级配置：外键约束开启 + WAL 模式 + 繁忙超时。"""
    if settings.DB_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """ORM 声明式基类。"""


def get_db():
    """FastAPI 依赖：请求级数据库会话。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
