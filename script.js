const spans = [
  { key: "Control", label: "Span of Control", left: "Few", right: "Many" },
  { key: "Accountability", label: "Span of Accountability", left: "Few trade-offs", right: "Many trade-offs" },
  { key: "Influence", label: "Span of Influence", left: "Within unit", right: "Across units" },
  { key: "Support", label: "Span of Support", left: "No help", right: "Willing to help" },
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
const statusText = el("statusText");
const svg = el("spansSvg");

const W = 920;
const H = 280;

const margin = { top: 26, right: 26, bottom: 18, left: 210 };
const axisW = W - margin.left - margin.right;

const rowH = 58;
const firstRowY = 52;

function xForValue(v) {
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
  // Vertical grid 1..10
  for (let i = 1; i <= 10; i++) {
    const x = xForValue(i);
    addSvg("line", {
      x1: x, y1: margin.top,
      x2: x, y2: H - margin.bottom,
      stroke: "rgba(15,23,42,.08)",
      "stroke-width": 1
    });
    addSvg("text", {
      x, y: 16,
      fill: "rgba(15,23,42,.55)",
      "font-size": 12,
      "text-anchor": "middle",
      "font-family": "ui-sans-serif, system-ui",
    }).textContent = i;
  }

  // Rows + labels
  spans.forEach((s, idx) => {
    const y = yForRow(idx);

    addSvg("line", {
      x1: margin.left, y1: y,
      x2: W - margin.right, y2: y,
      stroke: "rgba(15,23,42,.14)",
      "stroke-width": 1
    });

    addSvg("text", {
      x: 14,
      y: y + 4,
      fill: "rgba(15,23,42,.92)",
      "font-size": 13,
      "text-anchor": "start",
      "font-family": "ui-sans-serif, system-ui",
    }).textContent = s.label;

    addSvg("text", {
      x: margin.left,
      y: y + 22,
      fill: "rgba(107,114,128,.92)",
      "font-size": 11,
      "text-anchor": "start",
      "font-family": "ui-sans-serif, system-ui",
    }).textContent = s.left;

    addSvg("text", {
      x: W - margin.right,
      y: y + 22,
      fill: "rgba(107,114,128,.92)",
      "font-size": 11,
      "text-anchor": "end",
      "font-family": "ui-sans-serif, system-ui",
    }).textContent = s.right;
  });
}

function drawZigzag(vals) {
  const points = spans.map((s, idx) => {
    return { x: xForValue(vals[s.key]), y: yForRow(idx) };
  });

  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  addSvg("path", {
    d,
    fill: "none",
    stroke: "rgba(15,23,42,.85)",
    "stroke-width": 1.2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });

  for (const p of points) {
    addSvg("circle", { cx: p.x, cy: p.y, r: 5, fill: "rgba(15,23,42,.92)" });
    addSvg("circle", { cx: p.x, cy: p.y, r: 10, fill: "rgba(15,23,42,.10)" });
  }
}

function drawGapArrow(vals) {
  // Gap = Accountability - Control, show as horizontal arrow between their positions
  const y = 34; // under the scale numbers
  const xC = xForValue(vals.Control);
  const xA = xForValue(vals.Accountability);

  const left = Math.min(xC, xA);
  const right = Math.max(xC, xA);

  // marker arrowhead
  const defs = addSvg("defs");
  const marker = addSvg("marker", {
    id: "arrowHead",
    markerWidth: "10",
    markerHeight: "10",
    refX: "9",
    refY: "3",
    orient: "auto",
    markerUnits: "strokeWidth"
  }, defs);

  addSvg("path", { d: "M0,0 L10,3 L0,6 Z", fill: "rgba(15,23,42,.75)" }, marker);

  addSvg("line", {
    x1: left, y1: y,
    x2: right, y2: y,
    stroke: "rgba(15,23,42,.75)",
    "stroke-width": 2,
    "marker-end": "url(#arrowHead)"
  });

  addSvg("text", {
    x: (left + right) / 2,
    y: y - 8,
    fill: "rgba(15,23,42,.75)",
    "font-size": 12,
    "text-anchor": "middle",
    "font-family": "ui-sans-serif, system-ui",
  }).textContent = "Entrepreneurial Gap";
}

function setTopUI(vals) {
  for (const s of spans) valueEls[s.key].textContent = String(vals[s.key]);

  const gap = vals.Accountability - vals.Control;
  gapValue.textContent = (gap >= 0 ? `+${gap}` : `${gap}`);

  // Simple “balanced” heuristic for the demo (not a real model)
  const demand = vals.Accountability + vals.Influence;
  const supply = vals.Control + vals.Support;
  const delta = supply - demand;

  if (delta >= 2) {
    statusText.textContent = "This job is balanced.";
    statusText.style.background = "#ecfeff";
    statusText.style.color = "#0f766e";
  } else if (delta <= -2) {
    statusText.textContent = "This job is overloaded.";
    statusText.style.background = "#fef2f2";
    statusText.style.color = "#b91c1c";
  } else {
    statusText.textContent = "This job is near balance.";
    statusText.style.background = "#fffbeb";
    statusText.style.color = "#b45309";
  }

  // Gap color cue
  if (gap >= 3) gapValue.style.color = "var(--warn)";
  else if (gap <= 0) gapValue.style.color = "var(--ok)";
  else gapValue.style.color = "var(--text)";
}

function render() {
  const vals = readValues();
  setTopUI(vals);

  clearSvg();
  drawBase();
  drawGapArrow(vals);
  drawZigzag(vals);
}

Object.values(inputs).forEach((inp) => inp.addEventListener("input", render));
render();
