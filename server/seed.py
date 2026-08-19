"""种子数据脚本（幂等，可重复执行）。

权威依据：md/蓁蓁智能家居-数据库设计文档.md V1.1 §6。
初始化内容：
- 3 个角色（超级管理员 / 内容运营 / 产品运营，含模块级权限矩阵）
- 3 个部门（总经办 → 市场部 / 产品部）
- 初始账号 admin / 123456（must_change_pwd=1，强制首登改密）
- 3 张单行配置表（home_config / about_content / contact_config）

用法：在 server 目录下执行 `python seed.py`
"""
import json

from app.core.database import SessionLocal
from app.core.security import hash_password, verify_password
from app.models import (
    AboutContent,
    ContactConfig,
    Department,
    HomeConfig,
    Role,
    SysUser,
)

# 文档 §6 给出的参考哈希：bcrypt("123456", gensalt(12))
ADMIN_PWD_REF_HASH = "$2b$12$LSuIt0um2IxGTpA30mGT8.EFjft13tCUSwjxbWl0pAFV7QekTVJF2"

ROLES = [
    (
        "超级管理员",
        {
            "banner": ["view", "edit"], "news": ["view", "edit"],
            "home": ["view", "edit"], "about": ["view", "edit"],
            "contact": ["view", "edit"], "product": ["view", "edit"],
            "message": ["view", "edit"], "user": ["view", "edit"],
            "dept": ["view", "edit"], "role": ["view", "edit"],
            "log": ["view"],
        },
    ),
    (
        "内容运营",
        {
            "banner": ["view", "edit"], "news": ["view", "edit"],
            "home": ["view", "edit"], "about": ["view", "edit"],
            "contact": ["view", "edit"], "message": ["view", "edit"],
        },
    ),
    (
        "产品运营",
        {"product": ["view", "edit"]},
    ),
]

DEPARTMENTS = [
    (1, "总经办", None, "HQ", 10),
    (2, "市场部", 1, "MKT", 20),
    (3, "产品部", 1, "PRD", 30),
]


def seed() -> None:
    db = SessionLocal()
    try:
        if db.query(SysUser).filter(SysUser.username == "admin").first():
            print("[skip] admin 账号已存在，种子数据已初始化，无需重复执行。")
            return

        # 1. 角色
        for idx, (name, perms) in enumerate(ROLES, start=1):
            db.add(
                Role(
                    id=idx,
                    name=name,
                    permissions=json.dumps(perms, ensure_ascii=False),
                    is_activate=1,
                    created_at="admin", updated_at="admin",
                )
            )

        # 2. 部门
        for did, name, parent_id, code, sort in DEPARTMENTS:
            db.add(
                Department(
                    id=did,
                    name=name,
                    parent_id=parent_id,
                    code=code,
                    sort=sort,
                    is_activate=1,
                    created_at="admin", updated_at="admin",
                )
            )

        # 3. 初始账号 admin / 123456（动态哈希，保证可用性）
        pwd_hash = hash_password("123456")
        assert verify_password("123456", pwd_hash), "密码哈希校验失败"
        db.add(
            SysUser(
                username="admin",
                password_hash=pwd_hash,
                real_name="系统管理员",
                nickname="Admin",
                gender=0,
                post="总经理",
                dept_id=1,
                role_id=1,
                must_change_pwd=1,
                is_activate=1,
                created_at="admin", updated_at="admin",
            )
        )

        # 4. 单行配置表（id=1）
        db.add(
            HomeConfig(
                id=1,
                brand_slogan="让家更懂你",
                brand_desc="以科技重塑居家体验，用智能连接美好生活。",
                brand_image="",
                advantages="[]",
                is_activate=1,
                created_at="admin", updated_at="admin",
            )
        )
        db.add(
            AboutContent(
                id=1,
                brand_story="",
                vision=json.dumps({"mission": "", "vision": "", "values": ""},
                                  ensure_ascii=False),
                milestones="[]",
                honors="[]",
                is_activate=1,
                created_at="admin", updated_at="admin",
            )
        )
        db.add(
            ContactConfig(
                id=1,
                phone="", email="", address="", work_time="",
                company_name="蓁蓁智能家居", icp_no="",
                is_activate=1,
                created_at="admin", updated_at="admin",
            )
        )

        db.commit()
        print("[ok] 种子数据初始化完成：")
        print("  - 角色 3 个（超级管理员/内容运营/产品运营）")
        print("  - 部门 3 个（总经办/市场部/产品部）")
        print("  - 账号 admin / 123456（must_change_pwd=1）")
        print("  - 单行配置表 3 张（home_config/about_content/contact_config）")
        print(f"  - 参考哈希（文档 §6）：{ADMIN_PWD_REF_HASH}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
