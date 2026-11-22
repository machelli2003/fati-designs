"""Legacy sample-content cleanup and neutral default settings."""
from .db import get_db, now

DEFAULT_SETTINGS = {
    "_id": "site",
    "brand_name": "FATI DESIGNS",
    "tagline": "Designed with Passion. Crafted with Precision.",
    "hero_heading": "Where Creativity Meets Craftsmanship.",
    "hero_description": "",
    "hero_image_url": None,
    "about_heading": "Hello, I'm Fati.",
    "about_bio": "",
    "profile_image_url": None,
    "whatsapp_number": "",
    "instagram_url": "",
    "email": "",
    "phone": "",
    "location": "Accra, Ghana",
}


def ensure_settings():
    db = get_db()
    if not db.site_settings.find_one({"_id": "site"}):
        db.site_settings.insert_one({**DEFAULT_SETTINGS, "updated_at": now()})


def remove_sample() -> dict:
    db = get_db()
    return {
        "designs": db.designs.delete_many({"is_sample": True}).deleted_count,
        "collections": db.collections.delete_many({"is_sample": True}).deleted_count,
        "videos": db.videos.delete_many({"is_sample": True}).deleted_count,
    }
