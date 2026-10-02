// feed.js — the adapter contract for quilt-overhead.
// Any producer that emits this shape can drive the board:
//   { cells: [ { id, name, agent, x, y, doc,
//                deltas: [ { t, kind, size } ] } ] }
// kind ∈ {"edit","commit","pin","receipt","note"} — the five fleet verbs.
// x,y are lattice coordinates (0..1 floats). deltas must be time-ordered.
//
// TODAY: a synthetic scene, marked SIMULATED in the UI. The real adapter
// (lanes/ + git log --since + the snowball queue) drops into the same shape.

const FEED = (() => {
  const kinds = ["edit", "commit", "pin", "receipt", "note"];
  const agents = ["snowball", "pulse", "guardian", "scout-e", "mavis"];
  const names = [
    "git-agent", "quilt-in-git", "doubt-ledger", "frozen-clock",
    "cf-native-backend", "quilt-adjudication", "pong-quilt",
    "AI-Writings", "wardroom", "qcells-lab", "micro-moth", "tidepool",
  ];

  function mulberry(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Deterministic scene: seed 20261002 reproduces this exact board.
  const rng = mulberry(20261002);
  const cells = names.map((name, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const deltas = [];
    let t = Date.now() - 1000 * 60 * 60 * (1 + rng() * 20); // 1–21h ago
    const n = 3 + Math.floor(rng() * 9);
    for (let k = 0; k < n; k++) {
      deltas.push({
        t: (t += 1000 * 60 * (2 + rng() * 40)),
        kind: kinds[Math.floor(rng() * kinds.length)],
        size: 1 + Math.floor(rng() * 24),
      });
    }
    return {
      id: `cell-${i}`,
      name,
      agent: agents[Math.floor(rng() * agents.length)],
      x: 0.12 + col * 0.24 + (rng() - 0.5) * 0.06,
      y: 0.16 + row * 0.24 + (rng() - 0.5) * 0.06,
      doc: `# ${name}\n(state synthesized for the demo board)`,
      deltas,
    };
  });

  // Cell 0 is YOU: snowball's cell at ground level. Its doc is the textarea.
  cells[0].agent = "you";

  return {
    simulated: true,
    cells,
    // live(): returns fresh events since `after` (ms epoch) — the real
    // adapter polls fleet state here. The sim fabricates a heartbeat event
    // so the board always breathes.
    live(after) {
      const now = Date.now();
      const out = [];
      for (const c of this.cells) {
        if (c.agent === "you") continue;
        if (rng() < 0.35) {
          const d = {
            t: now,
            kind: kinds[Math.floor(rng() * kinds.length)],
            size: 1 + Math.floor(rng() * 12),
          };
          c.deltas.push(d);
          out.push({ cell: c.id, delta: d });
        }
      }
      return out;
    },
  };
})();
