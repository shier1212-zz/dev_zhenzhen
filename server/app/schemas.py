"""Pydantic 请求/响应模型。

约定（开发技术文档 §5.3 / 实施方案 §5.1）：
- 统一响应：{"code": 0, "message": "ok", "data": ...}
- 分页：{items, total, page, page_size}
- 业务模型 schema 随 M2 各模块补充，本文件先提供通用与认证相关模型。
"""
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


# ---------- 通用 ----------
class ORMModel(BaseModel):
    """ORM 输出基类（from_attributes）。"""

    model_config = ConfigDict(from_attributes=True)


class PageResult(BaseModel, Generic[T]):
    """通用分页结果。"""

    items: list[T]
    total: int
    page: int
    page_size: int


# ---------- 认证（/api/v1/admin/auth） ----------
class CaptchaResponse(BaseModel):
    """图形验证码响应。"""

    captcha_id: str = Field(description="验证码会话标识，登录时回传")
    svg: str = Field(description="SVG 验证码内容（前端可直接渲染）")


class LoginRequest(BaseModel):
    """登录请求。"""

    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)
    captcha_id: str = Field(min_length=1)
    captcha: str = Field(min_length=1, max_length=10)


class LoginResponse(BaseModel):
    """登录响应。"""

    token: str
    expires_in: int = Field(description="Token 有效期（秒），默认 8 小时 = 28800")
    permissions: dict = Field(default_factory=dict, description="当前用户角色权限矩阵")
    must_change_pwd: bool = Field(description="是否需强制修改密码")


class ChangePasswordRequest(BaseModel):
    """修改密码请求。"""

    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128, description="新密码（至少 6 位）")


class UpdateAvatarRequest(BaseModel):
    """更新头像请求。"""

    avatar_url: str = Field(min_length=1, max_length=255)


class UserInfo(BaseModel):
    """当前登录用户信息（auth/me）。"""

    id: int
    username: str
    real_name: str | None = None
    nickname: str | None = None
    phone: str | None = None
    email: str | None = None
    gender: int = 0
    post: str | None = None
    dept_id: int | None = None
    role_id: int | None = None
    avatar: str | None = None
    must_change_pwd: int = 0
    is_activate: int = 1
    permissions: dict = Field(default_factory=dict, description="角色权限矩阵")


class UploadResponse(BaseModel):
    """文件上传响应。"""

    url: str = Field(description="可访问的相对 URL，如 /uploads/2026/08/xxx.jpg")
