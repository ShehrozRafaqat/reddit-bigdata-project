# Reddit Big Data MVP (2-day build)

A **small Reddit-style MVP** aligned with the design doc:
- **PostgreSQL**: users + communities (strong consistency)
- **MongoDB**: posts + comments (document, flexible schema)
- **MinIO (S3 compatible)**: images/videos (object storage), store only keys/URLs in Mongo
- **Event log / Datalake**: JSONL events written to `./datalake/events/` (for analytics demo)

---

## 0) Prerequisites (Windows)
1. Install **Docker Desktop** (WSL2 enabled if prompted).
2. Install **Node.js 18+** (for the React UI).
3. Install **VS Code** (recommended).
4. Verify:
   ```powershell
   docker --version
   docker compose version
   node -v
   npm -v

1) Run the backend stack (API + Postgres + Mongo + MinIO)

From repo root:

PowerShell (Windows)
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps

Bash (Git Bash / WSL)
cp .env.example .env
docker compose up -d --build
docker compose ps

Open:

API docs (Swagger): http://localhost:8000/docs

MinIO console: http://localhost:9001
 (use MINIO_ROOT_USER/MINIO_ROOT_PASSWORD from .env)

Optional admin UIs:

docker compose --profile admin up -d


pgAdmin: http://localhost:5050

mongo-express: http://localhost:8081

2) Run the React UI (frontend)

In a second terminal:

cd frontend
npm install
npm run dev


Open UI:

React UI: http://localhost:5173

3) Quick demo flow (UI + Swagger)
UI demo

Register

Login

Create/select a community

Create a post (optional image/video)

Add comments

Swagger demo (backup / for showing APIs)

Register → POST /auth/register

Login → POST /auth/login (copy token)

Swagger Authorize → Bearer <token>

Create community → POST /communities

Upload media → POST /media/upload (returns key + presigned URL)

Create post → POST /posts (include media_keys)

Comment → POST /comments

List → GET /communities/{community_id}/posts, GET /posts/{post_id}/comments

4) Analytics mini-demo (batch over event logs)

Events are appended to JSONL files in:
./datalake/events/YYYY-MM-DD.jsonl

Run inside the API container:

docker compose exec api python scripts/daily_metrics.py

5) Stop / reset

Stop:

docker compose down


Stop and delete databases:

docker compose down -v

6) Troubleshooting
CORS errors in browser (React -> API blocked)

If you see CORS errors, ensure FastAPI enables CORS for http://localhost:5173,
rebuild API:

docker compose up -d --build api
Ports in use

If ports are busy, stop old containers:
docker compose down
docker ps

---

### One more tip before handing to Codex
Also add a short “Codex Tasks” section at bottom (optional) with bullets like:
- Fix CORS
- Make Create Community available in UI
- Show comments under each post
- Seed demo data

If you want, paste your current `docker-compose.yml` and I’ll add the **exact** UI service (so `docker compose up` also runs frontend automatically).
