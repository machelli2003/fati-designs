import math

from fastapi import APIRouter, HTTPException, Query, Request

from . import config
from .db import get_db, now, oid, ser
from .schemas import InquiryIn
from .security import rate_limit

router = APIRouter(prefix="/api")


def _collection_names() -> dict[str, str]:
    return {str(c["_id"]): c["name"] for c in get_db().collections.find({}, {"name": 1})}


def _design_out(d: dict, names: dict[str, str]) -> dict:
    out = ser(d)
    out["collection_name"] = names.get(d.get("collection_id") or "")
    return out


@router.get("/health")
def health():
    get_db().command("ping") if not config.MONGO_MOCK else None
    return {"ok": True}


@router.get("/meta")
def meta():
    return {"categories": config.CATEGORIES, "services": config.SERVICES}


@router.get("/settings")
def settings():
    doc = get_db().site_settings.find_one({"_id": "site"}) or {}
    doc.pop("_id", None)
    doc.pop("updated_at", None)
    return doc


@router.get("/designs")
def list_designs(
    category: str | None = None,
    collection: str | None = None,
    featured: bool | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=48),
):
    q: dict = {"status": "published", "is_sample": {"$ne": True}}
    if category:
        q["category"] = category
    if collection:
        q["collection_id"] = collection
    if featured is not None:
        q["featured"] = featured
    db = get_db()
    total = db.designs.count_documents(q)
    cur = db.designs.find(q).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
    names = _collection_names()
    return {
        "items": [_design_out(d, names) for d in cur],
        "total": total,
        "page": page,
        "pages": max(1, math.ceil(total / limit)),
    }


@router.get("/designs/{design_id}")
def get_design(design_id: str):
    d = get_db().designs.find_one({
        "_id": oid(design_id),
        "status": "published",
        "is_sample": {"$ne": True},
    })
    if not d:
        raise HTTPException(404, "Design not found")
    return _design_out(d, _collection_names())


@router.get("/collections")
def list_collections():
    db = get_db()
    out = []
    for c in db.collections.find({"status": "published", "is_sample": {"$ne": True}}).sort("created_at", -1):
        item = ser(c)
        cid = str(c["_id"])
        item["design_count"] = db.designs.count_documents({
            "collection_id": cid,
            "status": "published",
            "is_sample": {"$ne": True},
        })
        if not item.get("cover_url"):
            first = db.designs.find_one({"collection_id": cid, "status": "published", "is_sample": {"$ne": True}})
            if first and first.get("images"):
                item["cover_url"] = first["images"][0]["url"]
        out.append(item)
    return out


@router.get("/videos")
def list_videos(category: str | None = None):
    q: dict = {"status": "published", "is_sample": {"$ne": True}}
    if category in config.VIDEO_CATEGORIES:
        q["category"] = category
    return [ser(v) for v in get_db().videos.find(q).sort("created_at", -1)]


@router.post("/inquiries", status_code=201)
def create_inquiry(body: InquiryIn, request: Request):
    rate_limit(request, "inquiry", limit=5, window_s=600)
    if body.website.strip():
        # Honeypot filled: pretend success, store nothing.
        return {"ok": True}
    get_db().inquiries.insert_one(
        {
            "name": body.name.strip(),
            "contact": body.contact,
            "service": body.service.strip() or "Other",
            "message": body.message.strip(),
            "status": "new",
            "created_at": now(),
        }
    )
    return {"ok": True}
