"""应用配置：基于 pydantic-settings 从环境变量 / .env 读取。"""
from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """全局配置。所有配置项可通过环境变量或 server/.env 覆盖。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # 应用
    APP_NAME: str = "蓁蓁智能家居"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # 数据库（SQLite，WAL 模式由 database.py 开启）
    DB_URL: str = "sqlite:///./data/zhz.db"

    # JWT 认证
    JWT_SECRET: str = "please-change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720

    # CORS（开发期：前台 5173 / 后台 5174）
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ]
    )

    # 文件上传
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB

    # 留言限流
    MESSAGE_RATE_LIMIT_PER_HOUR: int = 10


@lru_cache
def get_settings() -> Settings:
    """获取全局配置单例。"""
    return Settings()


settings = get_settings()
