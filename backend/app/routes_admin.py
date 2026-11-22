from fastapi import APIRouter, Depends, HTTPException, Request

from . import media, seed
from .db import get_db, now, oid, ser
from .schemas import (
    CollectionIn,
    DesignIn,
    InquiryStatus,
    LoginIn,
    SettingsIn,
    SignIn,
    VideoIn,
)
from .security import create_token, current_admin, rate_limit, verify_password

auth = APIRouter(prefix="/api/auth")
router = APIRouter(prefix="/api/admin", dependencies=[Depends(current_admin)])

_DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5pQ0Yb1b0o8m3kq7s3xO6y0m0m0m0m0"


# ---------- auth ----------
@auth.post("/login")
def login(body: LoginIn, request: Request):
    rate_limit(request, "login", limit=8, window_s=600)
    user = get_db().users.find_one({"email": body.email.lower(), "role": "admin"})
    ok = verify_password(body.password, user["password_hash"] if user else _DUMMY_HASH)
    if not user or not ok:
        raise HTTPException(401, "Incorrect email or password")
    return {"token": create_token(str(user["_id"])), "email": user["email"]}


@auth.get("/me")
def me(user: dict = Depends(current_admin)):
    return {"email": user["email"]}


# ---------- stats ----------
@router.get("/stats")
def stats():
    db = get_db()
    return {
        "designs": db.designs.count_documents({}),
        "collections": db.collections.count_documents({}),
        "videos": db.videos.count_documents({}),
        "inquiries": db.inquiries.count_documents({}),
        "new_inquiries": db.inquiries.count_documents({"status": "new"}),
        "recent_designs": [ser(d) for d in db.designs.find().sort("created_at", -1).limit(5)],
        "recent_inquiries": [ser(i) for i in db.inquiries.find().sort("created_at", -1).limit(5)],
        "storage_configured": media.configured(),
    }


# ---------- uploads ----------
@router.post("/upload/sign")
def sign_upload(body: SignIn):
    return media.upload_signature(body.resource_type, body.folder)


# ---------- designs ----------
def _check_collection(cid: str | None):
    if cid and not get_db().collections.find_one({"_id": oid(cid)}):
        raise HTTPException(422, "Selected collection does not exist")


def _design_doc(body: DesignIn) -> dict:
    _check_collection(body.collection_id)
    doc = body.model_dump()
    if doc["status"] == "published" and not doc["images"]:
        raise HTTPException(422, "Add at least one photograph before publishing")
    return doc


@router.get("/designs")
def admin_designs():
    return [ser(d) for d in get_db().designs.find().sort("created_at", -1)]


@router.get("/designs/{design_id}")
def admin_design(design_id: str):
    d = get_db().designs.find_one({"_id": oid(design_id)})
    if not d:
        raise HTTPException(404, "Design not found")
    return ser(d)


@router.post("/designs", status_code=201)
def create_design(body: DesignIn):
    doc = {**_design_doc(body), "created_at": now(), "updated_at": now()}
    doc["_id"] = get_db().designs.insert_one(doc).inserted_id
    return ser(doc)


@router.put("/designs/{design_id}")
def update_design(design_id: str, body: DesignIn):
    db = get_db()
    old = db.designs.find_one({"_id": oid(design_id)})
    if not old:
        raise HTTPException(404, "Design not found")
    doc = {**_design_doc(body), "updated_at": now()}
    db.designs.update_one({"_id": old["_id"]}, {"$set": doc})
    kept = {i["public_id"] for i in doc["images"] if i.get("public_id")}
    for img in old.get("images", []):
        if img.get("public_id") and img["public_id"] not in kept:
            media.destroy(img["public_id"])
    return ser(db.designs.find_one({"_id": old["_id"]}))


@router.delete("/designs/{design_id}")
def delete_design(design_id: str):
    db = get_db()
    d = db.designs.find_one_and_delete({"_id": oid(design_id)})
    if not d:
        raise HTTPException(404, "Design not found")
    for img in d.get("images", []):
        media.destroy(img.get("public_id"))
    return {"ok": True}


# ---------- collections ----------
@router.get("/collections")
def admin_collections():
    db = get_db()
    out = []
    for c in db.collections.find().sort("created_at", -1):
        item = ser(c)
        item["design_count"] = db.designs.count_documents({"collection_id": str(c["_id"])})
        out.append(item)
    return out


@router.get("/collections/{cid}")
def admin_collection(cid: str):
    c = get_db().collections.find_one({"_id": oid(cid)})
    if not c:
        raise HTTPException(404, "Collection not found")
    return ser(c)


@router.post("/collections", status_code=201)
def create_collection(body: CollectionIn):
    doc = {**body.model_dump(), "created_at": now()}
    doc["_id"] = get_db().collections.insert_one(doc).inserted_id
    return ser(doc)


@router.put("/collections/{cid}")
def update_collection(cid: str, body: CollectionIn):
    db = get_db()
    r = db.collections.update_one({"_id": oid(cid)}, {"$set": body.model_dump()})
    if not r.matched_count:
        raise HTTPException(404, "Collection not found")
    return ser(db.collections.find_one({"_id": oid(cid)}))


@router.delete("/collections/{cid}")
def delete_collection(cid: str):
    db = get_db()
    c = db.collections.find_one_and_delete({"_id": oid(cid)})
    if not c:
        raise HTTPException(404, "Collection not found")
    db.designs.update_many({"collection_id": cid}, {"$set": {"collection_id": None}})
    media.destroy(c.get("cover_public_id"))
    return {"ok": True}


@router.put("/collections/{cid}/designs")
def assign_designs(cid: str, body: dict):
    """Body: {"design_ids": [...]} - sets exactly these designs as the collection's members."""
    db = get_db()
    if not db.collections.find_one({"_id": oid(cid)}):
        raise HTTPException(404, "Collection not found")
    ids = body.get("design_ids")
    if not isinstance(ids, list):
        raise HTTPException(422, "design_ids must be a list")
    object_ids = [oid(i) for i in ids]
    db.designs.update_many({"collection_id": cid, "_id": {"$nin": object_ids}}, {"$set": {"collection_id": None}})
    db.designs.update_many({"_id": {"$in": object_ids}}, {"$set": {"collection_id": cid}})
    return {"ok": True}


# ---------- videos ----------
@router.get("/videos")
def admin_videos():
    return [ser(v) for v in get_db().videos.find().sort("created_at", -1)]


@router.get("/videos/{vid}")
def admin_video(vid: str):
    v = get_db().videos.find_one({"_id": oid(vid)})
    if not v:
        raise HTTPException(404, "Video not found")
    return ser(v)


@router.post("/videos", status_code=201)
def create_video(body: VideoIn):
    doc = {**body.model_dump(), "created_at": now()}
    doc["_id"] = get_db().videos.insert_one(doc).inserted_id
    return ser(doc)


@router.put("/videos/{vid}")
def update_video(vid: str, body: VideoIn):
    db = get_db()
    old = db.videos.find_one({"_id": oid(vid)})
    if not old:
        raise HTTPException(404, "Video not found")
    doc = body.model_dump()
    db.videos.update_one({"_id": old["_id"]}, {"$set": doc})
    if old.get("video_public_id") and old["video_public_id"] != doc.get("video_public_id"):
        media.destroy(old["video_public_id"], "video")
    if old.get("thumbnail_public_id") and old["thumbnail_public_id"] != doc.get("thumbnail_public_id"):
        media.destroy(old["thumbnail_public_id"])
    return ser(db.videos.find_one({"_id": old["_id"]}))


@router.delete("/videos/{vid}")
def delete_video(vid: str):
    v = get_db().videos.find_one_and_delete({"_id": oid(vid)})
    if not v:
        raise HTTPException(404, "Video not found")
    media.destroy(v.get("video_public_id"), "video")
    media.destroy(v.get("thumbnail_public_id"))
    return {"ok": True}


# ---------- inquiries ----------
@router.get("/inquiries")
def admin_inquiries():
    return [ser(i) for i in get_db().inquiries.find().sort("created_at", -1)]


@router.patch("/inquiries/{iid}")
def set_inquiry_status(iid: str, body: InquiryStatus):
    r = get_db().inquiries.update_one({"_id": oid(iid)}, {"$set": {"status": body.status}})
    if not r.matched_count:
        raise HTTPException(404, "Inquiry not found")
    return {"ok": True}


@router.delete("/inquiries/{iid}")
def delete_inquiry(iid: str):
    r = get_db().inquiries.delete_one({"_id": oid(iid)})
    if not r.deleted_count:
        raise HTTPException(404, "Inquiry not found")
    return {"ok": True}


# ---------- settings + sample content ----------
@router.get("/settings")
def admin_settings():
    doc = get_db().site_settings.find_one({"_id": "site"}) or {}
    doc.pop("_id", None)
    doc.pop("updated_at", None)
    return doc


@router.put("/settings")
def update_settings(body: SettingsIn):
    get_db().site_settings.update_one(
        {"_id": "site"}, {"$set": {**body.model_dump(), "updated_at": now()}}, upsert=True
    )
    return body.model_dump()


@router.delete("/sample-content")
def remove_sample_content():
    return seed.remove_sample()


