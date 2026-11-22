# FATI DESIGNS

Fashion portfolio with a private admin dashboard.
**React + TypeScript + Vite + Tailwind** (frontend) · **FastAPI + MongoDB Atlas** (backend) · **Cloudinary** (photo/video storage).

```
backend/    FastAPI API, auth, MongoDB, signed upload endpoint
frontend/   Public website + /admin dashboard
```

## 1. MongoDB Atlas
1. Create a free cluster at cloud.mongodb.com.
2. Database Access: create a user with a strong password (read/write).
3. Network Access: allow the backend host's outbound IP addresses. Avoid `0.0.0.0/0` when possible.
4. Connect > Drivers: copy the connection string into `MONGODB_URI`, replacing the password placeholder with the database user's password. URL-encode special characters in the password.
Collections and indexes are created automatically on first start.

## 2. Media storage (Cloudinary)
Atlas stores data, not large files, so photos and videos go to Cloudinary (free tier is enough to start).
1. Sign up at cloudinary.com. From the dashboard copy **Cloud name, API key, API secret**.
2. Put them in the backend env (`CLOUDINARY_*`). The secret never reaches the browser: the backend signs each upload and the browser uploads straight to Cloudinary (so progress bars work, and it works on phones).
3. Limits enforced: images JPG/PNG/WEBP up to 10MB, videos MP4/MOV/WEBM up to 100MB (checked in the browser; formats are also enforced by the signed upload). For longer videos use the YouTube/Vimeo link option.

## 3. Run locally
```bash
# backend
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
Copy-Item .env.example .env # PowerShell; then fill in MONGODB_URI, JWT_SECRET, CLOUDINARY_*
python create_admin.py fati@example.com               # prompts for password (min 10 chars)
python run.py

# frontend (new terminal)
cd frontend
npm install
Copy-Item .env.example .env # PowerShell; set VITE_API_URL=http://localhost:8000
npm run dev                 # http://localhost:5173  ·  admin: /admin/login
```

## 4. First administrator (secure)
There is **no public signup and no default account**. The only way to create an admin is running
`python create_admin.py <email>` on a machine that has the backend `.env` (your laptop is fine, it just talks to Atlas).
Run it again with the same email to reset the password.

## 5. Deploy
1. In Render, create a **Blueprint** from this repository using the root `render.yaml`. It creates the FastAPI web service and the Vite static site. The root `.python-version` pins the backend to the latest Python 3.11 patch release instead of Render's newer default.
2. Set `MONGODB_URI` and all three `CLOUDINARY_*` values for the API service. Render generates `JWT_SECRET`; `MONGODB_DB` is already set.
3. Set the static site's `VITE_API_URL` to the API service's full HTTPS URL (no trailing slash). Set the API's `CORS_ORIGINS` to the static site's exact origin (scheme included, no trailing slash). If you add a custom domain later, update `CORS_ORIGINS` to include it and redeploy the API.
4. The static-site rewrite in `render.yaml` supports React Router paths. The API health check is `/api/health`.
5. After choosing a custom domain, replace `YOUR-DOMAIN.com` in `frontend/public/robots.txt` and `frontend/public/sitemap.xml`.
6. Verify `/api/health`, the public pages, the contact form, and `/admin/login` on the deployed site. Never put backend secrets in a `VITE_*` variable.

Render's free instances may sleep when idle, so the first request can take ~30 seconds.

## 6. Using the dashboard (`/admin`)
- **Designs**: upload several photos at once, reorder, star = cover, publish or save as draft, feature on home page.
- **Collections**: create, set cover, tick which designs belong to it.
- **Videos**: upload MP4 or paste YouTube/Vimeo link; thumbnail is auto-generated if not provided.
- **Inquiries**: new / contacted / completed, delete.
- **Settings**: brand, hero, bio, profile photo, WhatsApp, Instagram, email, phone, location. Changes appear instantly.

## Security notes
- Passwords hashed with bcrypt; JWT sessions (12h by default); login limited to 8 attempts / 10 min / IP.
- All `/api/admin/*` routes require a valid admin token; public routes only return **published** content and never expose inquiries.
- Contact form: server-side validation, honeypot field, 5 submissions / 10 min / IP.
- No secrets in frontend env. Rotate `JWT_SECRET` to sign everyone out.
- Rate limiting is in-memory (fine for one instance).

## Tests
`cd backend && pip install mongomock pytest httpx && pytest` runs the API test suite against an in-memory Mongo.
