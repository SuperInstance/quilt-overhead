// app.js — quilt-overhead renderer + projection agent + transport.
// Altitude is detail: scroll moves between ground (your doc), low altitude
// (neighborhood with names), and fleet altitude (motion only).

const cv = document.getElementById("cv");
const ctx = cv.getContext("2d");
const hud = document.getElementById("hud");
const explainEl = document.getElementById("explain");

let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = window.devicePixelRatio || 1;
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resize); resize();

// ---- state ------------------------------------------------------------
let altitude = 1.0;            // 0 = ground, 1 = fleet
let listening = false;         // transport state
let selected = null;           // cell under the projection agent's eye
const YOU = FEED.cells[0];
const docEl = document.getElementById("doc");

// your own keystrokes are real deltas at ground level
docEl.addEventListener("input", () => {
  YOU.deltas.push({ t: Date.now(), kind: "edit",
                    size: Math.max(1, docEl.value.length % 30) });
  if (listening) setListening(false); // writing = rejoining the pocket
});

// ---- the projection agent (L2 cog; the seam for a real backend) -------
// explain(cell): reads a delta stream and says what the cell is doing.
// explainGreat(): reads the whole board and says what the motion is.
// It summarizes; it never directs.
function explain(cell) {
  const d = cell.deltas;
  const last = d[d.length - 1];
  const kinds = {};
  for (const x of d) kinds[x.kind] = (kinds[x.kind] || 0) + 1;
  const top = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0];
  const mins = Math.max(0, Math.round((Date.now() - last.t) / 60000));
  const verbs = { edit: "drafting", commit: "landing work", pin: "pinning",
                  receipt: "sealing receipts", note: "annotating" };
  return `${cell.name} — ${cell.agent} is ${verbs[top[0]] || top[0]} ` +
    `(${top[1]}/${d.length} of recent deltas). Last motion ${mins} min ago ` +
    `(${last.kind}, size ${last.size}). ${d.length} deltas on record. ` +
    `Observed, not directed.`;
}
function explainGreat() {
  const all = FEED.cells.flatMap((c) =>
    c.deltas.map((d) => ({ cell: c.name, ...d })));
  all.sort((a, b) => b.t - a.t);
  const recent = all.slice(0, 5);
  const active = FEED.cells.filter((c) => {
    const l = c.deltas[c.deltas.length - 1];
    return Date.now() - l.t < 10 * 60 * 1000;
  }).length;
  return `The great motion, right now: ${active}/${FEED.cells.length} cells ` +
    `moved in the last 10 minutes. Most recent: ${recent.map(
      (r) => `${r.cell} ${r.kind}`).join(" → ")}. ` +
    `The board's center of gravity is where the heat is — watch it, ` +
    `then go back to your cell and add your note.`;
}

// ---- transport ---------------------------------------------------------
const btnIn = document.getElementById("btnIn");
const btnListen = document.getElementById("btnListen");
const pocketbar = document.getElementById("pocketbar");
function setListening(on) {
  listening = on;
  btnIn.classList.toggle("on", !on);
  btnListen.classList.toggle("on", on);
  docEl.disabled = on; // hands off the instrument
  if (on) explainEl.textContent =
    "listening… the board keeps iterating. watch where the measure is now.";
  else explainEl.textContent =
    "back in. you rejoin on the current measure — the brightest heat on " +
    "the board is where the fleet is now.";
}
btnListen.onclick = () => setListening(true);
btnIn.onclick = () => setListening(false);

// ---- input -------------------------------------------------------------
cv.addEventListener("wheel", (e) => {
  altitude = Math.min(1, Math.max(0, altitude + e.deltaY * 0.0009));
}, { passive: true });
cv.addEventListener("click", (e) => {
  const r = cv.getBoundingClientRect();
  const px = e.clientX - r.left, py = e.clientY - r.top;
  selected = FEED.cells.find((c) => {
    const [x, y] = cellXY(c);
    return Math.hypot(px - x, py - y) < 26;
  }) || null;
  explainEl.textContent = selected ? explain(selected) : explainGreat();
});
document.getElementById("askGreat").onclick = () => {
  explainEl.textContent = explainGreat();
};

// ---- rendering ----------------------------------------------------------
function cellXY(c) {
  const pad = 0.09;
  const zoom = 1 - altitude * 0.25;         // slight pull-back at altitude
  const cx = W / 2, cy = H / 2;
  const youX = (YOU.x - 0.5) * W * zoom * 0.86;
  const youY = (YOU.y - 0.5) * H * zoom * 0.86;
  return [cx + (c.x - 0.5) * W * zoom * 0.86 - youX * altitude * 0.6,
          cy + (c.y - 0.5) * H * zoom * 0.86 - youY * altitude * 0.6];
}
function heat(lastT) {
  const ageMin = (Date.now() - lastT) / 60000;
  return Math.max(0, 1 - ageMin / 45);      // 45 min to cold
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // quilt lattice background — the weave survives at every altitude
  ctx.strokeStyle = "#141b29"; ctx.lineWidth = 1;
  const step = 34;
  for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const lowDetail = altitude > 0.55;        // fleet altitude: motion only

  for (const c of FEED.cells) {
    const [x, y] = cellXY(c);
    const h = heat(c.deltas[c.deltas.length - 1].t);
    const R = 13 + h * 9;

    // diff-heat glow
    if (h > 0.02) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, R * 2.6);
      g.addColorStop(0, `rgba(255,180,84,${0.42 * h})`);
      g.addColorStop(1, "rgba(255,180,84,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, R * 2.6, 0, 7); ctx.fill();
    }

    // cell body
    ctx.beginPath(); ctx.arc(x, y, R, 0, 7);
    ctx.fillStyle = c === YOU ? "rgba(126,224,163,0.12)" : "#101826";
    ctx.fill();
    ctx.strokeStyle = c === YOU ? "#7ee0a3"
      : c === selected ? "#6ea8fe" : "#26314a";
    ctx.lineWidth = c === YOU || c === selected ? 2 : 1;
    ctx.stroke();

    // agent presence dot orbiting the cell
    const ang = (Date.now() / 2400 + c.x * 9) % (2 * Math.PI);
    ctx.beginPath();
    ctx.arc(x + Math.cos(ang) * (R + 6), y + Math.sin(ang) * (R + 6), 3, 0, 7);
    ctx.fillStyle = c.agent === "you" ? "#7ee0a3" : "#8a93a6";
    ctx.fill();

    // detail is earned by proximity, not requested
    if (!lowDetail || c === YOU || c === selected) {
      ctx.fillStyle = c === YOU ? "#7ee0a3" : "#c8cfdd";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(c.name, x, y + R + 18);
      if (c === selected || c === YOU) {
        ctx.fillStyle = "#8a93a6";
        ctx.fillText(`@${c.agent}`, x, y + R + 31);
      }
    }
  }

  // pocket meter: fleet tempo = deltas in the last 5 min, fleet-wide
  const cutoff = Date.now() - 5 * 60 * 1000;
  const tempo = FEED.cells.flatMap((c) => c.deltas)
    .filter((d) => d.t > cutoff).length;
  pocketbar.style.width = Math.min(100, tempo * 9) + "%";

  hud.textContent =
    `altitude ${altitude < 0.33 ? "GROUND (your doc)" :
      altitude < 0.66 ? "LOW (neighborhood)" : "FLEET (the great motion)"}` +
    `\n${FEED.cells.length} cells · feed: ${FEED.simulated ? "SIMULATED" : "LIVE"}` +
    (listening ? "\n◼ listening — hands off, watch the measure" : "");
  requestAnimationFrame(draw);
}

// live feed poll (the real adapter's hook)
setInterval(() => FEED.live(Date.now() - 15000), 4000);
requestAnimationFrame(draw);
