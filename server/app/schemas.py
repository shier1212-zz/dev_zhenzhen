"""Pydantic 请求/响应模型。

约定（开发技术文档 §5.3 / 实施方案 §5.1）：
- 统一响应：{"code": 0, "message": "ok", "data": ...}
- 分页：data = {items, total, page, page_size}
- JSON 字段（advantages/vision/milestones/honors/images/params/permissions）：
  请求以对象/数组传入，路由层 json.dumps 存库；输出时路由层解析为对象
"""
from datetime import datetime
from typing import Any, Generic, TypeVar

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


class StdOut(ORMModel):
    """实体输出公共字段（6 标准字段）。"""

    id: int
    is_activate: int = 1
    created_at: str | None = None
    created_date: datetime | None = None
    updated_at: str | None = None
    updated_date: datetime | None = None


# ---------- 认证（/api/v1/admin/auth） ----------
class CaptchaResponse(BaseModel):
    captcha_id: str
    svg: str


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)
    captcha_id: str = Field(min_length=1)
    captcha: str = Field(min_length=1, max_length=10)


class LoginResponse(BaseModel):
    token: str
    expires_in: int = 28800
    permissions: dict = Field(default_factory=dict)
    must_change_pwd: bool


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class UpdateAvatarRequest(BaseModel):
    avatar_url: str = Field(min_length=1, max_length=255)


class UploadResponse(BaseModel):
    url: str


class StatusRequest(BaseModel):
    """通用启停状态（banner 等 is_activate）。"""

    is_activate: int = Field(ge=0, le=1)


class ProductStatusRequest(BaseModel):
    """产品上下架状态。"""

    status: int = Field(ge=0, le=1)


# ---------- 轮播 Banner ----------
class BannerBase(BaseModel):
    image_url: str = Field(min_length=1, max_length=255)
    title: str = Field(min_length=1, max_length=50)
    subtitle: str | None = Field(default=None, max_length=100)
    link_type: str = Field(default="none", pattern="^(none|product|news|url)$")
    link_target: str | None = Field(default=None, max_length=255)
    sort: int = 0


class BannerCreate(BannerBase):
    pass


class BannerUpdate(BannerBase):
    pass


class BannerOut(StdOut):
    image_url: str
    title: str
    subtitle: str | None = None
    link_type: str = "none"
    link_target: str | None = None
    sort: int = 0
    deleted_at: datetime | None = None


# ---------- 新闻 News ----------
class NewsBase(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    category: str | None = Field(default=None, max_length=50)
    cover_image: str | None = Field(default=None, max_length=255)
    summary: str | None = Field(default=None, max_length=200)
    content: str | None = None
    status: int = Field(default=0, ge=0, le=1, description="1 发布 / 0 草稿")


class NewsCreate(NewsBase):
    pass


class NewsUpdate(NewsBase):
    pass


class NewsOut(StdOut):
    title: str
    category: str | None = None
    cover_image: str | None = None
    summary: str | None = None
    content: str | None = None
    status: int = 0
    published_at: datetime | None = None


# ---------- 首页配置 Home ----------
class AdvantageItem(BaseModel):
    icon: str = ""
    title: str = ""
    desc: str = ""


class HomeConfigUpdate(BaseModel):
    brand_slogan: str | None = Field(default=None, max_length=100)
    brand_desc: str | None = None
    brand_image: str | None = Field(default=None, max_length=255)
    advantages: list[AdvantageItem] = Field(default_factory=list)


class HomeConfigOut(StdOut):
    brand_slogan: str | None = None
    brand_desc: str | None = None
    brand_image: str | None = None
    advantages: list[Any] = Field(default_factory=list)


class FeaturedUpdate(BaseModel):
    """首页精选产品批量设置。"""

    product_ids: list[int] = Field(min_length=0, max_length=20)


class FeaturedItem(BaseModel):
    id: int
    product_id: int
    sort: int
    product_name: str = ""
    cover_image: str = ""


# ---------- 关于我们 About ----------
class AboutUpdate(BaseModel):
    brand_story: str | None = None
    vision: dict = Field(default_factory=dict)
    milestones: list[Any] = Field(default_factory=list)
    honors: list[Any] = Field(default_factory=list)


class AboutOut(StdOut):
    brand_story: str | None = None
    vision: dict = Field(default_factory=dict)
    milestones: list[Any] = Field(default_factory=list)
    honors: list[Any] = Field(default_factory=list)


# ---------- 联系信息 Contact ----------
class ContactUpdate(BaseModel):
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=255)
    work_time: str | None = Field(default=None, max_length=100)
    company_name: str | None = Field(default=None, max_length=100)
    icp_no: str | None = Field(default=None, max_length=100)


class ContactOut(StdOut):
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    work_time: str | None = None
    company_name: str | None = None
    icp_no: str | None = None


# ---------- 产品分类 Category ----------
class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    sort: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryOut(StdOut):
    name: str
    sort: int = 0
    product_count: int = 0  # 附加：分类下产品数（删除约束提示）


# ---------- 产品 Product ----------
class ParamItem(BaseModel):
    key: str = ""
    value: str = ""


class ProductBase(BaseModel):
    category_id: int
    name: str = Field(min_length=1, max_length=100)
    cover_image: str = Field(min_length=1, max_length=255)
    images: list[str] = Field(default_factory=list)
    price_min: float | None = Field(default=None, ge=0)
    price_max: float | None = Field(default=None, ge=0)
    show_price: int = Field(default=1, ge=0, le=1)
    brief: str | None = Field(default=None, max_length=200)
    params: list[ParamItem] = Field(default_factory=list)
    detail_content: str | None = None
    sort: int = 0
    status: int = Field(default=1, ge=0, le=1, description="1 上架 / 0 下架")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductOut(StdOut):
    category_id: int
    category_name: str = ""
    name: str
    cover_image: str
    images: list[Any] = Field(default_factory=list)
    price_min: float | None = None
    price_max: float | None = None
    show_price: int = 1
    brief: str | None = None
    params: list[Any] = Field(default_factory=list)
    detail_content: str | None = None
    sort: int = 0
    status: int = 1


class BatchStatusRequest(BaseModel):
    """批量上下架。"""

    ids: list[int] = Field(min_length=1)
    status: int = Field(ge=0, le=1)


# ---------- 留言 Message ----------
class MessageCreate(BaseModel):
    """前台留言提交。"""

    name: str = Field(min_length=1, max_length=50)
    phone: str = Field(min_length=1, max_length=20)
    company: str | None = Field(default=None, max_length=100)
    content: str = Field(min_length=1, max_length=500)


class MessageUpdate(BaseModel):
    """后台处理留言。"""

    status: int = Field(ge=0, le=1)
    handle_note: str | None = Field(default=None, max_length=500)


class MessageOut(StdOut):
    name: str
    phone: str
    company: str | None = None
    content: str
    status: int = 0
    handle_note: str | None = None
    ip: str | None = None


# ---------- 部门 Department ----------
class DepartmentBase(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    parent_id: int | None = None
    code: str | None = Field(default=None, max_length=50)
    sort: int = 0


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(DepartmentBase):
    pass


class DepartmentOut(StdOut):
    name: str
    parent_id: int | None = None
    code: str | None = None
    sort: int = 0
    children: list[Any] = Field(default_factory=list)  # 树形


# ---------- 角色 Role ----------
class RoleBase(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    permissions: dict = Field(default_factory=dict)


class RoleCreate(RoleBase):
    pass


class RoleUpdate(RoleBase):
    pass


class RoleOut(StdOut):
    name: str
    permissions: dict = Field(default_factory=dict)
    user_count: int = 0  # 附加：绑定账号数


# ---------- 账号 User ----------
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=6, max_length=128)
    real_name: str | None = Field(default=None, max_length=50)
    nickname: str | None = Field(default=None, max_length=50)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=100)
    gender: int = Field(default=0, ge=0, le=2)
    post: str | None = Field(default=None, max_length=64)
    dept_id: int | None = None
    role_id: int | None = None
    is_activate: int = Field(default=1, ge=0, le=1)


class UserUpdate(BaseModel):
    real_name: str | None = Field(default=None, max_length=50)
    nickname: str | None = Field(default=None, max_length=50)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=100)
    gender: int = Field(default=0, ge=0, le=2)
    post: str | None = Field(default=None, max_length=64)
    dept_id: int | None = None
    role_id: int | None = None
    is_activate: int = Field(default=1, ge=0, le=1)


class UserOut(StdOut):
    username: str
    real_name: str | None = None
    nickname: str | None = None
    phone: str | None = None
    email: str | None = None
    gender: int = 0
    post: str | None = None
    dept_id: int | None = None
    dept_name: str = ""
    role_id: int | None = None
    role_name: str = ""
    must_change_pwd: int = 0
    last_login_at: datetime | None = None
    avatar: str | None = None


# ---------- 操作日志 Log ----------
class LogOut(StdOut):
    user_id: int
    username: str = ""  # 附加：操作人账号
    module: str | None = None
    action: str | None = None
    target: str | None = None
    ip: str | None = None
