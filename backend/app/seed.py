"""Sample content so the site never looks empty. Everything seeded has is_sample=True
and can be removed in one click from Admin > Settings."""
from .db import get_db, now

DEFAULT_SETTINGS = {
    "_id": "site",
    "brand_name": "FATI DESIGNS",
    "tagline": "Designed with Passion. Crafted with Precision.",
    "hero_heading": "Where Creativity Meets Craftsmanship.",
    "hero_description": (
        "Fati is a fashion designer who designs and sews every piece herself. "
        "Explore her creations, watch them come to life, and commission something made for you."
    ),
    "hero_image_url": "/placeholders/hero.svg",
    "about_heading": "Hello, I'm Fati.",
    "about_bio": (
        "SAMPLE TEXT - replace this from Admin > Settings.\n\n"
        "I am a fashion designer who loves turning ideas and fabric into clothing that makes people feel "
        "like themselves. Every garment starts as a sketch and is cut, sewn and finished by hand in my studio.\n\n"
        "My approach is simple: listen closely, design with intention, and sew with care. "
        "Whether it is an everyday dress, a traditional outfit or something for a special occasion, "
        "I want the finished piece to fit beautifully and feel unmistakably yours."
    ),
    "profile_image_url": "/placeholders/portrait.svg",
    "whatsapp_number": "",
    "instagram_url": "",
    "email": "",
    "phone": "",
    "location": "Accra, Ghana",
}

_SAMPLE_DESIGNS = [
    ("Sample - Evening Wrap Dress", "Dresses", "p1", True),
    ("Sample - Kente Inspired Two-Piece", "Traditional Wear", "p2", True),
    ("Sample - Everyday Linen Set", "Casual Wear", "p3", False),
    ("Sample - Bridal Gown Study", "Bridal and Occasion Wear", "p4", True),
    ("Sample - Custom Corset Dress", "Custom Designs", "p5", False),
    ("Sample - Ankara Peplum Top", "Traditional Wear", "p6", False),
    ("Sample - Garden Party Dress", "Dresses", "p7", False),
    ("Sample - Occasion Jumpsuit", "Other Creations", "p8", False),
]


def ensure_settings():
    db = get_db()
    if not db.site_settings.find_one({"_id": "site"}):
        db.site_settings.insert_one({**DEFAULT_SETTINGS, "updated_at": now()})


def seed_sample(force: bool = False) -> bool:
    db = get_db()
    if not force and db.designs.count_documents({}) > 0:
        return False
    t = now()
    col = db.collections.insert_one(
        {
            "name": "Sample Collection",
            "description": "Placeholder collection. Replace with your own from the dashboard.",
            "cover_url": "/placeholders/p1.svg",
            "status": "published",
            "is_sample": True,
            "created_at": t,
        }
    ).inserted_id
    for i, (title, cat, p, feat) in enumerate(_SAMPLE_DESIGNS):
        db.designs.insert_one(
            {
                "title": title,
                "description": "Sample design shown until real photographs are uploaded. Replace or delete it in the dashboard.",
                "category": cat,
                "collection_id": str(col) if i < 4 else None,
                "images": [{"url": f"/placeholders/{p}.svg", "public_id": None}],
                "featured": feat,
                "status": "published",
                "is_sample": True,
                "created_at": t,
            }
        )
    for title, cat in [("Sample - Runway Moment", "runway"), ("Sample - In the Studio", "process")]:
        db.videos.insert_one(
            {
                "title": title,
                "description": "Sample video card. Upload a real MP4 or add a YouTube/Vimeo link in the dashboard.",
                "category": cat,
                "source": "embed",
                "video_url": "",
                "video_public_id": None,
                "thumbnail_url": "/placeholders/p3.svg" if cat == "runway" else "/placeholders/p6.svg",
                "thumbnail_public_id": None,
                "status": "published",
                "is_sample": True,
                "created_at": t,
            }
        )
    return True


def remove_sample() -> dict:
    db = get_db()
    return {
        "designs": db.designs.delete_many({"is_sample": True}).deleted_count,
        "collections": db.collections.delete_many({"is_sample": True}).deleted_count,
        "videos": db.videos.delete_many({"is_sample": True}).deleted_count,
    }
