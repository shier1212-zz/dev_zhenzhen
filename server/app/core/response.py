"""统一 API 响应结构。"""
from typing import Any

from fastapi.responses import JSONResponse


def ok(data: Any = None, message: str = "ok") -> JSONResponse:
    """成功响应：{"code": 0, "message": "...", "data": ...}。"""
    return JSONResponse(content={"code": 0, "message": message, "data": data})


def fail(message: str = "操作失败", code: int = 1, status_code: int = 200,
         data: Any = None) -> JSONResponse:
    """失败响应：业务错误默认 HTTP 200 + code != 0，便于前端统一处理。"""
    return JSONResponse(
        status_code=status_code,
        content={"code": code, "message": message, "data": data},
    )
