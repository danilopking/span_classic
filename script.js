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
 * Get center point of a slider thumb relative to spans container.
 * We use the input element box + value percent.
 * This is stable enough for demo purposes across browsers.
 */
function sliderPoint(key){
  const input = sliders[key];
  const rect = input.getBoundingClientRect();
  const host = spansEl.getBoundingClientRect();

  const min = parseInt(input.min,10);
  const max = parseInt(input.max,10);
  const v = val(key);
  const t = (v - min) / (max - min);

  // Track runs full width of input element; thumb center approximated by t * width
  const x = (rect.left - host.left) + t * rect.width;

  // y = vertically center of the input element (track)
  const y = (rect.top - host.top) + rect.height / 2;

  return { x, y };
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

  const points = [p1,p2,p3,p4];

  // Dotted polyline
  svgEl("polyline", {
    points: points.map(p => `${p.x},${p.y}`).join(" "),
    fill: "none",
    stroke: "rgba(17,24,39,.85)",
    "stroke-width": 3,
    "stroke-dasharray": "3 5",
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

  // In the screenshot, arrow is aligned with the slider track area (not full width).
  // We'll compute left/right using the same sliderPoint() but projected into gapSvg width.
  const host = spansEl.getBoundingClientRect();
  const gapHost = gapSvg.getBoundingClientRect();

  // points in spans coords
  const c = sliderPoint("control");
  const a = sliderPoint("accountability");

  // Map spans x to gapSvg x
  // gapSvg sits under the tracks column, so use its bounding box mapping.
  const xC = ((c.x + host.left) - gapHost.left) ; // approximate px in gapSvg space
  const xA = ((a.x + host.left) - gapHost.left) ;

  const left = Math.min(xC, xA);
  const right = Math.max(xC, xA);
  const midY = h * 0.58;

  // Arrowhead marker
  const defs = svgEl("defs", {}, gapSvg);
  const marker = svgEl("marker", {
    id: "arrowHead",
    markerWidth: 12,
    markerHeight: 12,
    refX: 10,
    refY: 6,
    orient: "auto"
  }, defs);

  svgEl("path", { d: "M0,0 L12,6 L0,12 Z", fill: "rgba(127,29,29,.95)" }, marker);

  // Line + arrow
  svgEl("line", {
    x1: left,
    y1: midY,
    x2: right,
    y2: midY,
    stroke: "rgba(127,29,29,.95)",
    "stroke-width": 6,
    "marker-end": "url(#arrowHead)"
  }, gapSvg);

  // Left “tail” triangle like screenshot (optional, but nice)
  svgEl("path", {
    d: `M ${left} ${midY} L ${left + 18} ${midY - 10} L ${left + 18} ${midY + 10} Z`,
    fill: "rgba(127,29,29,.95)"
  }, gapSvg);

  svgEl("text", {
    x: (left + right) / 2,
    y: midY + 26,
    fill: "rgba(127,29,29,.95)",
    "font-size": 20,
    "text-anchor": "middle",
    "font-family": "ui-sans-serif, system-ui"
  }, gapSvg).textContent = "Entrepreneurial Gap";
}

function renderStatus(){
  // Minimal “balanced” heuristic for demo.
  const demand = val("accountability") + val("influence");
  const supply = val("control") + val("support");
  const delta = supply - demand;

  if (delta >= -1 && delta <= 1) statusText.textContent = "This job is balanced.";
  else if (delta < -1) statusText.textContent = "This job is overloaded.";
  else statusText.textContent = "This job has excess capacity.";
}

function render(){
  setBoxes();
  renderStatus();
  renderOverlayLine();
  renderGapArrow();
}

Object.values(sliders).forEach(inp => inp.addEventListener("input", render));

// Re-render on resize (important for “not crooked”)
new ResizeObserver(() => render()).observe(panel);

render();
