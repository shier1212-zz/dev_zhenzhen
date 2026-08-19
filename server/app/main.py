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

# 操作日志中间件（写操作自动记录）
from app.middleware.operation_log import OperationLogMiddleware

app.add_middleware(OperationLogMiddleware)

# 上传目录静态托管（/uploads -> server/uploads）
UPLOADS_DIR = Path(settings.UPLOAD_DIR).resolve()
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# 业务路由（M1-步骤4：认证 + 上传；M2 起补充公开接口与后台 CRUD）
from app.routers import auth, upload

app.include_router(auth.router)
app.include_router(upload.router)


@app.get("/api/health", tags=["system"])
def health_check():
    """健康检查。"""
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}
