"""统一 API 响应结构（含 datetime 等类型自动序列化）。"""
import json
from datetime import date, datetime
from typing import Any

from fastapi.responses import JSONResponse


class _ApiEncoder(json.JSONEncoder):
    """JSON 编码器：datetime/date → ISO 字符串，Decimal → float。"""

    def default(self, o):
        if isinstance(o, (datetime, date)):
            return o.isoformat(sep=" ") if isinstance(o, datetime) else o.isoformat()
        if hasattr(o, "__float__") and hasattr(o, "as_integer_ratio") is False:
            try:
                return float(o)
            except (TypeError, ValueError):
                pass
        return super().default(o)


class ApiJSONResponse(JSONResponse):
    """统一响应体（UTF-8 + ensure_ascii=False + 自定义编码器）。"""

    def render(self, content: Any) -> bytes:
        return json.dumps(
            content, ensure_ascii=False, cls=_ApiEncoder
        ).encode("utf-8")


def ok(data: Any = None, message: str = "ok") -> ApiJSONResponse:
    """成功响应：{"code": 0, "message": "...", "data": ...}。"""
    return ApiJSONResponse(content={"code": 0, "message": message, "data": data})


def fail(message: str = "操作失败", code: int = 1, status_code: int = 200,
         data: Any = None) -> ApiJSONResponse:
    """失败响应：业务错误默认 HTTP 200 + code != 0，便于前端统一处理。"""
    return ApiJSONResponse(
        status_code=status_code,
        content={"code": code, "message": message, "data": data},
    )
