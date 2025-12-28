#!/usr/bin/env python3

import os
import random
import sys
import time
from typing import Any, Dict, List, Optional, Sequence

import requests
from faker import Faker

BASE_URL = os.getenv("SEED_BASE_URL", "http://localhost:8000").rstrip("/")
OPENAPI_URL = f"{BASE_URL}/openapi.json"

USERS = int(os.getenv("SEED_USERS", "20"))
COMMUNITIES = int(os.getenv("SEED_COMMUNITIES", "8"))
POSTS = int(os.getenv("SEED_POSTS", "80"))

MAX_ATTEMPTS = int(os.getenv("SEED_MAX_ATTEMPTS", "5"))
BACKOFF_SECONDS = float(os.getenv("SEED_BACKOFF_SECONDS", "0.6"))

fake = Faker()


def request_with_retry(
    session: requests.Session,
    method: str,
    url: str,
    **kwargs: Any,
) -> requests.Response:
    last_exc: Optional[BaseException] = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = session.request(method, url, timeout=15, **kwargs)
        except requests.RequestException as exc:
            last_exc = exc
            print(
                f"[error] {method} {url} failed ({attempt}/{MAX_ATTEMPTS}): {exc}",
                file=sys.stderr,
            )
            if attempt < MAX_ATTEMPTS:
                time.sleep(BACKOFF_SECONDS * attempt)
            continue

        if response.status_code in {429, 500, 502, 503, 504}:
            print(
                f"[warn] {method} {url} -> {response.status_code}: {response.text[:200]}",
                file=sys.stderr,
            )
            if attempt < MAX_ATTEMPTS:
                time.sleep(BACKOFF_SECONDS * attempt)
                continue
        return response

    if last_exc is not None:
        raise last_exc
    raise RuntimeError(f"Failed {method} {url} after {MAX_ATTEMPTS} attempts")


def require_path(paths: Dict[str, Any], method: str, candidates: Sequence[str]) -> str:
    for candidate in candidates:
        if candidate in paths and method in paths[candidate]:
            return candidate
    raise RuntimeError(f"Missing required {method.upper()} endpoint. Checked: {', '.join(candidates)}")


def optional_path(paths: Dict[str, Any], method: str, candidates: Sequence[str]) -> Optional[str]:
    for candidate in candidates:
        if candidate in paths and method in paths[candidate]:
            return candidate
    return None


def extract_token(data: Dict[str, Any]) -> Optional[str]:
    for key in ("access_token", "token", "jwt"):
        if key in data:
            return data[key]
    if "data" in data and isinstance(data["data"], dict):
        return extract_token(data["data"])
    return None


def extract_id(data: Dict[str, Any]) -> Optional[Any]:
    for key in ("id", "community_id", "post_id", "user_id"):
        if key in data:
            return data[key]
    return None


def ensure_json(response: requests.Response) -> Dict[str, Any] | List[Any]:
    try:
        return response.json()
    except ValueError as exc:
        raise RuntimeError(
            f"Non-JSON response from {response.request.method} {response.url}: {response.text[:200]}"
        ) from exc


def make_headers(token: Optional[str]) -> Dict[str, str]:
    if not token:
        return {}
    return {"Authorization": f"Bearer {token}"}


def pick(items: Sequence[Any]) -> Any:
    return random.choice(list(items))


def collect_items(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("items", "data", "communities"):
            if key in payload and isinstance(payload[key], list):
                return payload[key]
    return []


def main() -> int:
    session = requests.Session()

    openapi_response = request_with_retry(session, "get", OPENAPI_URL)
    if openapi_response.status_code != 200:
        print(
            f"[error] Failed to load OpenAPI ({openapi_response.status_code}): {openapi_response.text}",
            file=sys.stderr,
        )
        return 1

    openapi = ensure_json(openapi_response)
    paths = openapi.get("paths", {})
    if not isinstance(paths, dict):
        print("[error] OpenAPI paths missing or invalid.", file=sys.stderr)
        return 1

    register_path = require_path(paths, "post", ["/auth/register"])
    login_path = require_path(paths, "post", ["/auth/login"])
    create_community_path = require_path(paths, "post", ["/communities"])
    list_community_path = require_path(paths, "get", ["/communities"])
    join_path = optional_path(paths, "post", ["/communities/{community_id}/join"])

    create_post_path = optional_path(
        paths,
        "post",
        ["/posts", "/communities/{community_id}/posts"],
    )
    if not create_post_path:
        raise RuntimeError("Missing required post creation endpoint: /posts or /communities/{community_id}/posts")

    users: List[Dict[str, Any]] = []
    for _ in range(USERS):
        username = fake.unique.user_name()
        password = fake.password(length=12)
        payload = {"username": username, "email": fake.unique.email(), "password": password}
        register_url = f"{BASE_URL}{register_path}"
        register_response = request_with_retry(session, "post", register_url, json=payload)

        if register_response.status_code == 400:
            print(f"[warn] Register failed for {username}, attempting login.", file=sys.stderr)
        elif register_response.status_code not in {200, 201}:
            print(
                f"[error] Register failed for {username}: {register_response.status_code} {register_response.text}",
                file=sys.stderr,
            )
            continue

        login_url = f"{BASE_URL}{login_path}"
        login_response = request_with_retry(
            session,
            "post",
            login_url,
            json={"username": username, "password": password},
        )
        if login_response.status_code not in {200, 201}:
            print(
                f"[error] Login failed for {username}: {login_response.status_code} {login_response.text}",
                file=sys.stderr,
            )
            continue
        token_payload = ensure_json(login_response)
        token = extract_token(token_payload)
        if not token:
            print(f"[error] Missing token for {username}: {token_payload}", file=sys.stderr)
            continue

        user_id = None
        if register_response.status_code in {200, 201}:
            user_payload = ensure_json(register_response)
            user_id = extract_id(user_payload)

        users.append(
            {
                "username": username,
                "password": password,
                "token": token,
                "id": user_id,
            }
        )

    if not users:
        print("[error] No users registered/logged in.", file=sys.stderr)
        return 1

    communities: List[Dict[str, Any]] = []
    pending_names: List[str] = []
    for _ in range(COMMUNITIES):
        creator = pick(users)
        name = fake.unique.word().capitalize() + fake.unique.word().capitalize()
        payload = {"name": name, "description": fake.sentence(nb_words=10)}
        response = request_with_retry(
            session,
            "post",
            f"{BASE_URL}{create_community_path}",
            json=payload,
            headers=make_headers(creator["token"]),
        )
        if response.status_code not in {200, 201}:
            print(
                f"[error] Create community failed: {response.status_code} {response.text}",
                file=sys.stderr,
            )
            continue

        response_payload = ensure_json(response)
        community_id = extract_id(response_payload) if isinstance(response_payload, dict) else None
        if community_id is None:
            pending_names.append(name)
        communities.append({"id": community_id, "name": name})

    if pending_names or any(c["id"] is None for c in communities):
        list_response = request_with_retry(session, "get", f"{BASE_URL}{list_community_path}")
        if list_response.status_code == 200:
            items = collect_items(ensure_json(list_response))
            name_map = {item.get("name"): item for item in items if isinstance(item, dict)}
            for community in communities:
                if community["id"] is None:
                    matched = name_map.get(community["name"])
                    if matched:
                        community["id"] = extract_id(matched)

    communities = [c for c in communities if c["id"] is not None]
    if not communities:
        print("[error] No communities created.", file=sys.stderr)
        return 1

    posts: List[str] = []
    for _ in range(POSTS):
        author = pick(users)
        community = pick(communities)
        headers = make_headers(author["token"])
        if join_path:
            join_url = f"{BASE_URL}{join_path}".format(community_id=community["id"])
            join_response = request_with_retry(session, "post", join_url, headers=headers)
            if join_response.status_code not in {200, 201}:
                print(
                    f"[warn] Join failed: {join_response.status_code} {join_response.text}",
                    file=sys.stderr,
                )

        title = fake.sentence(nb_words=8).rstrip(".")
        body = "\n\n".join(fake.paragraphs(nb=3))
        payload = {"title": title, "body": body}

        if create_post_path == "/posts":
            payload["community_id"] = community["id"]
            post_url = f"{BASE_URL}{create_post_path}"
        else:
            post_url = f"{BASE_URL}{create_post_path}".format(community_id=community["id"])

        response = request_with_retry(
            session,
            "post",
            post_url,
            json=payload,
            headers=headers,
        )

        if response.status_code == 403 and join_path:
            join_url = f"{BASE_URL}{join_path}".format(community_id=community["id"])
            request_with_retry(session, "post", join_url, headers=headers)
            response = request_with_retry(
                session,
                "post",
                post_url,
                json=payload,
                headers=headers,
            )

        if response.status_code not in {200, 201}:
            print(
                f"[error] Create post failed: {response.status_code} {response.text}",
                file=sys.stderr,
            )
            continue

        post_payload = ensure_json(response)
        if isinstance(post_payload, dict):
            post_id = post_payload.get("post_id") or extract_id(post_payload)
            if post_id:
                posts.append(str(post_id))

    print("\nSeed summary")
    print(f"Users: {len(users)} (sample ids: {[u.get('id') for u in users[:5]]})")
    print(f"Communities: {len(communities)} (sample ids: {[c.get('id') for c in communities[:5]]})")
    print(f"Posts: {len(posts)} (sample ids: {posts[:5]})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
