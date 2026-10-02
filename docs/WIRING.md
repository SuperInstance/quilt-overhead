# WIRING — real feeds across repos

This board renders simulated feeds by default (seed-pinned, tagged
SIMULATED). The real mesh starts here.

## Edge: backward-holdem -> quilt-overhead (feed.v1) — WIRED

Producer: `SuperInstance/backward-holdem` — `tools/wal2feed.py` converts a
tournament receipt WAL (`receipts/wal.jsonl`, fnv1a-chained ticks) into
this repo's feed dialect.

Consumer: `feeds/real-wal-feed.json` — generated from the sealed sample
run: seed 20261002, 120 hands, 1235 ticks, wal_ref
`0809402a13c37d70`. Tagged REAL. 5 cells (the table + 4 seats), 2297
deltas.

Conformance pins on BOTH ends (the dance of growth: drift is loud at
whichever end it happens):
- producer: `backward-holdem/tools/pin_wal2feed.py` (W1-W9; RED captured
  on W4 lattice coords before fix)
- consumer: `tools/pin_snapshot.py` (RED on empty feeds/, GREEN on the
  real snapshot; validates contract + wal_ref + REAL tag + named source)

Regenerate after any new tournament:
```
python3 <backward-holdem>/tools/wal2feed.py <wal> feeds/real-wal-feed.json
python3 tools/pin_snapshot.py
```

Declared next edges (PENDING in quilt-tools REFERRAL_GRAPH):
- quilt-in-git w3a git-notes receipts -> feed.v1 (the natural witness
  stream; replaces WAL-sourced snapshots for git-native work)
- doubt-ledger qmr1 export dialect -> any consumer (PR #4 open)
