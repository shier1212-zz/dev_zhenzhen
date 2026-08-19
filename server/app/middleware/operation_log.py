"""操作日志中间件：后台写操作（增/删/改/上下线）自动记录 operation_log。

说明：
- 仅记录 /api/v1/admin/ 下的写方法（POST/PUT/DELETE/PATCH），跳过验证码接口
- 登录成功日志由 auth 路由内部显式写入（此时请求尚无 token）
- 使用独立会话写库，任何异常不影响主请求
"""
from datetime import datetime
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models import OperationLog, SysUser

WRITE_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

# 路径段 -> 模块标识（与权限矩阵 key 对齐）
_MODULE_KEYS = {
    "auth": "auth", "banners": "banner", "news": "news", "home": "home",
    "contact": "contact", "categories": "category", "products": "product",
    "messages": "message", "departments": "dept", "roles": "role",
    "users": "user", "logs": "log", "upload": "upload",
}


def _resolve_user_id(request: Request) -> int | None:
    """从请求头解析 JWT，返回用户 id。"""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    payload = decode_access_token(auth[7:])
    if not payload or "sub" not in payload:
        return None
    db = SessionLocal()
    try:
        user = db.query(SysUser).filter(SysUser.username == payload["sub"]).first()
        return user.id if user else None
    finally:
        db.close()


def _map_action(method: str, path: str) -> str:
    """按方法与路径推断操作类型。"""
    if method == "DELETE":
        return "删除"
    if "/batch-status" in path or "/status" in path:
        return "上下线"
    if method == "POST":
        return "新增"
    if method == "PUT":
        return "修改"
    return method


def _extract(path: str) -> tuple[str, str]:
    """从路径提取 (module, target)。path 形如 /api/v1/admin/banners/5。"""
    segs = [s for s in path.split("/") if s]
    module = ""
    target = ""
    if len(segs) >= 4:
        module = _MODULE_KEYS.get(segs[3], segs[3])
        if len(segs) >= 5 and segs[4].isdigit():
            target = f"{module}#{segs[4]}"
        else:
            target = segs[3]
    return module, target


class OperationLogMiddleware(BaseHTTPMiddleware):
    """写操作日志中间件。"""

    async def dispatch(self, request: Request, call_next: Any):
        response = await call_next(request)
        try:
            self._record(request)
        except Exception:  # noqa: BLE001  日志失败不影响业务
            pass
        return response

    def _record(self, request: Request) -> None:
        path = request.url.path
        method = request.method
        if not path.startswith("/api/v1/admin/") or method not in WRITE_METHODS:
            return
        if path.endswith("/auth/captcha") or path.endswith("/auth/login"):
            return  # 验证码不记；登录由 auth 内部记录

        user_id = _resolve_user_id(request)
        if user_id is None:
            return
        module, target = _extract(path)
        if not module:
            return

        db = SessionLocal()
        try:
            db.add(
                OperationLog(
                    user_id=user_id,
                    module=module,
                    action=_map_action(method, path),
                    target=target,
                    ip=request.client.host if request.client else "",
                    created_at="system",
                    updated_at="system",
                )
            )
            db.commit()
        finally:
            db.close()
