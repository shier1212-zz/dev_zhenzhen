"""关于我们内容编辑（单行配置 GET/PUT）。"""
import json
from datetime import datetime

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, DbDep, require
from app.core.response import ok
from app.models import AboutContent
from app.schemas import AboutUpdate

router = APIRouter(prefix="/api/v1/admin/about", tags=["关于我们"])


@router.get("")
def get_about(
    db: DbDep,
    _user: CurrentUser = Depends(require("about", "view")),
):
    a = db.query(AboutContent).filter(AboutContent.id == 1).first()
    if a is None:
        return ok(data={
            "brand_story": "", "vision": {}, "milestones": [], "honors": [],
        })
    try:
        vision = json.loads(a.vision) if a.vision else {}
        milestones = json.loads(a.milestones) if a.milestones else []
        honors = json.loads(a.honors) if a.honors else []
    except (TypeError, json.JSONDecodeError):
        vision, milestones, honors = {}, [], []
    return ok(data={
        "brand_story": a.brand_story, "vision": vision,
        "milestones": milestones, "honors": honors,
    })


@router.put("")
def update_about(
    body: AboutUpdate,
    db: DbDep,
    user: CurrentUser = Depends(require("about", "edit")),
):
    a = db.query(AboutContent).filter(AboutContent.id == 1).first()
    if a is None:
        a = AboutContent(id=1, is_activate=1)
        db.add(a)
    a.brand_story = body.brand_story
    a.vision = json.dumps(body.vision, ensure_ascii=False)
    a.milestones = json.dumps(body.milestones, ensure_ascii=False)
    a.honors = json.dumps(body.honors, ensure_ascii=False)
    a.updated_at = user.username
    a.updated_date = datetime.now()
    db.commit()
    return ok(message="保存成功")
