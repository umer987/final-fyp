"""Safe logging that never breaks the ask pipeline on Windows."""
from __future__ import annotations

import json
import time
from pathlib import Path

_DEBUG_LOG = Path(__file__).resolve().parent.parent.parent.parent / "debug-f21b68.log"


def safe_log(msg: str) -> None:
    """Print without letting broken stdout/stderr crash /ask (Win Errno 22)."""
    try:
        print(msg, flush=True)
    except OSError:
        pass


def debug_log(
    location: str,
    message: str,
    data: dict | None = None,
    hypothesis_id: str = "",
) -> None:
    # #region agent log
    try:
        payload = {
            "sessionId": "f21b68",
            "timestamp": int(time.time() * 1000),
            "location": location,
            "message": message,
            "data": data or {},
            "hypothesisId": hypothesis_id,
        }
        with _DEBUG_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except OSError:
        pass
    # #endregion
