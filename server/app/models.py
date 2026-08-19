"""SQLAlchemy ORM 模型（13 张表）。

权威依据：md/蓁蓁智能家居-数据库设计文档.md（V1.1，建库权威依据）。
关键约定：
- 6 个全库通用标准字段：id / is_activate / created_at(创建人账号) /
  created_date(创建时间) / updated_at(修改人账号) / updated_date(修改时间)
- 软删除仅 banner（deleted_at）；其余表物理删除
- 外键全部 ON DELETE RESTRICT
- JSON 字段以 TEXT 存储（role.permissions / product.images / product.params /
  home_config.advantages / about_content.vision|milestones|honors）
"""
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StdFieldsMixin:
    """6 个全库通用标准字段（见数据库设计文档 §2.3.1）。"""

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    is_activate: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1",
        comment="状态：1 激活 / 0 禁用",
    )
    created_at: Mapped[str | None] = mapped_column(
        String(64), comment="创建人（写入者登录账号）"
    )
    created_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"),
        comment="创建时间",
    )
    updated_at: Mapped[str | None] = mapped_column(
        String(64), comment="修改人（最后一次修改者登录账号）"
    )
    updated_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"),
        comment="修改时间",
    )


class Department(StdFieldsMixin, Base):
    """部门（支持上下级层级）。"""

    __tablename__ = "department"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_department_is_activate"),
        Index("idx_department_code", "code"),
        Index("idx_department_parent", "parent_id"),
    )

    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="部门名称")
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("department.id", ondelete="RESTRICT"), comment="上级部门（NULL=顶级）"
    )
    code: Mapped[str | None] = mapped_column(String(50), unique=True, comment="部门编码")
    sort: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    children: Mapped[list["Department"]] = relationship(back_populates="parent")
    parent: Mapped["Department | None"] = relationship(
        back_populates="children", remote_side="Department.id"
    )
    users: Mapped[list["SysUser"]] = relationship(back_populates="dept")


class Role(StdFieldsMixin, Base):
    """角色（承载模块级权限矩阵）。"""

    __tablename__ = "role"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_role_is_activate"),
    )

    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, comment="角色名称")
    permissions: Mapped[str] = mapped_column(
        Text, nullable=False, default="{}", server_default="{}",
        comment="模块级权限矩阵 JSON，如 {\"banner\":[\"view\",\"edit\"]}",
    )

    users: Mapped[list["SysUser"]] = relationship(back_populates="role")


class ProductCategory(StdFieldsMixin, Base):
    """产品分类。"""

    __tablename__ = "product_category"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_product_category_is_activate"),
    )

    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="分类名")
    sort: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class SysUser(StdFieldsMixin, Base):
    """用户（后台账号）。"""

    __tablename__ = "sys_user"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_sys_user_is_activate"),
        CheckConstraint("gender IN (0,1,2)", name="ck_sys_user_gender"),
        CheckConstraint("must_change_pwd IN (0,1)", name="ck_sys_user_must_change_pwd"),
        CheckConstraint("fail_count >= 0", name="ck_sys_user_fail_count"),
        Index("idx_user_dept_role", "dept_id", "role_id", "is_activate"),
        Index("idx_user_role", "role_id"),
    )

    username: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, comment="登录用户名")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False, comment="bcrypt 哈希")
    real_name: Mapped[str | None] = mapped_column(String(50), comment="姓名")
    nickname: Mapped[str | None] = mapped_column(String(50), comment="昵称")
    phone: Mapped[str | None] = mapped_column(String(20), comment="手机号")
    email: Mapped[str | None] = mapped_column(String(100), comment="邮箱")
    gender: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0",
                                        comment="性别：0 未知 / 1 男 / 2 女")
    post: Mapped[str | None] = mapped_column(String(64), comment="岗位名称")
    dept_id: Mapped[int | None] = mapped_column(
        ForeignKey("department.id", ondelete="RESTRICT"), comment="所属部门"
    )
    role_id: Mapped[int | None] = mapped_column(
        ForeignKey("role.id", ondelete="RESTRICT"), comment="所属角色"
    )
    must_change_pwd: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0", comment="是否需强制改密：1 是 / 0 否"
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, comment="最近登录时间")
    fail_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0", comment="连续登录失败次数"
    )
    locked_until: Mapped[datetime | None] = mapped_column(DateTime, comment="锁定截止时间")
    avatar: Mapped[str | None] = mapped_column(String(255), comment="头像 URL")

    dept: Mapped["Department | None"] = relationship(back_populates="users")
    role: Mapped["Role | None"] = relationship(back_populates="users")
    operation_logs: Mapped[list["OperationLog"]] = relationship(back_populates="user")


class Product(StdFieldsMixin, Base):
    """产品。"""

    __tablename__ = "product"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_product_is_activate"),
        CheckConstraint("show_price IN (0,1)", name="ck_product_show_price"),
        CheckConstraint("status IN (0,1)", name="ck_product_status"),
        Index("idx_product_cat_status_sort", "category_id", "status", "sort"),
    )

    category_id: Mapped[int] = mapped_column(
        ForeignKey("product_category.id", ondelete="RESTRICT"), nullable=False, comment="所属分类"
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="产品名称")
    cover_image: Mapped[str] = mapped_column(String(255), nullable=False, comment="封面图")
    images: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]",
                                        comment="图片集数组 JSON")
    price_min: Mapped[float | None] = mapped_column(Numeric(10, 2), comment="价格下限")
    price_max: Mapped[float | None] = mapped_column(Numeric(10, 2), comment="价格上限")
    show_price: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1",
                                            comment="前台是否展示价格：1 展示 / 0 隐藏")
    brief: Mapped[str | None] = mapped_column(String(200), comment="核心简介")
    params: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]",
                                        comment="规格参数数组 JSON：[{key,value}]")
    detail_content: Mapped[str | None] = mapped_column(Text, comment="详情图文")
    sort: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    status: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1",
                                        comment="业务状态：1 上架 / 0 下架")

    category: Mapped["ProductCategory"] = relationship(back_populates="products")
    featured_links: Mapped[list["HomeFeaturedProduct"]] = relationship(back_populates="product")


class News(StdFieldsMixin, Base):
    """新闻资讯。"""

    __tablename__ = "news"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_news_is_activate"),
        CheckConstraint("status IN (0,1)", name="ck_news_status"),
        Index("idx_news_status_published", "status", "published_at"),
    )

    title: Mapped[str] = mapped_column(String(100), nullable=False, comment="标题")
    category: Mapped[str | None] = mapped_column(String(50), comment="分类")
    cover_image: Mapped[str | None] = mapped_column(String(255), comment="封面图")
    summary: Mapped[str | None] = mapped_column(String(200), comment="摘要")
    content: Mapped[str | None] = mapped_column(Text, comment="富文本正文")
    status: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0",
                                        comment="业务状态：1 已发布 / 0 草稿")
    published_at: Mapped[datetime | None] = mapped_column(DateTime, comment="发布时间")


class Banner(StdFieldsMixin, Base):
    """轮播图（唯一启用软删除的表）。"""

    __tablename__ = "banner"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_banner_is_activate"),
        CheckConstraint("link_type IN ('none','product','news','url')", name="ck_banner_link_type"),
        Index("idx_banner_act_sort", "is_activate", "sort"),
    )

    image_url: Mapped[str] = mapped_column(String(255), nullable=False, comment="图片地址")
    title: Mapped[str] = mapped_column(String(50), nullable=False, comment="标题")
    subtitle: Mapped[str | None] = mapped_column(String(100), comment="副标题")
    link_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="none", server_default="none",
        comment="跳转类型：none/product/news/url",
    )
    link_target: Mapped[str | None] = mapped_column(String(255), comment="跳转目标（产品/资讯 ID 或 URL）")
    sort: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, comment="软删除标记（NULL=未删）")


class HomeConfig(StdFieldsMixin, Base):
    """首页品牌展示区配置（单行记录）。"""

    __tablename__ = "home_config"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_home_config_is_activate"),
    )

    brand_slogan: Mapped[str | None] = mapped_column(String(100), comment="品牌定位语")
    brand_desc: Mapped[str | None] = mapped_column(Text, comment="理念描述")
    brand_image: Mapped[str | None] = mapped_column(String(255), comment="配图 URL")
    advantages: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]",
                                            comment="核心优势点数组 JSON：[{icon,title,desc}]")


class HomeFeaturedProduct(StdFieldsMixin, Base):
    """首页精选产品关联。"""

    __tablename__ = "home_featured_product"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_home_featured_product_is_activate"),
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("product.id", ondelete="RESTRICT"), nullable=False, comment="关联产品"
    )
    sort: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    product: Mapped["Product"] = relationship(back_populates="featured_links")


class AboutContent(StdFieldsMixin, Base):
    """关于我们内容（单行记录）。"""

    __tablename__ = "about_content"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_about_content_is_activate"),
    )

    brand_story: Mapped[str | None] = mapped_column(Text, comment="品牌故事（富文本）")
    vision: Mapped[str] = mapped_column(Text, nullable=False, default="{}", server_default="{}",
                                        comment="愿景 JSON：{mission,vision,values}")
    milestones: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]",
                                            comment="发展历程数组 JSON：[{year,event,sort}]")
    honors: Mapped[str] = mapped_column(Text, nullable=False, default="[]", server_default="[]",
                                        comment="资质荣誉数组 JSON：[{image,desc,sort}]")


class ContactConfig(StdFieldsMixin, Base):
    """联系信息配置（单行记录）。"""

    __tablename__ = "contact_config"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_contact_config_is_activate"),
    )

    phone: Mapped[str | None] = mapped_column(String(50), comment="联系电话（可多个，逗号分隔）")
    email: Mapped[str | None] = mapped_column(String(100), comment="邮箱")
    address: Mapped[str | None] = mapped_column(String(255), comment="公司地址")
    work_time: Mapped[str | None] = mapped_column(String(100), comment="工作时间")
    company_name: Mapped[str | None] = mapped_column(String(100), comment="企业名称（页脚展示）")
    icp_no: Mapped[str | None] = mapped_column(String(100), comment="备案号（页脚展示位）")


class Message(StdFieldsMixin, Base):
    """留言。"""

    __tablename__ = "message"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_message_is_activate"),
        CheckConstraint("status IN (0,1)", name="ck_message_status"),
        Index("idx_message_status_created", "status", "created_date"),
    )

    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="姓名")
    phone: Mapped[str] = mapped_column(String(20), nullable=False, comment="联系电话")
    company: Mapped[str | None] = mapped_column(String(100), comment="公司/单位")
    content: Mapped[str] = mapped_column(String(500), nullable=False, comment="留言内容")
    status: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0",
                                        comment="业务状态：0 待处理 / 1 已处理")
    handle_note: Mapped[str | None] = mapped_column(String(500), comment="处理备注")
    ip: Mapped[str | None] = mapped_column(String(50), comment="提交 IP")


class OperationLog(StdFieldsMixin, Base):
    """操作日志。"""

    __tablename__ = "operation_log"
    __table_args__ = (
        CheckConstraint("is_activate IN (0,1)", name="ck_operation_log_is_activate"),
        Index("idx_log_user_module_time", "user_id", "module", "created_date"),
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("sys_user.id", ondelete="RESTRICT"), nullable=False, comment="操作人（账号）"
    )
    module: Mapped[str | None] = mapped_column(String(50), comment="操作模块")
    action: Mapped[str | None] = mapped_column(String(50), comment="操作类型（增/删/改/上下线/登录）")
    target: Mapped[str | None] = mapped_column(String(255), comment="操作对象摘要")
    ip: Mapped[str | None] = mapped_column(String(50), comment="IP")

    user: Mapped["SysUser"] = relationship(back_populates="operation_logs")
