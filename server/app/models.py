"""SQLAlchemy ORM 模型（13 张表）。

权威依据：md/蓁蓁智能家居-数据库设计文档.md（V1.1）。
完整模型在 M1-步骤3（数据库建模）实现，此处仅声明 Base 供导入。
"""
from app.core.database import Base

# 待建模型清单（与数据库设计文档一致）：
# sys_user / department / role / banner / home_config /
# home_featured_product / news / about_content / product_category /
# product / contact_config / message / operation_log
