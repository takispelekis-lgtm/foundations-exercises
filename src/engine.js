/* ============================================================
   Engine for interactive foundation-engineering exercises
   (shared by the bearing-capacity, settlement and pile apps)
   ============================================================ */
'use strict';

/* ---------- numbers ---------- */
function fmt(x, d) {
  if (d === undefined) d = 2;
  if (x === undefined || x === null || isNaN(x)) return '–';
  if (!isFinite(x)) return '∞';
  var s = Number(x).toFixed(d);
  if (s === '-0' || /^-0\.0*$/.test(s)) s = s.slice(1);
  return s;
}
function sig(x, n) { // significant-ish: adaptive decimals
  var a = Math.abs(x);
  if (a >= 1000) return fmt(x, 0);
  if (a >= 100) return fmt(x, 1);
  if (a >= 10) return fmt(x, 2);
  return fmt(x, n === undefined ? 3 : n);
}
var DEG = Math.PI / 180;
var tand = function (a) { return Math.tan(a * DEG); };
var sind = function (a) { return Math.sin(a * DEG); };
var cosd = function (a) { return Math.cos(a * DEG); };
function interp(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (var i = 1; i < xs.length; i++) if (x <= xs[i]) {
    var t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
    return ys[i - 1] + t * (ys[i] - ys[i - 1]);
  }
  return ys[ys.length - 1];
}
/* bisection solve f(x)=0 on [a,b] */
function solve(f, a, b, tol) {
  tol = tol || 1e-6; var fa = f(a), fb = f(b);
  if (fa * fb > 0) { // try to expand
    for (var k = 0; k < 40 && fa * fb > 0; k++) { b += (b - a); fb = f(b); }
    if (fa * fb > 0) return NaN;
  }
  for (var i = 0; i < 80; i++) { var m = (a + b) / 2, fm = f(m); if (Math.abs(fm) < tol) return m; if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; } }
  return (a + b) / 2;
}

/* ---------- math markup (mini TeX -> HTML) ----------
   Supported: _x _{..} ^x ^{..} \frac{a}{b} \sqrt{a} \text{..} \unit{..} \hl{..}
   \cdot \times \Rightarrow \to \le \ge \approx \ne \pm \sum \int \deg \inf \, \;
   Single latin letters are italic, longer latin words (tan, sin, log, net, ult, max ...) upright.
   Greek letters are typed directly. */
var TEXSYM = { cdot: '·', times: '×', Rightarrow: '<span class="op">⇒</span>', to: '→', le: '≤', ge: '≥', approx: '≈', ne: '≠', pm: '±', sum: '<span class="big">Σ</span>', int: '<span class="big">∫</span>', deg: '°', inf: '∞', ',': '&thinsp;', ';': '&ensp;', lt: '&lt;', gt: '&gt;', gg: '≫', ll: '≪', prime: '′', leftarrow: '←', Leftrightarrow: '⇔', ldots: '…', pi: 'π', theta: 'θ', phi: 'φ', gamma: 'γ', sigma: 'σ', tau: 'τ', alpha: 'α', beta: 'β', delta: 'δ', Delta: 'Δ', nu: 'ν', mu: 'μ', eta: 'η', lambda: 'λ', rho: 'ρ', omega: 'ω', xi: 'ξ', Sigma: 'Σ', ' ': ' ', '%': '%', '{': '{', '}': '}', quad: '&ensp;', qquad: '&emsp;', tan: 'tan', sin: 'sin', cos: 'cos', cot: 'cot', log: 'log', ln: 'ln', exp: 'exp', arctan: 'arctan', max: 'max', min: 'min', e: 'e' };
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function tex(src) {
  var s = String(src), i = 0;
  function readGroup() { // assumes s[i]=='{'
    var depth = 0, start = i + 1;
    for (; i < s.length; i++) { if (s[i] === '{') depth++; else if (s[i] === '}') { depth--; if (depth === 0) { var g = s.slice(start, i); i++; return g; } } }
    return s.slice(start);
  }
  function readArg() { if (i >= s.length) return ''; if (s[i] === '{') return readGroup(); var c = s[i++]; return c; }
  function parseRun(txt) { // latin letter runs
    if (txt.length === 1) return '<i>' + txt + '</i>';
    return txt;
  }
  var out = '';
  while (i < s.length) {
    var c = s[i];
    if (c === '\\') {
      i++;
      var m = /^[A-Za-z]+/.exec(s.slice(i));
      var name;
      if (m) { name = m[0]; i += name.length; } else { name = s[i]; i++; }
      if (name === 'frac') { var a = readArg(); var b = readArg(); out += '<span class="fr"><span>' + tex(a) + '</span><span>' + tex(b) + '</span></span>'; }
      else if (name === 'sqrt') { var g = readArg(); out += '<span class="sq">√<span class="sqi">' + tex(g) + '</span></span>'; }
      else if (name === 'text') { out += '<span class="txt">' + esc(readArg()) + '</span>'; }
      else if (name === 'unit') { out += '<span class="u">' + esc(readArg()) + '</span>'; }
      else if (name === 'hl') { out += '<span class="hl">' + tex(readArg()) + '</span>'; }
      else if (name === 'b') { out += '<b>' + tex(readArg()) + '</b>'; }
      else if (name === 'left' || name === 'right') { /* ignore, next char printed */ }
      else if (TEXSYM[name] !== undefined) out += TEXSYM[name];
      else out += esc('\\' + name);
    } else if (c === '_' || c === '^') {
      i++; var arg = readArg(); out += (c === '_' ? '<sub>' : '<sup>') + tex(arg) + (c === '_' ? '</sub>' : '</sup>');
    } else if (c === '{') { out += tex(readGroup()); }
    else if (c === '}') { i++; }
    else if (/[A-Za-z]/.test(c)) { var mm = /^[A-Za-z]+/.exec(s.slice(i)); i += mm[0].length; out += parseRun(mm[0]); }
    else { out += esc(c); i++; }
  }
  return out;
}
function m(src) { return '<span class="m">' + tex(src) + '</span>'; }
function eq(src, why) { return '<div class="eq"><span class="m">' + tex(src) + '</span>' + (why ? '<span class="why">' + why + '</span>' : '') + '</div>'; }
function eqs(list) { return '<div class="eqs">' + list.map(function (x) { return Array.isArray(x) ? eq(x[0], x[1]) : eq(x); }).join('') + '</div>'; }
function p(html) { return '<p>' + html + '</p>'; }
function note(html) { return '<div class="note">' + html + '</div>'; }
function table(head, rows, hotRow) {
  var h = '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + head.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>';
  rows.forEach(function (r, idx) { h += '<tr' + (idx === hotRow ? ' class="hot"' : '') + '>' + r.map(function (x) { return '<td>' + x + '</td>'; }).join('') + '</tr>'; });
  return h + '</tbody></table></div>';
}

/* ---------- SVG helpers (all return strings) ---------- */
var SVG = {
  open: function (w, h, extra) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" ' + (extra || '') + '>' +
      '<defs>' +
      '<marker id="arL" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--load)"/></marker>' +
      '<marker id="arW" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent-2)"/></marker>' +
      '<marker id="arF" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--fg)"/></marker>' +
      '<marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5"><circle cx="5" cy="5" r="4" fill="var(--fg)"/></marker>' +
      '<pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="var(--fg)" stroke-width="1" opacity=".55"/></pattern>' +
      '<pattern id="hatch2" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="10" stroke="var(--ok)" stroke-width="1.2"/></pattern>' +
      '<pattern id="sandp" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="var(--soil-2)" opacity=".6"/><circle cx="10" cy="8" r="1" fill="var(--soil-2)" opacity=".6"/><circle cx="6" cy="12" r=".8" fill="var(--soil-2)" opacity=".6"/></pattern>' +
      '<pattern id="clayp" width="16" height="8" patternUnits="userSpaceOnUse"><line x1="0" y1="4" x2="10" y2="4" stroke="var(--soil-2)" stroke-width="1" opacity=".5"/></pattern>' +
      '<linearGradient id="soilg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--soil)"/><stop offset="1" stop-color="var(--soil-2)"/></linearGradient>' +
      '<linearGradient id="clayg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--clay)"/><stop offset="1" stop-color="var(--soil-2)"/></linearGradient>' +
      '<linearGradient id="rockg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--rock)"/><stop offset="1" stop-color="#2b2b2b"/></linearGradient>' +
      '</defs>';
  },
  close: function () { return '</svg>'; },
  /* soil mass with gradient; type: 'sand' | 'clay' | 'rock' */
  soil: function (x, y, w, h, type, attrs) {
    var fill = type === 'clay' ? 'url(#clayg)' : type === 'rock' ? 'url(#rockg)' : 'url(#soilg)';
    var pat = type === 'clay' ? 'url(#clayp)' : type === 'rock' ? '' : 'url(#sandp)';
    return '<g ' + (attrs || '') + '><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>' + (pat ? '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + pat + '"/>' : '') + '</g>';
  },
  /* ground surface line with little hatch ticks on the right side */
  ground: function (x1, x2, y, tickSide) {
    var s = '<line class="ground" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '"/>';
    var from = tickSide === 'left' ? x1 : x2 - 60, to = tickSide === 'left' ? x1 + 60 : x2;
    for (var x = from + 4; x < to; x += 8) s += '<line class="thin" x1="' + x + '" y1="' + y + '" x2="' + (x - 5) + '" y2="' + (y + 6) + '"/>';
    return s;
  },
  rect: function (x, y, w, h, cls, attrs) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" class="' + (cls || '') + '" ' + (attrs || '') + '/>'; },
  poly: function (pts, cls, attrs) { return '<polygon points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" class="' + (cls || '') + '" ' + (attrs || '') + '/>'; },
  line: function (x1, y1, x2, y2, cls, attrs) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="' + (cls || 'thin') + '" ' + (attrs || '') + '/>'; },
  circle: function (cx, cy, r, cls, attrs) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" class="' + (cls || '') + '" ' + (attrs || '') + '/>'; },
  text: function (x, y, str, cls, attrs) { return '<text x="' + x + '" y="' + y + '" class="' + (cls || '') + '" ' + (attrs || '') + '>' + str + '</text>'; },
  /* arrow with head; kind: 'load' (red) | 'weight' (blue) | 'fg' */
  arrow: function (x1, y1, x2, y2, kind, attrs, width) {
    var mk = kind === 'load' ? 'arL' : kind === 'weight' ? 'arW' : 'arF';
    var stroke = kind === 'load' ? 'var(--load)' : kind === 'weight' ? 'var(--accent-2)' : 'var(--fg)';
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + stroke + '" stroke-width="' + (width || 3) + '" marker-end="url(#' + mk + ')" ' + (attrs || '') + '/>';
  },
  /* dimension line between two points with text; off = offset perpendicular (px). horizontal if y1==y2 */
  dim: function (x1, y1, x2, y2, label, off, attrs) {
    off = off || 0;
    var horiz = Math.abs(y1 - y2) < 0.01;
    var s = '<g class="dimg" ' + (attrs || '') + '>';
    if (horiz) {
      var y = y1 + off;
      s += '<line class="dimline" x1="' + x1 + '" y1="' + y1 + '" x2="' + x1 + '" y2="' + (y + (off > 0 ? 4 : -4)) + '"/><line class="dimline" x1="' + x2 + '" y1="' + y2 + '" x2="' + x2 + '" y2="' + (y + (off > 0 ? 4 : -4)) + '"/>';
      s += '<line class="dimline" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" marker-start="url(#arF)" marker-end="url(#arF)"/>';
      s += '<text x="' + ((x1 + x2) / 2) + '" y="' + (y + (off >= 0 ? 15 : -5)) + '" text-anchor="middle" class="math">' + label + '</text>';
    } else {
      var x = x1 + off;
      s += '<line class="dimline" x1="' + x1 + '" y1="' + y1 + '" x2="' + (x + (off > 0 ? 4 : -4)) + '" y2="' + y1 + '"/><line class="dimline" x1="' + x2 + '" y1="' + y2 + '" x2="' + (x + (off > 0 ? 4 : -4)) + '" y2="' + y2 + '"/>';
      s += '<line class="dimline" x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '" marker-start="url(#arF)" marker-end="url(#arF)"/>';
      s += '<text x="' + (x + (off >= 0 ? 6 : -6)) + '" y="' + ((y1 + y2) / 2 + 4) + '" text-anchor="' + (off >= 0 ? 'start' : 'end') + '" class="math">' + label + '</text>';
    }
    return s + '</g>';
  },
  /* uniformly distributed load arrows pointing down onto y from y-len, spanning x1..x2 */
  udl: function (x1, x2, y, len, label, attrs, n) {
    n = n || Math.max(3, Math.round((x2 - x1) / 18));
    var s = '<g class="udl" ' + (attrs || '') + '><line class="load-line" x1="' + x1 + '" y1="' + (y - len) + '" x2="' + x2 + '" y2="' + (y - len) + '"/>';
    for (var k = 0; k <= n; k++) { var x = x1 + (x2 - x1) * k / n; s += '<line x1="' + x + '" y1="' + (y - len) + '" x2="' + x + '" y2="' + (y - 2) + '" stroke="var(--load)" stroke-width="1.6" marker-end="url(#arL)"/>'; }
    if (label) s += '<text x="' + ((x1 + x2) / 2) + '" y="' + (y - len - 6) + '" text-anchor="middle" class="lbl-load math">' + label + '</text>';
    return s + '</g>';
  },
  /* horizontal pressure diagram (triangle/trapezoid) acting on face at x, from yTop..yBot, widths wTop..wBot (px) extending to the right (side=+1) or left (-1) */
  pressure: function (x, yTop, yBot, wTop, wBot, side, cls, attrs, nArrows) {
    side = side || 1; cls = cls || 'load-fill';
    var pts = [[x, yTop], [x + side * wTop, yTop], [x + side * wBot, yBot], [x, yBot]];
    var s = '<g ' + (attrs || '') + '>' + SVG.poly(pts, cls);
    var n = nArrows === undefined ? 5 : nArrows;
    for (var k = 1; k <= n; k++) { var t = k / (n + 1), y = yTop + (yBot - yTop) * t, w = wTop + (wBot - wTop) * t; if (w > 6) s += '<line x1="' + (x + side * w) + '" y1="' + y + '" x2="' + (x + side * 3) + '" y2="' + y + '" stroke="var(--load)" stroke-width="1.3" marker-end="url(#arL)"/>'; }
    return s + '</g>';
  },
  /* water table symbol at (x,y) */
  wt: function (x, y) {
    return '<g class="wtsym"><polygon points="' + (x - 7) + ',' + (y - 10) + ' ' + (x + 7) + ',' + (y - 10) + ' ' + x + ',' + y + '" fill="var(--water)"/><line x1="' + (x - 10) + '" y1="' + (y + 3) + '" x2="' + (x + 10) + '" y2="' + (y + 3) + '" stroke="var(--water)" stroke-width="1.5"/><line x1="' + (x - 6) + '" y1="' + (y + 7) + '" x2="' + (x + 6) + '" y2="' + (y + 7) + '" stroke="var(--water)" stroke-width="1.5"/></g>';
  },
  /* label with small background box */
  label: function (x, y, str, cls, anchor) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" class="' + (cls || '') + '" paint-order="stroke" stroke="var(--panel-2)" stroke-width="4" stroke-linejoin="round">' + str + '</text>';
  },
  point: function (x, y, name, dx, dy) { return SVG.circle(x, y, 5, 'pt') + (name ? SVG.text(x + (dx === undefined ? 8 : dx), y + (dy === undefined ? 5 : dy), name, 'lbl-load') : ''); }
};
/* sub/sup inside SVG text: returns tspans */
function tsub(base, sub) { return base + '<tspan dy="4" font-size="10">' + sub + '</tspan><tspan dy="-4"> </tspan>'; }

/* ---------- Geotechnical functions ---------- */
var GEO = {
  Ka: function (phi) { return Math.pow(tand(45 - phi / 2), 2); },
  Kp: function (phi) { return Math.pow(tand(45 + phi / 2), 2); },
  /* Prandtl/Reissner Nq, Nc; Hansen Nγ (used in exercises 6-8) */
  Nq: function (phi) { if (phi <= 0) return 1; return Math.exp(Math.PI * tand(phi)) * Math.pow(tand(45 + phi / 2), 2); },
  Nc: function (phi) { if (phi <= 0.001) return 5.14; return (GEO.Nq(phi) - 1) / tand(phi); },
  Ng: function (phi) { if (phi <= 0) return 0; return 1.5 * (GEO.Nq(phi) - 1) * tand(phi); },         // Hansen
  NgVesic: function (phi) { if (phi <= 0) return 0; return 2 * (GEO.Nq(phi) + 1) * tand(phi); },
  /* DIN 4017 table as printed in the course notes (rounded). Nb(DIN) = (Nd-1) tanφ */
  DIN_TAB: [[0, 5.0, 1.0, 0.0], [5, 6.5, 1.5, 0.0], [10, 8.5, 2.5, 0.5], [15, 11.0, 4.0, 1.0], [20, 15.0, 6.5, 2.0], [22.5, 17.5, 8.0, 3.0], [25, 20.5, 10.5, 4.5], [27.5, 25.0, 14.0, 7.0], [30, 30.0, 18.0, 10.0], [32.5, 37.0, 25.0, 15.0], [35, 46.0, 33.0, 23.0], [37.5, 58.0, 46.0, 34.0], [40, 75.0, 64.0, 53.0], [42.5, 99.0, 92.0, 83.0]],
  din: function (phi) { // interpolated from the course table
    var t = GEO.DIN_TAB, xs = t.map(function (r) { return r[0]; });
    return { Nc: interp(xs, t.map(function (r) { return r[1]; }), phi), Nd: interp(xs, t.map(function (r) { return r[2]; }), phi), Nb: interp(xs, t.map(function (r) { return r[3]; }), phi) };
  },
  dinExact: function (phi) { var Nd = GEO.Nq(phi); return { Nc: phi > 0 ? (Nd - 1) / tand(phi) : 5.14, Nd: Nd, Nb: phi > 0 ? (Nd - 1) * tand(phi) : 0 }; },
  /* DIN 4017 shape factors: shape 'strip' | 'rect' | 'square' */
  dinShape: function (shape, B, L, phi, Nd) {
    if (shape === 'strip') return { Vc: 1, Vd: 1, Vb: 1 };
    var BL = shape === 'square' ? 1 : B / L;
    var Vd = 1 + BL * sind(phi), Vb = 1 - 0.3 * BL;
    var Vc = phi > 0 ? (Vd * Nd - 1) / (Nd - 1) : 1 + 0.2 * BL;
    return { Vc: Vc, Vd: Vd, Vb: Vb };
  },
  /* Steinbrenner influence factor f for corner of flexible rectangle L×B on layer of depth z, ν=0.3 : ρ = qB/E · f */
  steinF: function (LB, zB, nu) {
    nu = nu === undefined ? 0.3 : nu;
    var mm = LB, n = zB;
    if (n <= 0) return 0;
    var s1 = Math.sqrt(mm * mm + 1), s2 = Math.sqrt(mm * mm + n * n), s3 = Math.sqrt(mm * mm + n * n + 1), s4 = Math.sqrt(1 + n * n);
    var A0 = mm * Math.log((1 + s1) * s2 / (mm * (1 + s3)));
    var A1 = Math.log((mm + s1) * s4 / (mm + s3));
    var F1 = (A0 + A1) / Math.PI;
    var F2 = (n / (2 * Math.PI)) * Math.atan(mm / (n * s3));
    var Is = F1 + (1 - 2 * nu) / (1 - nu) * F2;
    return (1 - nu * nu) * Is;
  },
  /* Corner factor for a layer of thickness H whose modulus increases linearly with depth:
     E(z) = E0 (1 + K z/H), K = (E_H - E0)/E0, ρ = q B f / E0, read at z/B = H/B.
     Vertical strains of the homogeneous half-space integrated over the layer (Steinbrenner assumption):
     f_K(n) = f(n)/(1+K) + (K/n) ∫0..n f(ζ)/(1+Kζ/n)² dζ, with ζ = n t² and Simpson's rule. K = 0 gives steinF. */
  steinFK: function (LB, zB, K, nu) {
    nu = nu === undefined ? 0.3 : nu;
    if (zB <= 0) return 0;
    var f0 = GEO.steinF(LB, zB, nu);
    if (!K) return f0;
    var N = 96, h = 1 / N, sum = 0;
    for (var i = 1; i <= N; i++) { var t = i * h, w = i === N ? 1 : (i % 2 ? 4 : 2); sum += w * GEO.steinF(LB, zB * t * t, nu) * 2 * t / Math.pow(1 + K * t * t, 2); }
    return f0 / (1 + K) + K * sum * h / 3;
  },
  /* Schmertmann strain influence factor: type 'strip' (L/B>=10) or 'square'. z measured from foundation level, B width */
  schIz: function (z, B, type, Izmax) {
    Izmax = Izmax === undefined ? 0.6 : Izmax;
    var zp = type === 'strip' ? B : B / 2, zmax = type === 'strip' ? 4 * B : 2 * B, I0 = type === 'strip' ? 0.2 : 0.1;
    if (z < 0) return 0;
    if (z <= zp) return I0 + (Izmax - I0) * z / zp;
    if (z <= zmax) return Izmax * (zmax - z) / (zmax - zp);
    return 0;
  },
  /* Terzaghi one-dimensional consolidation: average degree U -> Tv */
  Tv: function (U) { if (U < 0.6) return Math.PI / 4 * U * U; return -0.933 * Math.log10(1 - U) - 0.085; },
  U: function (Tv) { return solve(function (u) { return GEO.Tv(u) - Tv; }, 0.0001, 0.9999, 1e-7); },
  /* Converse–Labarre group efficiency: n rows (m x n piles), D diameter, s spacing */
  converseLabarre: function (mRows, nCols, D, s) { var th = Math.atan(D / s) / DEG; return 1 - th * ((nCols - 1) * mRows + (mRows - 1) * nCols) / (90 * mRows * nCols); }
};

/* ---------- charts (SVG strings) ---------- */
var CHART = {
  /* Steinbrenner chart: f (x) vs z/B (y, downward). points: [{LB, zB, name}] marked.
     opts.K / opts.nu: nomograph for linearly increasing modulus E(z) = E0(1 + K z/H) and Poisson ratio ν
     (GEO.steinFK); without them the classic chart (K = 0, ν = 0.3) is drawn. opts.dec: decimals of the readings. */
  steinbrenner: function (points, opts) {
    opts = opts || {}; var W = 520, H = 420, L = 60, T = 40, R = 30, Bm = 30, pw = W - L - R, ph = H - T - Bm;
    var gen = opts.K !== undefined || opts.nu !== undefined, Kk = opts.K || 0, nu = opts.nu === undefined ? 0.3 : opts.nu, dec = opts.dec || 2;
    var F = function (LB, zB) { return gen ? GEO.steinFK(LB, zB, Kk, nu) : GEO.steinF(LB, zB); };
    var curves = [1, 2, 3, 5, 10, 1000];
    var names = ['1', '2', '3', '5', '10', '∞'];
    var fmax = 1.0, fstep = 0.1, zmax = 20;
    if (gen) { // horizontal axis fitted to the family of curves
      var top = 0; curves.forEach(function (LB) { top = Math.max(top, F(LB, zmax)); });
      (points || []).forEach(function (pt) { top = Math.max(top, F(pt.LB, pt.zB)); });
      top *= 1.02; var cand = [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
      for (var ck = 0; ck < cand.length; ck++) { fstep = cand[ck]; if (top / fstep <= 10) break; }
      fmax = Math.max(fstep, Math.ceil(top / fstep - 1e-9) * fstep);
    }
    var X = function (f) { return L + f / fmax * pw; }, Y = function (zB) { return T + zB / zmax * ph; };
    var s = SVG.open(W, H, 'aria-label="Διάγραμμα Steinbrenner: συντελεστής f συναρτήσει z/B για διάφορα L/B' + (gen ? ', K = ' + fmt(Kk, 2) + ', ν = ' + fmt(nu, 1) : '') + '"');
    for (var k = 0; k * fstep <= fmax + 1e-9; k++) { var f = k * fstep; s += SVG.line(X(f), T, X(f), T + ph, 'grid') + SVG.text(X(f), T - 8, fmt(f, fstep < 0.1 ? 2 : fstep < 1 ? 1 : 0), 'lbl-muted', 'text-anchor="middle"'); }
    for (var z = 0; z <= 20; z += 2) s += SVG.line(L, Y(z), L + pw, Y(z), 'grid') + SVG.text(L - 8, Y(z) + 4, z, 'lbl-muted', 'text-anchor="end"');
    s += SVG.rect(L, T, pw, ph, 'thin');
    s += SVG.text(L + pw / 2, 14, 'συντελεστής επιρροής f' + (gen ? '  (K = ' + fmt(Kk, 2) + ',  ν = ' + fmt(nu, 1) + ')' : ''), gen ? 'lbl-load' : 'lbl-muted', 'text-anchor="middle"');
    s += '<text transform="translate(16,' + (T + ph / 2) + ') rotate(-90)" text-anchor="middle" class="lbl-muted">' + (gen ? 'z/B′ = H/B′' : 'z/B') + '</text>';
    var path = function (LB) { var d = ''; for (var zB = 0.05; zB <= zmax + 0.001; zB += 0.25) { var fv = F(LB, zB); d += (d ? ' L' : 'M') + X(fv).toFixed(1) + ',' + Y(zB).toFixed(1); } return d; };
    var isStd = function (LB) { return LB >= 50 || curves.some(function (c) { return Math.abs(c - LB) < 0.01; }); };
    curves.forEach(function (LB, ci) {
      var hot = points && points.some(function (pt) { return Math.abs(pt.LB - LB) < 0.01 || (LB === 1000 && pt.LB >= 50); });
      s += '<path d="' + path(LB) + '" class="curve ' + (hot ? 'hot' : 'muted') + '"/>';
      var zl = zmax - 1.2 * ci, fe = F(LB, zl);
      var lx = X(fe) + (ci >= 3 ? 34 : 0); if (gen) lx = Math.min(lx, L + pw - 30);   // keep the label inside the frame
      s += SVG.label(lx, Y(zl) - 6, 'L/B=' + names[ci], 'lbl-muted', 'middle');
    });
    // interpolated curve (dashed) through each reading whose L/B is not one of the drawn curves
    if (gen) (points || []).forEach(function (pt) { if (!isStd(pt.LB)) s += '<path d="' + path(pt.LB) + '" class="curve hot" style="stroke-width:1.6;stroke-dasharray:6 4"/>'; });
    var placed = [];
    (points || []).forEach(function (pt) {
      var fv = F(pt.LB, pt.zB), txt = (pt.name ? pt.name + ': ' : '') + 'f = ' + fmt(fv, dec), lx = X(fv) + 10, ly = Y(pt.zB) - 8;
      // keep the labels of neighbouring readings apart
      [-8, 20, -24, 36].some(function (dy) { ly = Y(pt.zB) + dy; return !placed.some(function (q) { return Math.abs(q[1] - ly) < 15 && Math.abs(q[0] - lx) < 8 * txt.length; }); });
      placed.push([lx, ly]);
      s += '<path d="M' + X(0) + ',' + Y(pt.zB) + ' L' + X(fv) + ',' + Y(pt.zB) + ' L' + X(fv) + ',' + Y(0) + '" class="guide a-draw"/>';
      s += SVG.circle(X(fv), Y(pt.zB), 6, 'marker a-pop');
      s += SVG.label(lx, ly, txt, 'lbl-load', 'start');
    });
    return s + SVG.close();
  },
  /* Schmertmann Iz diagram for a given B/type with layer midpoints marked. layers: [{z, Iz}] (z from foundation level) */
  schmertmann: function (B, type, Izmax, layers, zTop) {
    zTop = zTop || 0; var zmax = type === 'strip' ? 4 * B : 2 * B;
    var W = 360, H = 420, L = 50, T = 36, R = 20, Bm = 24, pw = W - L - R, ph = H - T - Bm;
    var X = function (I) { return L + I / 0.8 * pw; }, Y = function (z) { return T + z / zmax * ph; };
    var s = SVG.open(W, H, 'aria-label="Διάγραμμα συντελεστή επιρροής παραμόρφωσης Iz κατά Schmertmann"');
    for (var I = 0; I <= 0.81; I += 0.2) s += SVG.line(X(I), T, X(I), T + ph, 'grid') + SVG.text(X(I), T - 8, fmt(I, 1), 'lbl-muted', 'text-anchor="middle"');
    var steps = Math.min(12, Math.round(zmax)); var dz = zmax / steps;
    for (var z = 0; z <= zmax + 0.001; z += dz) s += SVG.line(L, Y(z), L + pw, Y(z), 'grid') + SVG.text(L - 6, Y(z) + 4, fmt(z + zTop, 1), 'lbl-muted', 'text-anchor="end"');
    s += SVG.rect(L, T, pw, ph, 'thin');
    s += SVG.text(L + pw / 2, 12, tsub('I', 'z'), 'lbl-muted', 'text-anchor="middle"');
    s += '<text transform="translate(12,' + (T + ph / 2) + ') rotate(-90)" text-anchor="middle" class="lbl-muted">βάθος z (m)</text>';
    var zp = type === 'strip' ? B : B / 2, I0 = type === 'strip' ? 0.2 : 0.1;
    s += '<path d="M' + X(I0) + ',' + Y(0) + ' L' + X(Izmax) + ',' + Y(zp) + ' L' + X(0) + ',' + Y(zmax) + '" class="curve hot a-draw"/>';
    s += SVG.label(X(Izmax) - 8, Y(zp) + 18, tsub('I', 'z,max') + '=' + fmt(Izmax, 2) + ', z=' + fmt(zp, 1) + ' m', 'lbl-load', 'end');
    s += SVG.label(X(0) + 6, Y(zmax) - 6, (type === 'strip' ? '4B' : '2B') + ' = ' + fmt(zmax, 1) + ' m', 'lbl-muted', 'start');
    (layers || []).forEach(function (ly, i) {
      s += SVG.line(L, Y(ly.z), X(ly.Iz), Y(ly.z), 'guide');
      s += SVG.circle(X(ly.Iz), Y(ly.z), 5, 'marker a-pop', 'style="animation-delay:' + (i * 0.12) + 's"');
      s += SVG.label(X(ly.Iz) + 8, Y(ly.z) + 4, fmt(ly.Iz, 2), 'lbl-muted', 'start');
    });
    return s + SVG.close();
  },
  /* Consolidation U–Tv curve with a point */
  consol: function (Umark) {
    var W = 420, H = 260, L = 50, T = 20, R = 20, Bm = 36, pw = W - L - R, ph = H - T - Bm;
    var X = function (Tv) { return L + Tv / 1.2 * pw; }, Y = function (U) { return T + U * ph; };
    var s = SVG.open(W, H, 'aria-label="Καμπύλη βαθμού στερεοποίησης U – χρονικού παράγοντα Tv"');
    for (var t = 0; t <= 1.21; t += 0.2) s += SVG.line(X(t), T, X(t), T + ph, 'grid') + SVG.text(X(t), T + ph + 14, fmt(t, 1), 'lbl-muted', 'text-anchor="middle"');
    for (var u = 0; u <= 1.01; u += 0.2) s += SVG.line(L, Y(u), L + pw, Y(u), 'grid') + SVG.text(L - 6, Y(u) + 4, fmt(u * 100, 0) + '%', 'lbl-muted', 'text-anchor="end"');
    s += SVG.rect(L, T, pw, ph, 'thin');
    s += SVG.text(L + pw / 2, H - 4, tsub('T', 'v'), 'lbl-muted', 'text-anchor="middle"');
    var d = '';
    for (var U = 0; U <= 0.995; U += 0.01) { var Tv = GEO.Tv(U); if (Tv > 1.2) break; d += (d ? ' L' : 'M') + X(Tv).toFixed(1) + ',' + Y(U).toFixed(1); }
    s += '<path d="' + d + '" class="curve hot a-draw"/>';
    if (Umark) { var Tm = GEO.Tv(Umark); s += '<path d="M' + X(0) + ',' + Y(Umark) + ' L' + X(Tm) + ',' + Y(Umark) + ' L' + X(Tm) + ',' + Y(1) + '" class="guide"/>' + SVG.circle(X(Tm), Y(Umark), 6, 'marker a-pop') + SVG.label(X(Tm) + 8, Y(Umark) - 8, 'U=' + fmt(Umark * 100, 0) + '% → ' + tsub('T', 'v') + '=' + fmt(Tm, 3), 'lbl-load', 'start'); }
    return s + SVG.close();
  }
};

/* ---------- tables ---------- */
var TABLES = {
  din1: function (phiHot) {
    var rows = GEO.DIN_TAB.map(function (r) { return [fmt(r[0], 1) + '°', fmt(r[1], 1), fmt(r[2], 1), fmt(r[3], 1)]; });
    var hot = -1; GEO.DIN_TAB.forEach(function (r, i) { if (phiHot !== undefined && Math.abs(r[0] - phiHot) < 0.01) hot = i; });
    return table(['φ', m('N_c'), m('N_d'), m('N_b')], rows, hot);
  },
  din2: function () {
    return table(['Μορφή θεμελίου', m('V_c\\;(φ≠0)'), m('V_c\\;(φ=0)'), m('V_d'), m('V_b')], [
      ['Λωρίδα', '1.0', '1.0', '1.0', '1.0'],
      ['Ορθογώνιο', m('\\frac{V_d N_d - 1}{N_d - 1}'), m('1+0.2\\,\\frac{B}{L}'), m('1+\\frac{B}{L}\\sin φ'), m('1-0.3\\,\\frac{B}{L}')],
      ['Τετράγωνο ή κύκλος', m('\\frac{V_d N_d - 1}{N_d - 1}'), '1.2', m('1+\\sin φ'), '0.7']]);
  },
  din3: function () {
    return table(['Συντελεστής', 'φ ≠ 0 (DIN 4017)', 'φ = 0'], [
      [m('K_d'), m('\\left(1-0.7\\,\\frac{H}{V+B\'L\'c\\cot φ}\\right)^3'), '1'],
      [m('K_b'), m('\\left(1-\\frac{H}{V+B\'L\'c\\cot φ}\\right)^3'), '–'],
      [m('K_c'), m('K_d-\\frac{1-K_d}{N_d-1}'), m('0.5+0.5\\sqrt{1-\\frac{H}{B\'L\'c}}')]]);
  },
  bc: function (phiHot) {
    var phis = [0, 5, 10, 15, 20, 25, 30, 32, 35, 40];
    var rows = phis.map(function (f) { return [f + '°', fmt(GEO.Nc(f), 1), fmt(GEO.Nq(f), 1), fmt(GEO.Ng(f), 1)]; });
    var hot = phis.indexOf(phiHot);
    return table(['φ', m('N_c'), m('N_q'), m('N_γ') + ' (Hansen)'], rows, hot);
  }
};

/* ---------- App shell ---------- */
var APP = (function () {
  var cfg, state = { exId: null, step: 0, params: {}, playing: null, showAll: false };
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function ex() { return cfg.exercises.filter(function (e) { return e.id === state.exId; })[0]; }
  function params(e) { var pr = {}; (e.givens || []).forEach(function (g) { pr[g.key] = (state.params[e.id] && state.params[e.id][g.key] !== undefined) ? state.params[e.id][g.key] : g.value; }); return pr; }
  function defaults(e) { var pr = {}; (e.givens || []).forEach(function (g) { pr[g.key] = g.value; }); return pr; }


  var UOP_LOGO = 'data:image/jpeg;base64,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';
  var UOP_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2 12h4l3-8 4 16 3-8h6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function banner(c) {
    return '<header class="uhead"><img class="ulogo" src="' + UOP_LOGO + '" alt="Πανεπιστήμιο Πατρών">' +
      '<div class="udept"><b>Τμήμα Πολιτικών Μηχανικών</b><span>Αν. Καθ. Παναγιώτης Πελέκης</span></div>' +
      '<div class="uapp"><h1>' + UOP_ICON + ' ' + (c.appName || ('Διαδραστικές Ασκήσεις · ' + c.title)) + ' <span class="ver">' + (c.version || 'v1.0') + '</span></h1>' +
      '<p>' + (c.desc || c.subtitle) + '</p></div></header>';
  }
  function init(c) {
    if (!document.body) { document.addEventListener('DOMContentLoaded', function () { init(c); }); return; }
    cfg = c;
    document.title = c.title + ' · Θεμελιώσεις';
    document.body.appendChild(el(banner(c)));
    var app = el('<div class="app"><aside class="side" id="side"></aside><main class="main" id="main"></main></div>');
    document.body.appendChild(app);
    renderSide();
    var h = location.hash.replace('#', ''), stepReq = 0;
    var sm = /^(.*)-step(\d+)$/.exec(h); if (sm) { h = sm[1]; stepReq = parseInt(sm[2]); }
    var first = cfg.exercises[0].id;
    go(cfg.exercises.some(function (e) { return e.id === h; }) || h === 'sheet' ? h : first);
    if (stepReq > 0 && ex()) { state.step = Math.min(stepReq, ex().steps.length); renderMain(false); }
    window.addEventListener('hashchange', function () {
      var id = location.hash.replace('#', ''), mm = /^(.*)-step(\d+)$/.exec(id); if (mm) id = mm[1];
      if (id && id !== state.exId) go(id);
      if (mm && ex()) { state.step = Math.min(parseInt(mm[2]), ex().steps.length); renderMain(false); }
    });
    document.addEventListener('click', function (ev) { var sd = $('#side'); if (sd && sd.classList.contains('open') && !sd.contains(ev.target) && !ev.target.closest('#menu')) sd.classList.remove('open'); });
    document.addEventListener('keydown', function (ev) {
      if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
      if (ev.key === ' ' && (ev.target.tagName === 'BUTTON' || ev.target.tagName === 'A')) return;
      if (ev.key === 'ArrowRight' || ev.key === ' ') { ev.preventDefault(); next(); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); prev(); }
      else if (ev.key === 'p' || ev.key === 'P' || ev.key === 'π') togglePresent();
      else if (ev.key === 'f' || ev.key === 'F' || ev.key === 'φ') fullscreen();
      else if (ev.key === 'Home') { state.step = 0; renderMain(false); }
      else if (ev.key === 'End') { state.step = ex().steps.length; renderMain(false); }
    });
  }
  function renderSide() {
    var s = '<div class="brand"><div class="uni">' + cfg.uni + '</div><h1>' + cfg.title + '</h1><div class="sub">' + cfg.subtitle + '</div></div><nav class="nav">';
    var grp = null;
    cfg.exercises.forEach(function (e) {
      if (e.group && e.group !== grp) { grp = e.group; s += '<div class="grp">' + grp + '</div>'; }
      s += '<button data-id="' + e.id + '"><span class="n">' + e.num + '</span><span class="t">' + e.title + '</span></button>';
    });
    s += '<div class="grp">Αναφορά</div><button data-id="sheet"><span class="n">Σ</span><span class="t">Τυπολόγιο, πίνακες και διαγράμματα</span></button>';
    s += '</nav><div class="foot">' + cfg.footer + '<br>Πλήκτρα: <span class="kbd">→</span> επόμενο βήμα, <span class="kbd">←</span> πίσω, <span class="kbd">P</span> παρουσίαση, <span class="kbd">F</span> πλήρης οθόνη</div>';
    $('#side').innerHTML = s;
    $('#side').addEventListener('click', function (ev) { var b = ev.target.closest('button[data-id]'); if (b) { go(b.dataset.id); $('#side').classList.remove('open'); } });
  }
  function go(id) {
    state.exId = id; state.step = 0; state.showAll = false; stopPlay();
    try { if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id); } catch (e) { }
    document.querySelectorAll('.nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.id === id); });
    renderMain(true);
    window.scrollTo({ top: 0 });
  }
  function topbar(extra) {
    return '<div class="topbar"><button class="btn menu-btn" id="menu">☰ Ασκήσεις</button>' + (extra || '') + '<span class="sp"></span>' +
      '<button class="btn" id="present" title="Μεγαλύτερη γραμματοσειρά, χωρίς πλαϊνό μενού (P)">▣ Παρουσίαση</button>' +
      '<button class="btn" id="theme" title="Εναλλαγή φωτεινού/σκούρου θέματος">◐ Θέμα</button></div>';
  }
  function wireTop() {
    $('#menu').onclick = function () { $('#side').classList.toggle('open'); };
    $('#present').onclick = togglePresent;
    $('#theme').onclick = function () { var r = document.documentElement; var dark = r.getAttribute('data-theme') === 'dark' || (!r.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches); r.setAttribute('data-theme', dark ? 'light' : 'dark'); };
  }
  function togglePresent() { document.body.classList.toggle('present'); }
  function fullscreen() { var d = document.documentElement; try { if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(function () { }); else if (document.exitFullscreen) document.exitFullscreen(); } catch (e) { } }

  function renderMain(full, scroll) {
    if (state.exId === 'sheet') { renderSheet(); return; }
    var e = ex(); if (!e) return;
    var pr = params(e), r = e.compute(pr);
    var main = $('#main');
    if (full || !$('#exroot')) {
      var h = topbar('<span class="tags">' + (e.tags || []).map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</span>');
      h += '<div id="exroot"><div class="ex-head"><span class="kicker">' + cfg.kicker + ' · ' + (e.source || '') + '</span><h2>' + e.num + '. ' + e.title + '</h2></div>';
      h += '<div class="grid2"><div style="display:grid;gap:16px;min-width:0"><div class="card"><h3>Εκφώνηση</h3><div class="statement">' + e.statement + '</div></div>' +
        '<div class="card"><h3>Σχήμα</h3><div class="fig-wrap"><div class="fig" id="fig"></div><div class="fig-cap" id="figcap"></div></div></div></div>' +
        '<div style="display:grid;gap:16px;min-width:0"><div class="card"><h3>Δεδομένα – πειραματιστείτε</h3><div class="sliders" id="sliders"></div><div class="sliders-foot"><button class="btn" id="reset">↺ Τιμές εκφώνησης</button><span>Αλλάξτε τα δεδομένα και δείτε πώς αλλάζει κάθε βήμα της λύσης.</span></div></div>' +
        '<div class="card" id="quick"><h3>Βασικά μεγέθη</h3><div id="quickbody"></div></div></div></div>';
      h += '<div class="card"><div class="steps-head"><h3 style="margin:0">Λύση βήμα-βήμα</h3><span class="sp" style="flex:1"></span><span class="prog" id="prog"></span>' +
        '<button class="btn" id="prev">← Πίσω</button><button class="btn primary" id="next">Επόμενο βήμα →</button><button class="btn" id="play">▶ Αυτόματα</button><button class="btn" id="all">Όλα</button></div>' +
        '<div class="progress"><i id="pbar"></i></div><div class="steps" id="steps"></div><div id="resbox"></div></div>';
      h += '</div>';
      main.innerHTML = h;
      wireTop();
      renderSliders(e);
      $('#reset').onclick = function () { state.params[e.id] = {}; renderSliders(e); renderMain(false); };
      $('#prev').onclick = prev; $('#next').onclick = next;
      $('#play').onclick = function () { if (state.playing) stopPlay(); else { if (state.step >= e.steps.length) state.step = 0; state.playing = setInterval(function () { if (state.step >= e.steps.length) stopPlay(); else next(); }, cfg.playInterval || 4500); $('#play').textContent = '⏸ Παύση'; next(); } };
      $('#all').onclick = function () { stopPlay(); if (state.showAll) { state.showAll = false; state.step = 0; } else { state.showAll = true; state.step = e.steps.length; } renderMain(false); };
    }
    // figure
    var stepObj = state.step > 0 ? e.steps[state.step - 1] : null;
    var figHtml = e.figure(pr, r, state.step - 1);
    var fig = $('#fig'); fig.innerHTML = figHtml;
    var hl = stepObj && stepObj.hl;
    fig.classList.toggle('focus', !!(hl && hl.length));
    if (hl && hl.length) fig.querySelectorAll('[data-k]').forEach(function (n) { var on = hl.indexOf(n.getAttribute('data-k')) >= 0; n.classList.toggle('hl', on); if (on) n.classList.add('a-pop'); });
    $('#figcap').innerHTML = stepObj && stepObj.cap ? stepObj.cap : (e.figcap || '');
    // quick values
    $('#quickbody').innerHTML = e.quick ? e.quick(pr, r) : ''; $('#quick').hidden = !e.quick;
    $('#all').textContent = state.showAll ? 'Απόκρυψη' : 'Όλα';
    // steps
    var sh = '';
    for (var i = 0; i < Math.min(state.step, e.steps.length); i++) {
      var st = e.steps[i];
      sh += '<div class="step ' + (i === state.step - 1 ? 'cur' : 'done') + '"><div class="st"><span class="no">ΒΗΜΑ ' + (i + 1) + '</span><h4>' + st.title + '</h4></div><div class="body">' + st.body(pr, r) + '</div></div>';
    }
    $('#steps').innerHTML = sh;
    $('#resbox').innerHTML = state.step >= e.steps.length && e.result ? '<div class="result"><h3>Αποτέλεσμα</h3>' + e.result(pr, r) + '</div>' : '';
    $('#prog').textContent = 'Βήμα ' + state.step + ' / ' + e.steps.length;
    $('#pbar').style.width = (100 * state.step / e.steps.length) + '%';
    $('#prev').disabled = state.step === 0; $('#next').disabled = state.step >= e.steps.length;
    var cur = $('.step.cur'); if (cur && scroll && !state.showAll) cur.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function renderSliders(e) {
    var pr = params(e), df = defaults(e), s = '';
    (e.givens || []).forEach(function (g) {
      var changed = Math.abs(pr[g.key] - df[g.key]) > 1e-9;
      s += '<div class="sl' + (changed ? ' changed' : '') + '"><label for="sl_' + g.key + '">' + g.label + '</label><span class="v">' + fmt(pr[g.key], g.dec === undefined ? (g.step < 1 ? 2 : 0) : g.dec) + '<small>' + (g.unit || '') + '</small></span><input type="range" id="sl_' + g.key + '" data-key="' + g.key + '" min="' + g.min + '" max="' + g.max + '" step="' + g.step + '" value="' + pr[g.key] + '"></div>';
    });
    $('#sliders').innerHTML = s || '<span style="color:var(--muted);font-size:13px">Η άσκηση δεν έχει μεταβλητά δεδομένα.</span>';
    $('#sliders').querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        state.params[e.id] = state.params[e.id] || {}; state.params[e.id][inp.dataset.key] = parseFloat(inp.value);
        var g = e.givens.filter(function (x) { return x.key === inp.dataset.key; })[0];
        inp.parentNode.querySelector('.v').innerHTML = fmt(parseFloat(inp.value), g.dec === undefined ? (g.step < 1 ? 2 : 0) : g.dec) + '<small>' + (g.unit || '') + '</small>';
        inp.parentNode.classList.toggle('changed', Math.abs(parseFloat(inp.value) - g.value) > 1e-9);
        renderMain(false);
      });
    });
  }
  function next() { var e = ex(); if (!e || state.step >= e.steps.length) { stopPlay(); return; } state.step++; renderMain(false, true); }
  function prev() { var e = ex(); if (!e || state.step <= 0) return; state.step--; renderMain(false, true); }
  function stopPlay() { if (state.playing) { clearInterval(state.playing); state.playing = null; var b = $('#play'); if (b) b.textContent = '▶ Αυτόματα'; } }
  function renderSheet() {
    var main = $('#main');
    var h = topbar() + '<div class="ex-head"><span class="kicker">' + cfg.kicker + '</span><h2>Τυπολόγιο, πίνακες και διαγράμματα</h2></div><div class="sheet">';
    cfg.sheet.forEach(function (c) { h += '<div class="card' + (c.wide ? ' wide' : '') + '"><h3>' + c.title + '</h3>' + c.html + '</div>'; });
    main.innerHTML = h + '</div>';
    wireTop();
  }
  return { init: init, go: go, state: state };
})();
