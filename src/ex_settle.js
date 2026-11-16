/* Καθιζήσεις – ασκήσεις 1..9 (από: Υποδειγματικές Ασκήσεις Καθιζήσεων, Π. Πελέκης, Νοέμβριος 2025) */
'use strict';
var EX = [];

/* ---------- local helpers ---------- */
function fS(LB, zB) { return GEO.steinF(LB, zB); }
/* strip (L/B = ∞) working values read from the course chart (Steinbrenner, ν = 0.3) */
var STRIP_ZB = [0, 1, 2, 4, 6, 8, 10, 20], STRIP_F = [0, 0.22, 0.36, 0.52, 0.64, 0.72, 0.78, 0.95];
function fStrip(zB) { return interp(STRIP_ZB, STRIP_F, zB); }
function LBtxt(LB) { return LB >= 50 ? '∞' : fmt(LB, 2); }
function gl(rows) { // quick "given" list: [[label, value], ...]
  return '<dl class="given">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>';
}
function grid2(a, b) { return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:start">' + a + b + '</div>'; }
/* plan on top (full width), chart below centred – used where the plan would be too small side by side */
function stack(a, b) { return '<div style="display:grid;gap:10px">' + a + '<div style="max-width:560px;width:100%;margin:0 auto">' + b + '</div></div>'; }
var GRP_EL = 'Θεωρία ελαστικότητας (Steinbrenner)', GRP_SCH = 'Μέθοδος Schmertmann', GRP_CON = 'Στερεοποίηση + Schmertmann', GRP_MIX = 'Σύνθετο: καθιζήσεις & φέρουσα ικανότητα';

/* Plan view: new raft (hatched) next to existing building (grid of 2x2 footings at spacing sp). Coordinates in m, origin = raft top-left. */
function planFig(o) {
  var s = o.s || 20, ox = 64, oy = 56, raft = o.raft, sp = o.sp, ncols = 4, nrows = 3;
  var X = function (x) { return ox + x * s; }, Y = function (y) { return oy + y * s; };
  var Wm = raft + (ncols - 1) * sp + 1.6;
  var W = X(Wm) + 24, H = Y(raft) + 52;
  var h = SVG.open(W, H, 'aria-label="' + (o.aria || 'Κάτοψη νέας κοιτόστρωσης δίπλα σε υφιστάμενη κατασκευή με σημεία Α, Β, Γ') + '"');
  var yRows = [], xCols = [], j, k;
  for (j = 0; j < nrows; j++) yRows.push(raft / 2 + (j - 1) * sp);
  for (k = 0; k < ncols; k++) xCols.push(raft + k * sp);
  yRows.forEach(function (y) { h += SVG.line(X(xCols[0]), Y(y) - 2, X(xCols[ncols - 1]), Y(y) - 2, 'thin') + SVG.line(X(xCols[0]), Y(y) + 2, X(xCols[ncols - 1]), Y(y) + 2, 'thin'); });
  xCols.forEach(function (x) { h += SVG.line(X(x) - 2, Y(yRows[0] - 1.2), X(x) - 2, Y(yRows[nrows - 1] + 1.2), 'thin') + SVG.line(X(x) + 2, Y(yRows[0] - 1.2), X(x) + 2, Y(yRows[nrows - 1] + 1.2), 'thin'); });
  xCols.forEach(function (x) { yRows.forEach(function (y) { h += SVG.rect(X(x - 1), Y(y - 1), 2 * s, 2 * s, 'conc'); }); });
  h += SVG.rect(X(0), Y(0), raft * s, raft * s, 'hatch') + SVG.rect(X(0), Y(0), raft * s, raft * s, 'thin', 'stroke-width="2"');
  (o.overlays || []).forEach(function (v, i) {
    h += '<g data-k="' + (v.k || '') + '" class="a-fade" style="animation-delay:' + (i * 0.15) + 's">' + SVG.rect(X(v.x), Y(v.y), v.w * s, v.h * s, v.cls) +
      (v.label ? SVG.label(X(v.x + v.w / 2), Y(v.y + v.h / 2) + 4, v.label, 'math') : '') + '</g>';
  });
  (o.pts || []).forEach(function (pt) { h += '<g data-k="' + pt.name + '">' + SVG.point(X(pt.x), Y(pt.y), pt.name, pt.dx === undefined ? -6 : pt.dx, pt.dy === undefined ? 20 : pt.dy) + '</g>'; });
  h += SVG.dim(X(0), Y(0) - 8, X(raft), Y(0) - 8, fmt(raft, 2) + ' m', -16);
  h += SVG.dim(X(0) - 8, Y(0), X(0) - 8, Y(raft), fmt(raft, 2) + ' m', -10);
  for (k = 0; k < ncols - 1; k++) h += SVG.dim(X(xCols[k]), Y(yRows[0] - 1) - 6, X(xCols[k + 1]), Y(yRows[0] - 1) - 6, fmt(sp, 2), -12);
  h += SVG.text(X(raft / 2), Y(raft) + 18, 'ΝΕΑ ΚΑΤΑΣΚΕΥΗ', 'lbl-muted', 'text-anchor="middle"');
  h += SVG.text(X(raft + 1.5 * sp), Y(raft) + 36, 'ΥΦΙΣΤΑΜΕΝΗ ΚΑΤΑΣΚΕΥΗ', 'lbl-muted', 'text-anchor="middle"');
  return h + SVG.close();
}

/* Soil section. o: {Wm, Dm, s, layers:[{z1,z2,type,label,sub,k}], foot:{x1,x2,Df,label,k}, udl, wt, ticks:[], marks:[{x,z,name}], extra:fn(X,Y), sink:px, aria} */
function sectionFig(o) {
  var s = o.s, ml = o.ml || 66, mt = o.mt || 66, mr = o.mr || 16, mb = 12;
  var X = function (x) { return ml + x * s; }, Y = function (z) { return mt + z * s; };
  var W = ml + o.Wm * s + mr, H = mt + o.Dm * s + mb;
  var h = SVG.open(W, H, 'aria-label="' + (o.aria || 'Εδαφική τομή με θεμέλιο και εδαφικά στρώματα') + '"');
  o.layers.forEach(function (l) {
    h += '<g data-k="' + (l.k || '') + '">' + SVG.soil(X(0), Y(l.z1), o.Wm * s, (l.z2 - l.z1) * s, l.type) +
      (l.z1 > 0 ? SVG.line(X(0), Y(l.z1), X(o.Wm), Y(l.z1), 'thin dash') : '') +
      (l.label ? SVG.label(X(o.Wm) - 8, Y(l.z1) + 16, l.label, l.type === 'rock' ? 'lbl-w' : 'lbl-muted', 'end') : '') +
      (l.sub ? SVG.label(X(o.Wm) - 8, Y(l.z1) + 30, l.sub, l.type === 'rock' ? 'lbl-w' : 'lbl-muted', 'end') : '') + '</g>';
  });
  (o.ticks || []).forEach(function (z) { h += SVG.line(X(0) - 6, Y(z), X(0), Y(z), 'thin') + SVG.text(X(0) - 9, Y(z) + 4, fmt(z, 0) + ' m', 'lbl-muted', 'text-anchor="end"'); });
  if (o.foot) {
    var f = o.foot, t = Math.max(8, 0.5 * s);
    if (f.Df > 0) h += '<rect x="' + X(f.x1 - 0.3) + '" y="' + Y(0) + '" width="' + ((f.x2 - f.x1 + 0.6) * s) + '" height="' + (f.Df * s) + '" fill="var(--panel-2)"/>';
    h += '<g data-k="' + (f.k || 'foot') + '"' + (o.sink ? ' class="a-sink" style="--sink:' + o.sink + 'px"' : '') + '>' +
      SVG.rect(X(f.x1), Y(f.Df) - t, (f.x2 - f.x1) * s, t, 'conc') +
      SVG.udl(X(f.x1), X(f.x2), Y(f.Df) - t, 34, o.udl || 'q', '', Math.max(4, Math.round((f.x2 - f.x1) * s / 16))) + '</g>';
    h += SVG.dim(X(f.x1), Y(f.Df) + 6, X(f.x2), Y(f.Df) + 6, f.label || ('B = ' + fmt(f.x2 - f.x1, 1) + ' m'), 10);
    if (f.Df > 0) h += SVG.dim(X(f.x2 + 0.5), Y(0), X(f.x2 + 0.5), Y(f.Df), tsub('D', 'f') + '=' + fmt(f.Df, 1) + ' m', 10);
  }
  h += SVG.ground(X(0), X(o.Wm), Y(0), 'right');
  if (o.wt !== undefined) h += SVG.wt(X(1.4), Y(o.wt));
  (o.marks || []).forEach(function (mk) { h += '<g data-k="' + mk.name + '">' + SVG.circle(X(mk.x), Y(mk.z), 5, 'marker') + SVG.label(X(mk.x) + 10, Y(mk.z) + 4, mk.name + (mk.txt ? '  ' + mk.txt : ''), 'lbl-load', 'start') + '</g>'; });
  if (o.extra) h += o.extra(X, Y, s);
  return h + SVG.close();
}

/* Layering principle panel: three mini columns (1) depth z1 with E1, (2) depth z2 with E2, (3) depth z1 with E2 */
function layerPanel(o) {
  var s = o.s, cw = 92, gap = 22, ml = 40, mt = 40, W = ml + 3 * cw + 2 * gap + 10, H = mt + o.Dm * s + 56;
  var h = SVG.open(W, H, 'aria-label="Αρχή διαστρωμάτωσης: τρεις υπολογισμοί συμπίεσης"');
  h += SVG.text(W / 2, 16, 'Αρχή διαστρωμάτωσης: S = (1) + (2) − (3)', 'lbl-muted', 'text-anchor="middle"');
  o.items.forEach(function (it, i) {
    var x = ml + i * (cw + gap), Y = function (z) { return mt + z * s; };
    h += '<g data-k="' + it.k + '">' + SVG.rect(x, Y(0), cw, o.Dm * s, 'thin') + SVG.line(x, Y(o.zb), x + cw, Y(o.zb), 'thin dash');
    h += SVG.rect(x, Y(it.z1), cw, (it.z2 - it.z1) * s, it.cls);
    h += SVG.rect(x + cw * 0.3, Y(0) - 6, cw * 0.4, 6, 'conc');
    h += SVG.label(x + cw / 2, Y((it.z1 + it.z2) / 2) + 4, it.label, 'math');
    h += SVG.text(x + cw / 2, Y(o.Dm) + 16, '(' + (i + 1) + ') z = ' + fmt(it.z2, 0) + ' m', 'lbl-muted', 'text-anchor="middle"');
    h += SVG.text(x + cw / 2, Y(o.Dm) + 30, it.sub, 'lbl-muted', 'text-anchor="middle"');
    h += SVG.text(x + cw / 2, Y(o.Dm) + 46, it.res, 'math', 'text-anchor="middle"') + '</g>';
  });
  for (var z = 0; z <= o.Dm; z += o.tick || 2) h += SVG.text(ml - 6, mt + z * s + 4, z, 'lbl-muted', 'text-anchor="end"');
  return h + SVG.close();
}

/* ===================== ΑΣΚΗΣΗ 1 ===================== */
EX.push({
  id: 's1', num: 1, group: GRP_EL, source: 'Άσκηση 1',
  title: 'Καθίζηση εύκαμπτης κοιτόστρωσης και γωνιακή παραμόρφωση γειτονικής κατασκευής',
  tags: ['Steinbrenner', 'Επαλληλία ορθογωνίων', 'Γωνιακή παραμόρφωση'],
  statement: p('Κτήριο πρόκειται να θεμελιωθεί με σύστημα εύκαμπτης κοιτόστρωσης διαστάσεων 10 m × 10 m. Το κτήριο γειτνιάζει με υφιστάμενη κατασκευή θεμελιωμένη σε επιφανειακά μεμονωμένα θεμέλια 2 m × 2 m. Να υπολογίσετε:') +
    '<ol><li>Την καθίζηση στο σημείο Α με τη θεωρία ελαστικότητας.</li><li>Τη διαφορική καθίζηση και τη γωνιακή παραμόρφωση μεταξύ των σημείων Β και Γ. Σχολιάστε την τιμή.</li><li>Το μέγιστο επιτρεπόμενο φορτίο της νέας κατασκευής ώστε η γωνιακή παραμόρφωση Β–Γ να μην ξεπερνά το 1/500.</li></ol>' +
    '<ul><li>Φορτίο νέας κατασκευής ' + m('q = 100\\unit{kPa}') + ', φορτίο θεμελίων υφιστάμενης 200 kPa (δεν επηρεάζει τις πρόσθετες καθιζήσεις)</li><li>Βάθος θεμελίωσης ' + m('d = 0') + ', πάχος συμπιεστού εδάφους ' + m('H = 20\\unit{m}') + ', ' + m('E = 8\\unit{MPa}') + '</li></ul>',
  givens: [
    { key: 'q', label: 'Φορτίο νέας κατασκευής q', unit: 'kPa', value: 100, min: 20, max: 300, step: 5 },
    { key: 'E', label: 'Μέτρο ελαστικότητας E', unit: 'MPa', value: 8, min: 2, max: 40, step: 0.5, dec: 1 },
    { key: 'H', label: 'Πάχος συμπιεστού εδάφους H', unit: 'm', value: 20, min: 5, max: 60, step: 1 },
    { key: 'ilim', label: 'Επιτρεπόμενη γωνιακή παραμόρφωση 1/x', unit: '', value: 500, min: 150, max: 1000, step: 50 }
  ],
  compute: function (q) {
    var raft = 10, sp = 5, b = raft / 2, E = q.E * 1000, zB = q.H / b;
    var fA = fS(1, zB), IA = 4 * fA, SA = q.q * b * IA / E;
    var fB = fS(raft / b, zB), IB = 2 * fB, SB = q.q * b * IB / E;
    var f2 = fS((raft + sp) / b, zB), f3 = fS(sp / b, zB), IG = 2 * (f2 - f3), SG = q.q * b * IG / E;
    var dS = SB - SG, i = dS / sp, qmax = (1 / q.ilim) * sp * E / (b * (IB - IG));
    return { raft: raft, sp: sp, b: b, zB: zB, fA: fA, IA: IA, SA: SA, fB: fB, IB: IB, SB: SB, f2: f2, f3: f3, IG: IG, SG: SG, dS: dS, i: i, qmax: qmax, LB_B: raft / b, LB_2: (raft + sp) / b, LB_3: sp / b };
  },
  figure: function (q, r, step) {
    var ov = [], pts = [{ x: 5, y: 5, name: 'A' }, { x: 10, y: 5, name: 'B', dx: 6 }, { x: 15, y: 5, name: 'Γ', dx: 6 }], chartPts = [];
    if (step === 0) { ov = [{ x: 0, y: 0, w: 5, h: 5, cls: 'fill-blue', k: 'A' }, { x: 5, y: 0, w: 5, h: 5, cls: 'fill-blue', k: 'A' }, { x: 0, y: 5, w: 5, h: 5, cls: 'fill-blue', k: 'A' }, { x: 5, y: 5, w: 5, h: 5, cls: 'fill-blue', k: 'A', label: '4 × (5×5)' }]; chartPts = [{ LB: 1, zB: r.zB, name: 'A' }]; }
    else if (step === 1) { ov = [{ x: 0, y: 0, w: 10, h: 5, cls: 'fill-blue', k: 'B' }, { x: 0, y: 5, w: 10, h: 5, cls: 'fill-blue', k: 'B', label: '2 × (5×10)' }]; chartPts = [{ LB: r.LB_B, zB: r.zB, name: 'B' }]; }
    else if (step === 2) { ov = [{ x: 0, y: 0, w: 15, h: 5, cls: 'fill-green', k: 'Γ', label: '5×15 (+)' }, { x: 10, y: 0, w: 5, h: 5, cls: 'fill-red', k: 'Γ', label: '5×5 (−)' }]; chartPts = [{ LB: r.LB_2, zB: r.zB, name: 'Γ₁' }, { LB: r.LB_3, zB: r.zB, name: 'Γ₂' }]; }
    else if (step >= 3) { chartPts = [{ LB: 1, zB: r.zB, name: 'A' }, { LB: r.LB_B, zB: r.zB, name: 'B' }, { LB: r.LB_2, zB: r.zB, name: 'Γ₁' }]; }
    var plan = planFig({ raft: 10, sp: 5, overlays: ov, pts: pts });
    if (step >= 3) plan += sectionFig({ Wm: 20, Dm: q.H + 2, s: Math.min(12, 260 / (q.H + 2)), mt: 50, layers: [{ z1: 0, z2: q.H, type: 'sand', label: 'E = ' + fmt(q.E, 1) + ' MPa', sub: 'H = ' + fmt(q.H, 0) + ' m' }, { z1: q.H, z2: q.H + 2, type: 'rock', label: 'Ασυμπίεστο' }], foot: { x1: 2, x2: 12, Df: 0, label: '10 m' }, udl: 'q = ' + fmt(q.q, 0) + ' kPa', sink: 10, ticks: [0, q.H], marks: [{ x: 12, z: 0.2, name: 'B' }, { x: 17, z: 0.2, name: 'Γ' }] });
    return stack(plan, CHART.steinbrenner(chartPts));
  },
  figcap: 'Η λύση Steinbrenner δίνει την καθίζηση του γωνιακού σημείου ορθογωνίου. Κάθε σημείο αναλύεται σε ορθογώνια που έχουν γωνία στο σημείο.',
  quick: function (q, r) { return gl([[m('S_A'), fmt(r.SA * 1000, 0) + ' mm'], [m('S_B'), fmt(r.SB * 1000, 0) + ' mm'], [m('S_Γ'), fmt(r.SG * 1000, 0) + ' mm'], [m('i_{ΒΓ}'), '1/' + fmt(1 / r.i, 0)], [m('q_{max}'), '<b>' + fmt(r.qmax, 1) + ' kPa</b>']]); },
  steps: [
    {
      title: 'Σημείο Α (κέντρο): 4 ορθογώνια 5 × 5', hl: ['A'],
      cap: 'Το κέντρο Α είναι γωνία τεσσάρων ίσων τετραγώνων 5×5. Στο διάγραμμα: L/B = 1, z/B = 4.',
      body: function (q, r) {
        return eqs([
          ['B\' = L\' = 5\\unit{m},\\quad \\frac{L\'}{B\'} = 1,\\quad \\frac{z}{B\'} = \\frac{' + fmt(q.H, 0) + '}{5} = ' + fmt(r.zB, 1)],
          ['\\text{Διάγραμμα 2: } f = ' + fmt(r.fA, 3) + ' \\Rightarrow I_A = 4\\cdot f = \\hl{' + fmt(r.IA, 2) + '}'],
          ['S_A = \\frac{q\\,B\'}{E}\\,I_A = \\frac{' + fmt(q.q, 0) + '\\times 5}{' + fmt(q.E * 1000, 0) + '}\\times ' + fmt(r.IA, 2) + ' = \\hl{' + fmt(r.SA * 1000, 0) + '\\unit{mm}}']
        ]);
      }
    },
    {
      title: 'Σημείο Β (μέσο πλευράς): 2 ορθογώνια 5 × 10', hl: ['B'],
      cap: 'Το Β είναι γωνία δύο ορθογωνίων 5×10 (πάνω και κάτω από το Β).',
      body: function (q, r) {
        return eqs([
          ['B\' = 5\\unit{m},\\; L\' = 10\\unit{m},\\quad \\frac{L\'}{B\'} = 2,\\quad \\frac{z}{B\'} = ' + fmt(r.zB, 1)],
          ['f = ' + fmt(r.fB, 3) + ' \\Rightarrow I_B = 2\\cdot f = \\hl{' + fmt(r.IB, 2) + '}'],
          ['S_B = \\frac{q\\,B\'}{E}\\,I_B = ' + fmt(q.q * 5 / (q.E * 1000), 4) + '\\times ' + fmt(r.IB, 2) + ' = \\hl{' + fmt(r.SB * 1000, 0) + '\\unit{mm}}']
        ]) + note('Σημειώσεις: f ≈ 0.47, I<sub>B</sub> = 0.94, S<sub>B</sub> = 59 mm.');
      }
    },
    {
      title: 'Σημείο Γ (5 m έξω από την κοιτόστρωση): διαφορά ορθογωνίων', hl: ['Γ'],
      cap: 'Το Γ βρίσκεται εκτός φορτίου: ορθογώνιο 5×15 (που περιλαμβάνει το Γ ως γωνία) μείον το αφόρτιστο 5×5, επί 2 για πάνω και κάτω.',
      body: function (q, r) {
        return p('Το Γ δεν είναι γωνία φορτισμένου ορθογωνίου. Το "φορτίζουμε" νοητά μέχρι το Γ και αφαιρούμε το τμήμα που δεν υπάρχει:') + eqs([
          ['I_Γ = 2\\,(I_2 - I_3)'],
          ['I_2:\\; B\' = 5,\\; L\' = 15,\\; \\frac{L\'}{B\'} = 3,\\; \\frac{z}{B\'} = ' + fmt(r.zB, 1) + ' \\Rightarrow f_2 = ' + fmt(r.f2, 3)],
          ['I_3:\\; B\' = L\' = 5,\\; \\frac{L\'}{B\'} = 1,\\; \\frac{z}{B\'} = ' + fmt(r.zB, 1) + ' \\Rightarrow f_3 = ' + fmt(r.f3, 3)],
          ['I_Γ = 2\\,(' + fmt(r.f2, 3) + ' - ' + fmt(r.f3, 3) + ') = \\hl{' + fmt(r.IG, 3) + '}'],
          ['S_Γ = \\frac{q\\,B\'}{E}\\,I_Γ = ' + fmt(q.q * 5 / (q.E * 1000), 4) + '\\times ' + fmt(r.IG, 3) + ' = \\hl{' + fmt(r.SG * 1000, 0) + '\\unit{mm}}']
        ]) + note('Σημειώσεις: f<sub>2</sub> ≈ 0.48, f<sub>3</sub> ≈ 0.39, I<sub>Γ</sub> = 0.18, S<sub>Γ</sub> = 11 mm.');
      }
    },
    {
      title: 'Διαφορική καθίζηση και γωνιακή παραμόρφωση Β–Γ', hl: ['B', 'Γ', 'foot'],
      cap: 'Η κοιτόστρωση "τραβά" το Β πολύ περισσότερο από το Γ: το υφιστάμενο κτήριο στρεβλώνεται.',
      body: function (q, r) {
        var ok = r.i <= 1 / q.ilim;
        return eqs([
          ['ΔS_{ΒΓ} = S_B - S_Γ = ' + fmt(r.SB * 1000, 0) + ' - ' + fmt(r.SG * 1000, 0) + ' = \\hl{' + fmt(r.dS * 1000, 0) + '\\unit{mm}}'],
          ['i = \\frac{ΔS_{ΒΓ}}{L_{ΒΓ}} = \\frac{' + fmt(r.dS * 1000, 0) + '}{5000} \\approx \\hl{\\frac{1}{' + fmt(1 / r.i, 0) + '}} ' + (ok ? '\\le' : '\\gg') + ' \\frac{1}{' + q.ilim + '}']
        ]) + p(ok ? '<b style="color:var(--ok)">Αποδεκτή</b> γωνιακή παραμόρφωση.' : '<b style="color:var(--warn)">Μη αποδεκτή:</b> το όριο 1/500 αντιστοιχεί σε έναρξη ρηγμάτωσης τοιχοποιίας. Η γειτονική κατασκευή θα υποστεί βλάβες.');
      }
    },
    {
      title: 'Μέγιστο φορτίο q ώστε i ≤ 1/' + '500', hl: ['B', 'Γ'],
      body: function (q, r) {
        return p('Οι καθιζήσεις είναι ανάλογες του q, άρα:') + eqs([
          ['\\frac{1}{' + q.ilim + '} = \\frac{ΔS_{ΒΓ}}{L_{ΒΓ}} = \\frac{q\\,B\'\\,(I_B - I_Γ)}{E\\,L_{ΒΓ}} = \\frac{q\\times 5\\times(' + fmt(r.IB, 2) + ' - ' + fmt(r.IG, 2) + ')}{' + fmt(q.E * 1000, 0) + '\\times 5}'],
          ['\\Rightarrow q_{max} = \\hl{' + fmt(r.qmax, 1) + '\\unit{kPa}}']
        ]) + note('Σημειώσεις: q = 10/0.48 ≈ 20.8 kPa. Πρακτικά: τόσο μικρό φορτίο σημαίνει ότι η εύκαμπτη κοιτόστρωση δίπλα σε υφιστάμενο κτήριο δεν είναι κατάλληλη λύση.');
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('S_A = ' + fmt(r.SA * 1000, 0) + '\\unit{mm},\\quad i_{ΒΓ} \\approx 1/' + fmt(1 / r.i, 0) + ',\\quad q_{max} \\approx ' + fmt(r.qmax, 1) + '\\unit{kPa}') + '</div>'; }
});

/* ===================== ΑΣΚΗΣΗ 2 ===================== */
EX.push({
  id: 's2', num: 2, group: GRP_EL, source: 'Άσκηση 2',
  title: 'Άκαμπτο θεμέλιο 3 × 3 σε δύο στρώματα: αρχή της διαστρωμάτωσης',
  tags: ['Steinbrenner', 'Αρχή διαστρωμάτωσης', 'Διόρθωση ακαμψίας'],
  statement: p('Να υπολογιστεί με τη μέθοδο της αρχής της διαστρωμάτωσης η καθίζηση επιφανειακού άκαμπτου θεμελίου 3 m × 3 m που φέρει συνολικό φορτίο 90 t. Το έδαφος να θεωρηθεί ασυμπίεστο σε βάθος μεγαλύτερο των 12 m.') +
    table(['Βάθος', 'Μέτρο ελαστικότητας'], [['0 – 6 m', m('E_1 = 2\\unit{MPa}')], ['6 – 12 m', m('E_2 = 4\\unit{MPa}')]]) +
    p('Οι υπολογισμοί να γίνουν στο κέντρο του θεμελίου με τις ελαστικές λύσεις (Διάγραμμα 2).'),
  givens: [
    { key: 'P', label: 'Συνολικό φορτίο P', unit: 'kN', value: 900, min: 300, max: 3000, step: 50 },
    { key: 'B', label: 'Πλευρά θεμελίου B', unit: 'm', value: 3, min: 1.5, max: 6, step: 0.5, dec: 1 },
    { key: 'E1', label: 'E₁ (0–6 m)', unit: 'MPa', value: 2, min: 1, max: 20, step: 0.5, dec: 1 },
    { key: 'E2', label: 'E₂ (6–12 m)', unit: 'MPa', value: 4, min: 1, max: 40, step: 0.5, dec: 1 },
    { key: 'rig', label: 'Συντελεστής ακαμψίας', unit: '', value: 0.75, min: 0.6, max: 1, step: 0.05, dec: 2 }
  ],
  compute: function (q) {
    var z1 = 6, z2 = 12, b = q.B / 2, qq = q.P / (q.B * q.B);
    var f1 = fS(1, z1 / b), f2a = fS(1, z2 / b), f2b = f1;
    var dh1 = 4 * qq * b * f1 / (q.E1 * 1000), dh2a = 4 * qq * b * f2a / (q.E2 * 1000), dh2b = 4 * qq * b * f2b / (q.E2 * 1000);
    var dh2 = dh2a - dh2b, S = dh1 + dh2, Sr = q.rig * S;
    return { qq: qq, b: b, z1: z1, z2: z2, f1: f1, f2a: f2a, f2b: f2b, dh1: dh1, dh2a: dh2a, dh2b: dh2b, dh2: dh2, S: S, Sr: Sr };
  },
  figure: function (q, r, step) {
    var sec = sectionFig({ Wm: 14, Dm: 13.5, s: 20, layers: [{ z1: 0, z2: 6, type: 'sand', label: 'E₁ = ' + fmt(q.E1, 1) + ' MPa', k: 'L1' }, { z1: 6, z2: 12, type: 'clay', label: 'E₂ = ' + fmt(q.E2, 1) + ' MPa', k: 'L2' }, { z1: 12, z2: 13.5, type: 'rock', label: 'Ασυμπίεστο έδαφος' }],
      foot: { x1: 7 - q.B / 2, x2: 7 + q.B / 2, Df: 0, label: 'B = ' + fmt(q.B, 1) + ' m' }, udl: 'q = ' + fmt(r.qq, 0) + ' kPa', ticks: [0, 6, 12], sink: step >= 4 ? 14 : 0,
      extra: function (X, Y) { return step >= 0 ? '<g data-k="c1">' + SVG.rect(X(7 - q.B / 2), Y(0), q.B / 2 * 20, q.B / 2 * 20, 'fill-blue') + SVG.label(X(7 - q.B / 4), Y(q.B / 4) + 4, 'B/2', 'math') + '</g>' : ''; } });
    var dm = 2;
    var panel = layerPanel({ s: 20, Dm: 12, zb: 6, tick: 2, items: [
      { k: 'c1', z1: 0, z2: 6, cls: 'fill-blue', label: 'E₁', sub: 'z/B\' = ' + fmt(6 / r.b, 1), res: 'Δh₁ = ' + fmt(r.dh1 * 1000, 0) + ' mm' },
      { k: 'c2', z1: 0, z2: 12, cls: 'fill-green', label: 'E₂', sub: 'z/B\' = ' + fmt(12 / r.b, 1), res: 'Δh₂ₐ = ' + fmt(r.dh2a * 1000, 1) + ' mm' },
      { k: 'c3', z1: 0, z2: 6, cls: 'fill-red', label: 'E₂', sub: 'z/B\' = ' + fmt(6 / r.b, 1), res: 'Δh₂ᵦ = ' + fmt(r.dh2b * 1000, 1) + ' mm' }] });
    return grid2(sec, panel);
  },
  figcap: 'Αρχή διαστρωμάτωσης: η συμπίεση του 2ου στρώματος = (συμπίεση όλου του βάθους με E₂) − (συμπίεση του 1ου στρώματος με E₂).',
  quick: function (q, r) { return gl([[m('q'), fmt(r.qq, 0) + ' kPa'], [m('Δh_1'), fmt(r.dh1 * 1000, 0) + ' mm'], [m('Δh_2'), fmt(r.dh2 * 1000, 1) + ' mm'], [m('S_{flex}'), fmt(r.S * 1000, 0) + ' mm'], [m('S_{rigid}'), '<b>' + fmt(r.Sr * 1000, 0) + ' mm</b>']]); },
  steps: [
    {
      title: 'Τάση και γεωμετρία επαλληλίας', hl: ['c1', 'foot'],
      cap: 'Η λύση δίνει καθίζηση γωνίας. Για το κέντρο: 4 τετράγωνα πλευράς B/2 = ' + '1.5 m.',
      body: function (q, r) { return eqs([['q = \\frac{P}{B^2} = \\frac{' + fmt(q.P, 0) + '}{' + fmt(q.B, 1) + '^2} = \\hl{' + fmt(r.qq, 0) + '\\unit{kPa}}'], ['\\text{Κέντρο: } 4\\times\\text{τετράγωνο } B\' = ' + fmt(r.b, 2) + '\\unit{m},\\quad Δh_i = 4\\cdot\\frac{q\\,B\'}{E_i}\\,I_i']]); }
    },
    {
      title: 'Συμπίεση 1ου στρώματος (z = 6 m, E₁)', hl: ['c1', 'L1'],
      body: function (q, r) { return eqs([['\\frac{L}{B} = 1,\\quad \\frac{z}{B\'} = \\frac{6}{' + fmt(r.b, 2) + '} = ' + fmt(6 / r.b, 1) + ' \\Rightarrow I_1 = ' + fmt(r.f1, 3)], ['Δh_1 = 4\\cdot\\frac{' + fmt(r.qq, 0) + '\\times ' + fmt(r.b, 2) + '}{' + fmt(q.E1 * 1000, 0) + '}\\times ' + fmt(r.f1, 3) + ' = \\hl{' + fmt(r.dh1 * 1000, 0) + '\\unit{mm}}']]) + note('Σημειώσεις: I = 0.4 (διάγραμμα) → Δh₁ = 120 mm.'); }
    },
    {
      title: 'Συμπίεση 2ου στρώματος: αρχή διαστρωμάτωσης', hl: ['c2', 'c3', 'L2'],
      cap: 'Το στρώμα 2 δεν ξεκινά από την επιφάνεια: υπολογίζουμε όλο το βάθος 12 m με E₂ και αφαιρούμε τα πρώτα 6 m με E₂.',
      body: function (q, r) {
        return eqs([
          ['Δh_2 = Δh_{2,α}(z=12,\\,E_2) - Δh_{2,β}(z=6,\\,E_2)'],
          ['Δh_{2,α}:\\; \\frac{z}{B\'} = ' + fmt(12 / r.b, 1) + ' \\Rightarrow I = ' + fmt(r.f2a, 3) + ',\\quad Δh_{2,α} = 4\\cdot\\frac{' + fmt(r.qq, 0) + '\\times ' + fmt(r.b, 2) + '}{' + fmt(q.E2 * 1000, 0) + '}\\times ' + fmt(r.f2a, 3) + ' = ' + fmt(r.dh2a * 1000, 1) + '\\unit{mm}'],
          ['Δh_{2,β}:\\; \\frac{z}{B\'} = ' + fmt(6 / r.b, 1) + ' \\Rightarrow I = ' + fmt(r.f2b, 3) + ',\\quad Δh_{2,β} = ' + fmt(r.dh2b * 1000, 1) + '\\unit{mm}'],
          ['Δh_2 = ' + fmt(r.dh2a * 1000, 1) + ' - ' + fmt(r.dh2b * 1000, 1) + ' = \\hl{' + fmt(r.dh2 * 1000, 1) + '\\unit{mm}}']
        ]) + note('Σημειώσεις: I = 0.45 και 0.40 → Δh₂ = 67.5 − 60 = 7.5 mm.');
      }
    },
    {
      title: 'Καθίζηση στο κέντρο (εύκαμπτο)', hl: ['c1', 'c2', 'c3'],
      body: function (q, r) { return eq('S = Δh_1 + Δh_2 = ' + fmt(r.dh1 * 1000, 0) + ' + ' + fmt(r.dh2 * 1000, 1) + ' = \\hl{' + fmt(r.S * 1000, 0) + '\\unit{mm}}', 'σημειώσεις: 127.5 mm'); }
    },
    {
      title: 'Διόρθωση ακαμψίας', hl: ['foot'],
      cap: 'Το άκαμπτο θεμέλιο καθιζάνει ομοιόμορφα, περίπου 75–80 % της καθίζησης του κέντρου του εύκαμπτου.',
      body: function (q, r) { return eq('S_{rigid} \\approx ' + fmt(q.rig, 2) + '\\cdot S = ' + fmt(q.rig, 2) + '\\times ' + fmt(r.S * 1000, 0) + ' = \\hl{' + fmt(r.Sr * 1000, 0) + '\\unit{mm}}', 'σημειώσεις: 96 mm'); }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('S_{rigid} \\approx ' + fmt(r.Sr * 1000, 0) + '\\unit{mm}') + '</div><p>Το μαλακό επιφανειακό στρώμα (E₁) δίνει το ' + fmt(100 * r.dh1 / r.S, 0) + ' % της καθίζησης.</p>'; }
});

/* ===================== ΑΣΚΗΣΗ 3 ===================== */
EX.push({
  id: 's3', num: 3, group: GRP_EL, source: 'Άσκηση 3',
  title: 'Άκαμπτη πεδιλοδοκός πλάτους 4 m σε δύο στρώματα',
  tags: ['Steinbrenner', 'Θεμελιολωρίδα L/B = ∞', 'Αρχή διαστρωμάτωσης'],
  statement: p('Να υπολογίσετε την καθίζηση άκαμπτης πεδιλοδοκού πλάτους 4 m σύμφωνα με τη θεωρία ελαστικότητας. Το έδαφος σε βάθος μεγαλύτερο των 12 m να θεωρηθεί ασυμπίεστο.') +
    '<ul><li>Κατακόρυφο φορτίο ' + m('q = 100\\unit{kPa}') + ', βάθος θεμελίωσης ' + m('d = 0') + '</li><li>' + m('E = 4\\unit{MPa}') + ' για 0 – 4 m, ' + m('E = 8\\unit{MPa}') + ' για 4 – 12 m</li></ul>',
  givens: [
    { key: 'q', label: 'Φορτίο q', unit: 'kPa', value: 100, min: 20, max: 400, step: 10 },
    { key: 'B', label: 'Πλάτος πεδιλοδοκού B', unit: 'm', value: 4, min: 1, max: 8, step: 0.5, dec: 1 },
    { key: 'E1', label: 'E₁ (0–4 m)', unit: 'MPa', value: 4, min: 1, max: 30, step: 0.5, dec: 1 },
    { key: 'E2', label: 'E₂ (4–12 m)', unit: 'MPa', value: 8, min: 1, max: 60, step: 0.5, dec: 1 },
    { key: 'rig', label: 'Συντελεστής ακαμψίας', unit: '', value: 0.8, min: 0.6, max: 1, step: 0.05, dec: 2 }
  ],
  compute: function (q) {
    var z1 = 4, z2 = 12, b = q.B / 2, I1 = fStrip(z1 / b), I2 = fStrip(z2 / b), I2b = I1;
    var dh1 = 2 * q.q * b * I1 / (q.E1 * 1000), dh2 = 2 * q.q * b * (I2 - I2b) / (q.E2 * 1000), S = dh1 + dh2, Sr = q.rig * S;
    return { b: b, I1: I1, I2: I2, I2b: I2b, dh1: dh1, dh2: dh2, S: S, Sr: Sr, dh2a: 2 * q.q * b * I2 / (q.E2 * 1000), dh2b: 2 * q.q * b * I2b / (q.E2 * 1000), I1x: fS(1000, z1 / b), I2x: fS(1000, z2 / b) };
  },
  figure: function (q, r, step) {
    var sec = sectionFig({ Wm: 14, Dm: 13.5, s: 20, layers: [{ z1: 0, z2: 4, type: 'sand', label: 'E₁ = ' + fmt(q.E1, 1) + ' MPa', k: 'L1' }, { z1: 4, z2: 12, type: 'clay', label: 'E₂ = ' + fmt(q.E2, 1) + ' MPa', k: 'L2' }, { z1: 12, z2: 13.5, type: 'rock', label: 'Ασυμπίεστο έδαφος' }],
      foot: { x1: 7 - q.B / 2, x2: 7 + q.B / 2, Df: 0, label: 'B = ' + fmt(q.B, 1) + ' m' }, udl: 'q = ' + fmt(q.q, 0) + ' kPa', ticks: [0, 4, 12], sink: step >= 3 ? 12 : 0,
      extra: function (X, Y) { return '<g data-k="c1">' + SVG.rect(X(7 - q.B / 2), Y(0), q.B / 2 * 20, 0.6 * 20, 'fill-blue') + SVG.label(X(7 - q.B / 4), Y(0.3) + 4, 'B/2', 'math') + SVG.line(X(7), Y(-0.1), X(7), Y(1.2), 'thin dash') + '</g>'; } });
    var panel = layerPanel({ s: 20, Dm: 12, zb: 4, tick: 2, items: [
      { k: 'c1', z1: 0, z2: 4, cls: 'fill-blue', label: 'E₁', sub: 'z/B\' = ' + fmt(4 / r.b, 1), res: 'Δh₁ = ' + fmt(r.dh1 * 1000, 0) + ' mm' },
      { k: 'c2', z1: 0, z2: 12, cls: 'fill-green', label: 'E₂', sub: 'z/B\' = ' + fmt(12 / r.b, 1), res: fmt(r.dh2a * 1000, 0) + ' mm' },
      { k: 'c3', z1: 0, z2: 4, cls: 'fill-red', label: 'E₂', sub: 'z/B\' = ' + fmt(4 / r.b, 1), res: fmt(r.dh2b * 1000, 0) + ' mm' }] });
    return grid2(sec, panel);
  },
  figcap: 'Λωρίδα (L/B = ∞): η καθίζηση στο κέντρο = 2 × καθίζηση γωνίας ημι-λωρίδας πλάτους B/2.',
  quick: function (q, r) { return gl([[m('I_1\\,(z/B\'=' + fmt(4 / r.b, 0) + ')'), fmt(r.I1, 3)], [m('I_2\\,(z/B\'=' + fmt(12 / r.b, 0) + ')'), fmt(r.I2, 3)], [m('Δh_1'), fmt(r.dh1 * 1000, 0) + ' mm'], [m('Δh_2'), fmt(r.dh2 * 1000, 0) + ' mm'], [m('S_{rigid}'), '<b>' + fmt(r.Sr * 1000, 0) + ' mm</b>']]); },
  steps: [
    {
      title: 'Γεωμετρία: ημι-λωρίδα B′ = B/2, L/B = ∞', hl: ['c1', 'foot'],
      body: function (q, r) { return p('Ζητείται η καθίζηση στο κέντρο. Υπολογίζουμε για λωρίδα πλάτους ' + m('B\' = ' + fmt(r.b, 1) + '\\unit{m}') + ' (καμπύλη L/B = ∞ του διαγράμματος) και πολλαπλασιάζουμε × 2.') + eq('Δh_i = \\frac{q\\,B\'}{E_i}\\cdot 2\\cdot I_i'); }
    },
    {
      title: 'Συμπίεση 1ου στρώματος (0 – 4 m, E₁)', hl: ['c1', 'L1'],
      body: function (q, r) { return eqs([['\\frac{z}{B\'} = \\frac{4}{' + fmt(r.b, 1) + '} = ' + fmt(4 / r.b, 1) + ' \\Rightarrow I_1 = ' + fmt(r.I1, 3)], ['Δh_1 = \\frac{' + fmt(q.q, 0) + '\\times ' + fmt(r.b, 1) + '}{' + fmt(q.E1 * 1000, 0) + '}\\cdot 2\\cdot ' + fmt(r.I1, 3) + ' = \\hl{' + fmt(r.dh1 * 1000, 0) + '\\unit{mm}}']]) + note('Τιμή από το Διάγραμμα 2 (καμπύλη L/B = ∞). Η κλειστή λύση Steinbrenner για ν = 0.3 δίνει ' + fmt(r.I1x, 2) + '· διατηρούμε την τιμή του διαγράμματος όπως στις σημειώσεις.'); }
    },
    {
      title: 'Συμπίεση 2ου στρώματος (4 – 12 m, E₂): αρχή διαστρωμάτωσης', hl: ['c2', 'c3', 'L2'],
      body: function (q, r) { return eqs([['\\frac{z}{B\'} = \\frac{12}{' + fmt(r.b, 1) + '} = ' + fmt(12 / r.b, 1) + ' \\Rightarrow I_2 = ' + fmt(r.I2, 3) + ',\\qquad \\frac{z}{B\'} = ' + fmt(4 / r.b, 1) + ' \\Rightarrow I\'_2 = ' + fmt(r.I2b, 3)], ['Δh_2 = \\frac{q\\,B\'}{E_2}\\cdot 2\\cdot (I_2 - I\'_2) = \\frac{' + fmt(q.q, 0) + '\\times ' + fmt(r.b, 1) + '}{' + fmt(q.E2 * 1000, 0) + '}\\cdot 2\\cdot(' + fmt(r.I2, 3) + ' - ' + fmt(r.I2b, 3) + ') = \\hl{' + fmt(r.dh2 * 1000, 0) + '\\unit{mm}}']]) + note('Τιμές διαγράμματος (L/B = ∞). Κλειστή λύση: I₂ = ' + fmt(r.I2x, 2) + ', I′₂ = ' + fmt(r.I1x, 2) + '.'); }
    },
    {
      title: 'Συνολική καθίζηση και διόρθωση ακαμψίας', hl: ['foot'],
      body: function (q, r) { return eqs([['S_{flex} = Δh_1 + Δh_2 = ' + fmt(r.dh1 * 1000, 0) + ' + ' + fmt(r.dh2 * 1000, 0) + ' = ' + fmt(r.S * 1000, 0) + '\\unit{mm}'], ['S_{rigid} \\approx ' + fmt(q.rig * 100, 0) + '\\%\\cdot S_{flex} = \\hl{' + fmt(r.Sr * 1000, 0) + '\\unit{mm}}']]) + note('Σημειώσεις: 36 + 14 = 50 mm, άκαμπτο 80 % → 40 mm.'); }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('S_{rigid} \\approx ' + fmt(r.Sr * 1000, 0) + '\\unit{mm}') + '</div>'; }
});

/* ===================== ΑΣΚΗΣΗ 4 ===================== */
/* Linearly increasing modulus: E(z) = E0 (1 + K z/H). The influence factor depends on K and ν (GEO.steinFK),
   S_corner = q B' f / E0, read at z/B' = H/B'. K is the same for every sub-rectangle of the superposition. */
EX.push({
  id: 's4', num: 4, group: GRP_EL, source: 'Άσκηση 4',
  title: 'Κοιτόστρωση σε αστράγγιστες συνθήκες με γραμμικά αυξανόμενο E',
  tags: ['Steinbrenner', 'E(z) γραμμικό (K), ν = 0.5', 'Γωνιακή παραμόρφωση'],
  statement: p('Κτήριο πρόκειται να θεμελιωθεί με εύκαμπτη κοιτόστρωση 10 m × 10 m, δίπλα σε υφιστάμενη κατασκευή με μεμονωμένα θεμέλια 2 m × 2 m (κάνναβος 4 m). Να υπολογίσετε:') +
    '<ol><li>Την καθίζηση στο κέντρο της κοιτόστρωσης με τη θεωρία ελαστικότητας σε αστράγγιστες συνθήκες.</li><li>Τη διαφορική καθίζηση και τη γωνιακή παραμόρφωση μεταξύ Β και Γ.</li><li>Το μέγιστο φορτίο ώστε η γωνιακή παραμόρφωση Β–Γ να μην ξεπερνά το 1/500.</li></ol>' +
    '<ul><li>' + m('q = 100\\unit{kPa}') + ', ' + m('d = 0') + ', ' + m('H = 20\\unit{m}') + '</li><li>Γραμμικά αυξανόμενο μέτρο ελαστικότητας: ' + m('E_0 = 4\\unit{MPa}') + ' στην επιφάνεια, ' + m('E_H = 8\\unit{MPa}') + ' στα 20 m</li>' +
    '<li>Να χρησιμοποιηθούν τα νομογραφήματα για γραμμικά αυξανόμενο μέτρο ελαστικότητας (Παράρτημα, στο Τυπολόγιο) με ν = 0.5.</li></ul>',
  givens: [
    { key: 'q', label: 'Φορτίο q', unit: 'kPa', value: 100, min: 20, max: 300, step: 5 },
    { key: 'E0', label: 'E₀ στην επιφάνεια', unit: 'MPa', value: 4, min: 1, max: 20, step: 0.5, dec: 1 },
    { key: 'EH', label: 'E στο βάθος H', unit: 'MPa', value: 8, min: 1, max: 40, step: 0.5, dec: 1 },
    { key: 'H', label: 'Πάχος συμπιεστού εδάφους H', unit: 'm', value: 20, min: 5, max: 60, step: 1 },
    { key: 'nu', label: 'Δείκτης Poisson ν (αστράγγιστες: 0.5)', unit: '', value: 0.5, min: 0, max: 0.5, step: 0.1, dec: 1 }
  ],
  compute: function (q) {
    var raft = 10, sp = 4, b = 5, E = q.E0 * 1000, K = (q.EH - q.E0) / q.E0, nu = q.nu;
    var r3 = function (x) { return Math.round(x * 1000) / 1000; };          // readings are taken with three decimals
    var fK = function (LB, zB) { return r3(GEO.steinFK(LB, zB, K, nu)); };
    var fA = fK(1, q.H / b), SA = 4 * q.q * b * fA / E;
    var fA0 = r3(GEO.steinF(1, q.H / b, nu)), SA0 = 4 * q.q * b * fA0 / E;  // homogeneous soil with E = E0 (K = 0)
    var fB = fK(2, q.H / b), SB = 2 * q.q * b * fB / E;
    var B1 = 5, L1 = raft + sp, f1 = fK(L1 / B1, q.H / B1);                 // ΗΓΔΖ 14 x 5
    var B2 = sp, L2 = 5, f2 = fK(L2 / B2, q.H / B2);                        // ΕΔΓΒ 4 x 5
    var SG = 2 * q.q * (B1 * f1 - B2 * f2) / E;
    var dS = SB - SG, i = dS / sp, qmax = (1 / 500) * sp * E / (2 * b * fB - 2 * (B1 * f1 - B2 * f2));
    return { K: K, nu: nu, b: b, zB: q.H / b, fA: fA, SA: SA, fA0: fA0, SA0: SA0, fB: fB, SB: SB, f1: f1, f2: f2, B1: B1, L1: L1, B2: B2, L2: L2, SG: SG, dS: dS, i: i, qmax: qmax, sp: sp };
  },
  figure: function (q, r, step) {
    var ov = [], pts = [{ x: 5, y: 5, name: 'A' }, { x: 10, y: 5, name: 'B', dx: 6 }, { x: 14, y: 5, name: 'Γ', dx: 6 }], chartPts = [];
    if (step === 1) { ov = [{ x: 0, y: 0, w: 5, h: 5, cls: 'fill-blue', k: 'A' }, { x: 5, y: 0, w: 5, h: 5, cls: 'fill-blue', k: 'A' }, { x: 0, y: 5, w: 5, h: 5, cls: 'fill-blue', k: 'A' }, { x: 5, y: 5, w: 5, h: 5, cls: 'fill-blue', k: 'A', label: '4 × (5×5)' }]; chartPts = [{ LB: 1, zB: r.zB, name: 'A' }]; }
    else if (step === 2) { ov = [{ x: 0, y: 0, w: 10, h: 5, cls: 'fill-blue', k: 'B' }, { x: 0, y: 5, w: 10, h: 5, cls: 'fill-blue', k: 'B', label: '2 × (5×10)' }]; chartPts = [{ LB: 2, zB: r.zB, name: 'B' }]; }
    else if (step === 3) { ov = [{ x: 0, y: 0, w: 14, h: 5, cls: 'fill-green', k: 'Γ', label: 'ΗΓΔΖ 14×5 (+)' }, { x: 10, y: 0, w: 4, h: 5, cls: 'fill-red', k: 'Γ', label: 'ΕΔΓΒ' }]; chartPts = [{ LB: r.L1 / r.B1, zB: q.H / r.B1, name: 'ΗΓΔΖ' }, { LB: r.L2 / r.B2, zB: q.H / r.B2, name: 'ΕΔΓΒ' }]; }
    else chartPts = [{ LB: 1, zB: r.zB, name: 'A' }, { LB: 2, zB: r.zB, name: 'B' }];
    var plan = planFig({ raft: 10, sp: 4, overlays: ov, pts: pts });
    // E(z) profile section
    var sec = sectionFig({ Wm: 22, Dm: q.H + 2, s: Math.min(11, 240 / (q.H + 2)), mt: 56, layers: [{ z1: 0, z2: q.H, type: 'sand' }, { z1: q.H, z2: q.H + 2, type: 'rock', label: 'Ασυμπίεστο' }], foot: { x1: 2, x2: 12, Df: 0, label: '10 m' }, udl: 'q = ' + fmt(q.q, 0) + ' kPa', ticks: [0, q.H],
      extra: function (X, Y, s) {
        var x0 = X(13), k = 5 * s / Math.max(q.EH, q.E0, 1); // px per MPa
        var g = '<g data-k="E">' + SVG.line(x0, Y(0), x0, Y(q.H), 'thin') + SVG.line(x0, Y(0), x0 + 6 * s, Y(0), 'axis', 'marker-end="url(#arF)"') + SVG.text(x0 + 6 * s + 4, Y(0) + 4, 'E', 'math');
        g += SVG.line(x0 + q.E0 * k, Y(0), x0 + q.EH * k, Y(q.H), 'curve hot a-draw');
        g += SVG.circle(x0 + q.E0 * k, Y(0), 4, 'marker') + SVG.label(x0 + q.E0 * k - 6, Y(0) + 18, 'E₀ = ' + fmt(q.E0, 1) + ' MPa', 'lbl-load', 'end');
        g += SVG.circle(x0 + q.EH * k, Y(q.H), 4, 'marker') + SVG.label(x0 + q.EH * k - 6, Y(q.H) - 8, 'E(' + fmt(q.H, 0) + ' m) = ' + fmt(q.EH, 1) + ' MPa', 'lbl-load', 'end');
        return g + '</g>';
      } });
    return stack(grid2(plan, sec), CHART.steinbrenner(chartPts, { K: r.K, nu: r.nu, dec: 3 }));
  },
  figcap: 'Το μέτρο ελαστικότητας αυξάνει γραμμικά με το βάθος, από E₀ στην επιφάνεια σε E<sub>H</sub> στο βάθος H. Το νομογράφημα σχεδιάζεται για τα K και ν του προβλήματος.',
  quick: function (q, r) { return gl([[m('K = (E_H - E_0)/E_0'), fmt(r.K, 2)], [m('ν'), fmt(r.nu, 1)], [m('S_A'), fmt(r.SA * 1000, 0) + ' mm'], [m('S_B'), fmt(r.SB * 1000, 1) + ' mm'], [m('S_Γ'), fmt(r.SG * 1000, 1) + ' mm'], [m('i_{ΒΓ}'), '1/' + fmt(1 / r.i, 0)], [m('q_{max}'), '<b>' + fmt(r.qmax, 1) + ' kPa</b>']]); },
  steps: [
    {
      title: 'Κλίση του μέτρου ελαστικότητας και επιλογή νομογραφήματος', hl: ['E'],
      cap: 'Η κλίση του E(z) εκφράζεται με τον λόγο K. Για K = 1 το E διπλασιάζεται στο βάθος H.',
      body: function (q, r) {
        return p('<b>Ορισμοί.</b> Το συμπιεστό στρώμα έχει πάχος H και το μέτρο ελαστικότητάς του αυξάνει γραμμικά με το βάθος z κάτω από τη στάθμη θεμελίωσης, από ' + m('E_0') + ' (z = 0) σε ' + m('E_H') + ' (z = H):') +
          eqs([['E(z) = E_0\\left(1 + K\\,\\frac{z}{H}\\right),\\qquad K = \\frac{E_H - E_0}{E_0}']]) +
          p('Η καθίζηση του γωνιακού σημείου εύκαμπτου ορθογωνίου B′ × L′ με ομοιόμορφη τάση q είναι:') +
          eqs([['S_{γωνίας} = \\frac{q\\,B\'}{E_0}\\,f\\left(\\frac{L\'}{B\'},\\frac{H}{B\'},\\,K,\\,ν\\right)']]) +
          '<ul><li><b>K</b>: αδιάστατη κλίση του μέτρου ελαστικότητας ως προς το πάχος H του στρώματος. Για K = 0 το έδαφος είναι ομοιογενές (λύση Steinbrenner).</li>' +
          '<li>' + m('E_0') + ': μέτρο ελαστικότητας στη στάθμη θεμελίωσης· αυτό μπαίνει στον τύπο. Η αύξηση του E με το βάθος περιέχεται στον f.</li>' +
          '<li><b>B′, L′</b>: μικρή και μεγάλη πλευρά του ορθογωνίου που έχει το σημείο υπολογισμού ως γωνία.</li>' +
          '<li><b>f</b>: συντελεστής επιρροής, από τα νομογραφήματα για τα K και ν του προβλήματος· διαβάζεται με z/B′ = H/B′ (συνολικό πάχος του στρώματος) και L/B = L′/B′.</li>' +
          '<li><b>ν</b>: δείκτης Poisson. Σε αστράγγιστες συνθήκες (κορεσμένη άργιλος, φόρτιση χωρίς μεταβολή όγκου) ν = 0.5 και το E είναι το αστράγγιστο μέτρο E<sub>u</sub>.</li>' +
          '<li><b>Επαλληλία</b>: όπως στη λύση Steinbrenner (κέντρο = 4 ορθογώνια, μέσο πλευράς = 2, σημείο εκτός φορτίου = διαφορά ορθογωνίων). Το K είναι το ίδιο για όλα τα επιμέρους ορθογώνια.</li></ul>' +
          p('<b>Εφαρμογή.</b> Για τα δεδομένα της άσκησης:') +
          eqs([['K = \\frac{E_H - E_0}{E_0} = \\frac{' + fmt(q.EH, 1) + ' - ' + fmt(q.E0, 1) + '}{' + fmt(q.E0, 1) + '} = \\hl{' + fmt(r.K, 2) + '}']]) +
          p('Με K = ' + fmt(r.K, 2) + ' και ν = ' + fmt(r.nu, 1) + ' χρησιμοποιείται το αντίστοιχο νομογράφημα (εμφανίζεται στο σχήμα· όλα τα νομογραφήματα βρίσκονται στο Παράρτημα του Τυπολογίου), με z = H = ' + fmt(q.H, 0) + ' m και ' + m('E_0 = ' + fmt(q.E0, 1) + '\\unit{MPa}') + ' στον τύπο της καθίζησης.');
      }
    },
    {
      title: 'Σημείο Α (κέντρο): 4 × (5 × 5)', hl: ['A'],
      body: function (q, r) {
        var pct = (r.SA0 / r.SA - 1) * 100;
        return eqs([['\\frac{z}{B} = \\frac{' + fmt(q.H, 0) + '}{5} = ' + fmt(r.zB, 1) + ',\\quad \\frac{L}{B} = 1 \\Rightarrow f_A = ' + fmt(r.fA, 3)], ['S_A = \\frac{q\\,B\'}{E_0}\\cdot 4\\cdot f_A = \\frac{' + fmt(q.q, 0) + '\\times 5}{' + fmt(q.E0 * 1000, 0) + '}\\cdot 4\\cdot ' + fmt(r.fA, 3) + ' = \\hl{' + fmt(r.SA * 1000, 0) + '\\unit{mm}}']]) +
          (Math.abs(r.K) > 1e-9 ? note('Με σταθερό E = E₀ (K = 0, ν = ' + fmt(r.nu, 1) + ') θα προέκυπτε f<sub>A</sub> = ' + fmt(r.fA0, 3) + ' και S<sub>A</sub> = ' + fmt(r.SA0 * 1000, 0) + ' mm, δηλαδή ' + fmt(Math.abs(pct), 0) + ' % ' + (pct >= 0 ? 'μεγαλύτερη' : 'μικρότερη') + ' καθίζηση.') : '');
      }
    },
    {
      title: 'Σημείο Β: 2 × (5 × 10)', hl: ['B'],
      body: function (q, r) { return eqs([['\\frac{z}{B} = ' + fmt(r.zB, 1) + ',\\quad \\frac{L}{B} = 2 \\Rightarrow f_B = ' + fmt(r.fB, 3)], ['S_B = \\frac{' + fmt(q.q, 0) + '\\times 5}{' + fmt(q.E0 * 1000, 0) + '}\\cdot 2\\cdot ' + fmt(r.fB, 3) + ' = \\hl{' + fmt(r.SB * 1000, 1) + '\\unit{mm}}']]); }
    },
    {
      title: 'Σημείο Γ (4 m έξω): ΗΓΔΖ (14 × 5) − ΕΔΓΒ (4 × 5)', hl: ['Γ'],
      cap: 'Τα δύο ορθογώνια έχουν διαφορετικό μικρό πλάτος (5 m και 4 m), άρα διαφορετικό B′ στον τύπο της καθίζησης.',
      body: function (q, r) {
        return eqs([
          ['\\text{ΗΓΔΖ: } B\' = 5,\\; L\' = 14,\\; \\frac{L}{B} = 2.8,\\; \\frac{z}{B} = ' + fmt(q.H / 5, 1) + ' \\Rightarrow f_{ΗΓΔΖ} = ' + fmt(r.f1, 3)],
          ['\\text{ΕΔΓΒ: } B\' = 4,\\; L\' = 5,\\; \\frac{L}{B} = 1.25,\\; \\frac{z}{B} = ' + fmt(q.H / 4, 1) + ' \\Rightarrow f_{ΕΔΓΒ} = ' + fmt(r.f2, 3)],
          ['S_Γ = 2\\cdot\\frac{q}{E_0}\\,(B\'_1 f_{ΗΓΔΖ} - B\'_2 f_{ΕΔΓΒ}) = 2\\cdot\\frac{' + fmt(q.q, 0) + '}{' + fmt(q.E0 * 1000, 0) + '}\\,(5\\times ' + fmt(r.f1, 3) + ' - 4\\times ' + fmt(r.f2, 3) + ') = \\hl{' + fmt(r.SG * 1000, 1) + '\\unit{mm}}']
        ]) + note('Η S<sub>Γ</sub> προκύπτει ως διαφορά δύο σχεδόν ίσων όρων και είναι ευαίσθητη στην ακρίβεια ανάγνωσης: οι συντελεστές λαμβάνονται με τρία δεκαδικά, με παρεμβολή μεταξύ των καμπυλών L/B (διακεκομμένες καμπύλες στο σχήμα).');
      }
    },
    {
      title: 'Διαφορική καθίζηση και γωνιακή παραμόρφωση Β–Γ', hl: ['B', 'Γ'],
      body: function (q, r) {
        var ok = r.i <= 1 / 500;
        return eqs([['ΔS_{ΒΓ} = ' + fmt(r.SB * 1000, 1) + ' - ' + fmt(r.SG * 1000, 1) + ' = \\hl{' + fmt(r.dS * 1000, 1) + '\\unit{mm}}'], ['i = \\frac{ΔS_{ΒΓ}}{L_{ΒΓ}} = \\frac{' + fmt(r.dS * 1000, 1) + '}{4000} \\approx \\hl{\\frac{1}{' + fmt(1 / r.i, 0) + '}} ' + (ok ? '\\le' : '\\gg') + ' \\frac{1}{500}']]) +
          note(ok ? 'Αποδεκτή γωνιακή παραμόρφωση.' : 'Μη αποδεκτή: αναμένονται σοβαρές βλάβες στην υφιστάμενη κατασκευή.');
      }
    },
    {
      title: 'Μέγιστο q για i = 1/500', hl: ['B', 'Γ'],
      body: function (q, r) {
        return eqs([['q_{max} = \\frac{(1/500)\\,L_{ΒΓ}\\,E_0}{2 B\' f_B - 2(B\'_1 f_{ΗΓΔΖ} - B\'_2 f_{ΕΔΓΒ})} = \\hl{' + fmt(r.qmax, 1) + '\\unit{kPa}}']]) +
          note('Οι καθιζήσεις είναι ανάλογες του q, άρα ισοδύναμα q<sub>max</sub> = ' + fmt(q.q, 0) + ' × (' + fmt(r.sp * 1000 / 500, 0) + ' / ' + fmt(r.dS * 1000, 1) + ') = ' + fmt(r.qmax, 1) + ' kPa (επιτρεπόμενη ΔS<sub>ΒΓ</sub> = 4000/500 = 8 mm).');
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('S_A = ' + fmt(r.SA * 1000, 0) + '\\unit{mm},\\quad i_{ΒΓ} \\approx 1/' + fmt(1 / r.i, 0) + ',\\quad q_{max} \\approx ' + fmt(r.qmax, 1) + '\\unit{kPa}') + '</div><p>Πρακτικό συμπέρασμα: εύκαμπτη κοιτόστρωση δίπλα σε υφιστάμενο κτήριο σε τόσο μαλακό έδαφος δεν είναι εφικτή χωρίς βαθιά θεμελίωση ή βελτίωση εδάφους.</p>'; }
});

/* ---------- Schmertmann helpers ---------- */
function schLayers(n, dz, Df, B, type, Izmax, Efun, dP) {
  var out = [];
  for (var i = 0; i < n; i++) {
    var z = dz * (i + 0.5), depth = Df + z, E = Efun(i, depth), Iz = GEO.schIz(z, B, type, Izmax);
    out.push({ i: i + 1, z: z, depth: depth, E: E, Iz: Iz, term: dP * dz * Iz / E }); // mm (E in MPa)
  }
  return out;
}
function schTable(layers, hot, extraCol) {
  var head = ['Στρώμα', 'Βάθος μέσου (m)'].concat(extraCol ? [extraCol.head] : []).concat([m('E_i') + ' (MPa)', m('I_z'), m('\\frac{ΔP\\,Δz\\,I_z}{E_i}') + ' (mm)']);
  var rows = layers.map(function (l) { return [l.i, fmt(l.depth, 2)].concat(extraCol ? [extraCol.val(l)] : []).concat([fmt(l.E, 2), fmt(l.Iz, 2), fmt(l.term, 2)]); });
  return table(head, rows, hot);
}
/* section with n Schmertmann layers drawn as bands */
function schSection(o) {
  var n = o.layers.length, dz = o.dz;
  return sectionFig({ Wm: o.Wm, Dm: o.Df + n * dz + o.extraDepth, s: o.s, ml: o.ml || 66, layers: [{ z1: 0, z2: o.Df + n * dz + o.extraDepth, type: o.type || 'sand', label: o.soilLabel }],
    foot: { x1: o.xc - o.B / 2, x2: o.xc + o.B / 2, Df: o.Df, label: 'B = ' + fmt(o.B, 1) + ' m' }, udl: o.udl, wt: o.wt, ticks: o.ticks,
    extra: function (X, Y, s) {
      var g = '';
      o.layers.forEach(function (l, i) {
        var z1 = o.Df + i * dz, z2 = z1 + dz;
        g += '<g data-k="L' + l.i + '">' + '<rect x="' + X(0) + '" y="' + Y(z1) + '" width="' + (o.Wm * s) + '" height="' + (dz * s) + '" fill="var(--accent-2)" fill-opacity="' + (i % 2 ? 0.08 : 0.18) + '"/>' +
          SVG.line(X(0), Y(z2), X(o.Wm), Y(z2), 'thin dash') + SVG.label(X(0.5), Y((z1 + z2) / 2) + 4, (i + 1) + ':  E = ' + fmt(l.E, 1) + ' MPa,  I' + '<tspan dy="3" font-size="9">z</tspan><tspan dy="-3"> = ' + fmt(l.Iz, 2) + '</tspan>', 'lbl-muted', 'start') + '</g>';
      });
      if (o.extra) g += o.extra(X, Y, s);
      return g;
    } });
}

/* ---------- Schmertmann with calculation layers split at the knee of the Iz diagram ----------
   Rule of the course: a layer boundary is always placed at the knee (depth of Iz,max) and at every soil interface;
   each branch of the diagram is divided separately, so the Δz need not be equal. */
function nz(x, d) { return String(+(+x).toFixed(d === undefined ? 2 : d)); }                       // number without trailing zeros
function fz(x) { return Math.abs(x * 100 - Math.round(x * 100)) < 1e-6 ? fmt(x, 2) : fmt(x, 3); }   // 2 decimals, 3 when needed
function kneeBounds(zp, zmax, nA, nB) { var b = [0], i; for (i = 1; i <= nA; i++) b.push(zp * i / nA); for (i = 1; i <= nB; i++) b.push(zp + (zmax - zp) * i / nB); return b; }
function schSplit(bounds, Df, B, type, Izmax, Efun, dP) {
  var zp = type === 'strip' ? B : B / 2, out = [];
  for (var i = 0; i < bounds.length - 1; i++) {
    var a = bounds[i], b = bounds[i + 1], zm = (a + b) / 2, E = Efun(Df + zm), Iz = GEO.schIz(zm, B, type, Izmax);
    out.push({ i: i + 1, a: a, b: b, dz: b - a, z: zm, depth: Df + zm, E: E, Iz: Iz, term: dP * (b - a) * Iz / E, above: b <= zp + 1e-9 }); // mm (E in MPa)
  }
  return out;
}
function schSum(layers) { return layers.reduce(function (a, l) { return a + l.term; }, 0); }
function schSplitTable(layers) {
  return table(['Στρώμα', 'z από – έως (m)', 'Δz (m)', 'z μέσου (m)', 'Βάθος μέσου από την επιφάνεια (m)', m('E_i') + ' (MPa)', m('I_z'), m('\\frac{ΔP\\,Δz\\,I_z}{E_i}') + ' (mm)'],
    layers.map(function (l) { return [l.i, nz(l.a) + ' – ' + nz(l.b), nz(l.dz), nz(l.z, 3), nz(l.depth, 3), fz(l.E), fz(l.Iz), fmt(l.term, 2)]; }));
}
/* Section and Iz diagram on a common depth scale; layer boundaries drawn across both, knee in red.
   o: {Df, B, q, Izmax, layers (from schSplit), soil} – strip footing */
function schKneeFig(o) {
  var Df = o.Df, B = o.B, Izmax = o.Izmax, I0 = 0.2, zp = B, zmax = 4 * B, layers = o.layers;
  var W = 800, y0 = 74, Dm = Df + zmax + 0.7, s = 372.65 / Dm, H = y0 + Dm * s + 16;
  var XL = 82, XR = 418, X0 = XL + 49, X1 = X0 + B * s, ex = 0.25 * s, t = 9;
  var Y = function (d) { return y0 + d * s; };                                                       // d = depth from the surface
  var CX0 = 520, CX1 = 700, XI = function (I) { return CX0 + I / 0.8 * (CX1 - CX0); };
  var Iz = function (z) { return GEO.schIz(z, B, 'strip', Izmax); };
  var h = SVG.open(W, H, 'aria-label="Τομή και διάγραμμα Iz σε κοινή κλίμακα βάθους, με τα στρώματα υπολογισμού χωρισμένα στο γόνατο"');
  h += SVG.soil(XL, Y(0), XR - XL, Dm * s, 'sand');
  // calculation layers as bands (above / below the knee)
  ['up', 'dn'].forEach(function (key) {
    h += '<g data-k="' + key + '">';
    layers.forEach(function (l, k) {
      if ((key === 'up') !== l.above) return;
      h += '<rect x="' + XL + '" y="' + Y(Df + l.a) + '" width="' + (XR - XL) + '" height="' + (l.dz * s) + '" fill="var(--accent-2)" fill-opacity="' + (k % 2 ? 0.05 : 0.16) + '"/>';
    });
    h += '</g>';
  });
  // footing in its excavation
  h += '<g data-k="foot">';
  if (Df > 0) {
    h += '<rect x="' + (X0 - ex) + '" y="' + (Y(0) - 1) + '" width="' + (X1 - X0 + 2 * ex) + '" height="' + (Df * s + 1) + '" fill="var(--panel-2)"/>';
    h += SVG.line(X0 - ex, Y(0), X0 - ex, Y(Df), 'thin', 'stroke-width="1.5"') + SVG.line(X1 + ex, Y(0), X1 + ex, Y(Df), 'thin', 'stroke-width="1.5"') + SVG.line(X0 - ex, Y(Df), X1 + ex, Y(Df), 'thin', 'stroke-width="1.5"');
  }
  h += SVG.rect(X0, Y(Df) - t, X1 - X0, t, 'conc') + SVG.udl(X0, X1, Y(Df) - t, 46, 'q = ' + fmt(o.q, 0) + ' kPa', '', 4) + '</g>';
  var gl0 = Df > 0 ? X0 - ex : X0, gr0 = Df > 0 ? X1 + ex : X1;
  h += '<line class="ground" x1="' + XL + '" y1="' + Y(0) + '" x2="' + gl0 + '" y2="' + Y(0) + '"/><line class="ground" x1="' + gr0 + '" y1="' + Y(0) + '" x2="' + XR + '" y2="' + Y(0) + '"/>';
  for (var gx = XL + 6; gx < X0 - 12; gx += 8) h += '<line class="thin" x1="' + gx + '" y1="' + Y(0) + '" x2="' + (gx - 5) + '" y2="' + (Y(0) + 6) + '"/>';
  for (gx = XR - 58; gx < XR; gx += 8) h += '<line class="thin" x1="' + gx + '" y1="' + Y(0) + '" x2="' + (gx - 5) + '" y2="' + (Y(0) + 6) + '"/>';
  h += SVG.dim(X0, Y(Df) + 5, X1, Y(Df) + 5, 'B = ' + fmt(B, 1) + ' m', 11);
  if (Df > 0) h += SVG.dim(X1 + 19, Y(0), X1 + 19, Y(Df), tsub('D', 'f') + '= ' + fmt(Df, 1) + ' m', 9);
  // layer boundaries across both panels; two depth scales
  var bounds = [0].concat(layers.map(function (l) { return l.b; }));
  bounds.forEach(function (z) {
    var knee = Math.abs(z - zp) < 1e-9, yy = Y(Df + z);
    if (knee) h += '<g data-k="knee"><line x1="' + XL + '" y1="' + yy + '" x2="' + CX1 + '" y2="' + yy + '" stroke="var(--load)" stroke-width="2" stroke-dasharray="7 4"/></g>';
    else {
      if (z > 0) h += '<line x1="' + XL + '" y1="' + yy + '" x2="' + XR + '" y2="' + yy + '" stroke="var(--fg)" stroke-width="1" stroke-dasharray="5 4"/>';
      h += '<line x1="' + CX0 + '" y1="' + yy + '" x2="' + CX1 + '" y2="' + yy + '" stroke="var(--fg)" stroke-width="1" stroke-dasharray="5 4"/>';
    }
    h += SVG.line(XL - 6, yy, XL, yy, 'thin') + SVG.text(XL - 9, yy + 4, nz(Df + z) + ' m', 'lbl-muted', 'text-anchor="end"');
    h += '<rect x="' + (CX0 - 52) + '" y="' + (yy - 8) + '" width="46" height="16" fill="var(--panel-2)"/>' + SVG.text(CX0 - 8, yy + 4, 'z = ' + nz(z), knee ? 'lbl-load' : '', 'text-anchor="end"' + (knee ? '' : ' style="font-size:12px"'));
  });
  if (Df * s >= 13) h += SVG.line(XL - 6, Y(0), XL, Y(0), 'thin') + SVG.text(XL - 9, Y(0) + 4, '0 m', 'lbl-muted', 'text-anchor="end"');
  h += '<text transform="translate(18,' + Y(Df + zmax / 2) + ') rotate(-90)" text-anchor="middle" class="lbl-muted">βάθος από την επιφάνεια (m)</text>';
  h += '<text transform="translate(446,' + (Y(Df + zmax / 2) + 22) + ') rotate(-90)" text-anchor="middle" class="lbl-muted">z κάτω από τη θεμελίωση (m)</text>';
  // layer labels in the section
  layers.forEach(function (l) {
    h += '<g data-k="' + (l.above ? 'up' : 'dn') + '">' + SVG.label(X1 + 13, Y(Df + l.z) + 4, l.i + ':  Δz = ' + nz(l.dz) + ' m,  E = ' + fmt(l.E, 1) + ' MPa', '', 'start') + '</g>';
  });
  h += SVG.label(XL + 7, Y(Df + zmax) - 14, o.soil || '', 'lbl-muted', 'start');
  // Iz diagram
  for (var I = 0; I <= 0.81; I += 0.2) h += SVG.line(XI(I), Y(Df), XI(I), Y(Df + zmax), 'grid') + SVG.text(XI(I), Y(Df) - 8, fmt(I, 1), 'lbl-muted', 'text-anchor="middle"');
  h += SVG.rect(CX0, Y(Df), CX1 - CX0, zmax * s, 'thin');
  h += '<text x="' + ((CX0 + CX1) / 2) + '" y="' + (Y(Df) - 30) + '" text-anchor="middle" style="font-weight:600;font-size:14px">διάγραμμα I<tspan dy="4" font-size="10">z</tspan><tspan dy="-4"> (λωρίδα)</tspan></text>';
  layers.forEach(function (l) { var yy = Y(Df + l.z); h += '<line x1="' + CX0 + '" y1="' + yy + '" x2="' + XI(l.Iz) + '" y2="' + yy + '" class="guide"/>'; });
  h += '<path d="M' + XI(I0) + ',' + Y(Df) + ' L' + XI(Izmax) + ',' + Y(Df + zp) + ' L' + XI(0) + ',' + Y(Df + zmax) + '" class="curve hot"/>';
  layers.forEach(function (l, k) {
    var yy = Y(Df + l.z);
    h += '<g data-k="' + (l.above ? 'up' : 'dn') + '">' + SVG.circle(XI(l.Iz), yy, 6, 'marker a-pop', 'style="animation-delay:' + (k * 0.1) + 's"') + SVG.label(XI(l.Iz) + 11, yy + 4, fz(l.Iz), '', 'start') + '</g>';
  });
  h += '<g data-k="knee">' + SVG.circle(XI(Izmax), Y(Df + zp), 3.5, '', 'fill="var(--load)"') +
    SVG.label(CX1 + 8, Y(Df + zp) + 4, 'I<tspan dy="4" font-size="10">z,max</tspan><tspan dy="-4"> = ' + fmt(Izmax, 2) + '</tspan>', 'lbl-load', 'start') +
    SVG.label(CX0 + 6, Y(Df + zp) - 6, 'γόνατο', 'lbl-load', 'start') + '</g>';
  h += SVG.label(CX1 - 6, Y(Df + zmax) - 7, '4B = ' + nz(zmax) + ' m', 'lbl-muted', 'end');
  return h + SVG.close();
}

/* ===================== ΑΣΚΗΣΗ 5 ===================== */
EX.push({
  id: 's5', num: 5, group: GRP_SCH, source: 'Άσκηση 5',
  title: 'Πεδιλοδοκός 6 m σε άμμο με E(z) = 3 + 0.2z: μέθοδος Schmertmann',
  tags: ['Schmertmann', 'Θεμελιολωρίδα', 'Iz', 'Χωρισμός στο γόνατο'],
  statement: p('Να υπολογίσετε την καθίζηση με τη μέθοδο Schmertmann πεδιλοδοκού πλάτους 6 m, εδραζόμενης σε αμμώδες έδαφος σε βάθος 1.0 m από την επιφάνεια.') +
    '<ul><li>Ειδικό βάρος εδάφους 18 kN/m³, τάση θεμελίωσης από την ανωδομή 50 kPa</li><li>Μέτρο ελαστικότητας ' + m('E(z) = 3 + 0.2z\\;\\unit{(MPa)}') + ', z = βάθος από την επιφάνεια (m)</li><li>' + m('C_1 = C_2 = 1,\\; I_{z,max} = 0.6') + '</li>' +
    '<li>Στρώματα υπολογισμού: χωρισμός στο γόνατο του διαγράμματος I<sub>z</sub>, με Δz = 3 m έως το γόνατο και Δz = 6 m κάτω από αυτό.</li></ul>',
  givens: [
    { key: 'q', label: 'Τάση θεμελίωσης q', unit: 'kPa', value: 50, min: 20, max: 300, step: 5 },
    { key: 'Df', label: 'Βάθος θεμελίωσης Df', unit: 'm', value: 1, min: 0, max: 3, step: 0.5, dec: 1 },
    { key: 'B', label: 'Πλάτος πεδιλοδοκού B', unit: 'm', value: 6, min: 3, max: 9, step: 1.5, dec: 1 },
    { key: 'E0', label: 'E στην επιφάνεια', unit: 'MPa', value: 3, min: 1, max: 20, step: 0.5, dec: 1 },
    { key: 'kE', label: 'Κλίση E (MPa/m)', unit: '', value: 0.2, min: 0, max: 1, step: 0.05, dec: 2 },
    { key: 'C1', label: 'C₁', unit: '', value: 1, min: 0.5, max: 1, step: 0.05, dec: 2 },
    { key: 'n1', label: 'Στρώματα πάνω από το γόνατο', unit: '', value: 2, min: 1, max: 4, step: 1 },
    { key: 'n2', label: 'Στρώματα κάτω από το γόνατο', unit: '', value: 3, min: 1, max: 6, step: 1 }
  ],
  compute: function (q) {
    var g = 18, Izmax = 0.6, B = q.B, zp = B, zinf = 4 * B, dP = q.q - g * q.Df, n1 = Math.round(q.n1), n2 = Math.round(q.n2);
    var Efun = function (depth) { return q.E0 + q.kE * depth; };
    var split = function (a, b) { return schSplit(kneeBounds(zp, zinf, a, b), q.Df, B, 'strip', Izmax, Efun, dP); };
    var layers = split(n1, n2), sum = schSum(layers);
    var Iz = function (z) { return GEO.schIz(z, B, 'strip', Izmax); };
    var kneeMean = ((Iz(B / 2) + Izmax) / 2 + (Izmax + Iz(1.5 * B)) / 2) / 2;       // true mean of Iz in a layer B/2 .. 3B/2 that contains the knee
    var C1f = dP > 0 ? Math.max(0.5, 1 - 0.5 * g * q.Df / dP) : NaN, sv = g * (q.Df + B), Izf = dP > 0 ? 0.5 + 0.1 * Math.sqrt(dP / sv) : NaN;
    var nSh = n1 + 1, share = sum ? layers.slice(0, nSh).reduce(function (a, l) { return a + l.term; }, 0) / sum : 0;
    return { g: g, Izmax: Izmax, dP: dP, zp: zp, zinf: zinf, n1: n1, n2: n2, dzA: zp / n1, dzB: (zinf - zp) / n2, layers: layers, sum: sum, S: q.C1 * 1 * sum,
      sum8: schSum(split(2, 6)), sum2: schSum(split(1, 1)), sumX: schSum(split(100, 300)), kneeMean: kneeMean, kneeOver: (Izmax / kneeMean - 1) * 100,
      C1f: C1f, SC1f: C1f * sum, sv: sv, Izf: Izf, nSh: nSh, zSh: layers[nSh - 1].b, share: share };
  },
  figure: function (q, r, step) {
    return schKneeFig({ Df: q.Df, B: q.B, q: q.q, Izmax: r.Izmax, layers: r.layers, soil: 'Άμμος, γ = 18 kN/m³' });
  },
  figcap: 'Θεμελιολωρίδα: το διάγραμμα I<sub>z</sub> ξεκινά από 0.2 στη στάθμη θεμελίωσης, κορυφώνεται (0.6) στο γόνατο, σε βάθος z = B, και μηδενίζεται σε z = 4B. Όριο στρώματος υπολογισμού μπαίνει πάντα στο γόνατο.',
  quick: function (q, r) { return gl([[m('ΔP'), fmt(r.dP, 0) + ' kPa'], ['Γόνατο z = B', nz(r.zp) + ' m'], ['Βάθος επιρροής 4B', nz(r.zinf) + ' m'], ['Στρώματα', r.n1 + ' × ' + nz(r.dzA) + ' m + ' + r.n2 + ' × ' + nz(r.dzB) + ' m'], [m('\\sum ΔP Δz I_z / E'), fmt(r.sum, 2) + ' mm'], [m('S'), '<b>' + fmt(r.S, 1) + ' mm</b>']]); },
  steps: [
    {
      title: 'Καθαρή ασκούμενη τάση', hl: ['foot'],
      body: function (q, r) {
        return eq('ΔP = q - γ\\,D_f = ' + fmt(q.q, 0) + ' - ' + fmt(r.g, 0) + '\\times ' + fmt(q.Df, 1) + ' = \\hl{' + fmt(r.dP, 0) + '\\unit{kPa}}', 'αφαιρείται η τάση του εδάφους που εκσκάφθηκε') +
          (q.Df > 0 ? note('Καθίζηση προκαλεί μόνο η πρόσθετη (καθαρή) τάση: πριν από την εκσκαφή το έδαφος στη στάθμη θεμελίωσης έφερε ήδη γ·D<sub>f</sub> = ' + fmt(r.g * q.Df, 0) + ' kPa. Συνηθισμένο λάθος: χρήση της ολικής τάσης q = ' + fmt(q.q, 0) + ' kPa.') : '') +
          (r.dP <= 0 ? note('<b>ΔP ≤ 0:</b> το βάρος του εδάφους που αφαιρέθηκε καλύπτει την τάση της θεμελίωσης (πλήρως αντισταθμισμένη θεμελίωση)· δεν προκύπτει καθίζηση από πρόσθετη τάση.') : '');
      }
    },
    {
      title: 'Διάγραμμα Iz λωρίδας: γόνατο και βάθος επιρροής', hl: ['knee'],
      cap: 'Λωρίδα (L/B ≥ 10): I<sub>z</sub> = 0.2 στη στάθμη θεμελίωσης, I<sub>z,max</sub> = 0.6 σε z = B, I<sub>z</sub> = 0 σε z = 4B.',
      body: function (q, r) {
        return eqs([
          ['z_{max} = 4B = ' + nz(r.zinf) + '\\unit{m},\\qquad z(I_{z,max}) = B = ' + nz(r.zp) + '\\unit{m}\\quad\\text{(γόνατο)}'],
          ['\\text{Πάνω από το γόνατο, } 0 \\le z \\le B:\\quad I_z = 0.2 + (I_{z,max} - 0.2)\\,\\frac{z}{B} = 0.2 + ' + fmt(r.Izmax - 0.2, 1) + '\\,\\frac{z}{' + nz(q.B) + '}'],
          ['\\text{Κάτω από το γόνατο, } B \\le z \\le 4B:\\quad I_z = I_{z,max}\\,\\frac{4B - z}{3B} = ' + fmt(r.Izmax, 1) + '\\,\\frac{' + nz(r.zinf) + ' - z}{' + nz(3 * q.B) + '}']
        ]) + note('Το z του διαγράμματος I<sub>z</sub> μετριέται από τη στάθμη θεμελίωσης, όχι από την επιφάνεια του εδάφους. Το διάγραμμα αυτό ισχύει για λωρίδα (L/B ≥ 10)· για τετραγωνικό θεμέλιο ξεκινά από 0.1, έχει το γόνατο σε z = B/2 και μηδενίζεται σε z = 2B.');
      }
    },
    {
      title: 'Χωρισμός σε στρώματα υπολογισμού: πάντα στο γόνατο', hl: ['knee', 'up', 'dn'],
      cap: 'Τα όρια των στρωμάτων υπολογισμού σχεδιάζονται και στην τομή και στο διάγραμμα I<sub>z</sub>· το όριο στο γόνατο με κόκκινο.',
      body: function (q, r) {
        var lay = function (n, dz) { return n === 1 ? '1 στρώμα των ' + nz(dz) + ' m' : n + ' στρώματα των ' + nz(dz) + ' m'; }, B = q.B;
        return p('Η καθίζηση υπολογίζεται ως άθροισμα όρων ' + m('\\frac{ΔP\\,Δz_i\\,I_{z,i}}{E_i}') + ', με τα ' + m('I_z') + ' και E στο μέσο κάθε στρώματος. Το διάγραμμα I<sub>z</sub> είναι γραμμικό σε κάθε κλάδο, άρα η τιμή στο μέσο ισούται με τη μέση τιμή του στρώματος μόνο όταν το στρώμα δεν περιέχει το γόνατο. Επομένως:') +
          '<ul><li>Όριο στρώματος μπαίνει <b>πάντα στο γόνατο</b> (z = B = ' + nz(B) + ' m), καθώς και σε κάθε διεπιφάνεια εδαφικών στρωμάτων, αν υπάρχει.</li>' +
          '<li>Τα Δz δεν χρειάζεται να είναι ίσα: κάθε κλάδος του διαγράμματος χωρίζεται ξεχωριστά.</li>' +
          '<li>Πάνω από το γόνατο (z = 0 – ' + nz(B) + ' m): ' + lay(r.n1, r.dzA) + '. Κάτω από το γόνατο (z = ' + nz(B) + ' – ' + nz(4 * B) + ' m): ' + lay(r.n2, r.dzB) + '. Σύνολο ' + (r.n1 + r.n2) + ' στρώματα.</li></ul>' +
          note('Αν ένα στρώμα περιείχε το γόνατο, π.χ. z = ' + nz(B / 2) + ' – ' + nz(1.5 * B) + ' m, η τιμή στο μέσο του θα ήταν I<sub>z</sub>(' + nz(B) + ') = ' + fmt(r.Izmax, 2) + ', ενώ η πραγματική μέση τιμή του I<sub>z</sub> στο στρώμα είναι ' + fmt(r.kneeMean, 3) + ': υπερεκτίμηση ' + fmt(r.kneeOver, 0) + ' %.');
      }
    },
    {
      title: 'E και Iz στο μέσο κάθε στρώματος', hl: ['up', 'dn'],
      body: function (q, r) {
        var a = r.layers[0], b = r.layers[r.n1], B = q.B, sub = function (s, i) { return s + '_{' + i + '}'; };
        return eqs([
          ['E_i = ' + fmt(q.E0, 1) + ' + ' + fmt(q.kE, 2) + '\\,(D_f + z_i)\\;\\unit{(MPa)},\\qquad z_i = \\text{βάθος του μέσου κάτω από τη θεμελίωση}'],
          ['\\text{Στρώμα ' + a.i + ': }\\; ' + sub('z', a.i) + ' = ' + nz(a.z, 3) + '\\unit{m} \\Rightarrow I_z = 0.2 + ' + fmt(r.Izmax - 0.2, 1) + '\\times\\frac{' + nz(a.z, 3) + '}{' + nz(B) + '} = ' + fz(a.Iz) + ',\\quad ' + sub('E', a.i) + ' = ' + fmt(q.E0, 1) + ' + ' + fmt(q.kE, 2) + '\\times(' + fmt(q.Df, 1) + ' + ' + nz(a.z, 3) + ') = ' + fz(a.E) + '\\unit{MPa}'],
          ['\\text{Στρώμα ' + b.i + ': }\\; ' + sub('z', b.i) + ' = ' + nz(b.z, 3) + '\\unit{m} \\Rightarrow I_z = ' + fmt(r.Izmax, 1) + '\\times\\frac{' + nz(r.zinf) + ' - ' + nz(b.z, 3) + '}{' + nz(3 * B) + '} = ' + fz(b.Iz) + ',\\quad ' + sub('E', b.i) + ' = ' + fmt(q.E0, 1) + ' + ' + fmt(q.kE, 2) + '\\times(' + fmt(q.Df, 1) + ' + ' + nz(b.z, 3) + ') = ' + fz(b.E) + '\\unit{MPa}']
        ]) + note('Δύο διαφορετικές αφετηρίες βάθους: το I<sub>z</sub> υπολογίζεται με το z κάτω από τη θεμελίωση, ενώ το E(z) της εκφώνησης με το βάθος από την επιφάνεια, δηλαδή D<sub>f</sub> + z. Συνηθισμένο λάθος: το E υπολογίζεται με το z του διαγράμματος I<sub>z</sub>.');
      }
    },
    {
      title: 'Όροι πάνω από το γόνατο', hl: ['up'],
      body: function (q, r) { return eq('\\text{Όρος στρώματος } i:\\; \\frac{ΔP\\,Δz_i\\,I_{z,i}}{E_i} \\quad \\text{(kPa·m/MPa = mm)}') + schSplitTable(r.layers.filter(function (l) { return l.above; })); }
    },
    {
      title: 'Όροι κάτω από το γόνατο', hl: ['dn'],
      body: function (q, r) { return schSplitTable(r.layers.filter(function (l) { return !l.above; })); }
    },
    {
      title: 'Άθροιση και καθίζηση', hl: ['up', 'dn'],
      body: function (q, r) {
        var B = q.B, h = eqs([
          ['\\sum\\frac{ΔP\\,Δz_i\\,I_{z,i}}{E_i} = ' + r.layers.map(function (l) { return fmt(l.term, 2); }).join(' + ') + ' = ' + fmt(r.sum, 2) + '\\unit{mm}'],
          ['S = C_1\\,C_2\\,\\sum_{0}^{4B}\\frac{ΔP\\,Δz_i\\,I_{z,i}}{E_i} = ' + fmt(q.C1, 2) + '\\times 1\\times ' + fmt(r.sum, 2) + ' = \\hl{' + fmt(r.S, 1) + '\\unit{mm}}']
        ]);
        h += note('<b>Έλεγχος ευαισθησίας</b> (άθροισμα Σ): με 8 ίσα στρώματα των ' + nz(B / 2) + ' m προκύπτει ' + fmt(r.sum8, 1) + ' mm, με ακριβή ολοκλήρωση ' + fmt(r.sumX, 1) + ' mm· ακόμη και με δύο μόνο στρώματα, ένα ανά κλάδο (0 – ' + nz(B) + ' και ' + nz(B) + ' – ' + nz(4 * B) + ' m), προκύπτει ' + fmt(r.sum2, 1) + ' mm. Το κρίσιμο είναι ο χωρισμός στο γόνατο, όχι το πλήθος των στρωμάτων. Δοκιμάστε το με τα ρυθμιστικά «Στρώματα πάνω / κάτω από το γόνατο».');
        if (r.dP > 0) h += note('Τα C<sub>1</sub>, C<sub>2</sub> και I<sub>z,max</sub> δίνονται εδώ από την εκφώνηση. Με τους τύπους της μεθόδου: C<sub>1</sub> = 1 − 0.5·σ′<sub>v0</sub>/ΔP = 1 − 0.5×' + fmt(r.g * q.Df, 0) + '/' + fmt(r.dP, 0) + ' = ' + fmt(r.C1f, 2) + (1 - 0.5 * r.g * q.Df / r.dP < 0.5 ? ' (κατώτατο όριο 0.5)' : '') + ' (τότε S ≈ ' + fmt(r.SC1f, 0) + ' mm)· C<sub>2</sub> = 1 + 0.2·log(t/0.1), π.χ. 1.4 για t = 10 έτη· I<sub>z,max</sub> = 0.5 + 0.1·√(ΔP/σ′<sub>v</sub>) = ' + fmt(r.Izf, 2) + ', με σ′<sub>v</sub> = ' + fmt(r.g, 0) + '×' + nz(q.Df + B) + ' = ' + fmt(r.sv, 0) + ' kPa στο βάθος του γονάτου.');
        return h;
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('S \\approx ' + fmt(r.S, 1) + '\\unit{mm}') + '</div><p>Τα πρώτα ' + r.nSh + ' στρώματα (έως z = ' + nz(r.zSh) + ' m κάτω από τη θεμελίωση) δίνουν το ' + fmt(r.share * 100, 0) + ' % της καθίζησης: εκεί συνδυάζεται μεγάλο I<sub>z</sub> με χαμηλό E.</p>'; }
});
function r_hl_all(n) { var a = []; for (var i = 1; i <= n; i++) a.push('L' + i); return a; }

/* ===================== ΑΣΚΗΣΗ 6 ===================== */
EX.push({
  id: 's6', num: 6, group: GRP_CON, source: 'Άσκηση 6',
  title: 'Κοιτόστρωση 12 × 12 σε άργιλο πάνω από άμμο: μέθοδος Cc και Schmertmann',
  tags: ['Στερεοποίηση (Cc)', 'Μέθοδος 2:1', 'Schmertmann'],
  statement: p('Κτήριο θεμελιώνεται σε γενική κοιτόστρωση 12 m × 12 m σε βάθος 2 m. Το βάρος του κτηρίου με τη θεμελίωση είναι 11 520 kN. Να υπολογίσετε:') +
    '<ol><li>Την τελική συμπίεση του αργιλικού στρώματος με τη μέθοδο ' + m('C_c') + ', με στρώματα υπολογισμού έως 2 m (μέθοδος 2:1). Η άμεση συμπίεση της αργίλου να ληφθεί 10 % της συμπίεσης στερεοποίησης.</li><li>Την άμεση συμπίεση των αμμωδών σχηματισμών κατά Schmertmann (1978) με ' + m('Δz = 3\\unit{m},\\; C_1 = 0.9,\\; C_2 = 1,\\; I_{z,max} = 0.6') + '.</li></ol>' +
    '<ul><li>0 – 8 m: κανονικά στερεοποιημένη άργιλος, ' + m('γ_κ = 20\\unit{kN/m³},\\; c_c = 0.1,\\; e_0 = 1') + '</li><li>8 – 14 m: ιλυώδης άμμος, ' + m('γ_κ = 20\\unit{kN/m³},\\; E = 5\\unit{MPa}') + '</li><li>&gt; 14 m: ασυμπίεστο και αδιαπέρατο. Υδροφόρος ορίζοντας στην επιφάνεια.</li></ul>',
  givens: [
    { key: 'W', label: 'Βάρος κτηρίου W', unit: 'kN', value: 11520, min: 4000, max: 30000, step: 160 },
    { key: 'cc', label: 'Δείκτης συμπίεσης cc', unit: '', value: 0.1, min: 0.05, max: 0.5, step: 0.01, dec: 2 },
    { key: 'e0', label: 'Αρχικός δείκτης πόρων e₀', unit: '', value: 1, min: 0.5, max: 2, step: 0.1, dec: 1 },
    { key: 'Es', label: 'E άμμου', unit: 'MPa', value: 5, min: 2, max: 40, step: 0.5, dec: 1 },
    { key: 'C1', label: 'C₁', unit: '', value: 0.9, min: 0.5, max: 1, step: 0.05, dec: 2 }
  ],
  compute: function (q) {
    var B = 12, L = 12, Df = 2, g = 20, gw = 10, qq = q.W / (B * L), P0 = (g - gw) * Df, dP = qq - P0;
    var clay = [];
    [1, 3, 5].forEach(function (z, i) {
      var depth = Df + z, s0 = (g - gw) * depth, ds = dP * B * L / ((B + z) * (L + z));
      var dh = 2 * q.cc / (1 + q.e0) * Math.log10((s0 + ds) / s0) * 1000;
      clay.push({ name: ['A', 'B', 'Γ'][i], z: z, depth: depth, s0: s0, ds: ds, dh: dh });
    });
    var Sc = clay.reduce(function (a, l) { return a + l.dh; }, 0), Sclay = 1.1 * Sc, Si_clay = 0.1 * Sc;
    var sand = [{ name: 'Δ', z: 7.5 }, { name: 'Ε', z: 10.5 }].map(function (l) { l.Iz = GEO.schIz(l.z, B, 'square', 0.6); l.term = dP * 3 * l.Iz / q.Es; return l; });
    var sumS = sand.reduce(function (a, l) { return a + l.term; }, 0), Ssand = q.C1 * 1 * sumS;
    return { B: B, L: L, Df: Df, g: g, qq: qq, P0: P0, dP: dP, clay: clay, Sc: Sc, Sclay: Sclay, Si_clay: Si_clay, sand: sand, sumS: sumS, Ssand: Ssand, Stot: Sclay + Ssand };
  },
  figure: function (q, r, step) {
    var sec = sectionFig({ Wm: 24, Dm: 15.5, s: 19, layers: [{ z1: 0, z2: 8, type: 'clay', label: 'ΚΣ άργιλος γ = 20, cc = ' + fmt(q.cc, 2) + ', e₀ = ' + fmt(q.e0, 1), k: 'clay' }, { z1: 8, z2: 14, type: 'sand', label: 'Ιλυώδης άμμος  E = ' + fmt(q.Es, 1) + ' MPa', k: 'sand' }, { z1: 14, z2: 15.5, type: 'rock', label: 'Ασυμπίεστο & αδιαπέρατο' }],
      foot: { x1: 6, x2: 18, Df: 2, label: 'B = L = 12 m' }, udl: 'q = ' + fmt(r.qq, 0) + ' kPa', wt: 0, ticks: [0, 2, 4, 6, 8, 11, 14], sink: step >= 5 ? 10 : 0,
      marks: r.clay.map(function (l) { return { x: 3, z: l.depth, name: l.name, txt: 'z = ' + l.z + ' m' }; }).concat(r.sand.map(function (l) { return { x: 20.5, z: r.Df + l.z, name: l.name, txt: 'Iz = ' + fmt(l.Iz, 2) }; })),
      extra: function (X, Y, s) {
        var g = '';
        [4, 6].forEach(function (z) { g += SVG.line(X(0), Y(z), X(24), Y(z), 'thin dash'); });
        // 2:1 spread lines
        if (step >= 1 && step <= 3) g += '<g class="a-draw">' + SVG.line(X(6), Y(2), X(6 - 3), Y(8), 'guide') + SVG.line(X(18), Y(2), X(21), Y(8), 'guide') + SVG.label(X(21.5), Y(5), '2:1', 'lbl-load', 'start') + '</g>';
        // Iz line in sand: Iz=0.6 at z=8 (0.5B below foundation), 0 at 24 m below foundation
        var k = 5 * s; var xb = X(23);
        g += '<g data-k="Iz">' + SVG.line(xb - 0.6 * k, Y(8), xb - 0.6 * k + 0.6 * k * (6 / 18), Y(14), 'curve hot') + SVG.label(xb - 0.6 * k - 6, Y(8) + 4, 'Iz = 0.6', 'lbl-load', 'end') + '</g>';
        return g;
      } });
    var chart = step >= 4 ? CHART.schmertmann(12, 'square', 0.6, r.sand.map(function (l) { return { z: l.z, Iz: l.Iz }; }), 2) : '';
    return grid2(sec, chart);
  },
  figcap: 'Άργιλος: συμπίεση στερεοποίησης στο μέσο κάθε υποστρώματος (Α, Β, Γ) με τη μέθοδο 2:1. Άμμος: Schmertmann με Iz στα σημεία Δ, Ε.',
  quick: function (q, r) { return gl([[m('q'), fmt(r.qq, 0) + ' kPa'], [m('ΔP'), fmt(r.dP, 0) + ' kPa'], ['Στερεοποίηση αργίλου', fmt(r.Sc, 0) + ' mm'], ['Σύνολο αργίλου (×1.1)', fmt(r.Sclay, 0) + ' mm'], ['Άμμος (Schmertmann)', fmt(r.Ssand, 1) + ' mm'], ['Σύνολο', '<b>' + fmt(r.Stot, 0) + ' mm</b>']]); },
  steps: [
    {
      title: 'Ασκούμενη και καθαρή τάση', hl: ['foot'],
      body: function (q, r) { return eqs([['q = \\frac{W}{B\\,L} = \\frac{' + fmt(q.W, 0) + '}{12\\times 12} = \\hl{' + fmt(r.qq, 0) + '\\unit{kPa}}'], ['P_0 = γ\'\\,D_f = (20 - 10)\\times 2 = ' + fmt(r.P0, 0) + '\\unit{kPa}', 'ενεργός τάση στη στάθμη θεμελίωσης (ΥΟ στην επιφάνεια)'], ['ΔP = q - P_0 = \\hl{' + fmt(r.dP, 0) + '\\unit{kPa}}']]); }
    },
    {
      title: 'Αύξηση τάσης με τη μέθοδο 2:1', hl: ['A', 'B', 'Γ'],
      cap: 'Το φορτίο "διαχέεται" με κλίση 2:1 (κατακόρυφο:οριζόντιο). Σε βάθος z κάτω από τη θεμελίωση η φορτιζόμενη επιφάνεια είναι (B+z)(L+z).',
      body: function (q, r) { return eqs([['Δσ(z) = \\frac{ΔP\\,B\\,L}{(B+z)(L+z)} = \\frac{' + fmt(r.dP * 144, 0) + '}{(12+z)^2}'], ['Δh = \\frac{H}{1+e_0}\\,c_c\\,\\log\\frac{σ\'_{v0}+Δσ}{σ\'_{v0}} = \\frac{2}{1+' + fmt(q.e0, 1) + '}\\times ' + fmt(q.cc, 2) + '\\times\\log\\frac{σ\'_{v0}+Δσ}{σ\'_{v0}}', 'ΚΣ άργιλος, υποστρώματα H = 2 m']]); }
    },
    {
      title: 'Συμπίεση υποστρωμάτων αργίλου Α, Β, Γ', hl: ['A', 'B', 'Γ', 'clay'],
      body: function (q, r) {
        return table(['Στρώμα', 'z κάτω από θεμελίωση (m)', m('σ\'_{v0}') + ' (kPa)', m('Δσ') + ' (kPa)', 'Δh (mm)'], r.clay.map(function (l) { return [l.name + ' (βάθος ' + l.depth + ' m)', l.z, fmt(l.s0, 0), fmt(l.ds, 1), fmt(l.dh, 1)]; })) +
          eq('S_{c,clay} = \\sum Δh = \\hl{' + fmt(r.Sc, 0) + '\\unit{mm}}') + note('Σημειώσεις: Δσ = 52.12, 38.4, 29.9 kPa → Δh = 43, 25, 15 mm (Σ = 83 mm). Η πρώτη τιμή Δσ είναι αριθμητικό λάθος: 8640/13² = 51.1 kPa.');
      }
    },
    {
      title: 'Συνολική συμπίεση αργίλου (άμεση + στερεοποίησης)', hl: ['clay'],
      body: function (q, r) { return eqs([['S_{i,clay} = 0.10\\,S_{c,clay} = ' + fmt(r.Si_clay, 1) + '\\unit{mm}'], ['S_{clay} = 1.1\\times ' + fmt(r.Sc, 0) + ' = \\hl{' + fmt(r.Sclay, 0) + '\\unit{mm}}']]) + note('Σημειώσεις: 1.1 · (43 + 25 + 15) = 91 mm.'); }
    },
    {
      title: 'Άμμος: διάγραμμα Iz (τετραγωνικό θεμέλιο)', hl: ['Δ', 'Ε', 'Iz', 'sand'],
      cap: 'Τετραγωνικό: Iz,max = 0.6 σε z = 0.5B = 6 m κάτω από τη θεμελίωση (= κορυφή της άμμου), μηδέν σε 2B = 24 m. Γραμμική παρεμβολή στα Δ, Ε.',
      body: function (q, r) { return eqs([['z(I_{z,max}) = 0.5B = 6\\unit{m},\\quad z(I_z = 0) = 2B = 24\\unit{m} \\;\\text{(από τη στάθμη θεμελίωσης)}'], ['I_z(z) = 0.6\\,\\frac{24 - z}{24 - 6} \\Rightarrow I_{z,Δ}(7.5) = \\hl{' + fmt(r.sand[0].Iz, 2) + '},\\quad I_{z,Ε}(10.5) = \\hl{' + fmt(r.sand[1].Iz, 2) + '}']]) + p('Η άμμος εκτείνεται μόνο έως 14 m (z = 12 m), άρα δύο στρώματα των 3 m.'); }
    },
    {
      title: 'Άμεση συμπίεση άμμου και σύνολο', hl: ['sand', 'foot'],
      body: function (q, r) { return eqs([['S_{sand} = C_1\\,C_2\\,ΔP\\,\\sum\\frac{I_{z,i}}{E_i}\\,Δz = ' + fmt(q.C1, 2) + '\\times 1\\times ' + fmt(r.dP, 0) + '\\times\\frac{3}{' + fmt(q.Es * 1000, 0) + '}\\times(' + fmt(r.sand[0].Iz, 2) + ' + ' + fmt(r.sand[1].Iz, 2) + ') = \\hl{' + fmt(r.Ssand, 1) + '\\unit{mm}}'], ['S_{total} = S_{clay} + S_{sand} = ' + fmt(r.Sclay, 0) + ' + ' + fmt(r.Ssand, 1) + ' = \\hl{' + fmt(r.Stot, 0) + '\\unit{mm}}']]) + note('Σημειώσεις: S(άμμου) = 32.4 mm.'); }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('S_{clay} \\approx ' + fmt(r.Sclay, 0) + '\\unit{mm},\\quad S_{sand} \\approx ' + fmt(r.Ssand, 1) + '\\unit{mm}') + '</div>'; }
});

/* ===================== ΑΣΚΗΣΗ 7 ===================== */
var QC_MEAN = [2.20, 2.51, 3.65, 5.44, 10.04, 10.04, 3.09, 4.35];
function qcProfile(d) { // synthetic jagged CPT trace (MPa) consistent with the layer means
  var i = Math.min(7, Math.floor(d / 1.5)), base = QC_MEAN[i];
  return Math.max(0.3, base * (1 + 0.28 * Math.sin(d * 7.3 + i) + 0.14 * Math.sin(d * 19.1) + 0.1 * Math.cos(d * 41)));
}
EX.push({
  id: 's7', num: 7, group: GRP_SCH, source: 'Άσκηση 7',
  title: 'Θεμελιολωρίδα 3 m σε ιλυώδη άμμο με δοκιμή CPT: Schmertmann',
  tags: ['Schmertmann', 'CPT', 'E = x·qc'],
  statement: p('Συστοιχία φωτοβολταϊκών πάνελ θεμελιώνεται σε θεμελιολωρίδα πλάτους 3 m στην επιφάνεια κορεσμένων ιλυοαμμωδών σχηματισμών. Από δοκιμή CPT προσδιορίστηκε η αντίσταση αιχμής ' + m('q_c') + ' με το βάθος. Να υπολογίσετε την άμεση συμπίεση με τη μέθοδο Schmertmann (1978) με ' + m('Δz = 1.5\\unit{m},\\; C_1 = 0.9,\\; C_2 = 1,\\; I_{z,max} = 0.6') + ', θεωρώντας τάση θεμελίωσης 50 kPa.') +
    p('Μέτρο ελαστικότητας από CPT: ' + m('E = x\\cdot q_c') + ', με x = 3.5 για θεμελιολωρίδα (2.5 για τετραγωνικό).'),
  givens: [
    { key: 'q', label: 'Τάση θεμελίωσης q', unit: 'kPa', value: 50, min: 20, max: 200, step: 5 },
    { key: 'x', label: 'Συντελεστής x (E = x·qc)', unit: '', value: 3.5, min: 2, max: 5, step: 0.25, dec: 2 },
    { key: 'C1', label: 'C₁', unit: '', value: 0.9, min: 0.5, max: 1, step: 0.05, dec: 2 },
    { key: 'C2', label: 'C₂ (ερπυσμός)', unit: '', value: 1, min: 1, max: 1.6, step: 0.05, dec: 2 }
  ],
  compute: function (q) {
    var B = 3, dz = 1.5, dP = q.q, layers = schLayers(8, dz, 0, B, 'strip', 0.6, function (i) { return q.x * QC_MEAN[i]; }, dP);
    layers.forEach(function (l, i) { l.qc = QC_MEAN[i]; });
    var sum = layers.reduce(function (a, l) { return a + l.term; }, 0);
    return { B: B, dz: dz, dP: dP, layers: layers, sum: sum, S: q.C1 * q.C2 * sum, sumNotes: sum * 45 / q.q };
  },
  figure: function (q, r, step) {
    var sec = schSection({ Wm: 14, s: 22, ml: 170, Df: 0, B: 3, xc: 7, dz: 1.5, layers: r.layers, extraDepth: 1, udl: 'q = ' + fmt(q.q, 0) + ' kPa', ticks: [0, 3, 6, 9, 12], soilLabel: 'Ιλυώδης άμμος (κορεσμένη)', type: 'sand',
      extra: function (X, Y, s) {
        var x0 = 24, w = 110, kx = w / 12; // qc 0..12 MPa
        var g = '<g data-k="qc">' + SVG.rect(x0, Y(0), w, 12 * s, 'thin');
        for (var v = 0; v <= 12; v += 4) g += SVG.line(x0 + v * kx, Y(0), x0 + v * kx, Y(0) - 4, 'thin') + SVG.text(x0 + v * kx, Y(0) - 8, v, 'lbl-muted', 'text-anchor="middle"');
        g += SVG.text(x0 + w / 2, Y(0) - 22, 'qc (MPa)', 'lbl-muted', 'text-anchor="middle"');
        var d = '';
        for (var z = 0; z <= 12; z += 0.1) d += (d ? ' L' : 'M') + (x0 + Math.min(12, qcProfile(z)) * kx).toFixed(1) + ',' + Y(z).toFixed(1);
        g += '<path d="' + d + '" class="curve hot a-draw" stroke-width="1.4"/>';
        var ds = '';
        r.layers.forEach(function (l, i) { var z1 = i * 1.5, z2 = z1 + 1.5, xx = x0 + l.qc * kx; ds += (ds ? ' L' : 'M') + xx + ',' + Y(z1) + ' L' + xx + ',' + Y(z2); });
        g += '<path d="' + ds + '" class="blue"/>' + SVG.label(x0 + w - 4, Y(12) - 6, 'μέση qc ανά στρώμα', 'lbl-muted', 'end');
        return g + '</g>';
      } });
    return grid2(sec, CHART.schmertmann(3, 'strip', 0.6, r.layers.map(function (l) { return { z: l.z, Iz: l.Iz }; }), 0));
  },
  figcap: 'Αριστερά: η καταγραφή qc της CPT και η μέση τιμή ανά στρώμα 1.5 m (μπλε). Από αυτή προκύπτει E = x·qc. Δεξιά: το διάγραμμα Iz της λωρίδας έως 4B = 12 m.',
  quick: function (q, r) { return gl([[m('ΔP'), fmt(r.dP, 0) + ' kPa'], ['Βάθος επιρροής 4B', '12 m'], [m('\\sum'), fmt(r.sum, 2) + ' mm'], [m('S'), '<b>' + fmt(r.S, 1) + ' mm</b>']]); },
  steps: [
    {
      title: 'Γεωμετρία Schmertmann για λωρίδα', hl: ['foot'],
      body: function (q, r) { return eqs([['z_{max} = 4B = 12\\unit{m},\\quad z(I_{z,max}) = B/2 \\to \\text{για λωρίδα } z = B = 3\\unit{m}'], ['ΔP = q - γ D_f = ' + fmt(q.q, 0) + ' - 0 = \\hl{' + fmt(r.dP, 0) + '\\unit{kPa}}', 'επιφανειακή θεμελίωση']]) + note('Στις σημειώσεις αναφέρεται "το βάθος του Iz,max βρίσκεται σε B/2 = 1.5 m" αλλά οι τιμές του πίνακα αντιστοιχούν σωστά στο διάγραμμα λωρίδας (κορυφή σε z = B = 3 m).') + note('Για επιφανειακή θεμελίωση (D<sub>f</sub> = 0) η σχέση του Schmertmann δίνει C<sub>1</sub> = 1 − 0.5·q/(q̄ − q) = 1.0. Η τιμή C<sub>1</sub> = ' + fmt(q.C1, 1) + ' είναι δεδομένο της εκφώνησης και όχι αποτέλεσμα της σχέσης· σε πραγματικό πρόβλημα με D<sub>f</sub> = 0 λαμβάνεται C<sub>1</sub> = 1.'); }
    },
    {
      title: 'Μέση qc ανά στρώμα και E = x·qc', hl: ['qc'],
      body: function (q, r) { return table(['Στρώμα', 'Βάθος (m)', 'μέση qc (MPa)', 'E = ' + fmt(q.x, 2) + '·qc (MPa)'], r.layers.map(function (l, i) { return [l.i, fmt(i * 1.5, 1) + ' – ' + fmt(i * 1.5 + 1.5, 1), fmt(l.qc, 2), fmt(l.E, 2)]; })); }
    },
    {
      title: 'Συντελεστής Iz στο μέσο κάθε στρώματος', hl: r_hl_all(8),
      body: function (q, r) { return p('Από το διάγραμμα της λωρίδας: 0.2 στην επιφάνεια, 0.6 σε z = 3 m, 0 σε z = 12 m.') + p(r.layers.map(function (l) { return m('I_z(' + fmt(l.z, 2) + ') = ' + fmt(l.Iz, 2)); }).join(', &ensp;')); }
    },
    {
      title: 'Όροι στρωμάτων 1 – 4', hl: ['L1', 'L2', 'L3', 'L4'],
      body: function (q, r) { return schTable(r.layers.slice(0, 4), -1, { head: 'qc (MPa)', val: function (l) { return fmt(l.qc, 2); } }); }
    },
    {
      title: 'Όροι στρωμάτων 5 – 8', hl: ['L5', 'L6', 'L7', 'L8'],
      body: function (q, r) { return schTable(r.layers.slice(4), -1, { head: 'qc (MPa)', val: function (l) { return fmt(l.qc, 2); } }); }
    },
    {
      title: 'Άθροιση και καθίζηση', hl: r_hl_all(8),
      body: function (q, r) { return eqs([['S = C_1\\,C_2\\sum\\frac{ΔP\\,Δz\\,I_{z,i}}{E_i} = ' + fmt(q.C1, 2) + '\\times ' + fmt(q.C2, 2) + '\\times ' + fmt(r.sum, 2) + ' = \\hl{' + fmt(r.S, 1) + '\\unit{mm}}']]) + note('<b>Απόκλιση από τις σημειώσεις:</b> εκεί οι όροι του πίνακα (2.63, 3.83, …, Σ = 14.74) αντιστοιχούν σε ΔP ≈ 45 kPa, δηλαδή ο C₁ = 0.9 εφαρμόστηκε δύο φορές (S = 0.9 · 14.74 = 13.26 mm). Με ΔP = 50 kPa η σωστή τιμή είναι Σ = ' + fmt(r.sum, 2) + ' mm και S = ' + fmt(r.S, 1) + ' mm.'); }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('S \\approx ' + fmt(r.S, 1) + '\\unit{mm}') + '</div><p>Μικρή καθίζηση: οι στρώσεις 5–6 με υψηλή qc (≈ 10 MPa) συμπιέζονται ελάχιστα παρά το σημαντικό Iz.</p>'; }
});

/* ===================== ΑΣΚΗΣΗ 8 ===================== */
EX.push({
  id: 's8', num: 8, group: GRP_CON, source: 'Άσκηση 8',
  title: 'Κοιτόστρωση 12 × 12 σε άμμο πάνω από άργιλο: συμπιέσεις και χρόνος στερεοποίησης',
  tags: ['Στερεοποίηση (Cc)', 'Schmertmann', 'Χρόνος t₉₀', 'Tv – U'],
  statement: p('Κτίριο θεμελιώνεται σε γενική κοιτόστρωση 12 m × 12 m σε βάθος 2 m. Το βάρος του κτιρίου με τη θεμελίωση είναι 1440 t.') +
    '<ol><li>Τελική συμπίεση του αργιλικού στρώματος με τη μέθοδο ' + m('c_c') + ' (υποστρώματα έως 2 m, μέθοδος 2:1). Άμεση συμπίεση αργίλου = 10 % της συμπίεσης στερεοποίησης.</li><li>Άμεση συμπίεση των αμμωδών σχηματισμών κατά Schmertmann (1978), ' + m('Δz = 3\\unit{m},\\; C_1 = 0.9,\\; C_2 = 1,\\; I_{z,max} = 0.6') + '.</li><li>Χρόνος για την ανάπτυξη του 90 % των τελικών καθιζήσεων.</li></ol>' +
    '<ul><li>0 – 8 m: ιλυώδης άμμος, ' + m('γ_κ = 20\\unit{kN/m³},\\; E = 5\\unit{MPa}') + '</li><li>8 – 12 m: ΚΣ άργιλος, ' + m('γ_κ = 20\\unit{kN/m³},\\; c_c = 0.1,\\; e_0 = 1,\\; c_v = 1.86\\unit{cm²/day}') + '</li><li>&gt; 12 m: ασυμπίεστο και αδιαπέρατο. Υδροφόρος ορίζοντας στην επιφάνεια.</li></ul>',
  givens: [
    { key: 'N', label: 'Βάρος κτιρίου N', unit: 'kN', value: 14400, min: 5000, max: 40000, step: 200 },
    { key: 'Es', label: 'E άμμου', unit: 'MPa', value: 5, min: 2, max: 40, step: 0.5, dec: 1 },
    { key: 'cc', label: 'Δείκτης συμπίεσης cc', unit: '', value: 0.1, min: 0.05, max: 0.5, step: 0.01, dec: 2 },
    { key: 'cv', label: 'Συντελεστής στερεοποίησης cv', unit: 'cm²/day', value: 1.86, min: 0.5, max: 20, step: 0.1, dec: 2 },
    { key: 'U90', label: 'Ποσοστό τελικής καθίζησης', unit: '%', value: 90, min: 50, max: 99, step: 1 }
  ],
  compute: function (q) {
    var B = 12, L = 12, Df = 2, g = 20, gw = 10, e0 = 1, C1 = 0.9, qq = q.N / (B * L), qnet = qq - (g - gw) * Df;
    var clay = [{ name: 'A', depth: 9 }, { name: 'B', depth: 11 }].map(function (l) {
      l.z = l.depth - Df; l.s0 = (g - gw) * l.depth; l.ds = qnet * B * L / ((B + l.z) * (L + l.z));
      l.dh = 2 * q.cc / (1 + e0) * Math.log10((l.s0 + l.ds) / l.s0) * 1000; return l;
    });
    var Sc = clay[0].dh + clay[1].dh, Sclay = 1.1 * Sc, Si_clay = 0.1 * Sc;
    var sand = [{ name: '1', z: 1.5 }, { name: '2', z: 4.5 }].map(function (l) { l.Iz = GEO.schIz(l.z, B, 'square', 0.6); l.term = qnet * 3 * l.Iz / q.Es; return l; });
    var Ssand = C1 * (sand[0].term + sand[1].term);
    var St = Ssand + Sclay, Si = Ssand + Si_clay, S90 = q.U90 / 100 * St, need = S90 - Si, U = Math.max(0.01, Math.min(0.999, need / Sc)), Tv = GEO.Tv(U);
    var d = 4, tdays = Tv * (d * 100) * (d * 100) / q.cv, tyrs = tdays / 365;
    return { qq: qq, qnet: qnet, clay: clay, Sc: Sc, Sclay: Sclay, Si_clay: Si_clay, sand: sand, Ssand: Ssand, St: St, Si: Si, S90: S90, need: need, U: U, Tv: Tv, d: d, tdays: tdays, tyrs: tyrs, C1: C1 };
  },
  figure: function (q, r, step) {
    var sec = sectionFig({ Wm: 24, Dm: 13.5, s: 20, layers: [{ z1: 0, z2: 8, type: 'sand', label: 'Ιλυώδης άμμος  E = ' + fmt(q.Es, 1) + ' MPa', k: 'sand' }, { z1: 8, z2: 12, type: 'clay', label: 'ΚΣ άργιλος cc = ' + fmt(q.cc, 2) + ', e₀ = 1, cv = ' + fmt(q.cv, 2) + ' cm²/d', k: 'clay' }, { z1: 12, z2: 13.5, type: 'rock', label: 'Ασυμπίεστο & αδιαπέρατο' }],
      foot: { x1: 6, x2: 18, Df: 2, label: 'B = L = 12 m' }, udl: 'q = ' + fmt(r.qq, 0) + ' kPa', wt: 0, ticks: [0, 2, 4, 6, 8, 10, 12], sink: step >= 6 ? 10 : 0,
      marks: r.clay.map(function (l) { return { x: 3, z: l.depth, name: l.name, txt: 'z = ' + l.z + ' m' }; }).concat(r.sand.map(function (l) { return { x: 20.5, z: 2 + l.z, name: 'Iz = ' + fmt(l.Iz, 2) }; })),
      extra: function (X, Y, s) {
        var g = SVG.line(X(0), Y(10), X(24), Y(10), 'thin dash') + SVG.line(X(0), Y(5), X(24), Y(5), 'thin dash');
        if (step >= 1 && step <= 3) g += '<g class="a-draw">' + SVG.line(X(6), Y(2), X(1.5), Y(11), 'guide') + SVG.line(X(18), Y(2), X(22.5), Y(11), 'guide') + SVG.label(X(22.8), Y(6), '2:1', 'lbl-load', 'start') + '</g>';
        var k = 5 * s, xb = X(23);
        g += '<g data-k="Iz">' + SVG.line(xb - 0.1 * k, Y(2), xb - 0.6 * k, Y(8), 'curve hot') + SVG.label(xb - 0.6 * k - 6, Y(8) + 4, 'Iz = 0.6', 'lbl-load', 'end') + SVG.label(xb - 0.1 * k + 4, Y(2) + 14, '0.1', 'lbl-load', 'start') + '</g>';
        if (step >= 6) g += '<g class="a-flow">' + [8, 12, 16].map(function (x) { return SVG.arrow(X(x), Y(11.5), X(x), Y(8.6), 'fg', '', 1.5); }).join('') + '</g>' + SVG.label(X(12), Y(12.8) - 2, 'μονή στράγγιση προς τα πάνω: d = 4 m', 'lbl-w', 'middle');
        return g;
      } });
    var chart = step >= 6 ? CHART.consol(r.U) : (step >= 4 ? CHART.schmertmann(12, 'square', 0.6, r.sand.map(function (l) { return { z: l.z, Iz: l.Iz }; }), 2) : '');
    return grid2(sec, chart);
  },
  figcap: 'Η άμμος (0–8 m) συμπιέζεται άμεσα (Schmertmann, Iz γραμμικό 0.1 → 0.6 στα πρώτα 6 m). Η άργιλος (8–12 m) στερεοποιείται με μονή στράγγιση προς τα πάνω.',
  quick: function (q, r) { return gl([[m('q_{app,net}'), fmt(r.qnet, 0) + ' kPa'], ['Άργιλος, στερεοποίηση', fmt(r.Sc, 1) + ' mm'], ['Άμμος, άμεση', fmt(r.Ssand, 1) + ' mm'], [m('S_t'), fmt(r.St, 1) + ' mm'], [m('U') + ' για ' + q.U90 + '%', fmt(r.U * 100, 0) + ' %'], [m('t'), '<b>' + fmt(r.tyrs, 0) + ' έτη</b>']]); },
  steps: [
    {
      title: 'Ασκούμενη και καθαρή τάση', hl: ['foot'],
      body: function (q, r) { return eqs([['q_{app} = \\frac{N}{A} = \\frac{' + fmt(q.N, 0) + '}{12\\times 12} = \\hl{' + fmt(r.qq, 0) + '\\unit{kPa}}'], ['q_{app,net} = q_{app} - γ\'\\,D_f = ' + fmt(r.qq, 0) + ' - 10\\times 2 = \\hl{' + fmt(r.qnet, 0) + '\\unit{kPa}}', 'ΥΟ στην επιφάνεια: γ′ = 20 − 10']]); }
    },
    {
      title: 'Άργιλος, υπόστρωμα Α (8 – 10 m)', hl: ['A', 'clay'],
      body: function (q, r) { var l = r.clay[0]; return eqs([['Δσ_A = \\frac{q_{app,net}\\,B\\,L}{(B+z)(L+z)} = \\frac{' + fmt(r.qnet, 0) + '\\times 12^2}{(12+' + l.z + ')^2} = \\hl{' + fmt(l.ds, 1) + '\\unit{kPa}}', 'z = ' + l.z + ' m κάτω από τη θεμελίωση'], ['σ\'_{v,A} = γ_κ\\,' + l.depth + ' - γ_w\\,' + l.depth + ' = \\hl{' + fmt(l.s0, 0) + '\\unit{kPa}}'], ['Δh_A = \\frac{H}{1+e_0}\\,c_c\\,\\log\\frac{σ\'_{v,A}+Δσ_A}{σ\'_{v,A}} = \\frac{2}{2}\\times ' + fmt(q.cc, 2) + '\\times\\log\\frac{' + fmt(l.s0 + l.ds, 1) + '}{' + fmt(l.s0, 0) + '} = \\hl{' + fmt(l.dh, 1) + '\\unit{mm}}']]) + note('Σημειώσεις: Δσ ≈ 32 kPa, Δh_A = 13 mm.'); }
    },
    {
      title: 'Άργιλος, υπόστρωμα Β (10 – 12 m)', hl: ['B', 'clay'],
      body: function (q, r) { var l = r.clay[1]; return eqs([['Δσ_B = \\frac{' + fmt(r.qnet, 0) + '\\times 12^2}{(12+' + l.z + ')^2} = \\hl{' + fmt(l.ds, 1) + '\\unit{kPa}}'], ['σ\'_{v,B} = 10\\times ' + l.depth + ' = \\hl{' + fmt(l.s0, 0) + '\\unit{kPa}}'], ['Δh_B = 1\\times ' + fmt(q.cc, 2) + '\\times\\log\\frac{' + fmt(l.s0 + l.ds, 1) + '}{' + fmt(l.s0, 0) + '} = \\hl{' + fmt(l.dh, 1) + '\\unit{mm}}']]) + note('Σημειώσεις: Δσ ≈ 26 kPa, Δh_B = 9 mm.'); }
    },
    {
      title: 'Τελική συμπίεση αργίλου', hl: ['clay'],
      body: function (q, r) { return eqs([['S_{c,clay} = Δh_A + Δh_B = ' + fmt(r.Sc, 1) + '\\unit{mm}'], ['S_{clay} = \\text{άμεση} + \\text{στερεοποίησης} = 1.1\\times ' + fmt(r.Sc, 1) + ' = \\hl{' + fmt(r.Sclay, 1) + '\\unit{mm}}'], ['S_{i,clay} = 0.1\\times ' + fmt(r.Sc, 1) + ' = ' + fmt(r.Si_clay, 1) + '\\unit{mm}']]) + note('Σημειώσεις: 1.1 · (13 + 9) = 24.2 mm, άμεση 2.2 mm.'); }
    },
    {
      title: 'Άμμος: Schmertmann (τετραγωνικό, μόνο 0 – 6 m κάτω από τη θεμελίωση)', hl: ['sand', 'Iz'],
      cap: 'Τετραγωνικό: Iz = 0.1 στη στάθμη θεμελίωσης και 0.6 σε B/2 = 6 m, ακριβώς στην κορυφή της αργίλου. Δύο στρώματα των 3 m.',
      body: function (q, r) { return eqs([['I_z(z) = 0.1 + 0.5\\,\\frac{z}{6} \\Rightarrow I_{z1}(1.5) = \\hl{' + fmt(r.sand[0].Iz, 3) + '},\\quad I_{z2}(4.5) = \\hl{' + fmt(r.sand[1].Iz, 3) + '}'], ['S_{sand} = c_1\\,c_2\\,ΔP\\sum\\frac{I_{z,i}}{E_i}Δz = 0.9\\times 1\\times ' + fmt(r.qnet, 0) + '\\times\\left(\\frac{' + fmt(r.sand[0].Iz, 3) + '}{' + fmt(q.Es * 1000, 0) + '}\\times 3 + \\frac{' + fmt(r.sand[1].Iz, 3) + '}{' + fmt(q.Es * 1000, 0) + '}\\times 3\\right) = \\hl{' + fmt(r.Ssand, 1) + '\\unit{mm}}']]) + note('Σημειώσεις: Iz = 0.22 και 0.47 (γραφικά) → ≈ 30 mm.'); }
    },
    {
      title: 'Άμεσες, στερεοποίησης και τελικές καθιζήσεις', hl: ['foot', 'sand', 'clay'],
      body: function (q, r) { return eqs([['S_i = S_{sand} + S_{i,clay} = ' + fmt(r.Ssand, 1) + ' + ' + fmt(r.Si_clay, 1) + ' = \\hl{' + fmt(r.Si, 1) + '\\unit{mm}}', 'άμεσες (άμμος + άργιλος)'], ['S_t = S_{sand} + S_{clay} = ' + fmt(r.Ssand, 1) + ' + ' + fmt(r.Sclay, 1) + ' = \\hl{' + fmt(r.St, 1) + '\\unit{mm}}', 'τελικές'], ['S_c = S_t - S_i = \\hl{' + fmt(r.Sc, 1) + '\\unit{mm}}', 'καθιζήσεις στερεοποίησης']]) + note('Σημειώσεις: Si = 32.2 mm, St = 54.2 mm, Sc = 22 mm.'); }
    },
    {
      title: 'Χρόνος για το ' + '90 % των τελικών καθιζήσεων', hl: ['clay'],
      cap: 'Μόνο η στερεοποίηση της αργίλου εξελίσσεται στον χρόνο: υπολογίζουμε πόσο από τα Sc χρειάζεται και τον αντίστοιχο βαθμό U.',
      body: function (q, r) { return eqs([['S_{' + q.U90 + '} = ' + fmt(q.U90 / 100, 2) + '\\times S_t = ' + fmt(r.S90, 1) + '\\unit{mm} \\Rightarrow S_{' + q.U90 + '} - S_i = ' + fmt(r.need, 1) + '\\unit{mm}', 'αφαιρούμε τις άμεσες'], ['U = \\frac{' + fmt(r.need, 1) + '}{' + fmt(r.Sc, 1) + '} = \\hl{' + fmt(r.U * 100, 0) + '\\%} \\Rightarrow T_v = ' + fmt(r.Tv, 3), 'από την καμπύλη U–Tv'], ['t = \\frac{T_v\\,d^2}{c_v} = \\frac{' + fmt(r.Tv, 3) + '\\times 400^2}{' + fmt(q.cv, 2) + '} = ' + fmt(r.tdays, 0) + '\\unit{days} \\approx \\hl{' + fmt(r.tyrs, 0) + '\\unit{έτη}}', 'd = 4 m: μονή στράγγιση (αδιαπέρατο υπόβαθρο)']]) + note('Σημειώσεις: U ≈ 75 %, Tv = 0.52 (από διάγραμμα) → t ≈ 122 έτη. Η αναλυτική σχέση δίνει Tv = ' + fmt(GEO.Tv(0.75), 3) + ' για U = 75 %.') + note('Το 10 % άμεσης συμπίεσης της αργίλου προστίθεται στις άμεσες (S<sub>i</sub> = ' + fmt(r.Si, 1) + ' mm) και το ' + q.U90 + ' % των τελικών μετράται πάνω στο S<sub>i</sub> + S<sub>c</sub>. Ο βαθμός U = ' + fmt(r.U * 100, 0) + ' % αναφέρεται μόνο στην καθίζηση στερεοποίησης της αργίλου (' + fmt(r.Sc, 1) + ' mm), όχι στη συνολική καθίζηση.'); }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('S_t \\approx ' + fmt(r.St, 0) + '\\unit{mm},\\quad t_{' + q.U90 + '} \\approx ' + fmt(r.tyrs, 0) + '\\unit{έτη}') + '</div><p>Ο χρόνος στερεοποίησης είναι τεράστιος λόγω του μικρού cv και της μονής στράγγισης (d = 4 m): t ∝ d².</p>'; }
});

/* ===================== ΑΣΚΗΣΗ 9 ===================== */
function tankPlan(L, overlays, pts) {
  var s = 9, ox = 36, oy = 40, gap = L / 2, D = L - 2, W = ox * 2 + (2.5 * L) * s, H = oy + L * s + 40;
  var X = function (x) { return ox + x * s; }, Y = function (y) { return oy + y * s; };
  var h = SVG.open(W, H, 'aria-label="Κάτοψη δύο δεξαμενών σε τετραγωνικά θεμέλια με σημεία Α, Ο, Β"');
  [0, L + gap].forEach(function (x0) { h += SVG.rect(X(x0), Y(0), L * s, L * s, 'hatch') + SVG.rect(X(x0), Y(0), L * s, L * s, 'thin', 'stroke-width="2"') + SVG.circle(X(x0 + L / 2), Y(L / 2), D / 2 * s, 'conc'); });
  overlays.forEach(function (v, i) { h += '<g data-k="' + (v.k || '') + '" class="a-fade" style="animation-delay:' + (i * 0.15) + 's">' + SVG.rect(X(v.x), Y(v.y), v.w * s, v.h * s, v.cls) + (v.label ? SVG.label(X(v.lx === undefined ? v.x + v.w / 2 : v.lx), Y(v.ly === undefined ? v.y + v.h / 2 : v.ly) + 4, v.label, 'math') : '') + '</g>'; });
  pts.forEach(function (pt) { h += '<g data-k="' + pt.name + '">' + SVG.point(X(pt.x), Y(pt.y), pt.name, pt.dx, pt.dy) + '</g>'; });
  h += SVG.dim(X(0), Y(L) + 10, X(L), Y(L) + 10, 'L = ' + fmt(L, 0) + ' m', 12) + SVG.dim(X(L), Y(L) + 10, X(L + gap), Y(L) + 10, 'L/2', 12) + SVG.dim(X(L + gap), Y(L) + 10, X(2 * L + gap), Y(L) + 10, 'L', 12);
  h += SVG.label(X(L + gap + L / 2), Y(L / 2) + 4, 'D = L − 2 = ' + fmt(D, 0) + ' m', 'lbl-muted');
  return h + SVG.close();
}
EX.push({
  id: 's9', num: 9, group: GRP_MIX, source: 'Άσκηση 9',
  title: 'Δεξαμενές πετρελαίου: μέγιστο ύψος από καθίζηση, γωνιακή παραμόρφωση και φέρουσα ικανότητα',
  tags: ['Steinbrenner', 'Γωνιακή παραμόρφωση', 'DIN 4017 (φ = 0)'],
  statement: p('Δεξαμενές πετρελαίου θεμελιώνονται σε τετραγωνικά εύκαμπτα θεμέλια ΩΣ σε κορεσμένο αργιλικό έδαφος. Να υπολογίσετε το μέγιστο ύψος πετρελαίου ώστε:') +
    '<ol><li>Η καθίζηση στο Ο να μην ξεπεράσει τα 10 cm (αγνοήστε τη γειτονική δεξαμενή και το βάθος θεμελίωσης).</li><li>Η γωνιακή παραμόρφωση Α–Β να μην ξεπεράσει το 1/500 (αγνοήστε το βάρος θεμελίωσης).</li><li>Ο συντελεστής ασφαλείας έναντι φέρουσας ικανότητας σε αστράγγιστες συνθήκες (TSA) να είναι 2 κατά DIN 4017.</li></ol>' +
    '<ul><li>' + m('L = 12\\unit{m},\\; D_f = 2.5\\unit{m}') + ', πάχος συμπιεστού εδάφους 60 m</li><li>' + m('c_u = 40\\unit{kPa},\\; E = 10\\unit{MPa},\\; ν = 0.3,\\; γ = 20\\unit{kN/m³},\\; γ_{oil} = 8.4\\unit{kN/m³}') + '</li></ul>',
  givens: [
    { key: 'Smax', label: 'Επιτρεπόμενη καθίζηση στο Ο', unit: 'cm', value: 10, min: 2, max: 30, step: 1 },
    { key: 'E', label: 'Μέτρο ελαστικότητας E', unit: 'MPa', value: 10, min: 2, max: 50, step: 1 },
    { key: 'cu', label: 'Αστράγγιστη αντοχή cu', unit: 'kPa', value: 40, min: 15, max: 150, step: 5 },
    { key: 'goil', label: 'Ειδικό βάρος πετρελαίου', unit: 'kN/m³', value: 8.4, min: 7, max: 10, step: 0.1, dec: 1 },
    { key: 'FS', label: 'Συντελεστής ασφαλείας FS', unit: '', value: 2, min: 1.5, max: 3, step: 0.1, dec: 1 }
  ],
  compute: function (q) {
    var L = 12, Df = 2.5, H = 60, g = 20, b = L / 2, D = L - 2, AR = L * L / (Math.PI * D * D / 4), E = q.E * 1000, Smax = q.Smax / 100;
    var zB = H / b, fO = fS(1, zB), IO = 4 * fO, qa = Smax * E / (b * IO), qoil_a = qa * AR, ha = qoil_a / q.goil;
    var f2 = fS(2, zB), f5 = fS(5, zB), f3 = fS(3, zB), f1 = fS(1, zB);
    var IA = 2 * (f2 + f5 - f3), IB = 2 * (f2 + f3 - f1), dSlim = L / 500, qb = dSlim * E / (b * (IB - IA)), qoil_b = qb * AR, hb = qoil_b / q.goil;
    var Nc = 5, Vc = 1.2, qult = q.cu * Nc * Vc + g * Df, qnet = qult - g * Df, qappnet = qnet / q.FS, qslab = qappnet + g * Df, qoil_c = qslab * AR, hc = qoil_c / q.goil;
    return { L: L, Df: Df, H: H, b: b, D: D, AR: AR, zB: zB, fO: fO, IO: IO, qa: qa, qoil_a: qoil_a, ha: ha, f1: f1, f2: f2, f3: f3, f5: f5, IA: IA, IB: IB, dSlim: dSlim, qb: qb, qoil_b: qoil_b, hb: hb, Nc: Nc, Vc: Vc, qult: qult, qnet: qnet, qappnet: qappnet, qslab: qslab, qoil_c: qoil_c, hc: hc, hgov: Math.min(ha, hb, hc) };
  },
  figure: function (q, r, step) {
    var L = 12, ov = [], pts = [{ x: 0, y: 6, name: 'A', dx: -16, dy: -8 }, { x: 6, y: 6, name: 'O', dx: 6, dy: -8 }, { x: 12, y: 6, name: 'B', dx: 6, dy: -8 }], cp = [];
    if (step === 1) { ov = [{ x: 0, y: 0, w: 6, h: 6, cls: 'fill-blue', k: 'O', label: '4 × (6×6)' }]; cp = [{ LB: 1, zB: r.zB, name: 'O' }]; }
    else if (step === 2) { ov = [{ x: 0, y: 0, w: 12, h: 6, cls: 'fill-blue', k: 'A' }, { x: 0, y: 6, w: 12, h: 6, cls: 'fill-blue', k: 'A', label: '2×(6×12)' }, { x: 0, y: 0, w: 30, h: 6, cls: 'fill-green', k: 'A', label: '+ 6×30', lx: 24, ly: 3 }, { x: 0, y: 0, w: 18, h: 6, cls: 'fill-red', k: 'A', label: '− 6×18', lx: 15, ly: 3 }]; cp = [{ LB: 2, zB: r.zB, name: 'μπλε' }, { LB: 5, zB: r.zB, name: 'πράσινο' }, { LB: 3, zB: r.zB, name: 'κόκκινο' }]; }
    else if (step === 3) { ov = [{ x: 0, y: 0, w: 12, h: 6, cls: 'fill-blue', k: 'B' }, { x: 0, y: 6, w: 12, h: 6, cls: 'fill-blue', k: 'B', label: '2×(6×12)' }, { x: 12, y: 0, w: 18, h: 6, cls: 'fill-green', k: 'B', label: '+ 6×18', lx: 24, ly: 3 }, { x: 12, y: 0, w: 6, h: 6, cls: 'fill-red', k: 'B', label: '− 6×6', lx: 15, ly: 3 }]; cp = [{ LB: 2, zB: r.zB, name: 'μπλε' }, { LB: 3, zB: r.zB, name: 'πράσινο' }, { LB: 1, zB: r.zB, name: 'κόκκινο' }]; }
    var plan = tankPlan(L, ov, pts);
    var sec = sectionFig({ Wm: 36, Dm: 11, s: 8, mt: 70, layers: [{ z1: 0, z2: 11, type: 'clay', label: 'Κορεσμένη άργιλος cu = ' + fmt(q.cu, 0) + ' kPa, E = ' + fmt(q.E, 0) + ' MPa', sub: 'συμπιεστό έως H = 60 m', k: 'clay' }],
      foot: { x1: 3, x2: 15, Df: 2.5, label: 'L = 12 m', k: 'T1' }, udl: 'q', ticks: [0, 2.5],
      extra: function (X, Y, s) {
        var g = '<rect x="' + X(20.7) + '" y="' + Y(0) + '" width="' + (12.6 * s) + '" height="' + (2.5 * s) + '" fill="var(--panel-2)"/>' + SVG.rect(X(21), Y(2.5) - 4, 12 * s, 4, 'conc');
        [3, 21].forEach(function (x0) { g += SVG.rect(X(x0 + 1), Y(2.5) - 4 - 6.5 * s, 10 * s, 6.5 * s, 'conc', 'fill-opacity=".55"'); });
        g += '<g data-k="oil" class="a-down">' + SVG.rect(X(4), Y(2.5) - 4 - Math.min(6.3, r.hgov / 6) * s, 10 * s, Math.min(6.3, r.hgov / 6) * s, 'fill-hl') + '</g>' + SVG.label(X(9), Y(2.5) - 4 - 6.5 * s - 6, 'h = ' + fmt(r.hgov, 1) + ' m πετρέλαιο', 'lbl-load');
        g += SVG.label(X(24), Y(1.6), 'γειτονική δεξαμενή', 'lbl-muted', 'start');
        return g;
      } });
    return stack(grid2(plan, sec), CHART.steinbrenner(cp));
  },
  figcap: 'Κάτοψη: η κυκλική δεξαμενή (D = L − 2) εδράζεται σε τετραγωνικό θεμέλιο L × L. Η πίεση του πετρελαίου μεταφέρεται στο έδαφος μέσω του λόγου εμβαδών.',
  quick: function (q, r) { return gl([['Λόγος εμβαδών', fmt(r.AR, 2)], [m('h_a') + ' (καθίζηση)', fmt(r.ha, 1) + ' m'], [m('h_b') + ' (γωνιακή παρ.)', fmt(r.hb, 1) + ' m'], [m('h_c') + ' (φέρουσα ικ.)', fmt(r.hc, 1) + ' m'], [m('h_{max}'), '<b>' + fmt(r.hgov, 1) + ' m</b>']]); },
  steps: [
    {
      title: 'Γεωμετρία και λόγος εμβαδών', hl: ['T1', 'oil'],
      body: function (q, r) { return eqs([['A_{τετρ} = L^2 = 144\\unit{m²},\\quad A_{κύκλου} = \\frac{π D^2}{4} = \\frac{π\\,10^2}{4} = 78.54\\unit{m²}'], ['\\text{Λόγος εμβαδών } = \\frac{144}{78.54} = \\hl{' + fmt(r.AR, 2) + '} \\Rightarrow q_{oil} = ' + fmt(r.AR, 2) + '\\,q_{θεμελίου}', 'η πίεση του πετρελαίου απλώνεται στο μεγαλύτερο τετράγωνο']]); }
    },
    {
      title: '(α) Καθίζηση στο Ο ≤ ' + '10 cm', hl: ['O'],
      body: function (q, r) { return eqs([['B\' = L\' = 6\\unit{m},\\; \\frac{L\'}{B\'} = 1,\\; \\frac{z}{B\'} = \\frac{60}{6} = 10 \\Rightarrow f = ' + fmt(r.fO, 3) + ',\\; I_O = 4f = \\hl{' + fmt(r.IO, 2) + '}'], ['S_{max} = \\frac{q\\,B\'}{E}\\,I_O \\Rightarrow q = \\frac{S_{max}\\,E}{B\'\\,I_O} = \\frac{' + fmt(q.Smax / 100, 2) + '\\times ' + fmt(q.E * 1000, 0) + '}{6\\times ' + fmt(r.IO, 2) + '} = \\hl{' + fmt(r.qa, 1) + '\\unit{kPa}}'], ['q_{oil} = ' + fmt(r.AR, 2) + '\\,q = ' + fmt(r.qoil_a, 1) + '\\unit{kPa} \\Rightarrow h_a = \\frac{q_{oil}}{γ_{oil}} = \\frac{' + fmt(r.qoil_a, 1) + '}{' + fmt(q.goil, 1) + '} = \\hl{' + fmt(r.ha, 1) + '\\unit{m}}']]) + note('Σημειώσεις: f = 0.43 (διάγραμμα), I_O = 1.72, q ≈ 97 kPa, h = 21.3 m.') + note('Η σχέση S = q·B′·I/E χρησιμοποιείται χωρίς τον όρο (1 − ν²), επειδή το διάγραμμα Steinbrenner των ασκήσεων είναι ήδη για ν = 0.3 και ο συντελεστής f περιλαμβάνει την επίδραση του ν [f = (1 − ν²)F<sub>1</sub> + (1 − ν − 2ν²)F<sub>2</sub>]. Δεν εφαρμόζεται δεύτερη φορά ο όρος (1 − ν²).'); }
    },
    {
      title: '(β) Συντελεστής επιρροής στο Α', hl: ['A'],
      cap: 'Α: γωνία δύο ορθογωνίων 6×12 της ίδιας δεξαμενής (×2 πάνω/κάτω) + επιρροή της γειτονικής: ορθογώνιο 6×30 μείον 6×18, επίσης ×2.',
      body: function (q, r) { return eqs([['I_A = 2\\,(I_{μπλε} + I_{πράσινο} - I_{κόκκινο})'], ['I_{μπλε}:\\; 6\\times 12,\\; \\frac{L}{B} = 2 \\Rightarrow ' + fmt(r.f2, 3) + ';\\quad I_{πράσινο}:\\; 6\\times 30,\\; \\frac{L}{B} = 5 \\Rightarrow ' + fmt(r.f5, 3) + ';\\quad I_{κόκκινο}:\\; 6\\times 18,\\; \\frac{L}{B} = 3 \\Rightarrow ' + fmt(r.f3, 3)], ['I_A = 2\\,(' + fmt(r.f2, 3) + ' + ' + fmt(r.f5, 3) + ' - ' + fmt(r.f3, 3) + ') = \\hl{' + fmt(r.IA, 2) + '}']]) + note('Σημειώσεις: 2(0.6 + 0.725 − 0.65) = 1.35.'); }
    },
    {
      title: '(β) Συντελεστής επιρροής στο Β', hl: ['B'],
      cap: 'Β: τα ίδια 2 ορθογώνια 6×12 + γειτονική δεξαμενή: 6×18 μείον το κενό 6×6.',
      body: function (q, r) { return eqs([['I_B = 2\\,(I_{μπλε} + I_{πράσινο} - I_{κόκκινο})'], ['I_{πράσινο}:\\; 6\\times 18,\\; \\frac{L}{B} = 3 \\Rightarrow ' + fmt(r.f3, 3) + ';\\quad I_{κόκκινο}:\\; 6\\times 6,\\; \\frac{L}{B} = 1 \\Rightarrow ' + fmt(r.f1, 3)], ['I_B = 2\\,(' + fmt(r.f2, 3) + ' + ' + fmt(r.f3, 3) + ' - ' + fmt(r.f1, 3) + ') = \\hl{' + fmt(r.IB, 2) + '}']]) + note('Σημειώσεις: 2(0.6 + 0.65 − 0.46) = 1.58. Το Β καθιζάνει περισσότερο από το Α επειδή είναι πιο κοντά στη γειτονική δεξαμενή.'); }
    },
    {
      title: '(β) Μέγιστο q και h από τη γωνιακή παραμόρφωση Α–Β', hl: ['A', 'B'],
      body: function (q, r) { return eqs([['ΔS_{AB} \\le \\frac{L_{AB}}{500} = \\frac{12}{500} = ' + fmt(r.dSlim * 1000, 0) + '\\unit{mm}'], ['ΔS_{AB} = \\frac{q\\,B\'}{E}(I_B - I_A) \\Rightarrow q = \\frac{' + fmt(r.dSlim, 3) + '\\times ' + fmt(q.E * 1000, 0) + '}{6\\times(' + fmt(r.IB, 2) + ' - ' + fmt(r.IA, 2) + ')} = \\hl{' + fmt(r.qb, 0) + '\\unit{kPa}}'], ['q_{oil} = ' + fmt(r.AR, 2) + '\\times ' + fmt(r.qb, 0) + ' = ' + fmt(r.qoil_b, 0) + '\\unit{kPa} \\Rightarrow h_b = \\frac{' + fmt(r.qoil_b, 0) + '}{' + fmt(q.goil, 1) + '} = \\hl{' + fmt(r.hb, 1) + '\\unit{m}}']]) + note('Σημειώσεις: q = 174 kPa, q_oil = 318 kPa, h = 38 m.'); }
    },
    {
      title: '(γ) Φέρουσα ικανότητα σε αστράγγιστες συνθήκες (DIN 4017, φ = 0)', hl: ['clay', 'T1'],
      body: function (q, r) { return eqs([['φ = 0:\\; N_c = 5,\\; N_d = 1,\\; N_b = 0;\\quad \\text{τετράγωνο: } V_c = 1.2,\\; V_d = 1'], ['q_{ult} = c_u N_c V_c + γ D_f N_d V_d = ' + fmt(q.cu, 0) + '\\times 5\\times 1.2 + 20\\times 2.5 = \\hl{' + fmt(r.qult, 0) + '\\unit{kPa}}'], ['q_{ult,net} = q_{ult} - γ D_f = ' + fmt(r.qnet, 0) + '\\unit{kPa} \\Rightarrow q_{app,net} = \\frac{q_{ult,net}}{FS} = \\frac{' + fmt(r.qnet, 0) + '}{' + fmt(q.FS, 1) + '} = ' + fmt(r.qappnet, 0) + '\\unit{kPa}'], ['q_{app,slab} = q_{app,net} + γ D_f = ' + fmt(r.qslab, 0) + '\\unit{kPa} \\Rightarrow q_{oil} = ' + fmt(r.AR, 2) + '\\times ' + fmt(r.qslab, 0) + ' = ' + fmt(r.qoil_c, 0) + '\\unit{kPa} \\Rightarrow h_c = \\hl{' + fmt(r.hc, 1) + '\\unit{m}}']]) + note('Σημειώσεις: q_ult = 290, q_app,net = 120, q_slab = 170, q_oil = 312 kPa, h = 37.1 m.'); }
    },
    {
      title: 'Κρίσιμο κριτήριο', hl: ['oil'],
      body: function (q, r) { var crit = r.hgov === r.ha ? 'η καθίζηση στο Ο' : r.hgov === r.hb ? 'η γωνιακή παραμόρφωση Α–Β' : 'η φέρουσα ικανότητα'; return eq('h_{max} = \\min(' + fmt(r.ha, 1) + ',\\; ' + fmt(r.hb, 1) + ',\\; ' + fmt(r.hc, 1) + ') = \\hl{' + fmt(r.hgov, 1) + '\\unit{m}}') + p('Καθοριστικό κριτήριο: <b>' + crit + '</b>. Σε μαλακή άργιλο με μεγάλο πάχος, οι καθιζήσεις (λειτουργικότητα) ελέγχουν τον σχεδιασμό και όχι η αστοχία του εδάφους.'); }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('h_{max} \\approx ' + fmt(r.hgov, 1) + '\\unit{m}') + '</div><p>' + m('h_a = ' + fmt(r.ha, 1) + '\\unit{m}') + ' (καθίζηση), ' + m('h_b = ' + fmt(r.hb, 1) + '\\unit{m}') + ' (γωνιακή παραμόρφωση), ' + m('h_c = ' + fmt(r.hc, 1) + '\\unit{m}') + ' (φέρουσα ικανότητα).</p>'; }
});

/* ---------- Appendix: nomographs for linearly increasing modulus, E(z) = E0 (1 + K z/H) ----------
   Interactive card of the formula sheet: ν and K are chosen with buttons, a reading (L'/B', H/B') with sliders. */
var NOMO = { nu: 0.5, K: 1, LB: 1, zB: 4, inf: 0 };
function nomoLB() { return NOMO.inf ? 1000 : NOMO.LB; }
function nomoBtns() {
  var grp = function (key, vals, lab) {
    return '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0"><span style="min-width:2.6em">' + lab + '</span>' +
      vals.map(function (v) { return '<button class="btn' + (Math.abs(NOMO[key] - v) < 1e-9 ? ' primary' : '') + '" onclick="nomoSet(\'' + key + '\',' + v + ')">' + v + '</button>'; }).join('') + '</div>';
  };
  return grp('nu', [0, 0.3, 0.5], m('ν') + ' =') + grp('K', [0, 0.5, 1, 2, 3, 5], m('K') + ' =') +
    '<div style="margin:4px 0"><button class="btn' + (NOMO.inf ? ' primary' : '') + '" onclick="nomoSet(\'inf\',' + (NOMO.inf ? 0 : 1) + ')">L/B = ∞ (θεμελιολωρίδα)</button></div>';
}
function nomoChart() { return CHART.steinbrenner([{ LB: nomoLB(), zB: NOMO.zB, name: '' }], { K: NOMO.K, nu: NOMO.nu, dec: 3 }); }
function nomoRead() {
  return m('\\frac{L\'}{B\'} = ' + (NOMO.inf ? '\\inf' : fmt(NOMO.LB, 2)) + ',\\quad \\frac{H}{B\'} = ' + fmt(NOMO.zB, 1) + ',\\quad K = ' + NOMO.K + ',\\quad ν = ' + NOMO.nu +
    ' \\Rightarrow f = \\hl{' + fmt(GEO.steinFK(nomoLB(), NOMO.zB, NOMO.K, NOMO.nu), 3) + '}');
}
function nomoSet(key, v) {
  NOMO[key] = parseFloat(v);
  if (key === 'LB') NOMO.inf = 0;
  var set = function (id, html) { var n = document.getElementById(id); if (n) n.innerHTML = html; };
  set('nomo-btns', nomoBtns()); set('nomo-chart', nomoChart()); set('nomo-read', nomoRead());
  set('nomo-LBv', NOMO.inf ? '∞' : fmt(NOMO.LB, 2)); set('nomo-zBv', fmt(NOMO.zB, 1));
}
function nomoCard() {
  var sl = function (key, id, lab, min, max, step, val, dec) {
    return '<div class="sl"><label for="' + id + '">' + lab + '</label><span class="v" id="' + id + 'v">' + fmt(val, dec) + '</span><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" oninput="nomoSet(\'' + key + '\', this.value)"></div>';
  };
  return p('Συντελεστής επιρροής f για την καθίζηση του γωνιακού σημείου εύκαμπτου ορθογωνίου, για διάφορες τιμές της κλίσης K του μέτρου ελαστικότητας και του δείκτη Poisson ν.') +
    p('<b>Ορισμός.</b> Το συμπιεστό στρώμα έχει πάχος H κάτω από τη στάθμη θεμελίωσης και το μέτρο ελαστικότητάς του αυξάνει γραμμικά με το βάθος, από ' + m('E_0') + ' στη στάθμη θεμελίωσης σε ' + m('E_H') + ' στη βάση του στρώματος. Η καθίζηση του γωνιακού σημείου ορθογωνίου B′ × L′ (B′ η μικρή πλευρά) είναι:') +
    eqs(['S_{γωνίας} = \\frac{q\\,B\'}{E_0}\\,f\\left(\\frac{L\'}{B\'},\\frac{H}{B\'},\\,K,\\,ν\\right)', 'K = \\frac{E_H - E_0}{E_0},\\qquad E(z) = E_0\\left(1 + K\\,\\frac{z}{H}\\right)']) +
    p('<b>Χρήση:</b> υπολογίζεται το K, επιλέγεται το νομογράφημα με το αντίστοιχο K και ν, και διαβάζεται ο f για z/B′ = H/B′ και L/B = L′/B′. Στον τύπο μπαίνει το επιφανειακό ' + m('E_0') + '· η αύξηση του E με το βάθος περιέχεται στον f.') +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;align-items:start;margin:12px 0">' +
    '<div><div id="nomo-btns">' + nomoBtns() + '</div><div class="sliders" style="margin-top:10px">' +
    sl('LB', 'nomo-LB', 'Λόγος πλευρών L′/B′', 1, 10, 0.05, NOMO.LB, 2) + sl('zB', 'nomo-zB', 'Σχετικό πάχος στρώματος H/B′', 0.5, 20, 0.5, NOMO.zB, 1) + '</div>' +
    '<div class="eq" id="nomo-read" style="margin-top:12px">' + nomoRead() + '</div>' +
    '<p class="who">Τα κουμπιά επιλέγουν το νομογράφημα (ν, K)· τα ρυθμιστικά τοποθετούν το σημείο ανάγνωσης. Για L/B που δεν αντιστοιχεί σε σχεδιασμένη καμπύλη, η καμπύλη παρεμβολής σχεδιάζεται διακεκομμένη. Στο έντυπο των ασκήσεων τα ίδια νομογραφήματα δίνονται στο Παράρτημα (Σχήματα Π.1 – Π.6).</p></div>' +
    '<div class="fig" id="nomo-chart" style="max-width:640px">' + nomoChart() + '</div></div>' +
    '<ul><li>Δίνονται νομογραφήματα για ν = 0, 0.3 και 0.5. ν = 0.5: αστράγγιστες συνθήκες (κορεσμένη άργιλος, άμεση καθίζηση). ν = 0.3: συνήθης τιμή για στραγγισμένες συνθήκες. ν = 0: η παραμόρφωση εξαρτάται μόνο από την κατακόρυφη τάση, ε<sub>z</sub> = σ<sub>z</sub>/E.</li>' +
    '<li>Η επαλληλία ορθογωνίων γίνεται όπως στη λύση Steinbrenner. Το K ορίζεται ως προς το πάχος H του στρώματος, άρα είναι το ίδιο για όλα τα επιμέρους ορθογώνια.</li>' +
    '<li>Για K = 0 (ομοιογενές έδαφος) προκύπτει η λύση Steinbrenner. Για ενδιάμεσες τιμές K ή L/B γίνεται γραμμική παρεμβολή.</li>' +
    '<li>Τα διαγράμματα με K &gt; 0 διαβάζονται μόνο με το συνολικό πάχος H· η αρχή της διαστρωμάτωσης δεν εφαρμόζεται με ενδιάμεσα βάθη, γιατί κάθε σημείο της καμπύλης αντιστοιχεί σε στρώμα με μέτρο ' + m('E_H') + ' στη βάση του.</li>' +
    '<li>Για ν &gt; 0 η καμπύλη L/B = ∞ δεν είναι παντού η εξωτερική: τέμνει τις καμπύλες L/B = 5 και 10 (εντονότερα για ν = 0.5). Δεν πρόκειται για σφάλμα σχεδίασης.</li></ul>' +
    p('<span class="who">Προέλευση: οι καμπύλες υπολογίζονται με αριθμητική ολοκλήρωση των κατακόρυφων παραμορφώσεων ε<sub>z</sub> = [σ<sub>z</sub> − ν (σ<sub>x</sub> + σ<sub>y</sub>)] / E(z) κάτω από τη γωνία του ορθογωνίου, με τις τάσεις του ομοιογενούς ελαστικού ημιχώρου (παραδοχή της λύσης Steinbrenner). Αντίστοιχα διαγράμματα για ν = 0.5 έχει δώσει ο Butler (1974), με παράμετρο k = K·B′/H.</span>');
}

/* ===================== ΤΥΠΟΛΟΓΙΟ ===================== */
var SHEET = [
  { title: 'Ελαστική καθίζηση γωνιακού σημείου (Steinbrenner, ν = 0.3)', html: eqs(['S_{γωνίας} = \\frac{q\\,B\'}{E}\\,f\\left(\\frac{L\'}{B\'},\\frac{z}{B\'}\\right)', 'B\' = \\text{μικρή πλευρά},\\; L\' = \\text{μεγάλη πλευρά},\\; z = \\text{πάχος συμπιεστού στρώματος}']) +
      p('<b>Επαλληλία:</b> το σημείο πρέπει να είναι <i>γωνία</i> κάθε ορθογωνίου.') + '<ul><li>Κέντρο ορθογωνίου: 4 × (B/2 × L/2)</li><li>Μέσο πλευράς: 2 × (B/2 × L)</li><li>Σημείο εκτός φορτίου: (μεγάλο ορθογώνιο έως το σημείο) − (αφόρτιστο ορθογώνιο), επί 2 αν υπάρχει συμμετρία</li><li>Το E είναι σε kPa: 1 MPa = 1000 kPa</li></ul>' +
      p('<b>Διόρθωση ακαμψίας:</b> ' + m('S_{rigid} \\approx 0.75\\text{–}0.80\\,S_{flex,κέντρου}')) +
      p('<b>Αρχή διαστρωμάτωσης</b> (στρώμα i από βάθος z<sub>i−1</sub> έως z<sub>i</sub> με E<sub>i</sub>): ' + m('Δh_i = \\frac{q\\,B\'}{E_i}\\,[f(z_i) - f(z_{i-1})]') + ', δηλαδή συμπίεση όλου του βάθους z<sub>i</sub> με E<sub>i</sub> μείον το τμήμα πάνω από το στρώμα με το ίδιο E<sub>i</sub>.') },
  { title: 'Διάγραμμα Steinbrenner (καθίζηση γωνίας ορθογωνίου, ν = 0.3)', wide: true, html: '<div class="fig" style="max-width:640px">' + CHART.steinbrenner([]) + '</div><p class="who">Για θεμελιολωρίδα (L/B = ∞) οι τιμές εργασίας του μαθήματος: z/B = 1 → 0.22, 2 → 0.36, 4 → 0.52, 6 → 0.64, 8 → 0.72, 10 → 0.78.</p>' +
      p('<b>Γραμμικά αυξανόμενο E ή/και ν = 0.5:</b> χρησιμοποιούνται τα νομογραφήματα του Παραρτήματος (παράμετρος K), στο τέλος του τυπολογίου.') },
  { title: 'Μέθοδος Schmertmann (1978) – άμμοι', html: eqs(['S = C_1\\,C_2\\,ΔP\\,\\sum_{0}^{z_{max}}\\frac{I_{z,i}}{E_i}\\,Δz_i', 'C_1 = 1 - 0.5\\,\\frac{σ\'_{v0}(D_f)}{ΔP} \\ge 0.5 \\quad\\text{(εκσκαφή)}', 'C_2 = 1 + 0.2\\log\\frac{t\\,(\\text{έτη})}{0.1} \\quad\\text{(ερπυσμός)}', 'ΔP = q - γ\\,D_f \\quad\\text{(καθαρή τάση)}']) +
      table(['', 'Τετραγωνικό / κυκλικό (L/B = 1)', 'Λωρίδα (L/B ≥ 10)'], [[m('I_z') + ' στη στάθμη θεμελίωσης', '0.1', '0.2'], ['Βάθος ' + m('I_{z,max}'), '0.5 B', 'B'], ['Βάθος μηδενισμού', '2 B', '4 B'], [m('E') + ' από CPT', m('2.5\\,q_c'), m('3.5\\,q_c')]]) +
      p('Ενδιάμεσα L/B: γραμμική παρεμβολή. ' + m('I_{z,max} = 0.5 + 0.1\\sqrt{ΔP/σ\'_{v}(z_{I_{z,max}})}') + ' (στο μάθημα δίνεται συνήθως 0.6). Το E<sub>i</sub> και το I<sub>z,i</sub> λαμβάνονται στο μέσο κάθε στρώματος υπολογισμού.') +
      p('<b>Χωρισμός στρωμάτων:</b> όριο στρώματος υπολογισμού μπαίνει πάντα στο γόνατο του διαγράμματος (βάθος του I<sub>z,max</sub>) και σε κάθε διεπιφάνεια εδαφικών στρωμάτων· τα Δz δεν χρειάζεται να είναι ίσα.') },
  { title: 'Διαγράμματα Iz κατά Schmertmann', html: grid2('<div class="fig">' + CHART.schmertmann(1, 'square', 0.6, [], 0) + '</div>', '<div class="fig">' + CHART.schmertmann(1, 'strip', 0.6, [], 0) + '</div>') + p('<span class="who">Αριστερά τετραγωνικό (2B), δεξιά λωρίδα (4B), για B = 1.</span>') },
  { title: 'Κατανομή τάσεων – μέθοδος 2:1', html: eqs(['Δσ_z = \\frac{ΔP\\,B\\,L}{(B+z)(L+z)}', 'Δσ_z = \\frac{ΔP\\,B}{B+z} \\quad\\text{(λωρίδα)}']) + p('z = βάθος κάτω από τη στάθμη θεμελίωσης. Προσεγγιστική μέθοδος, κατάλληλη για το μέσο κάθε υποστρώματος.') },
  { title: 'Καθίζηση στερεοποίησης (μέθοδος Cc)', html: eqs(['Δh = \\frac{H}{1+e_0}\\,c_c\\,\\log\\frac{σ\'_{v0}+Δσ}{σ\'_{v0}} \\quad\\text{(ΚΣ άργιλος)}', 'Δh = \\frac{H}{1+e_0}\\left[c_r\\log\\frac{σ\'_p}{σ\'_{v0}} + c_c\\log\\frac{σ\'_{v0}+Δσ}{σ\'_p}\\right] \\quad\\text{(ΥΣ, } σ\'_{v0}+Δσ > σ\'_p)', 'Δh = \\frac{H}{1+e_0}\\,c_r\\,\\log\\frac{σ\'_{v0}+Δσ}{σ\'_{v0}} \\quad\\text{(ΥΣ, } σ\'_{v0}+Δσ \\le σ\'_p)']) +
      p('σ′<sub>v0</sub> και Δσ στο μέσο κάθε υποστρώματος (πάχος H ≤ 2 m). Η άμεση συμπίεση της αργίλου λαμβάνεται συχνά ως ποσοστό (≈ 10 %) της συμπίεσης στερεοποίησης.') },
  { title: 'Χρονική εξέλιξη στερεοποίησης', html: eqs(['T_v = \\frac{c_v\\,t}{d^2} \\Rightarrow t = \\frac{T_v\\,d^2}{c_v}', 'U < 60\\%:\\; T_v = \\frac{π}{4}U^2,\\qquad U \\ge 60\\%:\\; T_v = -0.933\\log(1-U) - 0.085', 'U = \\frac{S_c(t)}{S_{c,τελ}}']) +
      p('d = μήκος στράγγισης: H/2 για διπλή στράγγιση (διαπερατά και τα δύο όρια), H για μονή (αδιαπέρατο υπόβαθρο). Προσοχή στις μονάδες: c<sub>v</sub> σε cm²/day → d σε cm, t σε days.') +
      '<div class="fig">' + CHART.consol() + '</div>' },
  { title: 'Επιτρεπόμενες παραμορφώσεις', html: table(['Γωνιακή παραμόρφωση i = ΔS/L', 'Συνέπεια'], [['1/750', 'Όριο για ευαίσθητο μηχανολογικό εξοπλισμό'], ['1/600', 'Κίνδυνος για πλαίσια με διαγώνιους'], ['1/500', 'Όριο έναρξης ρηγμάτωσης τοιχοποιίας (συνήθες όριο σχεδιασμού)'], ['1/300', 'Ορατές ρωγμές σε τοιχοπληρώσεις'], ['1/150', 'Κίνδυνος δομικής βλάβης']]) +
      p('Συνήθεις μέγιστες ολικές καθιζήσεις: 25 mm μεμονωμένα θεμέλια σε άμμο, 50 mm κοιτοστρώσεις σε άμμο, 65–100 mm σε άργιλο.') },
  { title: 'Μονάδες και μετατροπές', html: table(['Μέγεθος', 'Μετατροπή'], [['Φορτίο', '1 t = 10 kN (≈ 9.81)'], ['Τάση', '1 kg/cm² = 100 kPa, 1 MPa = 1000 kPa'], ['Μέτρο ελαστικότητας', 'E (MPa) × 1000 → kPa'], ['Καθίζηση', '1 m = 1000 mm, S (m) = q (kPa)·B (m)·I / E (kPa)'], ['Χρόνος', '1 έτος = 365 days, 1 m = 100 cm']]) },
  { title: 'Παράρτημα: νομογραφήματα για γραμμικά αυξανόμενο μέτρο ελαστικότητας', wide: true, html: nomoCard() }
];

APP.init({ appName: 'Διαδραστικές Ασκήσεις · Καθιζήσεις', version: 'v1.0', desc: 'Υποδειγματικές ασκήσεις καθιζήσεων επιφανειακών θεμελιώσεων – Steinbrenner, Schmertmann, στερεοποίηση', uni: 'Πανεπιστήμιο Πατρών · Τμήμα Πολιτικών Μηχανικών', title: 'Καθιζήσεις', subtitle: 'Θεμελιώσεις · Υποδειγματικές ασκήσεις', kicker: 'Καθιζήσεις', footer: 'Βασισμένο στις Υποδειγματικές Ασκήσεις Καθιζήσεων (Π. Πελέκης, 2025).', exercises: EX, sheet: SHEET });
