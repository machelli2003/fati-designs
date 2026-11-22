import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config, seed
from .db import ensure_indexes, get_db
from .routes_admin import auth, router as admin_router
from .routes_public import router as public_router

log = logging.getLogger("fati")

app = FastAPI(title="FATI DESIGNS API", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.on_event("startup")
def startup():
    if not config.JWT_SECRET or len(config.JWT_SECRET) < 24:
        log.warning("JWT_SECRET is missing or too short. Admin login will not work until it is set.")
    get_db()
    ensure_indexes()
    seed.ensure_settings()
    # Permanently remove legacy placeholder content instead of reseeding it.
    seed.remove_sample()


app.include_router(public_router)
app.include_router(auth)
app.include_router(admin_router)
