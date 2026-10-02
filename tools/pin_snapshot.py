#!/usr/bin/env python3
"""FAIL-first pin: a REAL cross-repo feed snapshot must satisfy the same
contract the renderer promises (feed.js) — and must say where it came
from. Simulated feeds prove the renderer; real feeds prove the WIRING.
If the producer (backward-holdem wal2feed) drifts from feed.v1, this pin
goes RED in the CONSUMER's repo — that is the dance of growth: both
sides carry a conformance pin, so drift is loud at whichever end it
happens.

Run: python3 tools/pin_snapshot.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
SNAP = ROOT / "feeds" / "real-wal-feed.json"
KINDS = {"edit", "commit", "pin", "receipt", "note"}

def fail(msg):
    print(f"FAIL - {msg}")
    sys.exit(1)

if not SNAP.exists():
    fail("no real feed snapshot — the mesh is renderer-only, nothing wired")

snap = json.loads(SNAP.read_text(encoding="utf-8"))
cells = snap.get("cells")
if not isinstance(cells, list) or not cells:
    fail("snapshot has no cells")

for i, c in enumerate(cells):
    for f in ("id", "name", "agent", "x", "y", "doc", "deltas"):
        if f not in c:
            fail(f"cell[{i}] missing {f!r}")
    if not (0.0 <= float(c["x"]) <= 1.0 and 0.0 <= float(c["y"]) <= 1.0):
        fail(f"cell[{i}] x,y outside [0,1]")
    ts = [d.get("t") for d in c["deltas"]]
    if ts != sorted(ts):
        fail(f"cell[{i}] deltas out of order")
    for d in c["deltas"]:
        if d.get("kind") not in KINDS:
            fail(f"cell[{i}] delta kind {d.get('kind')!r} not a fleet verb")

meta = snap.get("meta", {})
if not meta.get("wal_ref"):
    fail("real feed carries no wal_ref — unwitnessed deltas")
if "REAL" not in str(meta.get("tag", "")):
    fail("snapshot not tagged REAL")
src = str(meta.get("source", ""))
if "/" not in src:
    fail("snapshot names no source repo")

print(f"GREEN - real feed wired: {len(cells)} cells, "
      f"{sum(len(c['deltas']) for c in cells)} deltas, "
      f"source {src}, wal_ref {meta.get('wal_ref')}")
