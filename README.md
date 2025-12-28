# Reddit Big Data MVP (2-day build)

A **small Reddit-style MVP** aligned with the design doc:
- **PostgreSQL**: users + communities (strong consistency)
- **MongoDB**: posts + comments (document, flexible schema)
- **MinIO (S3 compatible)**: images/videos (object storage), store only keys/URLs in Mongo
- **Event log / Datalake**: JSONL events written to `./datalake/events/` (for analytics demo)

---

## 0) Prerequisites
1. Install **Docker Desktop**.
2. Install **Node.js 18+** (for the React UI).
3. Verify:
   ```bash
   docker --version
   docker compose version
   node -v
   npm -v
   ```

## 1) Run the backend stack (API + Postgres + Mongo + MinIO)

From repo root:

PowerShell (Windows)
```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

Bash (Git Bash / WSL)
```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Open:

- API docs (Swagger): http://localhost:8000/docs
- MinIO console: http://localhost:9001 (use MINIO_ROOT_USER/MINIO_ROOT_PASSWORD from .env)

Optional admin UIs:
```bash
docker compose --profile admin up -d
```

- pgAdmin: http://localhost:5050
- mongo-express: http://localhost:8081

## 2) Run the React UI (frontend)

In a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Open UI: http://localhost:5173

Optional: set API base URL (defaults to `http://localhost:8000`):
```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

## 3) Demo-ready flow checklist

✅ No CORS errors in browser console (React → API)

1. **Register**
2. **Login**
3. **Create Community** (left sidebar)
4. **Create Post** (optional media upload)
5. **Add Comment**
6. **Feed renders** (new posts/comments show after submit)

## 4) Doctor / smoke test (recommended)

Run the automated smoke test (brings up stack, waits for API, runs auth/community/post/comment flow, then builds frontend):
```bash
./doctor.sh
```

## 5) Demo seed data

On first startup the API auto-seeds demo data:
- User: `demo` / `demo1234`
- Community: `r/demo`
- One welcome post + comment

If you want a clean slate, stop containers and wipe volumes:
```bash
docker compose down -v
```

## 6) Swagger demo (backup / for showing APIs)

- Register → `POST /auth/register`
- Login → `POST /auth/login` (copy token)
- Swagger Authorize → `Bearer <token>`
- Create community → `POST /communities`
- Upload media → `POST /media/upload` (returns key + presigned URL)
- Create post → `POST /posts` (include `media_keys`)
- Comment → `POST /comments`
- List → `GET /communities/{community_id}/posts`, `GET /posts/{post_id}/comments`

## 7) Analytics mini-demo (batch over event logs)

Events are appended to JSONL files in:
`./datalake/events/YYYY-MM-DD.jsonl`

Run inside the API container:
```bash
docker compose exec api python scripts/daily_metrics.py
```

## 8) Troubleshooting

### CORS errors in browser (React → API blocked)

If you see CORS errors, ensure FastAPI enables CORS for http://localhost:5173,
rebuild API:
```bash
docker compose up -d --build api
```

### Ports in use

If ports are busy, stop old containers:
```bash
docker compose down
```

---

## Demo checklist (quick)

- [ ] `docker compose up -d --build`
- [ ] `npm install` + `npm run dev`
- [ ] `./doctor.sh` (optional smoke test)
- [ ] Register + Login from UI
- [ ] Create community
- [ ] Create post (optional media upload)
- [ ] Add comment
- [ ] Verify feed renders new content
