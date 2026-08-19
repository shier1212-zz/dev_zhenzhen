"""文件上传：校验类型（jpg/jpeg/png/webp）+ 大小 ≤5MB + 内容嗅探，存 uploads/ 返回 URL。"""
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.core.config import settings
from app.core.deps import CurrentUser
from app.core.response import fail, ok

router = APIRouter(prefix="/api/v1/admin", tags=["上传"])

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}


def _sniff_image(data: bytes) -> bool:
    """基于 magic bytes 内容嗅探，防止改扩展名伪造。"""
    if data[:3] == b"\xff\xd8\xff":  # JPEG
        return True
    if data[:8] == b"\x89PNG\r\n\x1a\n":  # PNG
        return True
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":  # WebP
        return True
    return False


@router.post("/upload")
async def upload(user: CurrentUser, file: UploadFile = File(...)):
    """上传图片，返回 {url}；仅后台登录用户可调用。"""
    filename = file.filename or ""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        return fail("仅支持 jpg/png/webp 图片", code=400)
    if file.content_type not in ALLOWED_MIME:
        return fail("文件类型不合法", code=400)

    data = await file.read()
    if len(data) > settings.MAX_UPLOAD_SIZE:
        return fail("文件大小不能超过 5MB", code=400)
    if not data or not _sniff_image(data):
        return fail("文件内容不是有效图片", code=400)

    # 按日期分目录存储：uploads/YYYY/MM/uuid.ext
    now = datetime.now()
    rel_dir = f"uploads/{now:%Y/%m}"
    abs_dir = Path(settings.UPLOAD_DIR).resolve() / f"{now:%Y/%m}"
    abs_dir.mkdir(parents=True, exist_ok=True)

    fname = f"{uuid.uuid4().hex}{ext}"
    (abs_dir / fname).write_bytes(data)

    return ok(data={"url": f"/{rel_dir}/{fname}"})
