import json
import os
from datetime import datetime, timezone
from typing import Any, Dict

from app.core.config import EVENT_LOG_DIR

def log_event(event_type: str, actor_user_id: int | None, payload: Dict[str, Any]) -> None:
    os.makedirs(EVENT_LOG_DIR, exist_ok=True)
    now = datetime.now(timezone.utc)
    day = now.strftime("%Y-%m-%d")
    path = os.path.join(EVENT_LOG_DIR, f"{day}.jsonl")

    record = {
        "ts": now.isoformat(),
        "type": event_type,
        "actor_user_id": actor_user_id,
        "payload": payload,
    }
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")