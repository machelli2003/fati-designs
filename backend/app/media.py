"""Cloudinary helpers: signed browser uploads + best-effort deletes (no SDK needed)."""
import hashlib
import json
import time
import urllib.parse
import urllib.request

from fastapi import HTTPException

from . import config

IMAGE_FORMATS = "jpg,jpeg,png,webp"
VIDEO_FORMATS = "mp4,mov,webm"


def configured() -> bool:
    return bool(config.CLOUDINARY_CLOUD_NAME and config.CLOUDINARY_API_KEY and config.CLOUDINARY_API_SECRET)


def _sign(params: dict) -> str:
    to_sign = "&".join(f"{k}={v}" for k, v in sorted(params.items()) if v not in (None, ""))
    return hashlib.sha1((to_sign + config.CLOUDINARY_API_SECRET).encode()).hexdigest()


def upload_signature(resource_type: str, folder: str) -> dict:
    if not configured():
        raise HTTPException(
            status_code=503,
            detail="Media storage is not configured yet. Add the Cloudinary keys to the backend environment.",
        )
    params = {
        "timestamp": int(time.time()),
        "folder": f"fati-designs/{folder}",
        "allowed_formats": IMAGE_FORMATS if resource_type == "image" else VIDEO_FORMATS,
    }
    return {
        **params,
        "signature": _sign(params),
        "api_key": config.CLOUDINARY_API_KEY,
        "cloud_name": config.CLOUDINARY_CLOUD_NAME,
        "resource_type": resource_type,
    }


def destroy(public_id: str | None, resource_type: str = "image") -> None:
    """Best-effort delete; never raises (a failed cleanup must not block content deletion)."""
    if not public_id or not configured():
        return
    try:
        params = {"public_id": public_id, "timestamp": int(time.time())}
        body = urllib.parse.urlencode(
            {**params, "api_key": config.CLOUDINARY_API_KEY, "signature": _sign(params)}
        ).encode()
        url = f"https://api.cloudinary.com/v1_1/{config.CLOUDINARY_CLOUD_NAME}/{resource_type}/destroy"
        urllib.request.urlopen(urllib.request.Request(url, data=body), timeout=8).read()
    except Exception:
        pass
