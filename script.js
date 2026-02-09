const spans = [
  { key: "Control", label: "Span of Control" },
  { key: "Accountability", label: "Span of Accountability" },
  { key: "Influence", label: "Span of Influence" },
  { key: "Support", label: "Span of Support" },
];

const el = (id) => document.getElementById(id);

const inputs = {
  Control: el("sControl"),
  Accountability: el("sAccountability"),
  Influence: el("sInfluence"),
  Support: el("sSupport"),
};

const valueEls = {
  Control: el("vControl"),
  Accountability: el("vAccountability"),
  Influence: el("vInfluence"),
  Support: el("vSupport"),
};

const gapValue = el("gapValue");
const gapHint = el("gapHint");
const balanceValue = el("balanceValue");

const svg = el("spansSvg");

const W = 920;
const H = 320;

const margin = { top: 32, right: 26, bottom: 26, left: 220 };
const axisW = W - margin.left - margin.right;

const rowH = 62;
const firstRowY = 70;

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function xForValue(v) {
  // values are 1..10
  const t = (v - 1) / 9;
  return margin.left + t * axisW;
}

function yForRow(i) {
  return firstRowY + i * rowH;
}

function readValues() {
  const v = {};
  for (const s of spans) v[s.key] = parseInt(inputs[s.key].value, 10);
  return v;
}

function setLabels(vals) {
  for (const s of spans) valueEls[s.key].textContent = String(vals[s.key]);

  const gap = vals.Accountability - vals.Control;
  gapValue.textContent = gap >= 0 ? `+${gap}` : `${gap}`;
  gapHint.textContent = "Accountability − Control";

  // Basic heuristic balance indicator:
  // demand = accountability + influence
  // supply = control + support
  const demand = vals.Accountability + vals.Influence;
  const supply = vals.Control + vals.Support;
  const delta = supply - demand;

  if (delta >= 2) {
    balanceValue.textContent = "Supply ≥ Demand";
    balanceValue.style.color = "var(--ok)";
  } else if (delta <= -2) {
    balanceValue.textContent = "Demand > Supply";
    balanceValue.style.color = "var(--bad)";
  } else {
    balanceValue.textContent = "Near balance";
    balanceValue.style.color = "var(--warn)";
  }

  // Color hint for gap (classic “entrepreneurial gap”)
  if (gap >= 3) gapValue.style.color = "var(--warn)";
  else if (gap <= 0) gapValue.style.color = "var(--ok)";
  else gapValue.style.color = "var(--text)";
}

function clearSvg() {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

function addSvg(tag, attrs = {}, parent = svg) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  parent.appendChild(n);
  return n;
}

function drawBase() {
  // Background guides
  addSvg("rect", { x: 0, y: 0, width: W, height: H, fill: "rgba(0,0,0,0)" });

  // Column labels (1..10)
  for (let i = 1; i <= 10; i++) {
    const x = xForValue(i);
    addSvg("line", {
      x1: x, y1: margin.top,
      x2: x, y2: H - margin.bottom,
      stroke: "rgba(255,255,255,.06)",
      "stroke-width": 1
    });
    addSvg("text", {
      x, y: 22,
      fill: "rgba(255,255,255,.55)",
      "font-size": 12,
      "text-anchor": "middle",
      "font-family": "ui-sans-serif, system-ui",
    }).textContent = i;
  }

  // Rows
  spans.forEach((s, idx) => {
    const y = yForRow(idx);

    // row separator
    addSvg("line", {
      x1: margin.left, y1: y,
      x2: W - margin.right, y2: y,
      stroke: "rgba(255,255,255,.10)",
      "stroke-width": 1
    });

    // left label
    addSvg("text", {
      x: 16,
      y: y + 4,
      fill: "rgba(231,238,252,.92)",
      "font-size": 13,
      "text-anchor": "start",
      "font-family": "ui-sans-serif, system-ui",
    }).textContent = s.label;

    // subtle sublabel (left)
    const leftHint = {
      Control: "Few resources",
      Accountability: "Few trade-offs",
      Influence: "Within unit",
      Support: "No help",
    }[s.key];

    const rightHint = {
      Control: "Many resources",
      Accountability: "Many trade-offs",
      Influence: "Across units",
      Support: "Willing to help",
    }[s.key];

    addSvg("text", {
      x: margin.left,
      y: y + 24,
      fill: "rgba(147,160,179,.85)",
      "font-size": 11,
      "text-anchor": "start",
      "font-family": "ui-sans-serif, system-ui",
    }).textContent = leftHint;

    addSvg("text", {
      x: W - margin.right,
      y: y + 24,
      fill: "rgba(147,160,179,.85)",
      "font-size": 11,
      "text-anchor": "end",
      "font-family": "ui-sans-serif, system-ui",
    }).textContent = rightHint;
  });

  // Top axis line
  addSvg("line", {
    x1: margin.left, y1: margin.top,
    x2: W - margin.right, y2: margin.top,
    stroke: "rgba(255,255,255,.10)",
    "stroke-width": 1
  });
}

function drawData(vals) {
  const points = spans.map((s, idx) => {
    const x = xForValue(vals[s.key]);
    const y = yForRow(idx);
    return { x, y };
  });

  // Zigzag line (thin, crisp)
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  addSvg("path", {
    d,
    fill: "none",
    stroke: "rgba(231,238,252,.92)",
    "stroke-width": 1.25,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });

  // Points
  for (const p of points) {
    addSvg("circle", {
      cx: p.x, cy: p.y,
      r: 5,
      fill: "rgba(231,238,252,.96)"
    });
    addSvg("circle", {
      cx: p.x, cy: p.y,
      r: 10,
      fill: "rgba(231,238,252,.10)"
    });
  }
}

function render() {
  const vals = readValues();
  setLabels(vals);
  clearSvg();
  drawBase();
  drawData(vals);
}

for (const s of spans) {
  inputs[s.key].addEventListener("input", render);
}

render();
