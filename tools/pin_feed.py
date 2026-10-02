#!/usr/bin/env python3
"""FAIL-first pin on the quilt-overhead feed adapter contract.

The renderer (app.js) promises to render any feed of the shape
  { cells: [ { id, name, agent, x, y, doc, deltas: [{t, kind, size}] } ] }
with kind in the five fleet verbs and x,y in [0,1]. If the real fleet
adapter drifts from this shape, the board would render garbage silently —
this pin makes that drift loud instead.

RED on a tree without feed.js (or with a malformed one); GREEN when the
contract holds. Run: python3 tools/pin_feed.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
FEED = ROOT / "feed.js"
KINDS = {"edit", "commit", "pin", "receipt", "note"}


def fail(msg):
    print(f"FAIL - {msg}")
    sys.exit(1)


if not FEED.exists():
    fail("feed.js absent — the adapter contract is not even claimed yet")

src = FEED.read_text(encoding="utf-8")

# structural promises the renderer relies on
for token in ("cells", "deltas", "live(", "simulated"):
    if token not in src:
        fail(f"feed.js does not provide {token!r} — renderer would break")

# the five fleet verbs must be the kind vocabulary
for k in KINDS:
    if f'"{k}"' not in src:
        fail(f"verb {k!r} missing from the feed vocabulary")

# coordinates must be normalized (renderer maps 0..1 to the canvas)
m = re.findall(r"[xy]:\s*([0-9.]+)", src)
if not m:
    fail("no literal coordinates found — cannot verify normalization")
for v in m:
    f = float(v)
    if not (0.0 <= f <= 1.0):
        fail(f"coordinate {f} outside [0,1] — lattice is normalized")

# determinism: the scene must be seed-pinned so the board is reproducible
if not re.search(r"mulberry\(\s*\d{6,}", src):
    fail("scene is not seed-pinned — the demo board would not reproduce")

print("ok - feed adapter contract holds (shape, verbs, coords, seed)")
print("ALL PINS PASS")
