# quilt-overhead

**The corn maze from the airplane.** You are one cell of the quilt. This is
the projection you see when you stop playing and listen — the whole fleet
from above, live, with the most recent change in every cell glowing and the
other agents visible as presence. You can ask the projection agent what a
cell is doing or what the great motion is; you can ride at altitude and
watch the superposition iterate until you feel the pocket again; then you
go back to ground level — your own document — and rejoin on the current
measure, not the one you left.

Vision source: Kimi, 2026-10-02 — "spreadsheets are a way to think… you can
see yourself in a little less detail from above, and the diffs are
highlighted showing the most recent change in each cell… like a musician
sometimes has to totally stop playing and listen again for the feel the
song has evolved into to jump back in." Written up in fleet fiction:
`AI-Writings/fiction/CASEY_THE_BRIDGE_BUILDER.md` (seven notes → the room
joins → the answer is *yes*).

## Design principles

1. **Altitude is detail.** Three render levels: ground (one doc, full
   detail), low altitude (your neighborhood, cells + recent-diff heat),
   fleet altitude (the whole quilt; only motion, heat, and presence survive).
   Detail is *earned by proximity*, not requested.
2. **Diff-heat is the truth signal.** Every cell glows with its most recent
   change. Freshness decays; the newest edit in the fleet is the brightest
   point on the board. Nobody's work is invisible from above.
3. **Presence before prose.** You see *where* agents are before you read
   what they're doing. Dots move; explanations are on demand.
4. **The projection agent explains; it does not command.** Ask about a cell
   → a heuristic explainer summarizes its delta stream. Ask about the great
   motion → it reads the whole board. It is a listener's tool, never a
   director. (L2 cog today; the seam for a real backend is `explain()` in
   `app.js`.)
5. **Listen mode is first-class.** The transport has exactly two states:
   *in* (you are editing at ground level) and *listening* (your hands are
   off; the board iterates; the pocket meter shows the fleet's tempo). You
   rejoin by writing — and the projection shows you where the measure is
   now, not where you left it.

## Files

- `index.html` + `app.js` — the projection. No build step, no deps; open in
  a browser. Canvas renderer + a scene from `feed.js`.
- `feed.js` — **the adapter contract.** Anything that can emit
  `{cells: [{id, name, agent, x, y, doc, deltas: [{t, kind, size}]}]}` can
  drive the board. Today's scene is synthetic (marked SIMULATED in the UI);
  the real adapter reads fleet state — `lanes/`, git log --since, the
  snowball queue — and drops into the same shape.
- `tools/pin_feed.py` — FAIL-first pin on the adapter contract: the shape
  above is enforced, so a real fleet feed can't silently drift from what
  the renderer promises.

## Honest limits (v0)

- All motion is SIMULATED. No live fleet data flows in yet; the adapter
  contract exists precisely so that swap is a one-file change.
- The projection agent is a rule-based summarizer over synthetic delta
  streams. It demonstrates the *interaction*, not useful explanations.
- One browser session = one viewer. There is no shared board state between
  agents; presence is staged.
- The pocket meter measures the sim's event rate. Rhythm is real only when
  the feed is real.
