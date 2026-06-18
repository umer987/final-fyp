#!/usr/bin/env python3
"""POST /ask to a running NLP service."""
import json
import sys
import time

import httpx

question = sys.argv[1] if len(sys.argv) > 1 else "چوری کی سزا کیا ہے؟"
url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8001/ask"

t0 = time.perf_counter()
try:
    r = httpx.post(url, json={"question": question, "language": "urdu"}, timeout=240.0)
    elapsed = time.perf_counter() - t0
    print(f"status={r.status_code} elapsed_s={elapsed:.1f}")
    print(r.text[:2000])
except Exception as exc:
    print(f"FAILED after {time.perf_counter() - t0:.1f}s: {exc}")
