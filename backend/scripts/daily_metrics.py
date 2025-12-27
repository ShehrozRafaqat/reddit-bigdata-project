import json
import os
from collections import Counter

EVENT_DIR = os.getenv("EVENT_LOG_DIR", "/datalake/events")

def read_events():
    if not os.path.isdir(EVENT_DIR):
        return []
    files = sorted([f for f in os.listdir(EVENT_DIR) if f.endswith(".jsonl")])
    events = []
    for fn in files:
        path = os.path.join(EVENT_DIR, fn)
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    events.append(json.loads(line))
                except Exception:
                    pass
    return events

def main():
    events = read_events()
    if not events:
        print(f"No events found in {EVENT_DIR}. Create some posts/comments first.")
        return

    types = Counter(e.get("type") for e in events)
    posts_by_day = Counter()
    comments_by_day = Counter()

    for e in events:
        ts = e.get("ts")
        if not ts:
            continue
        day = ts[:10]
        if e.get("type") == "post_create":
            posts_by_day[day] += 1
        if e.get("type") == "comment_create":
            comments_by_day[day] += 1

    print("\n=== Event counts (all time) ===")
    for k, v in types.most_common():
        print(f"{k:15} {v}")

    print("\n=== Posts per day ===")
    for day in sorted(posts_by_day):
        print(f"{day}  {posts_by_day[day]}")

    print("\n=== Comments per day ===")
    for day in sorted(comments_by_day):
        print(f"{day}  {comments_by_day[day]}")

if __name__ == "__main__":
    main()