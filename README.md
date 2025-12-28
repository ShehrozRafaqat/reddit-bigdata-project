# Reddit Big Data MVP (2-day build)

A **small Reddit-style MVP** aligned with the design doc:
- **PostgreSQL**: users + communities (strong consistency)
- **MongoDB**: posts + comments (document, flexible schema)
- **MinIO (S3 compatible)**: images/videos (object storage), store only keys/URLs in Mongo
- **Event log / Datalake**: JSONL events written to `./datalake/events/` (for analytics demo)

---

## Architecture overview

```
┌───────────────────────────┐
│        React UI           │
│  Vite + Tailwind CSS      │
└────────────┬──────────────┘
             │ HTTP (REST)
┌────────────▼──────────────┐
│        FastAPI API         │
│   auth, posts, comments    │
└───────┬─────────┬──────────┘
        │         │
        │         ├─────────────┐
        │         │             │
┌───────▼──────┐  │      ┌──────▼────────┐
│ PostgreSQL  │  │      │ MongoDB        │
│ users +     │  │      │ posts/comments │
│ communities │  │      └────────────────┘
└─────────────┘  │
                 │      ┌────────────────┐
                 └──────► MinIO (S3)     │
                        │ media objects │
                        └────────────────┘

Event log (JSONL) written to ./datalake/events
```

---

## Project structure

```
backend/
  app/
    routers/          # FastAPI route handlers (auth, posts, comments, media)
    services/         # business logic helpers + seed data
    db/               # SQLModel + Mongo adapters
  drizzle/
    schema.ts         # Drizzle ORM schema for users/communities
    drizzle.config.ts # Drizzle config (optional migrations)

frontend/
  src/
    components/       # Small, reusable UI blocks (nav, sidebar, posts, comments)
    api.js            # REST client helpers
    App.jsx           # App orchestration + state
```

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

### Optional: Drizzle schema (Postgres)

The Postgres schema is also mirrored in `backend/drizzle/schema.ts` so you can
optionally generate migrations with Drizzle (e.g. `drizzle-kit`), if desired.

## 3) Demo-ready flow checklist

✅ No CORS errors in browser console (React → API)

1. **Register**
2. **Login**
3. **Create Community** (left sidebar)
4. **Create Post** (optional media upload)
5. **Add Comment**
6. **Feed renders** (new posts/comments show after submit)

## 4) Demo seed data

On first startup the API auto-seeds demo data:
- User: `demo` / `demo1234`
- Community: `r/demo`
- One welcome post + comment

If you want a clean slate, stop containers and wipe volumes:
```bash
docker compose down -v
```

## 5) Swagger demo (backup / for showing APIs)

- Register → `POST /auth/register`
- Login → `POST /auth/login` (copy token)
- Swagger Authorize → `Bearer <token>`
- Create community → `POST /communities`
- Upload media → `POST /media/upload` (returns key + presigned URL)
- Create post → `POST /posts` (include `media_keys`)
- Comment → `POST /comments`
- List → `GET /communities/{community_id}/posts`, `GET /posts/{post_id}/comments`

## 6) Analytics mini-demo (batch over event logs)

Events are appended to JSONL files in:
`./datalake/events/YYYY-MM-DD.jsonl`

Run inside the API container:
```bash
docker compose exec api python scripts/daily_metrics.py
```

## 7) Troubleshooting

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
- [ ] Register + Login from UI
- [ ] Create community
- [ ] Create post (optional media upload)
- [ ] Add comment
- [ ] Verify feed renders new content
