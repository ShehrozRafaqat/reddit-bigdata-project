#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$ROOT_DIR/.env" ]; then
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

docker compose up -d --build

echo "Waiting for API to become healthy..."
python - <<'PY'
import json
import time
import urllib.error
import urllib.request

base_url = "http://localhost:8000"
for attempt in range(60):
    try:
        with urllib.request.urlopen(f"{base_url}/") as resp:
            if resp.status == 200:
                print("API is up.")
                break
    except Exception:
        pass
    time.sleep(2)
else:
    raise SystemExit("API did not become ready in time.")


def request(path, method="GET", payload=None, token=None, expected=200):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(f"{base_url}{path}", data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode()
            if resp.status != expected:
                raise SystemExit(f"Unexpected status {resp.status} for {path}: {body}")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode()
        raise SystemExit(f"HTTP {exc.code} for {path}: {body}")


suffix = int(time.time())
username = f"demo_{suffix}"
password = "demo1234"
email = f"{username}@example.com"

request("/auth/register", method="POST", payload={"username": username, "email": email, "password": password})
login = request("/auth/login", method="POST", payload={"username": username, "password": password})
token = login["access_token"]

community = request("/communities", method="POST", payload={"name": f"demo-{suffix}", "description": "Doctor check"}, token=token)
post = request("/posts", method="POST", payload={"community_id": community["id"], "title": "Doctor post", "body": "Smoke test", "media_keys": []}, token=token)
request("/comments", method="POST", payload={"post_id": post["post_id"], "body": "Smoke test comment"}, token=token)

print("API smoke test complete.")
PY

echo "Running frontend build..."
cd "$ROOT_DIR/frontend"
npm install
npm run build

cd "$ROOT_DIR"
echo "Doctor check complete."
