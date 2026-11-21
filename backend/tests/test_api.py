import os

os.environ.update(MONGO_MOCK="1", JWT_SECRET="x" * 40, CORS_ORIGINS="http://localhost:5173",
                  CLOUDINARY_CLOUD_NAME="demo", CLOUDINARY_API_KEY="k", CLOUDINARY_API_SECRET="s")

from fastapi.testclient import TestClient  # noqa: E402

from app.db import get_db, now  # noqa: E402
from app.main import app  # noqa: E402
from app.security import hash_password  # noqa: E402


def setup_module():
    pass


def test_full_flow():
    with TestClient(app) as c:
        db = get_db()
        db.users.insert_one({"email": "a@b.com", "password_hash": hash_password("password123!"), "role": "admin", "created_at": now()})

        # public: seeded sample content
        r = c.get("/api/designs"); assert r.status_code == 200 and r.json()["total"] == 8
        assert c.get("/api/designs?category=Dresses").json()["total"] == 2
        assert c.get("/api/designs?limit=3").json()["pages"] == 3
        assert len(c.get("/api/collections").json()) == 1
        assert len(c.get("/api/videos?category=runway").json()) == 1
        assert c.get("/api/settings").json()["brand_name"] == "FATI DESIGNS"

        # admin is protected
        for path in ["/api/admin/stats", "/api/admin/designs", "/api/admin/inquiries"]:
            assert c.get(path).status_code == 401
        assert c.post("/api/admin/upload/sign", json={"resource_type": "image"}).status_code == 401
        assert c.post("/api/auth/login", json={"email": "a@b.com", "password": "wrong"}).status_code == 401
        t = c.post("/api/auth/login", json={"email": "a@b.com", "password": "password123!"}).json()["token"]
        h = {"Authorization": f"Bearer {t}"}
        assert c.get("/api/auth/me", headers=h).json()["email"] == "a@b.com"
        assert c.get("/api/admin/stats", headers=h).json()["designs"] == 8

        # signing
        s = c.post("/api/admin/upload/sign", json={"resource_type": "image", "folder": "designs"}, headers=h).json()
        assert s["signature"] and s["cloud_name"] == "demo"

        # collection + design lifecycle
        col = c.post("/api/admin/collections", json={"name": "Autumn", "status": "published"}, headers=h).json()
        d = {"title": "Gown", "category": "Dresses", "collection_id": col["id"], "status": "published",
             "images": [{"url": "https://x/y.jpg", "public_id": None}]}
        made = c.post("/api/admin/designs", json=d, headers=h); assert made.status_code == 201
        did = made.json()["id"]
        assert c.post("/api/admin/designs", json={**d, "images": []}, headers=h).status_code == 422  # publish w/o image
        assert c.post("/api/admin/designs", json={**d, "category": "Nope"}, headers=h).status_code == 422
        draft = c.post("/api/admin/designs", json={**d, "status": "draft", "images": []}, headers=h).json()
        public_ids = [i["id"] for i in c.get("/api/designs?limit=48").json()["items"]]
        assert did in public_ids and draft["id"] not in public_ids  # drafts hidden
        assert c.get(f"/api/designs/{draft['id']}").status_code == 404
        assert c.get(f"/api/designs/{did}").json()["collection_name"] == "Autumn"
        assert c.put(f"/api/admin/designs/{did}", json={**d, "title": "Gown 2"}, headers=h).json()["title"] == "Gown 2"
        c.put(f"/api/admin/collections/{col['id']}/designs", json={"design_ids": [did]}, headers=h)
        assert c.delete(f"/api/admin/collections/{col['id']}", headers=h).status_code == 200
        assert c.get(f"/api/designs/{did}").json()["collection_id"] is None
        assert c.delete(f"/api/admin/designs/{did}", headers=h).status_code == 200
        assert c.get(f"/api/designs/{did}").status_code == 404

        # videos
        v = {"title": "Show", "category": "runway", "source": "embed", "video_url": "https://youtu.be/abc", "status": "published"}
        vid = c.post("/api/admin/videos", json=v, headers=h).json()["id"]
        assert c.post("/api/admin/videos", json={**v, "video_url": "https://evil.com/x"}, headers=h).status_code == 422
        assert c.delete(f"/api/admin/videos/{vid}", headers=h).status_code == 200

        # inquiries: validation, honeypot, status flow, privacy
        good = {"name": "Ama", "contact": "ama@example.com", "service": "Custom Dress", "message": "I need a dress"}
        assert c.post("/api/inquiries", json={**good, "contact": "nope"}).status_code == 422
        assert c.post("/api/inquiries", json={**good, "website": "spam.com"}).status_code == 201
        assert db.inquiries.count_documents({}) == 0
        assert c.post("/api/inquiries", json=good).status_code == 201
        assert c.get("/api/inquiries").status_code in (404, 405)
        iid = c.get("/api/admin/inquiries", headers=h).json()[0]["id"]
        assert c.patch(f"/api/admin/inquiries/{iid}", json={"status": "contacted"}, headers=h).status_code == 200
        assert c.patch(f"/api/admin/inquiries/{iid}", json={"status": "bogus"}, headers=h).status_code == 422
        assert c.delete(f"/api/admin/inquiries/{iid}", headers=h).status_code == 200

        # settings + sample removal
        st = c.get("/api/admin/settings", headers=h).json(); st["tagline"] = "New tag"
        assert c.put("/api/admin/settings", json=st, headers=h).status_code == 200
        assert c.get("/api/settings").json()["tagline"] == "New tag"
        assert c.delete("/api/admin/sample-content", headers=h).json()["designs"] == 8
        assert c.get("/api/designs").json()["total"] == 0
