"""add_about_content_brand_image

Revision ID: 69649c5117ad
Revises: 99e8050a3229
Create Date: 2026-08-19 22:01:45.046279

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69649c5117ad'
down_revision: Union[str, Sequence[str], None] = '99e8050a3229'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """为 about_content 增加 brand_image 列."""
    op.add_column(
        "about_content",
        sa.Column("brand_image", sa.String(255), nullable=True, comment="品牌故事配图 URL"),
    )


def downgrade() -> None:
    """移除 about_content.brand_image 列."""
    op.drop_column("about_content", "brand_image")
