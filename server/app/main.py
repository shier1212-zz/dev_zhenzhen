"""FastAPI 应用入口：实例、CORS、路由挂载、静态/上传目录。"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="蓁蓁智能家居 · 前台官网 + 后台管理系统共享后端",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS（开发期允许前后台 Vite dev server）
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 上传目录静态托管（/uploads -> server/uploads）
UPLOADS_DIR = Path(settings.UPLOAD_DIR).resolve()
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# 业务路由（M1-步骤3 起逐个挂载）：
# from app.routers import auth, banners, news, home, contact, categories,
# products, messages, users, roles, departments, logs, upload
# from app.routers import public
# app.include_router(public.router)
# ...


@app.get("/api/health", tags=["system"])
def health_check():
    """健康检查。"""
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}
