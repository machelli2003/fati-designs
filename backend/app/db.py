from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from . import config

_db = None


def get_db():
    global _db
    if _db is not None:
        return _db
    if config.MONGO_MOCK:
        import mongomock  # type: ignore

        _db = mongomock.MongoClient()[config.MONGODB_DB]
    else:
        if not config.MONGODB_URI:
            raise RuntimeError("MONGODB_URI is not set")
        from pymongo import MongoClient

        _db = MongoClient(config.MONGODB_URI, serverSelectionTimeoutMS=8000)[config.MONGODB_DB]
    return _db


def now() -> datetime:
    return datetime.now(timezone.utc)


def oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Not found")


def ser(doc: dict | None) -> dict | None:
    """Make a Mongo document JSON friendly."""
    if doc is None:
        return None
    out = {}
    for k, v in doc.items():
        if k == "_id":
            out["id"] = str(v)
        elif isinstance(v, datetime):
            if v.tzinfo is None:
                v = v.replace(tzinfo=timezone.utc)
            out[k] = v.isoformat()
        elif isinstance(v, ObjectId):
            out[k] = str(v)
        else:
            out[k] = v
    return out


def ensure_indexes():
    db = get_db()
    db.users.create_index("email", unique=True)
    db.designs.create_index([("status", 1), ("created_at", -1)])
    db.designs.create_index("category")
    db.designs.create_index("collection_id")
    db.videos.create_index([("status", 1), ("created_at", -1)])
    db.collections.create_index([("status", 1), ("created_at", -1)])
    db.inquiries.create_index([("created_at", -1)])
