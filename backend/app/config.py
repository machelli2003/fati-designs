import os

from dotenv import load_dotenv

load_dotenv()


def _list(v: str) -> list[str]:
    return [x.strip() for x in v.split(",") if x.strip()]


MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB = os.getenv("MONGODB_DB", "fati_designs")
MONGO_MOCK = os.getenv("MONGO_MOCK", "0") == "1"  # tests only

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "720"))
CORS_ORIGINS = _list(os.getenv("CORS_ORIGINS", "http://localhost:5173"))

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

SEED_SAMPLE = os.getenv("SEED_SAMPLE", "1") == "1"

CATEGORIES = [
    "Dresses",
    "Traditional Wear",
    "Casual Wear",
    "Bridal and Occasion Wear",
    "Custom Designs",
    "Other Creations",
]
VIDEO_CATEGORIES = ["runway", "process"]
SERVICES = [
    "Custom Dress",
    "Traditional Wear",
    "Bridal / Occasion Wear",
    "Alterations",
    "Other",
]
