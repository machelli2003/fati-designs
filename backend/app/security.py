import time
from collections import defaultdict, deque
from datetime import timedelta

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import config
from .db import get_db, now, oid

bearer = HTTPBearer(auto_error=False)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except ValueError:
        return False


def create_token(user_id: str) -> str:
    if not config.JWT_SECRET:
        raise HTTPException(status_code=500, detail="Server auth is not configured")
    exp = now() + timedelta(minutes=config.JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": exp}, config.JWT_SECRET, algorithm="HS256")


def current_admin(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, config.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    user = get_db().users.find_one({"_id": oid(payload["sub"]), "role": "admin"})
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


# --- tiny in-memory rate limiter (per process; fine for a single small instance) ---
_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(request: Request, bucket: str, limit: int, window_s: int):
    ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "?")).split(",")[0].strip()
    key = f"{bucket}:{ip}"
    q = _hits[key]
    t = time.time()
    while q and q[0] < t - window_s:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again shortly.")
    q.append(t)
