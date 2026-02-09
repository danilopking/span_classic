const panel = document.getElementById("panel");
const spansEl = document.getElementById("spans");
const overlaySvg = document.getElementById("overlaySvg");
const gapSvg = document.getElementById("gapSvg");

const sliders = {
  control: document.getElementById("s-control"),
  accountability: document.getElementById("s-accountability"),
  influence: document.getElementById("s-influence"),
  support: document.getElementById("s-support"),
};

const boxes = {
  control: document.getElementById("box-control"),
  accountability: document.getElementById("box-accountability"),
  influence: document.getElementById("box-influence"),
  support: document.getElementById("box-support"),
};

const statusEl = document.getElementById("status");
const statusText = document.getElementById("statusText");

function val(key){ return parseInt(sliders[key].value, 10); }

function setBoxes(){
  for (const k of Object.keys(boxes)) boxes[k].textContent = String(val(k));
}

function clear(node){
  while(node.firstChild) node.removeChild(node.firstChild);
}

function svgEl(tag, attrs, parent){
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k,v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  parent.appendChild(el);
  return el;
}

/**
 * Point for overlay line: approximate thumb center relative to spans container.
 * Stable enough for demo video. (If you want pixel-perfect, we can build custom sliders.)
 */
function sliderPoint(key){
  const input = sliders[key];
  const rect = input.getBoundingClientRect();
  const host = spansEl.getBoundingClientRect();

  const min = parseInt(input.min,10);
  const max = parseInt(input.max,10);
  const v = val(key);
  const t = (v - min) / (max - min);

  const x = (rect.left - host.left) + t * rect.width;
  const y = (rect.top - host.top) + rect.height / 2;

  return { x, y };
}

// helper: range value -> x in a container width (used for gap arrow)
function xFromRange(input, width){
  const min = parseInt(input.min,10);
  const max = parseInt(input.max,10);
  const v = parseInt(input.value,10);
  const t = (v - min) / (max - min);
  return t * width;
}

function renderOverlayLine(){
  const host = spansEl.getBoundingClientRect();
  overlaySvg.setAttribute("viewBox", `0 0 ${host.width} ${host.height}`);
  overlaySvg.setAttribute("preserveAspectRatio", "none");

  clear(overlaySvg);

  const p1 = sliderPoint("control");
  const p2 = sliderPoint("accountability");
  const p3 = sliderPoint("influence");
  const p4 = sliderPoint("support");

  svgEl("polyline", {
    points: [p1,p2,p3,p4].map(p => `${p.x},${p.y}`).join(" "),
    fill: "none",
    stroke: "rgba(17,24,39,.75)",
    "stroke-width": 2,
    "stroke-dasharray": "2 5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }, overlaySvg);
}

function renderGapArrow(){
  const w = gapSvg.clientWidth;
  const h = gapSvg.clientHeight;

  gapSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  gapSvg.setAttribute("preserveAspectRatio", "none");
  clear(gapSvg);

  // Robust and straight: use % position on the scale, not DOM px mapping.
  const xC = xFromRange(sliders.control, w);
  const xA = xFromRange(sliders.accountability, w);

  const left = Math.min(xC, xA);
  const right = Math.max(xC, xA);

  const y = h * 0.50;

  const stroke = "rgba(15,23,42,.45)";
  const fill = "rgba(15,23,42,.45)";

  const head = 14;
  const half = 7;

  // main line
  svgEl("line", {
    x1: left + head,
    y1: y,
    x2: right - head,
    y2: y,
    stroke,
    "stroke-width": 3,
    "stroke-linecap": "round",
  }, gapSvg);

  // left head
  svgEl("path", {
    d: `M ${left + head} ${y - half} L ${left} ${y} L ${left + head} ${y + half} Z`,
    fill
  }, gapSvg);

  // right head
  svgEl("path", {
    d: `M ${right - head} ${y - half} L ${right} ${y} L ${right - head} ${y + half} Z`,
    fill
  }, gapSvg);

  // label
  svgEl("text", {
    x: (left + right) / 2,
    y: y + 26,
    fill: "rgba(15,23,42,.55)",
    "font-size": 18,
    "text-anchor": "middle",
    "font-family": "ui-sans-serif, system-ui"
  }, gapSvg).textContent = "Entrepreneurial Gap";
}

function renderStatus(){
  const demand = val("accountability") + val("influence");
  const supply = val("control") + val("support");
  const delta = supply - demand;

  statusEl.classList.remove("ok","warn","bad");

  if (delta >= -1 && delta <= 1) {
    statusText.textContent = "This job is balanced.";
    statusEl.classList.add("ok");
  } else if (delta < -1) {
    statusText.textContent = "This job is overloaded.";
    statusEl.classList.add("bad");
  } else {
    statusText.textContent = "This job has excess capacity.";
    statusEl.classList.add("warn");
  }
}

function render(){
  setBoxes();
  renderStatus();
  renderOverlayLine();
  renderGapArrow();
}

Object.values(sliders).forEach(inp => inp.addEventListener("input", render));
new ResizeObserver(() => render()).observe(panel);

render();
