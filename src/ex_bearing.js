/* Φέρουσα Ικανότητα – ασκήσεις 1..8 (από: Υποδειγματικές Ασκήσεις Φέρουσας Ικανότητας, Π. Πελέκης, Νοέμβριος 2024) */
'use strict';
var EX = [];

/* ===================== ΑΣΚΗΣΗ 1 ===================== */
EX.push({
  id: 'b1', num: 1, group: 'Τοίχοι αντιστήριξης', source: 'Άσκηση 1',
  title: 'Μήκος πέλματος L ώστε να μην υπάρχει εκκεντρότητα στη βάση τοίχου',
  tags: ['Τοίχος ΩΣ', 'Ενεργητικές ωθήσεις', 'Εκκεντρότητα'],
  statement: p('Για τον τοίχο αντιστήριξης ΩΣ του σχήματος να υπολογίσετε τη διάσταση ' + m('L') + ' ώστε να μην εμφανίζεται εκκεντρότητα στη βάση του τοίχου. Ο τοίχος να θεωρηθεί λείος.') +
    '<ul><li>Αμμοχάλικο: ' + m('φ = 34.5°,\\; γ = 17\\unit{kN/m³}') + '</li><li>Σκυρόδεμα: ' + m('γ_c = 24\\unit{kN/m³}') + '</li><li>Κορμός 0.5 m, πέλμα πάχους 0.5 m, προεξοχή εμπρός 1.0 m, ύψος ' + m('H = 5.5\\unit{m}') + '</li></ul>' +
    p('<b>Διαδικασία:</b> κατακόρυφες δυνάμεις → ροπές ως προς το σημείο Α (άκρο πέλματος) → απαίτηση ' + m('\\frac{\\sum M_A}{\\sum V} = \\frac{B}{2}') + ' (ισοδύναμα ' + m('\\sum M_O = 0') + ' ως προς το μέσο της βάσης).'),
  givens: [
    { key: 'H', label: 'Ύψος τοίχου H', unit: 'm', value: 5.5, min: 3, max: 8, step: 0.1 },
    { key: 'phi', label: 'Γωνία τριβής φ', unit: '°', value: 34.5, min: 25, max: 42, step: 0.5, dec: 1 },
    { key: 'g', label: 'Ειδικό βάρος εδάφους γ', unit: 'kN/m³', value: 17, min: 15, max: 21, step: 0.5, dec: 1 },
    { key: 'gc', label: 'Ειδικό βάρος σκυροδέματος γc', unit: 'kN/m³', value: 24, min: 22, max: 25, step: 0.5, dec: 1 },
    { key: 'a', label: 'Προεξοχή εμπρός (πόδι)', unit: 'm', value: 1.0, min: 0.3, max: 2, step: 0.1 }
  ],
  compute: function (q) {
    var t = 0.5, tb = 0.5, H = q.H, hs = H - tb;
    var W1 = hs * q.gc * t, arm1 = q.a + t / 2;
    var Ka = GEO.Ka(q.phi), sa = Ka * q.g * H, Pa = 0.5 * sa * H, armPa = H / 3;
    function parts(L) {
      var B = q.a + t + L, W2 = B * q.gc * tb, W3 = hs * q.g * L;
      var SV = W1 + W2 + W3, SM = W1 * arm1 + W2 * B / 2 + W3 * (q.a + t + L / 2) - Pa * armPa;
      return { B: B, W2: W2, W3: W3, SV: SV, SM: SM, e: B / 2 - SM / SV };
    }
    var L = solve(function (L) { var k = parts(L); return k.SM - k.SV * k.B / 2; }, 0.2, 12);
    var k = parts(L);
    return { t: t, tb: tb, hs: hs, W1: W1, arm1: arm1, Ka: Ka, sa: sa, Pa: Pa, armPa: armPa, L: L, B: k.B, W2: k.W2, W3: k.W3, SV: k.SV, SM: k.SM, parts: parts,
      c2: q.gc * tb, c3: hs * q.g }; // W2 = c2·B, W3 = c3·L
  },
  figure: function (q, r, step) {
    var s = 46, x0 = 150, gy = 380, H = q.H, L = isNaN(r.L) ? 2 : Math.min(r.L, 5);
    var a = q.a, t = r.t, tb = r.tb, B = a + t + L;
    var yTop = gy - H * s, yBase = gy - tb * s;
    var xs = x0 + a * s, xh = xs + t * s, xe = xh + L * s;
    var W = 760, Hc = 440;
    var h = SVG.open(W, Hc, 'aria-label="Τοίχος αντιστήριξης με επίχωση, κατακόρυφες δυνάμεις W1 W2 W3 και ενεργητική ώθηση Pa"');
    h += SVG.soil(xh, yTop, 720 - xh, gy - yTop, 'sand');          // backfill
    h += SVG.rect(30, gy, 700, Hc - gy - 10, 'soil2');              // foundation soil
    h += SVG.ground(30, xs, gy, 'left') + SVG.ground(xh, 730, yTop, 'right');
    // wall
    h += SVG.poly([[x0, yBase], [x0 + B * s, yBase], [x0 + B * s, gy], [x0, gy]], 'conc', 'data-k="B"');
    h += SVG.rect(xs, yTop, t * s, H * s - tb * s, 'conc');
    // weights
    var cx1 = xs + t * s / 2, cy1 = (yTop + yBase) / 2;
    h += '<g data-k="W1">' + SVG.arrow(cx1, cy1 - 40, cx1, cy1 + 40, 'weight') + SVG.label(cx1 + 14, cy1 + 5, tsub('W', '1'), 'math', 'start') + '</g>';
    var cx2 = x0 + B * s / 2, cy2 = yBase + tb * s / 2;
    h += '<g data-k="W2">' + SVG.arrow(cx2, cy2 - 6, cx2, cy2 + 50, 'weight') + SVG.label(cx2 + 12, cy2 + 40, tsub('W', '2'), 'math', 'start') + '</g>';
    var cx3 = xh + L * s / 2, cy3 = (yTop + yBase) / 2;
    h += '<g data-k="W3">' + SVG.arrow(cx3, cy3 - 40, cx3, cy3 + 40, 'weight') + SVG.label(cx3 + 14, cy3 + 5, tsub('W', '3'), 'math', 'start') + '</g>';
    // active pressure on vertical plane through heel end
    var wB = Math.min(110, r.sa * 3);
    h += '<g data-k="Pa">' + SVG.pressure(xe, yTop, gy, 0, wB, 1, 'load-fill', '', 6) +
      SVG.arrow(xe + wB + 30, gy - r.armPa * s, xe + 4, gy - r.armPa * s, 'load') + SVG.label(xe + wB + 36, gy - r.armPa * s - 8, tsub('P', 'a'), 'lbl-load math', 'start') +
      SVG.label(xe + wB + 6, gy - 4, 'σ' + '<tspan dy="4" font-size="10">a</tspan>', 'lbl-load math', 'start') + '</g>';
    // points
    h += '<g data-k="A">' + SVG.point(x0, gy, 'A', -16, 18) + '</g>';
    h += SVG.point(x0 + B * s / 2, gy, 'O', 6, 18);
    // dims
    h += '<g data-k="L">' + SVG.dim(xh, yBase - 8, xe, yBase - 8, 'L = ' + fmt(r.L, 2) + ' m', -18) + '</g>';
    h += SVG.dim(x0, yBase - 8, xs, yBase - 8, fmt(a, 1) + ' m', -18);
    h += SVG.dim(x0 - 50, yTop, x0 - 50, gy, 'H = ' + fmt(H, 1) + ' m', -8);
    h += '<g data-k="B">' + SVG.dim(x0, gy + 12, x0 + B * s, gy + 12, 'B = ' + fmt(r.B, 2) + ' m', 18) + '</g>';
    h += SVG.dim(x0 + B * s + 10, yBase, x0 + B * s + 10, gy, fmt(tb, 1), 8);
    h += SVG.label(xh + 90, yTop + 26, 'Αμμοχάλικο φ=' + fmt(q.phi, 1) + '°, γ=' + fmt(q.g, 0) + ' kN/m³', 'lbl-muted', 'start');
    h += SVG.label(xs + t * s / 2, yTop - 8, '0.5', 'lbl-muted');
    // resultant at step 5
    if (step >= 4) { h += '<g class="a-fade">' + SVG.arrow(x0 + B * s / 2, gy - 110, x0 + B * s / 2, gy - 8, 'fg', '', 4) + SVG.label(x0 + B * s / 2 + 10, gy - 90, 'ΣV στο μέσο → e = 0', 'math', 'start') + '</g>'; }
    return h + SVG.close();
  },
  figcap: 'Λείος τοίχος: η ενεργητική ώθηση λαμβάνεται στο κατακόρυφο επίπεδο που περνά από το άκρο του πέλματος, το έδαφος πάνω από το πέλμα (W₃) λογίζεται ως βάρος.',
  quick: function (q, r) {
    return '<dl class="given"><dt>' + m('K_a') + '</dt><dd>' + fmt(r.Ka, 3) + '</dd><dt>' + m('σ_a') + ' (βάση)</dt><dd>' + fmt(r.sa, 1) + ' kPa</dd><dt>' + m('P_a') + '</dt><dd>' + fmt(r.Pa, 1) + ' kN/m</dd><dt>' + m('\\sum V') + '</dt><dd>' + fmt(r.SV, 1) + ' kN/m</dd><dt>' + m('L') + '</dt><dd><b>' + fmt(r.L, 2) + ' m</b></dd></dl>';
  },
  steps: [
    {
      title: 'Κατακόρυφες δυνάμεις (ανά τρέχον μέτρο)', hl: ['W1', 'W2', 'W3'],
      cap: 'Τρία βάρη: κορμός W₁, πέλμα W₂, επίχωση πάνω από το πέλμα W₃. Τα W₂, W₃ εξαρτώνται από το άγνωστο L.',
      body: function (q, r) {
        return eqs([
          ['W_1 = (H - 0.5)\\,γ_c\\,0.5 = (' + fmt(q.H, 1) + '-0.5)\\times' + fmt(q.gc, 0) + '\\times 0.5 = \\hl{' + fmt(r.W1, 1) + '\\unit{kN}}', 'κορμός'],
          ['W_2 = (' + fmt(q.a + 0.5, 1) + '+L)\\,γ_c\\,0.5 = ' + fmt(r.c2, 0) + 'L + ' + fmt(r.c2 * (q.a + 0.5), 1), 'πέλμα'],
          ['W_3 = (H-0.5)\\,γ\\,L = ' + fmt(r.c3, 1) + '\\,L', 'επίχωση πάνω από το πέλμα']
        ]);
      }
    },
    {
      title: 'Συντελεστής ενεργητικών ωθήσεων', hl: ['Pa'],
      body: function (q, r) { return eq('K_a = \\tan^2\\left(45° - \\frac{φ}{2}\\right) = \\tan^2(' + fmt(45 - q.phi / 2, 2) + '°) = \\hl{' + fmt(r.Ka, 3) + '}', 'Rankine, λείος τοίχος, οριζόντια επιφάνεια'); }
    },
    {
      title: 'Ενεργητική τάση και ώθηση', hl: ['Pa'],
      cap: 'Τριγωνική κατανομή: μηδέν στην επιφάνεια, μέγιστη στη βάση. Η συνισταμένη Pa στο H/3 από τη βάση.',
      body: function (q, r) {
        return eqs([
          ['σ_a = K_a\\,γ\\,H = ' + fmt(r.Ka, 3) + '\\times' + fmt(q.g, 0) + '\\times' + fmt(q.H, 1) + ' = \\hl{' + fmt(r.sa, 1) + '\\unit{kPa}}'],
          ['P_a = \\frac{1}{2}\\,σ_a\\,H = \\frac{1}{2}\\times' + fmt(r.sa, 1) + '\\times' + fmt(q.H, 1) + ' = \\hl{' + fmt(r.Pa, 1) + '\\unit{kN/m}}', 'στο ύψος H/3 = ' + fmt(r.armPa, 2) + ' m']
        ]);
      }
    },
    {
      title: 'Ροπές ως προς το σημείο Α', hl: ['A', 'W1', 'W2', 'W3', 'Pa'],
      cap: 'Οι μοχλοβραχίονες μετρώνται από το μπροστινό άκρο Α. Τα βάρη δίνουν ροπές ευστάθειας (+), η Pa ροπή ανατροπής (−).',
      body: function (q, r) {
        var a = q.a, c2 = r.c2, c3 = r.c3, a05 = a + 0.5;
        return table(['Δύναμη', 'Τιμή (kN)', 'Μοχλοβραχίονας (m)', 'Ροπή ως προς Α (kNm)'], [
          [m('W_1'), fmt(r.W1, 1), fmt(r.arm1, 2), '+' + fmt(r.W1 * r.arm1, 1)],
          [m('W_2'), m(fmt(c2, 0) + 'L+' + fmt(c2 * a05, 1)), m('\\frac{' + fmt(a05, 1) + '+L}{2}'), m('+(' + fmt(c2 / 2, 0) + 'L^2 + ' + fmt(c2 * a05, 1) + 'L + ' + fmt(c2 * a05 * a05 / 2, 2) + ')')],
          [m('W_3'), m(fmt(c3, 1) + 'L'), m(fmt(a05, 1) + '+\\frac{L}{2}'), m('+(' + fmt(c3 / 2, 2) + 'L^2 + ' + fmt(c3 * a05, 1) + 'L)')],
          [m('P_a'), fmt(r.Pa, 1), fmt(r.armPa, 2), '−' + fmt(r.Pa * r.armPa, 1)]
        ]) + eqs([
          ['\\sum V = ' + fmt(c2 + c3, 1) + 'L + ' + fmt(r.W1 + c2 * a05, 1)],
          ['\\sum M_A = ' + fmt(c2 / 2 + c3 / 2, 2) + 'L^2 + ' + fmt(c2 * a05 + c3 * a05, 1) + 'L + ' + fmt(r.W1 * r.arm1 + c2 * a05 * a05 / 2 - r.Pa * r.armPa, 1)]
        ]);
      }
    },
    {
      title: 'Συνθήκη μηδενικής εκκεντρότητας → L', hl: ['L', 'B'],
      cap: 'Η συνισταμένη των κατακόρυφων δυνάμεων πρέπει να περνά από το μέσο της βάσης: e = 0.',
      body: function (q, r) {
        return p('Η συνισταμένη περνά από το μέσο της βάσης όταν η απόσταση της από το Α ισούται με B/2:') +
          eqs([
            ['\\frac{\\sum M_A}{\\sum V} = \\frac{B}{2} = \\frac{' + fmt(q.a + 0.5, 1) + ' + L}{2}'],
            ['\\Rightarrow\\; (' + fmt(q.a + 0.5, 1) + '+L)\\,\\sum V = 2\\,\\sum M_A', 'οι όροι L² απαλείφονται, γραμμική εξίσωση'],
            ['\\Rightarrow\\; L = \\hl{' + fmt(r.L, 2) + '\\unit{m}} \\approx ' + fmt(Math.round(r.L * 2) / 2, 1) + '\\unit{m},\\quad B = ' + fmt(r.B, 2) + '\\unit{m}']
          ]) + note('Έλεγχος: ' + m('\\sum M_A/\\sum V = ' + fmt(r.SM / r.SV, 2) + '\\unit{m} = B/2'));
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('L \\approx ' + fmt(r.L, 2) + '\\unit{m}') + '</div><p>Με ' + m('L = ' + fmt(r.L, 2) + '\\unit{m}') + ' η συνισταμένη των φορτίων περνά από το μέσο της βάσης (πλάτος ' + m('B = ' + fmt(r.B, 2) + '\\unit{m}') + '), άρα η τάση εδάφους είναι ομοιόμορφη.</p>'; }
});

/* ---------- local helpers ---------- */
/* section of a footing in a trench: o = {B, Df, Vlabel, wt, step, wedgeStep, labelsAbove, labelsBelow, Hlabel, extra, Bname} */
function footingSection(o) {
  var W = 760, Hc = 400, gy = 120, cx = 400;
  var B = Math.max(o.B, 0.6), Df = Math.max(o.Df, 0);
  var s = Math.min(240 / B, 90 / Math.max(Df, 0.8), 75);
  var yf = gy + Df * s, ft = 22, xl = cx - B * s / 2, xr = cx + B * s / 2, trench = 34;
  var h = SVG.open(W, Hc, 'aria-label="Τομή θεμελίου σε βάθος θεμελίωσης με έδαφος, φορτίο και υδροφόρο ορίζοντα"');
  h += SVG.soil(40, gy, xl - trench - 40, Hc - gy - 10, 'sand') + SVG.soil(xr + trench, gy, 720 - xr - trench, Hc - gy - 10, 'sand');
  h += SVG.soil(xl - trench, yf, xr - xl + 2 * trench, Hc - yf - 10, o.lowerType || 'sand');
  h += SVG.ground(40, xl - trench, gy, 'left') + SVG.ground(xr + trench, 720, gy, 'right');
  h += SVG.line(xl - trench, gy, xl - trench, yf, 'ground') + SVG.line(xr + trench, gy, xr + trench, yf, 'ground') + SVG.line(xl - trench, yf, xr + trench, yf, 'ground');
  // failure mechanism
  if (o.wedgeStep !== undefined && o.step >= o.wedgeStep) {
    var ang = (45 + (o.phi || 0) / 2) * DEG, hw = (B * s / 2) * Math.tan(ang);
    var d = 'M' + xl + ',' + yf + ' L' + cx + ',' + (yf + hw) + ' L' + xr + ',' + yf;
    var rx = xr + B * s * 0.9, ry = yf;
    var dsp = 'M' + cx + ',' + (yf + hw) + ' Q' + (xr + B * s * 0.5) + ',' + (yf + hw * 1.25) + ' ' + rx + ',' + ry;
    var dsp2 = 'M' + cx + ',' + (yf + hw) + ' Q' + (xl - B * s * 0.5) + ',' + (yf + hw * 1.25) + ' ' + (xl - B * s * 0.9) + ',' + ry;
    h += '<g data-k="wedge"><path d="' + d + '" class="guide a-draw"/><path d="' + dsp + '" class="guide a-draw"/><path d="' + dsp2 + '" class="guide a-draw"/>' +
      SVG.label(cx, yf + hw + 14, 'επιφάνεια αστοχίας', 'lbl-load') + '</g>';
  }
  // footing
  h += '<g data-k="B">' + SVG.rect(xl, yf - ft, xr - xl, ft, 'conc') + '</g>';
  h += '<g data-k="V">' + SVG.arrow(cx, yf - ft - 90, cx, yf - ft - 4, 'load', '', 4) + SVG.label(cx + 10, yf - ft - 60, o.Vlabel || 'V', 'lbl-load math', 'start') + '</g>';
  if (o.wt) h += '<g data-k="WT">' + SVG.wt(xr + trench + 40, yf) + SVG.line(40, yf, 720, yf, 'thin dash', 'stroke="var(--water)"') + SVG.label(xr + trench + 58, yf - 4, 'Υ.Ο.', 'lbl-muted', 'start') + '</g>';
  h += '<g data-k="B">' + SVG.dim(xl, yf + 10, xr, yf + 10, (o.Bname || 'B') + ' = ' + fmt(o.B, 2) + ' m', 16) + '</g>';
  if (Df > 0) h += '<g data-k="Df">' + SVG.dim(xl - trench - 30, gy, xl - trench - 30, yf, (o.Dfname || 'D<tspan dy="4" font-size="10">f</tspan><tspan dy="-4"> </tspan>') + '= ' + fmt(o.Df, 2) + ' m', -8) + '</g>';
  (o.labelsAbove || []).forEach(function (t, i) { h += SVG.label(60, gy + 22 + i * 16, t, 'lbl-muted', 'start'); });
  (o.labelsBelow || []).forEach(function (t, i) { h += SVG.label(60, yf + 40 + i * 16, t, 'lbl-muted', 'start'); });
  h += (o.extra || '');
  return h + SVG.close();
}
/* plan with effective area */
function effectivePlan(B, L, eB, eL, step, showEff) {
  var W = 360, Hc = 300, s = Math.min(220 / L, 180 / B), cx = 180, cy = 150;
  var x0 = cx - L * s / 2, y0 = cy - B * s / 2;
  var h = SVG.open(W, Hc, 'aria-label="Κάτοψη θεμελίου με ενεργό επιφάνεια"');
  h += SVG.rect(x0, y0, L * s, B * s, 'conc');
  var Lp = L - 2 * Math.abs(eL), Bp = B - 2 * Math.abs(eB);
  if (showEff) {
    var ex = eL >= 0 ? x0 + 2 * eL * s : x0, ey = eB >= 0 ? y0 + 2 * eB * s : y0;
    h += '<g data-k="Ap" class="a-fade">' + SVG.rect(ex, ey, Lp * s, Bp * s, 'fill-hl') + SVG.rect(ex, ey, Lp * s, Bp * s, 'hatch') +
      SVG.label(ex + Lp * s / 2, ey + Bp * s - 10, 'A′ = B′·L′', 'math') + '</g>';
    h += '<g data-k="Ap">' + SVG.dim(ex, y0 - 10, ex + Lp * s, y0 - 10, 'L′ = ' + fmt(Lp, 2), -14) + SVG.dim(x0 + L * s + 10, ey, x0 + L * s + 10, ey + Bp * s, 'B′ = ' + fmt(Bp, 2), 8) + '</g>';
  }
  h += SVG.circle(cx, cy, 4, 'pt') + SVG.label(cx - 8, cy - 10, 'κ.β.', 'lbl-muted', 'end');
  h += '<g data-k="e">' + SVG.circle(cx + eL * s, cy + eB * s, 5, 'marker a-pop') + SVG.label(cx + eL * s + 8, cy + eB * s - 10, 'V (e = ' + fmt(Math.abs(eL) + Math.abs(eB), 2) + ' m)', 'lbl-load', 'start') + '</g>';
  h += SVG.dim(x0, y0 + B * s + 12, x0 + L * s, y0 + B * s + 12, 'L = ' + fmt(L, 1), 16) + SVG.dim(x0 - 12, y0, x0 - 12, y0 + B * s, 'B = ' + fmt(B, 1), -8);
  return h + SVG.close();
}
function side2(a, b) { return '<div style="display:grid;gap:10px">' + a + '<div style="max-width:420px;margin:0 auto;width:100%">' + b + '</div></div>'; }
function dinTableHot(phi) { return TABLES.din1(phi); }

/* ===================== ΑΣΚΗΣΗ 2 ===================== */
EX.push({
  id: 'b2', num: 2, group: 'DIN 4017 – λοξή & έκκεντρη φόρτιση', source: 'Άσκηση 2',
  title: 'Συντελεστής ασφαλείας ορθογωνικού θεμελίου με λοξή και έκκεντρη φόρτιση (DIN 4017)',
  tags: ['DIN 4017', 'Εκκεντρότητα', 'Λοξή φόρτιση', 'Άμμος'],
  statement: p('Ορθογωνικό θεμέλιο ' + m('3\\times 2\\unit{m}') + ' εδράζεται σε βάθος ' + m('d = 2\\unit{m}') + ' και μεταβιβάζει στο έδαφος κατακόρυφο φορτίο ' + m('V = 150\\unit{t}') + ', οριζόντιο ' + m('H = 32.5\\unit{t}') + ' και ροπή ' + m('M = 75\\unit{tm}') + ' (κατά τη μεγάλη διάσταση). Το κατακόρυφο φορτίο διέρχεται από το κέντρο βάρους του θεμελίου.') +
    p('Να υπολογίσετε τον συντελεστή ασφαλείας έναντι φέρουσας ικανότητας σύμφωνα με τον DIN 4017 για λοξή και έκκεντρη φόρτιση.') +
    '<ul><li>Γωνία εσωτερικής τριβής ' + m('φ = 30°') + ', συνοχή ' + m('c = 0') + '</li><li>Ειδικό βάρος εδάφους ' + m('γ = 18\\unit{kN/m³}') + '</li></ul>',
  givens: [
    { key: 'V', label: 'Κατακόρυφο φορτίο V', unit: 'kN', value: 1500, min: 500, max: 3000, step: 50 },
    { key: 'H', label: 'Οριζόντιο φορτίο H', unit: 'kN', value: 325, min: 0, max: 800, step: 5 },
    { key: 'M', label: 'Ροπή M', unit: 'kNm', value: 750, min: 0, max: 1500, step: 10 },
    { key: 'phi', label: 'Γωνία τριβής φ', unit: '°', value: 30, min: 20, max: 40, step: 2.5, dec: 1 },
    { key: 'g', label: 'Ειδικό βάρος γ', unit: 'kN/m³', value: 18, min: 16, max: 21, step: 0.5, dec: 1 },
    { key: 'd', label: 'Βάθος θεμελίωσης d', unit: 'm', value: 2, min: 0.5, max: 4, step: 0.25 }
  ],
  compute: function (q) {
    var B = 2, L = 3, eL = q.M / q.V, Lp = Math.max(L - 2 * eL, 0.1), Bp = B, Ap = Lp * Bp;
    var Bmin = Math.min(Bp, Lp), Lmax = Math.max(Bp, Lp), BL = Bmin / Lmax;
    var N = GEO.din(q.phi), HV = q.H / q.V;
    var Kd = Math.pow(Math.max(1 - 0.7 * HV, 0), 3), Kb = Math.pow(Math.max(1 - HV, 0), 3), Kc = Kd - (1 - Kd) / (N.Nd - 1);
    var Vd = 1 + BL * sind(q.phi), Vb = 1 - 0.3 * BL, Vc = (Vd * N.Nd - 1) / (N.Nd - 1);
    var q1 = q.g * q.d * N.Nd * Kd * Vd, q2 = q.g * Bmin * N.Nb * Kb * Vb, qult = q1 + q2;
    var p0 = q.g * q.d, qapp = q.V / Ap, FS = (qult - p0) / (qapp - p0);
    return { B: B, L: L, eL: eL, Lp: Lp, Bp: Bp, Ap: Ap, Bmin: Bmin, BL: BL, Nc: N.Nc, Nd: N.Nd, Nb: N.Nb, HV: HV, Kd: Kd, Kb: Kb, Kc: Kc, Vd: Vd, Vb: Vb, Vc: Vc, q1: q1, q2: q2, qult: qult, p0: p0, qapp: qapp, FS: FS };
  },
  figure: function (q, r, step) {
    var extra = '';
    var sec = footingSection({ B: r.L, Df: q.d, Bname: 'L', Vlabel: 'V', step: step, wedgeStep: 5, phi: q.phi, labelsAbove: ['φ = ' + fmt(q.phi, 1) + '°, c = 0', 'γ = ' + fmt(q.g, 0) + ' kN/m³'], extra: extra });
    // add H and M arrows onto the section: re-use coordinates (cx=400, yf computed the same way)
    var B = Math.max(r.L, 0.6), s = Math.min(240 / B, 90 / Math.max(q.d, 0.8), 75), yf = 120 + q.d * s, cx = 400;
    var hm = '<g data-k="H">' + SVG.arrow(cx - 70, yf - 34, cx + 60, yf - 34, 'load', '', 3) + SVG.label(cx + 66, yf - 30, 'H', 'lbl-load math', 'start') + '</g>' +
      '<g data-k="M"><path d="M' + (cx - 50) + ',' + (yf - 100) + ' A50,25 0 0 1 ' + (cx + 50) + ',' + (yf - 100) + '" fill="none" stroke="var(--load)" stroke-width="3" marker-end="url(#arL)"/>' + SVG.label(cx + 56, yf - 106, 'M', 'lbl-load math', 'start') + '</g>';
    sec = sec.replace('</svg>', hm + '</svg>').replace(SVG.label(cx + 10, yf - 22 - 60, 'V', 'lbl-load math', 'start'), SVG.label(cx - 12, yf - 22 - 60, 'V', 'lbl-load math', 'end'));
    return side2(sec, effectivePlan(r.B, r.L, 0, r.eL, step, step >= 0));
  },
  figcap: 'Τομή κατά τη μεγάλη διάσταση L και κάτοψη: η ροπή μετατοπίζει τη συνισταμένη κατά e, το θεμέλιο «λειτουργεί» με την ενεργό επιφάνεια A′ = B′·L′.',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('e_L') + '</dt><dd>' + fmt(r.eL, 2) + ' m</dd><dt>' + m('A\'') + '</dt><dd>' + fmt(r.Ap, 2) + ' m²</dd><dt>' + m('K_d,\\;K_b') + '</dt><dd>' + fmt(r.Kd, 2) + ', ' + fmt(r.Kb, 2) + '</dd><dt>' + m('q_{ult}') + '</dt><dd>' + fmt(r.qult, 0) + ' kPa</dd><dt>FS</dt><dd><b>' + fmt(r.FS, 2) + '</b></dd></dl>'; },
  steps: [
    {
      title: 'Εκκεντρότητα και ενεργό επιφάνεια', hl: ['M', 'e', 'Ap'],
      cap: 'Η ροπή ισοδυναμεί με μετατόπιση του V κατά e = M/V. Το θεμέλιο «μικραίνει» κατά 2e στη διεύθυνση της ροπής (Meyerhof).',
      body: function (q, r) {
        return eqs([
          ['e_L = \\frac{\\sum M}{\\sum V} = \\frac{M}{V} = \\frac{' + fmt(q.M, 0) + '}{' + fmt(q.V, 0) + '} = \\hl{' + fmt(r.eL, 2) + '\\unit{m}}', 'e ≤ L/6 = 0.5 m: ' + (r.eL <= 0.5 ? 'ΟΚ, χωρίς αδρανή περιοχή' : 'υπέρβαση, εμφανίζεται αδρανής περιοχή')],
          ['L\' = L - 2e_L = 3 - ' + fmt(2 * r.eL, 2) + ' = \\hl{' + fmt(r.Lp, 2) + '\\unit{m}},\\quad B\' = B = 2\\unit{m}'],
          ['A\' = B\'\\,L\' = \\hl{' + fmt(r.Ap, 2) + '\\unit{m²}}']
        ]);
      }
    },
    {
      title: 'Συντελεστές φέρουσας ικανότητας κατά DIN 4017', hl: ['wedge'],
      body: function (q, r) { return p('Από τον Πίνακα 1 (DIN 4017) για ' + m('φ = ' + fmt(q.phi, 1) + '°') + ':') + eq('N_c = ' + fmt(r.Nc, 1) + ',\\quad N_d = \\hl{' + fmt(r.Nd, 1) + '},\\quad N_b = \\hl{' + fmt(r.Nb, 1) + '}') + dinTableHot(q.phi); }
    },
    {
      title: 'Συντελεστές λοξής φόρτισης', hl: ['H', 'V'],
      cap: 'Η οριζόντια συνιστώσα μειώνει τη φέρουσα ικανότητα: οι συντελεστές K εξαρτώνται από τον λόγο H/V.',
      body: function (q, r) {
        return p('Με ' + m('c = 0') + ' ο όρος ' + m('B\'L\'c\\cot φ') + ' μηδενίζεται και ' + m('H_b/V_b = H/V = ' + fmt(r.HV, 3)) + ' (οι συντελεστές ασφαλείας απλοποιούνται):') +
          eqs([
            ['K_d = \\left(1 - 0.7\\,\\frac{H}{V}\\right)^3 = (1 - 0.7\\times' + fmt(r.HV, 3) + ')^3 = \\hl{' + fmt(r.Kd, 2) + '}'],
            ['K_b = \\left(1 - \\frac{H}{V}\\right)^3 = (1 - ' + fmt(r.HV, 3) + ')^3 = \\hl{' + fmt(r.Kb, 2) + '}'],
            ['K_c = K_d - \\frac{1-K_d}{N_d - 1} = ' + fmt(r.Kc, 3), 'δεν χρειάζεται, αφού c = 0']
          ]) + note('Οι σημειώσεις αναγράφουν K<sub>c</sub> = 0.013 (τυπογραφικό). Η τιμή είναι αδιάφορη για αμμώδες έδαφος χωρίς συνοχή.');
      }
    },
    {
      title: 'Συντελεστές μορφής', hl: ['Ap'],
      body: function (q, r) {
        return p('Η ενεργός επιφάνεια είναι ' + m('B\' \\times L\' = ' + fmt(r.Bp, 2) + '\\times' + fmt(r.Lp, 2)) + (Math.abs(r.BL - 1) < 0.01 ? ' → τετράγωνο:' : ' → ορθογώνιο με ' + m('B\'/L\' = ' + fmt(r.BL, 2)) + ':')) +
          eqs([
            ['V\'_d = 1 + \\frac{B\'}{L\'}\\sin φ = 1 + ' + fmt(r.BL, 2) + '\\times\\sin ' + fmt(q.phi, 1) + '° = \\hl{' + fmt(r.Vd, 2) + '}'],
            ['V\'_b = 1 - 0.3\\,\\frac{B\'}{L\'} = \\hl{' + fmt(r.Vb, 2) + '}'],
            ['V\'_c:\\;\\text{αδιάφορος (c = 0)}']
          ]);
      }
    },
    {
      title: 'Οριακή φέρουσα ικανότητα', hl: ['wedge', 'B', 'Df'],
      cap: 'Δύο όροι συνεισφέρουν: το βάθος θεμελίωσης (υπερκείμενο γ·d) και το πλάτος B′ (βάρος εδάφους στη ζώνη αστοχίας).',
      body: function (q, r) {
        return eqs([
          ['q_{ult} = c N_c K_c V\'_c + γ_1\\,d\\,N_d K_d V\'_d + γ_2\\,B\'\\,N_b K_b V\'_b'],
          ['= ' + fmt(q.g, 0) + '\\cdot' + fmt(q.d, 2) + '\\cdot' + fmt(r.Nd, 1) + '\\cdot' + fmt(r.Kd, 2) + '\\cdot' + fmt(r.Vd, 2) + ' + ' + fmt(q.g, 0) + '\\cdot' + fmt(r.Bmin, 2) + '\\cdot' + fmt(r.Nb, 1) + '\\cdot' + fmt(r.Kb, 2) + '\\cdot' + fmt(r.Vb, 2)],
          ['= ' + fmt(r.q1, 1) + ' + ' + fmt(r.q2, 1) + ' = \\hl{' + fmt(r.qult, 0) + '\\unit{kPa}}']
        ]);
      }
    },
    {
      title: 'Συντελεστής ασφαλείας (καθαρές τάσεις)', hl: ['V', 'Ap'],
      body: function (q, r) {
        return p('Ο συντελεστής ασφαλείας ορίζεται με τις <b>καθαρές</b> τάσεις, αφαιρώντας την υπερκείμενη γεωστατική τάση ' + m('p_0 = γ d = ' + fmt(r.p0, 0) + '\\unit{kPa}') + ' και από τις δύο:') +
          eqs([
            ['FS = \\frac{q_{ult,net}}{q_{app,net}} = \\frac{q_{ult} - γ d}{\\frac{V}{B\'L\'} - γ d} = \\frac{' + fmt(r.qult, 0) + ' - ' + fmt(r.p0, 0) + '}{' + fmt(r.qapp, 1) + ' - ' + fmt(r.p0, 0) + '} = \\hl{' + fmt(r.FS, 2) + '}']
          ]);
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('FS \\approx ' + fmt(r.FS, 1)) + '</div><p>' + (r.FS >= 2 ? 'Ικανοποιητική ασφάλεια έναντι φέρουσας ικανότητας (συνήθης απαίτηση FS ≥ 2–3 για λοξή φόρτιση).' : 'Ανεπαρκής ασφάλεια: απαιτείται μεγαλύτερο θεμέλιο ή μικρότερη εκκεντρότητα.') + '</p>'; }
});

/* ===================== ΑΣΚΗΣΗ 3 ===================== */
EX.push({
  id: 'b3', num: 3, group: 'Τοίχοι αντιστήριξης', source: 'Άσκηση 3',
  title: 'Τοίχος με σεισμική δύναμη: μήκος L, ασφάλεια ολίσθησης και διατμητικό κλειδί',
  tags: ['Τοίχος ΩΣ', 'Ολίσθηση', 'Παθητικές ωθήσεις', 'Σεισμός'],
  statement: p('Για τον τοίχο του σχήματος (ύψος 4 m, κορμός 0.5 m, πέλμα 0.5 m, προεξοχή εμπρός 0.7 m, αμμοχάλικο ' + m('φ = 36.5°,\\; γ = 18\\unit{kN/m³}') + ', σκυρόδεμα ' + m('γ_c = 24\\unit{kN/m³}') + ') να υπολογίσετε:') +
    '<ol><li>Το μήκος ' + m('L') + ' ώστε η εκκεντρότητα στη βάση να είναι μηδενική, αγνοώντας το κλειδί και το σεισμικό φορτίο ' + m('E_x') + '.</li>' +
    '<li>Τον συντελεστή ασφαλείας έναντι ολίσθησης επί του ενεργού πλάτους ' + m('B\'') + ', με το σεισμικό φορτίο ' + m('E_x = 62\\unit{kN/m}') + ' (2 m πάνω από τη βάση) και τη ροπή που προκαλεί. Χωρίς κλειδί.</li>' +
    '<li>Το ύψος ' + m('h') + ' του διατμητικού κλειδιού ώστε ' + m('FS_{ολ} = 2') + '.</li></ol>' +
    p('Έδαφος θεμελίωσης: αστράγγιστη διατμητική αντοχή ' + m('c_u = 40\\unit{kPa}') + ' (φ<sub>u</sub> = 0).'),
  givens: [
    { key: 'H', label: 'Ύψος τοίχου H', unit: 'm', value: 4, min: 3, max: 6, step: 0.1 },
    { key: 'phi', label: 'Γωνία τριβής επίχωσης φ', unit: '°', value: 36.5, min: 28, max: 42, step: 0.5, dec: 1 },
    { key: 'g', label: 'Ειδικό βάρος εδάφους γ', unit: 'kN/m³', value: 18, min: 16, max: 21, step: 0.5, dec: 1 },
    { key: 'Fx', label: 'Σεισμική δύναμη Ex', unit: 'kN/m', value: 62, min: 0, max: 150, step: 2 },
    { key: 'hF', label: 'Ύψος εφαρμογής Ex', unit: 'm', value: 2, min: 0.5, max: 4, step: 0.1 },
    { key: 'cu', label: 'Αντοχή εδάφους θεμελίωσης cu', unit: 'kPa', value: 40, min: 20, max: 100, step: 5 },
    { key: 'FSt', label: 'Απαιτούμενος FS ολίσθησης', unit: '', value: 2, min: 1.2, max: 3, step: 0.1, dec: 1 }
  ],
  compute: function (q) {
    var a = 0.7, t = 0.5, tb = 0.5, gc = 24, hs = q.H - tb;
    var W1 = hs * gc * t, arm1 = a + t / 2;
    var Ka = GEO.Ka(q.phi), sa = Ka * q.g * q.H, Pa = 0.5 * sa * q.H, armPa = q.H / 3, MPa = Pa * armPa;
    function parts(L) { var B = a + t + L, W2 = B * gc * tb, W3 = hs * q.g * L; var SV = W1 + W2 + W3, SM = W1 * arm1 + W2 * B / 2 + W3 * (a + t + L / 2) - MPa; return { B: B, W2: W2, W3: W3, SV: SV, SM: SM }; }
    var Lex = solve(function (L) { var k = parts(L); return k.SM - k.SV * k.B / 2; }, 0.2, 12);
    var L = Math.round(Lex * 10) / 10; // επιλεγόμενο μήκος (στρογγυλοποίηση στα 0.1 m, όπως στις σημειώσεις: L ≈ 2 m)
    var k = parts(L);
    var MF = q.Fx * q.hF, SM2 = k.SM - MF, xbar = SM2 / k.SV, e0 = xbar - k.B / 2, Bp = Math.max(k.B - 2 * Math.abs(e0), 0.1);
    var R = q.cu * Bp, SFx = Pa + q.Fx, FS1 = R / SFx;
    var Kp = 1, svA = k.SV / Bp, spA = svA * Kp + 2 * q.cu * Math.sqrt(Kp);
    var Pp = function (h) { var spB = spA + q.g * h; return (spA + spB) / 2 * h; };
    var h = solve(function (h) { return (R + Pp(h)) / SFx - q.FSt; }, 0, 5);
    if (FS1 >= q.FSt) h = 0;
    return { a: a, t: t, tb: tb, gc: gc, hs: hs, W1: W1, arm1: arm1, Ka: Ka, sa: sa, Pa: Pa, armPa: armPa, MPa: MPa, Lex: Lex, L: L, B: k.B, W2: k.W2, W3: k.W3, SV: k.SV, SM: k.SM, MF: MF, SM2: SM2, xbar: xbar, e0: e0, Bp: Bp, R: R, SFx: SFx, FS1: FS1, Kp: Kp, svA: svA, spA: spA, h: h, spB: spA + q.g * h, Pph: Pp(h), c2: gc * tb, c3: hs * q.g };
  },
  figure: function (q, r, step) {
    var s = 48, x0 = 170, gy = 300, H = q.H, L = Math.min(r.L, 4), a = r.a, t = r.t, tb = r.tb, B = a + t + L;
    var yTop = gy - H * s, yBase = gy - tb * s, xs = x0 + a * s, xh = xs + t * s, xe = xh + L * s;
    var hk = Math.min(Math.max(r.h, 0.3), 1.5) * s, kx = xh + 1.0 * s, kw = 0.5 * s;
    var W = 780, Hc = 420;
    var h = SVG.open(W, Hc, 'aria-label="Τοίχος αντιστήριξης με διατμητικό κλειδί, σεισμική δύναμη, ενεργητική και παθητική ώθηση"');
    h += SVG.soil(xh, yTop, 740 - xh, gy - yTop, 'sand') + SVG.soil(30, gy, 710, Hc - gy - 10, 'clay');
    h += SVG.ground(30, xs, gy, 'left') + SVG.ground(xh, 740, yTop, 'right');
    h += SVG.poly([[x0, yBase], [x0 + B * s, yBase], [x0 + B * s, gy], [x0, gy]], 'conc', 'data-k="B"');
    h += SVG.rect(xs, yTop, t * s, H * s - tb * s, 'conc');
    h += '<g data-k="key">' + SVG.rect(kx, gy, kw, hk, 'conc') + SVG.label(kx + kw + 6, gy + hk - 4, 'κλειδί', 'lbl-conc', 'start') + SVG.dim(kx + kw + 30, gy, kx + kw + 30, gy + hk, 'h = ' + fmt(r.h, 2), 8) + '</g>';
    var cx1 = xs + t * s / 2, cy1 = (yTop + yBase) / 2;
    h += '<g data-k="W1">' + SVG.arrow(cx1, cy1 - 35, cx1, cy1 + 35, 'weight') + SVG.label(cx1 + 14, cy1 + 5, tsub('W', '1'), 'math', 'start') + '</g>';
    var cx2 = x0 + B * s / 2, cy2 = yBase + tb * s / 2;
    h += '<g data-k="W2">' + SVG.arrow(cx2, cy2 - 6, cx2, cy2 + 40, 'weight') + SVG.label(cx2 - 10, cy2 + 36, tsub('W', '2'), 'math', 'end') + '</g>';
    var cx3 = xh + L * s / 2, cy3 = (yTop + yBase) / 2;
    h += '<g data-k="W3">' + SVG.arrow(cx3, cy3 - 35, cx3, cy3 + 35, 'weight') + SVG.label(cx3 + 14, cy3 + 5, tsub('W', '3'), 'math', 'start') + '</g>';
    var wB = Math.min(90, r.sa * 4);
    h += '<g data-k="Pa">' + SVG.pressure(xe, yTop, gy, 0, wB, 1, 'load-fill', '', 5) + SVG.arrow(xe + wB + 40, gy - r.armPa * s, xe + 4, gy - r.armPa * s, 'load') + SVG.label(xe + wB + 46, gy - r.armPa * s + 4, tsub('P', 'a'), 'lbl-load math', 'start') + '</g>';
    var yF = gy - q.hF * s;
    h += '<g data-k="Fx">' + SVG.arrow(xe + 130, yF, xh + t * s + 4, yF, 'load', '', 4) + SVG.label(xe + 134, yF + 4, tsub('E', 'x') + ' = ' + fmt(q.Fx, 0), 'lbl-load math', 'start') + '</g>';
    // passive on key + base (left side, below base level)
    var wA = Math.min(70, r.spA * 0.35), wBp = Math.min(90, r.spB * 0.35);
    h += '<g data-k="Pp">' + SVG.pressure(x0, gy, gy + hk, wA, wBp, -1, 'fill-green', '', 3) + SVG.arrow(x0 - wBp - 40, gy + hk / 2, x0 - 4, gy + hk / 2, 'fg', 'stroke="var(--ok)"', 3) + SVG.label(x0 - wBp - 44, gy + hk / 2 + 4, tsub('P', 'p'), 'math', 'end') + '</g>';
    h += '<g data-k="A">' + SVG.point(x0, gy, 'A', -16, -8) + '</g>' + SVG.point(x0, gy + hk, 'B', -16, 14);
    h += '<g data-k="L">' + SVG.dim(xh, yBase - 8, xe, yBase - 8, 'L = ' + fmt(r.L, 2) + ' m', -18) + '</g>';
    h += SVG.dim(x0, yBase - 8, xs, yBase - 8, '0.7', -18);
    h += SVG.dim(x0 - 60, yTop, x0 - 60, gy, 'H = ' + fmt(H, 1) + ' m', -8);
    h += '<g data-k="Bp">' + SVG.dim(x0 + 2 * Math.abs(r.e0) * s * (r.e0 < 0 ? 0 : 1), gy + hk + 14, x0 + 2 * Math.abs(r.e0) * s * (r.e0 < 0 ? 0 : 1) + r.Bp * s, gy + hk + 14, 'B′ = ' + fmt(r.Bp, 2) + ' m', 16) + '</g>';
    h += SVG.dim(xe + 20, yBase, xe + 20, gy, '0.5', 8);
    h += SVG.label(xh + 100, yTop + 24, 'Αμμοχάλικο φ=' + fmt(q.phi, 1) + '°, γ=' + fmt(q.g, 0), 'lbl-muted', 'start');
    h += SVG.label(760, gy + 60, 'Άργιλος cu = ' + fmt(q.cu, 0) + ' kPa, φu = 0', 'lbl-muted', 'end');
    return h + SVG.close();
  },
  figcap: 'Η σεισμική δύναμη Eₓ δρα 2 m πάνω από τη βάση. Η παθητική αντίσταση Pₚ κινητοποιείται μπροστά από το κλειδί (από το Α ως το Β).',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('K_a') + '</dt><dd>' + fmt(r.Ka, 3) + '</dd><dt>' + m('P_a') + '</dt><dd>' + fmt(r.Pa, 1) + ' kN/m</dd><dt>' + m('L') + '</dt><dd><b>' + fmt(r.L, 1) + ' m</b></dd><dt>' + m('B\'') + '</dt><dd>' + fmt(r.Bp, 2) + ' m</dd><dt>' + m('FS_{ολ}') + ' (χωρίς κλειδί)</dt><dd>' + fmt(r.FS1, 2) + '</dd><dt>' + m('h') + ' κλειδιού</dt><dd><b>' + fmt(r.h, 2) + ' m</b></dd></dl>'; },
  steps: [
    {
      title: 'Κατακόρυφες δυνάμεις', hl: ['W1', 'W2', 'W3'],
      body: function (q, r) {
        return eqs([
          ['W_1 = (H-0.5)\\,γ_c\\,0.5 = ' + fmt(r.hs, 1) + '\\times 24\\times 0.5 = \\hl{' + fmt(r.W1, 1) + '\\unit{kN}}', 'κορμός, μοχλοβραχίονας από Α: 0.7+0.25 = 0.95 m'],
          ['W_2 = (1.2 + L)\\,γ_c\\,0.5 = 12\\,(1.2+L)', 'πέλμα'],
          ['W_3 = (H-0.5)\\,γ\\,L = ' + fmt(r.c3, 1) + '\\,L', 'επίχωση']
        ]);
      }
    },
    {
      title: 'Ενεργητικές ωθήσεις', hl: ['Pa'],
      body: function (q, r) {
        return eqs([
          ['K_a = \\tan^2(45° - φ/2) = \\tan^2(' + fmt(45 - q.phi / 2, 2) + '°) = \\hl{' + fmt(r.Ka, 3) + '}'],
          ['σ_a = γ\\,H\\,K_a = ' + fmt(q.g, 0) + '\\times' + fmt(q.H, 1) + '\\times' + fmt(r.Ka, 3) + ' = ' + fmt(r.sa, 1) + '\\unit{kPa}'],
          ['P_a = \\frac{1}{2}σ_a H = \\hl{' + fmt(r.Pa, 1) + '\\unit{kN/m}}', 'στο H/3 = ' + fmt(r.armPa, 2) + ' m → M = ' + fmt(r.MPa, 1) + ' kNm']
        ]);
      }
    },
    {
      title: '(α) Ροπές ως προς Α και μήκος L για e = 0', hl: ['A', 'L', 'B'],
      cap: 'Χωρίς Eₓ και χωρίς κλειδί: η συνισταμένη να περνά από το μέσο της βάσης.',
      body: function (q, r) {
        var a05 = 1.2;
        return table(['Δύναμη', 'kN', 'Μοχλοβραχίονας (m)', 'Ροπή ως προς Α (kNm)'], [
          [m('W_1'), fmt(r.W1, 1), fmt(r.arm1, 2), '+' + fmt(r.W1 * r.arm1, 1)],
          [m('W_2'), m('12(1.2+L)'), m('\\frac{1.2+L}{2}'), m('+6(1.2+L)^2')],
          [m('W_3'), m(fmt(r.c3, 1) + 'L'), m('1.2+\\frac{L}{2}'), m('+(' + fmt(r.c3 * 1.2, 1) + 'L + ' + fmt(r.c3 / 2, 1) + 'L^2)')],
          [m('P_a'), fmt(r.Pa, 1), fmt(r.armPa, 2), '−' + fmt(r.MPa, 1)]
        ]) + eqs([
          ['\\frac{\\sum M_A}{\\sum V} = \\frac{B}{2} = \\frac{1.2+L}{2} \\;\\Rightarrow\\; L = ' + fmt(r.Lex, 2) + ' \\approx \\hl{' + fmt(r.L, 1) + '\\unit{m}},\\quad B = \\hl{' + fmt(r.B, 1) + '\\unit{m}}'],
          ['\\sum V = ' + fmt(r.SV, 1) + '\\unit{kN},\\quad \\sum M_A = ' + fmt(r.SM, 1) + '\\unit{kNm}', 'με το επιλεγμένο L']
        ]);
      }
    },
    {
      title: '(β) Εκκεντρότητα με το σεισμικό φορτίο → ενεργό πλάτος B′', hl: ['Fx', 'Bp'],
      cap: 'Η ροπή της Eₓ μετακινεί τη συνισταμένη προς το Α. Το ενεργό πλάτος B′ = B − 2|e| μεταφέρει τα φορτία.',
      body: function (q, r) {
        return eqs([
          ['M_{E_x} = E_x\\cdot' + fmt(q.hF, 1) + ' = ' + fmt(q.Fx, 0) + '\\times' + fmt(q.hF, 1) + ' = ' + fmt(r.MF, 1) + '\\unit{kNm}', 'ανατρεπτική'],
          ['x̄ = \\frac{\\sum M_A - M_{E_x}}{\\sum V} = \\frac{' + fmt(r.SM, 1) + ' - ' + fmt(r.MF, 1) + '}{' + fmt(r.SV, 1) + '} = ' + fmt(r.xbar, 3) + '\\unit{m}'],
          ['e_0 = x̄ - \\frac{B}{2} = ' + fmt(r.xbar, 3) + ' - ' + fmt(r.B / 2, 2) + ' = ' + fmt(r.e0, 2) + '\\unit{m}'],
          ['B\' = B - 2|e_0| = ' + fmt(r.B, 1) + ' - ' + fmt(2 * Math.abs(r.e0), 2) + ' = \\hl{' + fmt(r.Bp, 2) + '\\unit{m}}']
        ]);
      }
    },
    {
      title: '(β) Συντελεστής ασφαλείας έναντι ολίσθησης', hl: ['Bp', 'Pa', 'Fx'],
      body: function (q, r) {
        return eqs([
          ['R = c_u\\,B\' = ' + fmt(q.cu, 0) + '\\times' + fmt(r.Bp, 2) + ' = \\hl{' + fmt(r.R, 1) + '\\unit{kN/m}}', 'αστράγγιστη αντίσταση στη βάση'],
          ['\\sum F_x = P_a + E_x = ' + fmt(r.Pa, 1) + ' + ' + fmt(q.Fx, 0) + ' = ' + fmt(r.SFx, 1) + '\\unit{kN/m}'],
          ['FS_{ολ} = \\frac{R}{\\sum F_x} = \\frac{' + fmt(r.R, 1) + '}{' + fmt(r.SFx, 1) + '} = \\hl{' + fmt(r.FS1, 2) + '}' + (r.FS1 < 1 ? ' \\lt 1\\;\\text{→ ολισθαίνει!}' : '')]
        ]) + note('Οι σημειώσεις γράφουν ΣFx = 36.4 + 62 = 98.4 kN (αντί 36.6 + 62 = 98.6), χωρίς επίπτωση στο αποτέλεσμα FS ≈ 0.81.');
      }
    },
    {
      title: '(γ) Παθητικές τάσεις μπροστά από το κλειδί', hl: ['Pp', 'key', 'A'],
      cap: 'Στο επίπεδο της βάσης (Α) η κατακόρυφη τάση είναι ΣV/B′. Με φ = 0 είναι Kp = 1 και η παθητική τάση αυξάνει κατά 2cu.',
      body: function (q, r) {
        return eqs([
          ['K_p = \\tan^2(45° + 0/2) = 1', 'έδαφος θεμελίωσης: φ_u = 0'],
          ['σ_{vA} = \\frac{\\sum V}{B\'} = \\frac{' + fmt(r.SV, 1) + '}{' + fmt(r.Bp, 2) + '} = ' + fmt(r.svA, 1) + '\\unit{kPa},\\quad σ_{vB} = σ_{vA} + γ h'],
          ['σ_{pA} = σ_{vA}K_p + 2c_u\\sqrt{K_p} = ' + fmt(r.svA, 1) + ' + 2\\times' + fmt(q.cu, 0) + ' = \\hl{' + fmt(r.spA, 1) + '\\unit{kPa}}'],
          ['σ_{pB} = ' + fmt(r.spA, 1) + ' + ' + fmt(q.g, 0) + 'h'],
          ['P_p = \\frac{σ_{pA}+σ_{pB}}{2}\\,h = \\frac{' + fmt(2 * r.spA, 1) + ' + ' + fmt(q.g, 0) + 'h}{2}\\,h']
        ]);
      }
    },
    {
      title: '(γ) Ύψος κλειδιού για τον απαιτούμενο FS', hl: ['Pp', 'key'],
      body: function (q, r) {
        return eqs([
          ['FS = \\frac{c_u B\' + P_p}{\\sum F_x} = \\frac{' + fmt(r.R, 1) + ' + \\frac{' + fmt(2 * r.spA, 1) + ' + ' + fmt(q.g, 0) + 'h}{2}\\,h}{' + fmt(r.SFx, 1) + '} = ' + fmt(q.FSt, 1)],
          ['\\Rightarrow\\; ' + fmt(q.g / 2, 0) + 'h^2 + ' + fmt(r.spA, 1) + 'h - ' + fmt(q.FSt * r.SFx - r.R, 1) + ' = 0 \\;\\Rightarrow\\; h = \\hl{' + fmt(r.h, 2) + '\\unit{m}}', 'P_p = ' + fmt(r.Pph, 1) + ' kN/m']
        ]) + (r.h === 0 ? note('Ο FS χωρίς κλειδί ήδη υπερβαίνει τον απαιτούμενο: δεν χρειάζεται κλειδί.') : '');
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('L \\approx ' + fmt(r.L, 1) + '\\unit{m},\\quad FS_{ολ} = ' + fmt(r.FS1, 2) + ',\\quad h \\approx ' + fmt(r.h, 2) + '\\unit{m}') + '</div><p>Χωρίς κλειδί ο τοίχος ' + (r.FS1 < 1 ? 'ολισθαίνει υπό το σεισμικό φορτίο' : 'έχει FS = ' + fmt(r.FS1, 2)) + '. Κλειδί ύψους ' + fmt(r.h, 2) + ' m κινητοποιεί παθητική αντίσταση ' + fmt(r.Pph, 0) + ' kN/m και δίνει FS = ' + fmt(q.FSt, 1) + '.</p>'; }
});

/* ===================== ΑΣΚΗΣΗ 4 ===================== */
EX.push({
  id: 'b4', num: 4, group: 'DIN 4017 – λοξή & έκκεντρη φόρτιση', source: 'Άσκηση 4',
  title: 'Φωτιστικός πυλώνας: βάθος θεμελίωσης χωρίς αδρανή περιοχή και FS κατά DIN 4017',
  tags: ['Εκκεντρότητα', 'DIN 4017', 'Άργιλος φ=0', 'Επαναληπτική λύση'],
  statement: p('Φωτιστικός πυλώνας θεμελιώνεται σε τετραγωνικό θεμέλιο ΩΣ ' + m('3\\times 3\\unit{m}') + '. Δέχεται οριζόντια δύναμη ανέμου ' + m('F_x = 18.75\\unit{kN}') + ' με σημείο εφαρμογής 10 m από την επιφάνεια του εδάφους.') +
    '<ol><li>Να υπολογίσετε το απαιτούμενο βάθος θεμελίωσης ώστε να μην αναπτύσσεται αδρανής περιοχή. Πόση είναι η μέγιστη τάση θεμελίωσης;</li><li>Να υπολογίσετε τον συντελεστή ασφαλείας έναντι φέρουσας ικανότητας (DIN 4017).</li></ol>' +
    p('<b>Παραδοχές:</b> η ροπή υπολογίζεται στη στάθμη έδρασης (συμπεριλαμβάνεται το βάθος), δρα σε μία διεύθυνση. Έδαφος: ' + m('c = 21.2\\unit{kPa},\\; φ = 0,\\; γ = 20\\unit{kN/m³}') + '. Σκυρόδεμα ' + m('γ_c = 25\\unit{kN/m³}') + ' (το κατακόρυφο φορτίο είναι το βάρος του θεμελίου).'),
  givens: [
    { key: 'Fx', label: 'Δύναμη ανέμου Fx', unit: 'kN', value: 18.75, min: 5, max: 40, step: 0.25 },
    { key: 'hF', label: 'Ύψος εφαρμογής από έδαφος', unit: 'm', value: 10, min: 4, max: 16, step: 0.5, dec: 1 },
    { key: 'B', label: 'Πλευρά θεμελίου B', unit: 'm', value: 3, min: 2, max: 4.5, step: 0.25 },
    { key: 'c', label: 'Συνοχή c (cu)', unit: 'kPa', value: 21.2, min: 10, max: 60, step: 0.2, dec: 1 },
    { key: 'g', label: 'Ειδικό βάρος εδάφους γ', unit: 'kN/m³', value: 20, min: 16, max: 22, step: 0.5, dec: 1 }
  ],
  compute: function (q) {
    var gc = 25, B = q.B, e = B / 6;
    var d = q.Fx * q.hF / (e * B * B * gc - q.Fx); if (d < 0 || !isFinite(d)) d = NaN;
    var V = B * B * d * gc, M = q.Fx * (q.hF + d), qavg = V / (B * B), qmax = qavg * (1 + 6 * e / B), qmin = qavg * (1 - 6 * e / B);
    var Bp = B - 2 * e, L = B, Ap = Bp * L;
    var Nc = 5, Nd = 1, Nb = 0, Vc = 1 + 0.2 * Bp / L, Vd = 1, Vb = 1 + 0.3 * Bp / L; // Vb αδιάφορος (Nb=0)
    var p0 = q.g * d, qappnet = V / Ap - p0;
    var Kc = function (FS) { var x = 1 - FS * q.Fx / (Ap * q.c); return x > 0 ? 0.5 + 0.5 * Math.sqrt(x) : NaN; };
    var qult = function (FS) { return q.c * Nc * Kc(FS) * Vc + p0; };
    var FScalc = function (FS) { return (qult(FS) - p0) / qappnet; };
    var FS = solve(function (f) { return FScalc(f) - f; }, 0.2, 6);
    var trials = [2, 3].map(function (f) { return { FS: f, Kc: Kc(f), qult: qult(f), FSc: FScalc(f) }; });
    return { gc: gc, B: B, e: e, d: d, V: V, M: M, qavg: qavg, qmax: qmax, qmin: qmin, Bp: Bp, L: L, Ap: Ap, Nc: Nc, Nd: Nd, Nb: Nb, Vc: Vc, Vd: Vd, p0: p0, qappnet: qappnet, kfac: q.Fx / (Ap * q.c), FS: FS, Kc: Kc(FS), qult: qult(FS), trials: trials };
  },
  figure: function (q, r, step) {
    var W = 760, Hc = 480, gy = 230, cx = 400, s = 36, d = isNaN(r.d) ? 1 : Math.min(r.d, 4);
    var Bw = q.B * s, xl = cx - Bw / 2, xr = cx + Bw / 2, yf = gy + d * s;
    var h = SVG.open(W, Hc, 'aria-label="Πυλώνας με οριζόντια δύναμη, τετραγωνικό θεμέλιο σε βάθος d και τριγωνική κατανομή τάσεων στη βάση"');
    h += SVG.soil(40, gy, 680, Hc - gy - 10, 'clay') + SVG.ground(40, xl, gy, 'left') + SVG.ground(xr, 720, gy, 'right');
    h += '<g data-k="d">' + SVG.rect(xl, gy, Bw, d * s, 'conc') + SVG.dim(xl - 30, gy, xl - 30, yf, 'd = ' + fmt(r.d, 2) + ' m', -8) + '</g>';
    h += SVG.rect(cx - 6, gy - 190, 12, 190, 'conc');
    var yF = gy - Math.min(q.hF, 10) * 18;
    h += '<g data-k="Fx">' + SVG.arrow(cx - 120, yF, cx - 8, yF, 'load', '', 4) + SVG.label(cx - 124, yF + 4, tsub('F', 'x') + ' = ' + fmt(q.Fx, 2) + ' kN', 'lbl-load math', 'end') + SVG.dim(cx + 40, yF, cx + 40, gy, fmt(q.hF, 0) + ' m', 8) + '</g>';
    h += '<g data-k="V">' + SVG.arrow(cx, gy + 8, cx, yf - 14, 'weight') + SVG.label(cx - 12, gy + 34, 'V = ' + fmt(r.V, 0) + ' kN', 'math', 'end') + '</g>';
    h += '<g data-k="M"><path d="M' + (cx - 34) + ',' + (gy + 30) + ' A34,18 0 0 1 ' + (cx + 34) + ',' + (gy + 30) + '" fill="none" stroke="var(--load)" stroke-width="2.5" marker-end="url(#arL)"/>' + SVG.label(cx + 40, gy + 26, 'M = ' + fmt(r.M, 1) + ' kNm', 'lbl-load math', 'start') + '</g>';
    // base pressure: zero at left, qmax at right (Fx pushes to the right -> rotation increases pressure on the right)
    var hp = Math.min(80, r.qmax * 0.7);
    h += '<g data-k="q">' + SVG.poly([[xl, yf], [xr, yf], [xr, yf + hp]], 'load-fill a-fade') + SVG.label(xr + 8, yf + hp, tsub('q', 'max') + ' = ' + fmt(r.qmax, 0) + ' kPa', 'lbl-load math', 'start') + SVG.label(xl - 8, yf + 14, tsub('q', 'min') + ' = 0', 'lbl-load math', 'end') + '</g>';
    h += '<g data-k="Bp">' + SVG.dim(xl + 2 * r.e * s, yf + hp + 14, xr, yf + hp + 14, 'B′ = B − 2e = ' + fmt(r.Bp, 2) + ' m', 16) + '</g>';
    h += '<g data-k="e">' + SVG.circle(cx + r.e * s, yf, 5, 'marker a-pop') + SVG.label(cx + r.e * s + 8, yf - 6, 'e = B/6', 'lbl-load', 'start') + '</g>';
    h += SVG.dim(xl, yf + hp + 48, xr, yf + hp + 48, 'B = ' + fmt(q.B, 1) + ' m', 16);
    h += SVG.label(60, gy + 24, 'c = ' + fmt(q.c, 1) + ' kPa, φ = 0, γ = ' + fmt(q.g, 0), 'lbl-muted', 'start');
    return h + SVG.close();
  },
  figcap: 'Η ροπή στη στάθμη έδρασης περιλαμβάνει και το βάθος d. Με e = B/6 η τάση μηδενίζεται ακριβώς στην αριστερή ακμή (όριο «αδρανούς περιοχής»).',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('e') + '</dt><dd>' + fmt(r.e, 2) + ' m</dd><dt>' + m('d') + '</dt><dd><b>' + fmt(r.d, 2) + ' m</b></dd><dt>' + m('q_{max}') + '</dt><dd>' + fmt(r.qmax, 0) + ' kPa</dd><dt>' + m('q_{ult}') + '</dt><dd>' + fmt(r.qult, 1) + ' kPa</dd><dt>FS</dt><dd><b>' + fmt(r.FS, 2) + '</b></dd></dl>'; },
  steps: [
    {
      title: '(α) Όριο αδρανούς περιοχής: e = B/6', hl: ['e', 'q'],
      cap: 'Τραπεζοειδής κατανομή τάσης. Για e = B/6 η ελάχιστη τάση γίνεται μηδέν.',
      body: function (q, r) { return eqs([['q_{max,min} = \\frac{P}{B\\,L}\\left(1 \\pm \\frac{6e}{B}\\right) \\;\\Rightarrow\\; q_{min} = 0 \\;\\text{για}\\; e = \\frac{B}{6} = \\frac{' + fmt(q.B, 1) + '}{6} = \\hl{' + fmt(r.e, 2) + '\\unit{m}}']]); }
    },
    {
      title: '(α) Βάθος θεμελίωσης d', hl: ['Fx', 'M', 'V', 'd'],
      cap: 'Το μόνο κατακόρυφο φορτίο είναι το ίδιο βάρος του θεμελίου, που μεγαλώνει με το d. Η ροπή επίσης μεγαλώνει με το d.',
      body: function (q, r) {
        return eqs([
          ['e = \\frac{\\sum M}{\\sum V} = \\frac{F_x\\,(' + fmt(q.hF, 0) + ' + d)}{B^2\\,d\\,γ_c} \\;\\Rightarrow\\; ' + fmt(r.e, 2) + ' = \\frac{' + fmt(q.Fx, 2) + '\\,(' + fmt(q.hF, 0) + '+d)}{' + fmt(q.B * q.B * r.gc, 0) + '\\,d}'],
          ['\\Rightarrow\\; ' + fmt(r.e * q.B * q.B * r.gc, 1) + 'd = ' + fmt(q.Fx * q.hF, 1) + ' + ' + fmt(q.Fx, 2) + 'd \\;\\Rightarrow\\; d = \\hl{' + fmt(r.d, 2) + '\\unit{m}}'],
          ['V = B^2 d γ_c = ' + fmt(r.V, 0) + '\\unit{kN},\\quad M = F_x(' + fmt(q.hF, 0) + '+d) = ' + fmt(r.M, 1) + '\\unit{kNm}']
        ]);
      }
    },
    {
      title: '(α) Μέγιστη τάση θεμελίωσης', hl: ['q'],
      body: function (q, r) { return eqs([['q_{max} = \\frac{V}{B^2}\\left(1 + \\frac{6e}{B}\\right) = \\frac{' + fmt(r.V, 0) + '}{' + fmt(q.B * q.B, 1) + '}\\,(1+1) = \\hl{' + fmt(r.qmax, 0) + '\\unit{kPa}},\\quad q_{min} = 0']]); }
    },
    {
      title: '(β) Ενεργό πλάτος και συντελεστές DIN 4017 (φ = 0)', hl: ['Bp'],
      body: function (q, r) {
        return eqs([
          ['B\' = B - 2e = \\hl{' + fmt(r.Bp, 2) + '\\unit{m}},\\quad L = ' + fmt(q.B, 1) + '\\unit{m},\\quad A\' = ' + fmt(r.Ap, 1) + '\\unit{m²}'],
          ['H = ' + fmt(q.Fx, 2) + '\\unit{kN},\\quad V = ' + fmt(r.V, 0) + '\\unit{kN}'],
          ['φ = 0 \\;\\Rightarrow\\; N_c = 5,\\; N_d = 1,\\; N_b = 0', 'Πίνακας 1 DIN 4017']
        ]) + dinTableHot(0);
      }
    },
    {
      title: '(β) Συντελεστές μορφής (ορθογώνιο, φ = 0)', hl: ['Bp'],
      body: function (q, r) { return eqs([['V_c = 1 + 0.2\\,\\frac{B\'}{L} = 1 + 0.2\\times\\frac{' + fmt(r.Bp, 2) + '}{' + fmt(r.L, 1) + '} = \\hl{' + fmt(r.Vc, 2) + '}'], ['V_d = 1,\\quad V_b:\\;\\text{αδιάφορος (N_b = 0)}']]); }
    },
    {
      title: '(β) Μειωτικός συντελεστής λοξής φόρτισης Kc', hl: ['Fx'],
      cap: 'Για φ = 0 ο Kc εξαρτάται από τον λόγο της οριζόντιας δύναμης προς την αστράγγιστη αντίσταση B′L′c. Στον DIN μπαίνει το φορτίο σχεδιασμού FS·H, άρα εξαρτάται από τον ζητούμενο FS.',
      body: function (q, r) {
        return eqs([
          ['K_c = 0.5 + 0.5\\sqrt{1 - \\frac{FS\\cdot H}{B\'\\,L\'\\,c}} = 0.5 + 0.5\\sqrt{1 - \\frac{FS\\times' + fmt(q.Fx, 2) + '}{' + fmt(r.Ap, 1) + '\\times' + fmt(q.c, 1) + '}} = 0.5 + 0.5\\sqrt{1 - ' + fmt(r.kfac, 3) + '\\,FS}'],
          ['K_d = 1,\\quad K_b:\\;\\text{αδιάφορος}']
        ]);
      }
    },
    {
      title: '(β) Δοκιμές: FS υποτιθέμενος = FS υπολογιζόμενος', hl: ['q', 'Bp'],
      body: function (q, r) {
        var rows = r.trials.map(function (t) { return ['FS = ' + fmt(t.FS, 1), fmt(t.Kc, 3), fmt(t.qult, 1), fmt(t.FSc, 2), Math.abs(t.FSc - t.FS) < 0.1 ? '✔ δεκτό' : '✘ απορρίπτεται']; });
        rows.push(['FS = ' + fmt(r.FS, 2) + ' (ακριβής λύση)', fmt(r.Kc, 3), fmt(r.qult, 1), fmt(r.FS, 2), '✔']);
        return eqs([
          ['q_{ult} = c\\,N_c\\,K_c\\,V_c + γ\\,d\\,N_d\\,K_d\\,V_d = ' + fmt(q.c, 1) + '\\times 5\\times K_c\\times' + fmt(r.Vc, 2) + ' + ' + fmt(r.p0, 0)],
          ['FS = \\frac{q_{ult} - γ d}{\\frac{V}{B\'L} - γ d} = \\frac{q_{ult} - ' + fmt(r.p0, 0) + '}{' + fmt(r.V / r.Ap, 1) + ' - ' + fmt(r.p0, 0) + '} = \\frac{q_{ult} - ' + fmt(r.p0, 0) + '}{' + fmt(r.qappnet, 1) + '}']
        ]) + table(['Δοκιμή', m('K_c'), m('q_{ult}') + ' (kPa)', 'FS υπολογ.', ''], rows, rows.length - 1) +
          note('Η λύση συγκλίνει όταν ο FS που υποθέτουμε στον Kc ισούται με τον FS που προκύπτει. Σημειώσεις: q<sub>ult</sub> = 150.2 και 144.6 kPa, μικρές διαφορές στρογγυλοποίησης του V<sub>c</sub> (1.13).');
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('d = ' + fmt(r.d, 2) + '\\unit{m},\\quad q_{max} = ' + fmt(r.qmax, 0) + '\\unit{kPa},\\quad FS \\approx ' + fmt(r.FS, 1)) + '</div>'; }
});

/* ===================== ΑΣΚΗΣΗ 5 ===================== */
EX.push({
  id: 'b5', num: 5, group: 'Τοίχοι αντιστήριξης', source: 'Άσκηση 5',
  title: 'Μέγιστο ύψος τοίχου με επιφόρτιση ώστε να μην ανατρέπεται',
  tags: ['Τοίχος ΩΣ', 'Ανατροπή', 'Επιφόρτιση'],
  statement: p('Για τον τοίχο αντιστήριξης ΩΣ του σχήματος να υπολογίσετε το μέγιστο ύψος ' + m('H') + ' ώστε να μην ανατρέπεται. Επιφόρτιση ' + m('q = 30\\unit{kPa}') + ' στην επίχωση. Αμμοχάλικο ' + m('φ = 32°,\\; γ = 17\\unit{kN/m³}') + ', σκυρόδεμα ' + m('γ_c = 24\\unit{kN/m³}') + '. Πέλμα: 1.0 m εμπρός, κορμός 0.5 m, 1.5 m πίσω, πάχος 0.5 m.') +
    p('<b>Παραδοχές:</b> ο τοίχος θεωρείται λείος· λαμβάνεται μόνο η δυσμενής επίπτωση της επιφόρτισης.'),
  givens: [
    { key: 'q', label: 'Επιφόρτιση q', unit: 'kPa', value: 30, min: 0, max: 80, step: 5 },
    { key: 'phi', label: 'Γωνία τριβής φ', unit: '°', value: 32, min: 25, max: 40, step: 0.5, dec: 1 },
    { key: 'g', label: 'Ειδικό βάρος εδάφους γ', unit: 'kN/m³', value: 17, min: 15, max: 21, step: 0.5, dec: 1 },
    { key: 'FSt', label: 'Συντελεστής ασφαλείας ανατροπής', unit: '', value: 1.0, min: 1, max: 2.5, step: 0.1, dec: 1 }
  ],
  compute: function (q) {
    var a = 1.0, t = 0.5, Lh = 1.5, tb = 0.5, gc = 24, B = a + t + Lh;
    var W1 = B * gc * tb, arm1 = B / 2, arm2 = a + t / 2, arm3 = a + t + Lh / 2;
    var Ka = GEO.Ka(q.phi), kPa = 0.5 * Ka * q.g, kPq = Ka * q.q;
    var Mstab = function (H) { return W1 * arm1 + (H - tb) * gc * t * arm2 + (H - tb) * q.g * Lh * arm3; };
    var Mover = function (H) { return kPa * H * H * H / 3 + kPq * H * H / 2; };
    var H = solve(function (H) { return Mstab(H) - q.FSt * Mover(H); }, 1, 30);
    var Vq = q.q * Lh, Mq = Vq * arm3;
    var H2 = solve(function (H) { return Mstab(H) + Mq - q.FSt * Mover(H); }, 1, 40);
    return { a: a, t: t, Lh: Lh, tb: tb, gc: gc, B: B, W1: W1, arm1: arm1, arm2: arm2, arm3: arm3, Ka: Ka, kPa: kPa, kPq: kPq, H: H, W2: (H - tb) * gc * t, W3: (H - tb) * q.g * Lh, Pa: kPa * H * H, Pq: kPq * H, Mstab: Mstab(H), Mover: Mover(H), MPa: kPa * H * H * H / 3, MPq: kPq * H * H / 2, Vq: Vq, Mq: Mq, H2: H2, c2: gc * t, c3: q.g * Lh };
  },
  figure: function (q, r, step) {
    var H = isNaN(r.H) ? 5 : Math.min(r.H, 9), s = Math.min(36, 300 / H), x0 = 170, gy = 380, a = r.a, t = r.t, Lh = r.Lh, tb = r.tb, B = r.B;
    var yTop = gy - H * s, yBase = gy - tb * s, xs = x0 + a * s, xh = xs + t * s, xe = xh + Lh * s;
    var W = 780, Hc = 420;
    var h = SVG.open(W, Hc, 'aria-label="Τοίχος αντιστήριξης με επιφόρτιση, βάρη, ενεργητική ώθηση εδάφους και ώθηση επιφόρτισης"');
    h += SVG.soil(xh, yTop, 740 - xh, gy - yTop, 'sand') + SVG.rect(30, gy, 710, Hc - gy - 10, 'soil2');
    h += SVG.ground(30, xs, gy, 'left') + SVG.ground(xh, 740, yTop, 'right');
    h += SVG.poly([[x0, yBase], [x0 + B * s, yBase], [x0 + B * s, gy], [x0, gy]], 'conc');
    h += SVG.rect(xs, yTop, t * s, H * s - tb * s, 'conc');
    h += '<g data-k="q">' + SVG.udl(xh + 4, xe + 90, yTop, 34, 'q = ' + fmt(q.q, 0) + ' kPa') + '</g>';
    var cx1 = x0 + B * s / 2, cy1 = yBase + tb * s / 2;
    h += '<g data-k="W1">' + SVG.arrow(cx1 + 30, cy1 - 4, cx1 + 30, cy1 + 44, 'weight') + SVG.label(cx1 + 42, cy1 + 40, tsub('W', '1'), 'math', 'start') + '</g>';
    var cx2 = xs + t * s / 2, cy2 = (yTop + yBase) / 2;
    h += '<g data-k="W2">' + SVG.arrow(cx2, cy2 - 35, cx2, cy2 + 35, 'weight') + SVG.label(cx2 + 14, cy2 + 5, tsub('W', '2'), 'math', 'start') + '</g>';
    var cx3 = xh + Lh * s / 2, cy3 = (yTop + yBase) / 2;
    h += '<g data-k="W3">' + SVG.arrow(cx3, cy3 - 35, cx3, cy3 + 35, 'weight') + SVG.label(cx3 + 14, cy3 + 5, tsub('W', '3'), 'math', 'start') + '</g>';
    var wB = Math.min(90, r.Ka * q.g * H * 3), wQ = Math.min(60, r.Ka * q.q * 3);
    h += '<g data-k="Pa">' + SVG.pressure(xe, yTop, gy, 0, wB, 1, 'load-fill', '', 5) + SVG.arrow(xe + wB + 40, gy - H * s / 3, xe + 4, gy - H * s / 3, 'load') + SVG.label(xe + wB + 46, gy - H * s / 3 + 4, tsub('P', 'a') + ' (H/3)', 'lbl-load math', 'start') + '</g>';
    var xq = xe + wB + 150;
    h += '<g data-k="Pq">' + SVG.pressure(xq, yTop, gy, wQ, wQ, 1, 'fill-red', '', 4) + SVG.arrow(xq + wQ + 40, gy - H * s / 2, xq + 4, gy - H * s / 2, 'load') + SVG.label(xq + wQ + 44, gy - H * s / 2 + 4, tsub('P', 'q') + ' (H/2)', 'lbl-load math', 'start') + SVG.label(xq + wQ / 2, yTop - 6, 'Ka·q', 'lbl-muted') + '</g>';
    h += '<g data-k="A">' + SVG.point(x0, gy, 'A', -16, 16) + '</g>' + SVG.point(x0 + B * s / 2, gy, 'O', 6, 16);
    h += SVG.dim(x0, yBase - 8, xs, yBase - 8, '1.0', -18) + SVG.dim(xh, yBase - 8, xe, yBase - 8, '1.5', -18);
    h += '<g data-k="H">' + SVG.dim(x0 - 60, yTop, x0 - 60, gy, 'H = ' + fmt(r.H, 2) + ' m', -8) + '</g>';
    h += SVG.label(xs + t * s / 2, yTop - 8, '0.5', 'lbl-muted');
    h += SVG.label(xh + 10, yTop + 60, 'φ=' + fmt(q.phi, 1) + '°, γ=' + fmt(q.g, 0), 'lbl-muted', 'start');
    return h + SVG.close();
  },
  figcap: 'Δύο ανατρεπτικές ωθήσεις: τριγωνική από το έδαφος (Pₐ στο H/3) και ορθογωνική από την επιφόρτιση (P_q στο H/2). Το βάρος της επιφόρτισης πάνω στο πέλμα αγνοείται (ευνοϊκό).',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('K_a') + '</dt><dd>' + fmt(r.Ka, 3) + '</dd><dt>' + m('P_a') + '</dt><dd>' + fmt(r.Pa, 1) + ' kN/m</dd><dt>' + m('P_q') + '</dt><dd>' + fmt(r.Pq, 1) + ' kN/m</dd><dt>' + m('M_{ευστ}') + ' = ' + m('M_{ανατρ}') + '</dt><dd>' + fmt(r.Mstab, 0) + ' kNm</dd><dt>' + m('H_{max}') + '</dt><dd><b>' + fmt(r.H, 2) + ' m</b></dd></dl>'; },
  steps: [
    {
      title: 'Βάρη συναρτήσει του H', hl: ['W1', 'W2', 'W3'],
      body: function (q, r) {
        return eqs([
          ['W_1 = B\\,γ_c\\,0.5 = ' + fmt(r.B, 1) + '\\times 24\\times 0.5 = \\hl{' + fmt(r.W1, 0) + '\\unit{kN}}', 'πέλμα, μοχλοβραχίονας ' + fmt(r.arm1, 2) + ' m'],
          ['W_2 = (H-0.5)\\,γ_c\\,0.5 = ' + fmt(r.c2, 0) + 'H - ' + fmt(r.c2 * r.tb, 0), 'κορμός, μοχλοβραχίονας ' + fmt(r.arm2, 2) + ' m'],
          ['W_3 = (H-0.5)\\,γ\\,1.5 = ' + fmt(r.c3, 1) + 'H - ' + fmt(r.c3 * r.tb, 2), 'επίχωση, μοχλοβραχίονας ' + fmt(r.arm3, 2) + ' m']
        ]);
      }
    },
    {
      title: 'Ωθήσεις εδάφους και επιφόρτισης', hl: ['Pa', 'Pq'],
      body: function (q, r) {
        return eqs([
          ['K_a = \\tan^2(45° - ' + fmt(q.phi / 2, 2) + '°) = \\hl{' + fmt(r.Ka, 3) + '}'],
          ['P_a = \\frac{1}{2}K_a\\,γ\\,H^2 = ' + fmt(r.kPa, 2) + '\\,H^2', 'στο H/3 → M = ' + fmt(r.kPa / 3, 3) + ' H³'],
          ['P_q = K_a\\,q\\,H = ' + fmt(r.Ka, 3) + '\\times' + fmt(q.q, 0) + '\\,H = ' + fmt(r.kPq, 2) + '\\,H', 'στο H/2 → M = ' + fmt(r.kPq / 2, 2) + ' H²']
        ]);
      }
    },
    {
      title: 'Πίνακας ροπών ως προς το Α', hl: ['A'],
      body: function (q, r) {
        return table(['Δύναμη', 'Τιμή (kN)', 'Μοχλοβραχίονας (m)', 'Ροπή ως προς Α (kNm)'], [
          [m('W_1'), fmt(r.W1, 0), fmt(r.arm1, 2), '+' + fmt(r.W1 * r.arm1, 1)],
          [m('W_2'), m(fmt(r.c2, 0) + 'H - ' + fmt(r.c2 * r.tb, 0)), fmt(r.arm2, 2), m('+(' + fmt(r.c2 * r.arm2, 1) + 'H - ' + fmt(r.c2 * r.tb * r.arm2, 1) + ')')],
          [m('W_3'), m(fmt(r.c3, 1) + 'H - ' + fmt(r.c3 * r.tb, 2)), fmt(r.arm3, 2), m('+(' + fmt(r.c3 * r.arm3, 2) + 'H - ' + fmt(r.c3 * r.tb * r.arm3, 2) + ')')],
          [m('P_a'), m(fmt(r.kPa, 2) + 'H^2'), m('H/3'), m('-' + fmt(r.kPa / 3, 3) + 'H^3')],
          [m('P_q'), m(fmt(r.kPq, 2) + 'H'), m('H/2'), m('-' + fmt(r.kPq / 2, 2) + 'H^2')]
        ]);
      }
    },
    {
      title: 'Δυσμενής περίπτωση επιφόρτισης', hl: ['q', 'W3'],
      cap: 'Η επιφόρτιση πάνω στο πέλμα θα έδινε πρόσθετο κατακόρυφο φορτίο και ροπή ευστάθειας: αγνοείται.',
      body: function (q, r) {
        return p('Αν η επιφόρτιση εκτεινόταν και πάνω από το πέλμα θα έδινε ' + m('V_q = q\\times 1.5 = ' + fmt(r.Vq, 0) + '\\unit{kN}') + ' με ροπή ευστάθειας ' + m('M_q = V_q\\times' + fmt(r.arm3, 2) + ' = ' + fmt(r.Mq, 1) + '\\unit{kNm}') + '. Η <b>δυσμενέστερη</b> περίπτωση είναι χωρίς αυτό το φορτίο (μόνο η ώθηση ' + m('P_q') + ').') +
          note('Αν συμπεριληφθεί το V<sub>q</sub>, το μέγιστο ύψος γίνεται H ≈ ' + fmt(r.H2, 1) + ' m (μη συντηρητικό).');
      }
    },
    {
      title: 'Ισορροπία ροπών: FS = 1 → H', hl: ['H', 'A'],
      body: function (q, r) {
        return eqs([
          ['FS = \\frac{M_{ευστ}}{M_{ανατρ}} = \\frac{' + fmt(r.W1 * r.arm1, 1) + ' + ' + fmt(r.c2 * r.arm2 + r.c3 * r.arm3, 2) + 'H - ' + fmt(r.c2 * r.tb * r.arm2 + r.c3 * r.tb * r.arm3, 2) + '}{' + fmt(r.kPa / 3, 3) + 'H^3 + ' + fmt(r.kPq / 2, 2) + 'H^2} = ' + fmt(q.FSt, 1)],
          ['\\Rightarrow\\; H = \\hl{' + fmt(r.H, 2) + '\\unit{m}} \\approx ' + fmt(Math.round(r.H * 2) / 2, 1) + '\\unit{m}', 'λύση με δοκιμές: M_ευστ = ' + fmt(r.Mstab, 0) + ', M_ανατρ = ' + fmt(r.Mover, 0) + ' kNm']
        ]);
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('H_{max} \\approx ' + fmt(r.H, 1) + '\\unit{m}') + '</div><p>Για μεγαλύτερο ύψος η ανατρεπτική ροπή των ωθήσεων (που αυξάνει με H³) υπερβαίνει τη ροπή ευστάθειας των βαρών (που αυξάνει γραμμικά με H).</p>'; }
});

/* ===================== ΑΣΚΗΣΗ 6 ===================== */
EX.push({
  id: 'b6', num: 6, group: 'Γενική εξίσωση φέρουσας ικανότητας', source: 'Άσκηση 6',
  title: 'Απαιτούμενο βάθος θεμελίωσης τετραγωνικού θεμελίου για FS = 3',
  tags: ['Γενική εξίσωση', 'Υδροφόρος', 'c–φ έδαφος'],
  statement: p('Να υπολογιστεί το απαιτούμενο βάθος θεμελίωσης τετραγωνικού θεμελίου ' + m('3\\times 3\\unit{m}') + ' ώστε ο συντελεστής ασφαλείας έναντι φέρουσας ικανότητας να ισούται με 3. Ο υδροφόρος ορίζοντας βρίσκεται στη στάθμη θεμελίωσης και το έδαφος θεωρείται γενικώς κορεσμένο.') +
    '<ul><li>Κατακόρυφο φορτίο ' + m('V = 362\\unit{t} = 3620\\unit{kN}') + '</li><li>Συνοχή ' + m('c = 0.12\\unit{kg/cm²} = 12\\unit{kPa}') + ', γωνία τριβής ' + m('φ = 25°') + '</li><li>Ειδικό βάρος κορεσμένου εδάφους ' + m('γ_κ = 20\\unit{kN/m³}') + '</li></ul>',
  givens: [
    { key: 'V', label: 'Κατακόρυφο φορτίο V', unit: 'kN', value: 3620, min: 1000, max: 6000, step: 20 },
    { key: 'B', label: 'Πλευρά θεμελίου B', unit: 'm', value: 3, min: 2, max: 5, step: 0.25 },
    { key: 'c', label: 'Συνοχή c', unit: 'kPa', value: 12, min: 0, max: 40, step: 1 },
    { key: 'phi', label: 'Γωνία τριβής φ', unit: '°', value: 25, min: 15, max: 35, step: 1, dec: 0 },
    { key: 'g', label: 'Ειδικό βάρος γκ', unit: 'kN/m³', value: 20, min: 17, max: 22, step: 0.5, dec: 1 },
    { key: 'FSt', label: 'Απαιτούμενος FS', unit: '', value: 3, min: 1.5, max: 4, step: 0.1, dec: 1 }
  ],
  compute: function (q) {
    var Nc = GEO.Nc(q.phi), Nq = GEO.Nq(q.phi), Ng = GEO.Ng(q.phi), BL = 1;
    var Sc = 1 + Nq / Nc * BL, Sq = 1 + BL * tand(q.phi), Sg = 1 - 0.4 * BL, gsub = q.g - 10;
    var A = q.c * Nc * Sc, Bt = 0.5 * gsub * q.B * Ng * Sg, Ct = q.g * Nq * Sq; // q_ult = A + Bt + Ct·Df
    var qapp = q.V / (q.B * q.B);
    var Df = solve(function (D) { return (A + Bt + (Ct - q.g) * D) - q.FSt * (qapp - q.g * D); }, 0, 10);
    return { Nc: Nc, Nq: Nq, Ng: Ng, Sc: Sc, Sq: Sq, Sg: Sg, gsub: gsub, A: A, Bt: Bt, Ct: Ct, qapp: qapp, Df: Df, qult: A + Bt + Ct * Df, qnet: A + Bt + (Ct - q.g) * Df, qappnet: qapp - q.g * Df };
  },
  figure: function (q, r, step) {
    return footingSection({ B: q.B, Df: isNaN(r.Df) ? 1 : r.Df, Vlabel: 'V = ' + fmt(q.V, 0) + ' kN', wt: true, step: step, wedgeStep: 2, phi: q.phi, labelsAbove: ['γ₁ = γκ = ' + fmt(q.g, 0) + ' kN/m³', 'c = ' + fmt(q.c, 0) + ' kPa, φ = ' + fmt(q.phi, 0) + '°'], labelsBelow: ['γ₂ = γ′ = γκ − γw = ' + fmt(r.gsub, 0) + ' kN/m³'] });
  },
  figcap: 'Πάνω από τη στάθμη θεμελίωσης δρα το ολικό βάρος γ₁·Df (υπερκείμενο). Κάτω από αυτήν, στη ζώνη αστοχίας, το έδαφος είναι βυθισμένο: γ′ = γκ − γw.',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('N_c, N_q, N_γ') + '</dt><dd>' + fmt(r.Nc, 1) + ', ' + fmt(r.Nq, 1) + ', ' + fmt(r.Ng, 1) + '</dd><dt>' + m('S_c, S_q, S_γ') + '</dt><dd>' + fmt(r.Sc, 2) + ', ' + fmt(r.Sq, 2) + ', ' + fmt(r.Sg, 2) + '</dd><dt>' + m('q_{app}') + '</dt><dd>' + fmt(r.qapp, 1) + ' kPa</dd><dt>' + m('D_f') + '</dt><dd><b>' + fmt(r.Df, 2) + ' m</b></dd></dl>'; },
  steps: [
    {
      title: 'Συντελεστές φέρουσας ικανότητας', hl: ['wedge'],
      body: function (q, r) { return p('Για ' + m('φ = ' + fmt(q.phi, 0) + '°') + ' (Prandtl–Reissner για N<sub>q</sub>, N<sub>c</sub> και Hansen για N<sub>γ</sub>):') + eq('N_c = \\hl{' + fmt(r.Nc, 1) + '},\\quad N_q = \\hl{' + fmt(r.Nq, 1) + '},\\quad N_γ = \\hl{' + fmt(r.Ng, 1) + '}') + TABLES.bc(q.phi); }
    },
    {
      title: 'Συντελεστές μορφής (τετράγωνο, B/L = 1)', hl: ['B'],
      body: function (q, r) { return eqs([['S_c = 1 + \\frac{N_q}{N_c}\\,\\frac{B}{L} = 1 + \\frac{' + fmt(r.Nq, 1) + '}{' + fmt(r.Nc, 1) + '} = \\hl{' + fmt(r.Sc, 2) + '}'], ['S_q = 1 + \\frac{B}{L}\\tan φ = 1 + \\tan ' + fmt(q.phi, 0) + '° = \\hl{' + fmt(r.Sq, 2) + '}'], ['S_γ = 1 - 0.4\\,\\frac{B}{L} = \\hl{' + fmt(r.Sg, 2) + '}']]); }
    },
    {
      title: 'Οριακή φέρουσα ικανότητα συναρτήσει του Df', hl: ['Df', 'WT', 'wedge'],
      cap: 'Τρεις όροι: συνοχή, βάρος εδάφους στη ζώνη αστοχίας (βυθισμένο γ′) και υπερκείμενο γ·Df.',
      body: function (q, r) {
        return eqs([
          ['q\'_{ult} = c\\,N_c\\,S_c + \\frac{1}{2}\\,γ\'\\,B\\,N_γ\\,S_γ + γ\\,D_f\\,N_q\\,S_q'],
          ['= ' + fmt(q.c, 0) + '\\cdot' + fmt(r.Nc, 1) + '\\cdot' + fmt(r.Sc, 2) + ' + 0.5\\cdot(' + fmt(q.g, 0) + '-10)\\cdot' + fmt(q.B, 1) + '\\cdot' + fmt(r.Ng, 1) + '\\cdot' + fmt(r.Sg, 2) + ' + ' + fmt(q.g, 0) + '\\,D_f\\cdot' + fmt(r.Nq, 1) + '\\cdot' + fmt(r.Sq, 2)],
          ['= ' + fmt(r.A, 1) + ' + ' + fmt(r.Bt, 1) + ' + ' + fmt(r.Ct, 1) + '\\,D_f = \\hl{' + fmt(r.A + r.Bt, 1) + ' + ' + fmt(r.Ct, 1) + '\\,D_f}']
        ]) + note('Σημειώσεις: ο όρος συνοχής αναγράφεται 337.6 (τυπογραφικό· 12·20.7·1.52 = 377.6), το άθροισμα 438.8 είναι σωστό.');
      }
    },
    {
      title: 'Καθαρές τάσεις', hl: ['V', 'Df'],
      body: function (q, r) {
        return eqs([
          ['q\'_{net} = q\'_{ult} - γ\\,D_f = ' + fmt(r.A + r.Bt, 1) + ' + ' + fmt(r.Ct - q.g, 1) + '\\,D_f'],
          ['q_{app,net} = \\frac{V}{B^2} - γ\\,D_f = \\frac{' + fmt(q.V, 0) + '}{' + fmt(q.B * q.B, 0) + '} - ' + fmt(q.g, 0) + '\\,D_f = ' + fmt(r.qapp, 1) + ' - ' + fmt(q.g, 0) + '\\,D_f']
        ]);
      }
    },
    {
      title: 'Συντελεστής ασφαλείας → Df', hl: ['Df'],
      body: function (q, r) {
        return eqs([
          ['FS = \\frac{q\'_{net}}{q_{app,net}} = ' + fmt(q.FSt, 1) + ' \\;\\Rightarrow\\; ' + fmt(r.A + r.Bt, 1) + ' + ' + fmt(r.Ct - q.g, 1) + 'D_f = ' + fmt(q.FSt, 1) + '\\,(' + fmt(r.qapp, 1) + ' - ' + fmt(q.g, 0) + 'D_f)'],
          ['\\Rightarrow\\; D_f = \\hl{' + fmt(r.Df, 2) + '\\unit{m}}', 'q′_ult = ' + fmt(r.qult, 0) + ' kPa, q_app,net = ' + fmt(r.qappnet, 1) + ' kPa']
        ]);
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('D_f \\approx ' + fmt(r.Df, 2) + '\\unit{m}') + '</div><p>Το βάθος θεμελίωσης αυξάνει τη φέρουσα ικανότητα μέσω του όρου γ·Df·Nq·Sq και ταυτόχρονα μειώνει την καθαρή επιβαλλόμενη τάση.</p>'; }
});

/* ===================== ΑΣΚΗΣΗ 7 ===================== */
EX.push({
  id: 'b7', num: 7, group: 'Γενική εξίσωση φέρουσας ικανότητας', source: 'Άσκηση 7',
  title: 'Απαιτούμενη διάσταση τετραγωνικού θεμελίου σε άμμο για FS = 2',
  tags: ['Γενική εξίσωση', 'Άμμος', 'Υδροφόρος'],
  statement: p('Να υπολογιστεί η απαιτούμενη διάσταση τετραγωνικού θεμελίου ώστε ο συντελεστής ασφαλείας έναντι φέρουσας ικανότητας στην κατακόρυφη διεύθυνση να ισούται με 2. Το έδαφος είναι αμμώδες και ο υδροφόρος ορίζοντας βρίσκεται στη στάθμη θεμελίωσης.') +
    '<ul><li>Βάθος θεμελίωσης ' + m('D_f = 2\\unit{m}') + ', κατακόρυφο φορτίο ' + m('V = 2880\\unit{kN}') + '</li><li>Γωνία τριβής ' + m('φ = 32°') + ', ' + m('c = 0') + '</li><li>Κορεσμένο ειδικό βάρος ' + m('γ_{sat} = 20\\unit{kN/m³}') + ', ολικό (πάνω από τον Υ.Ο.) ' + m('γ = 17\\unit{kN/m³}') + '</li></ul>' +
    eq('q_{ult} = c\\,N_c\\,S_c + σ_{z,D}\\,N_q\\,S_q + \\frac{1}{2}\\,γ\\,B\\,N_γ\\,S_γ', 'σ_z,D = κατακόρυφη τάση στη στάθμη θεμελίωσης'),
  givens: [
    { key: 'V', label: 'Κατακόρυφο φορτίο V', unit: 'kN', value: 2880, min: 1000, max: 6000, step: 20 },
    { key: 'Df', label: 'Βάθος θεμελίωσης Df', unit: 'm', value: 2, min: 0.5, max: 4, step: 0.25 },
    { key: 'phi', label: 'Γωνία τριβής φ', unit: '°', value: 32, min: 25, max: 40, step: 1, dec: 0 },
    { key: 'g', label: 'Ειδικό βάρος πάνω από Υ.Ο. γ', unit: 'kN/m³', value: 17, min: 15, max: 20, step: 0.5, dec: 1 },
    { key: 'gsat', label: 'Κορεσμένο ειδικό βάρος γsat', unit: 'kN/m³', value: 20, min: 18, max: 22, step: 0.5, dec: 1 },
    { key: 'FSt', label: 'Απαιτούμενος FS', unit: '', value: 2, min: 1.5, max: 4, step: 0.1, dec: 1 }
  ],
  compute: function (q) {
    var Nc = GEO.Nc(q.phi), Nq = GEO.Nq(q.phi), Ng = GEO.Ng(q.phi), Sq = 1 + tand(q.phi), Sg = 0.6, gsub = q.gsat - 10;
    var szD = q.g * q.Df, A = szD * Nq * Sq, k = 0.5 * gsub * Ng * Sg; // q_ult = A + k·B
    var FS = function (B) { return (A + k * B - szD) / (q.V / (B * B) - szD); };
    var B = solve(function (B) { return (A + k * B - szD) - q.FSt * (q.V / (B * B) - szD); }, 0.5, 12);
    var trials = [B - 0.5, B, B + 0.5].map(function (b) { b = Math.round(b * 2) / 2; return { B: b, qult: A + k * b, net: A + k * b - szD, app: q.V / (b * b) - szD, FS: FS(b) }; });
    return { Nc: Nc, Nq: Nq, Ng: Ng, Sq: Sq, Sg: Sg, gsub: gsub, szD: szD, A: A, k: k, B: B, qult: A + k * B, qnet: A + k * B - szD, qappnet: q.V / (B * B) - szD, trials: trials };
  },
  figure: function (q, r, step) {
    return footingSection({ B: isNaN(r.B) ? 2 : r.B, Df: q.Df, Vlabel: 'V = ' + fmt(q.V, 0) + ' kN', wt: true, step: step, wedgeStep: 2, phi: q.phi, Bname: 'B = ?', labelsAbove: ['γ = ' + fmt(q.g, 0) + ' kN/m³ (πάνω από Υ.Ο.)', 'άμμος φ = ' + fmt(q.phi, 0) + '°, c = 0'], labelsBelow: ['γsat = ' + fmt(q.gsat, 0) + ' → γ′ = ' + fmt(r.gsub, 0) + ' kN/m³'] });
  },
  figcap: 'Το υπερκείμενο υπολογίζεται με το ολικό βάρος (πάνω από τον Υ.Ο.), ο όρος του πλάτους B με το βυθισμένο γ′.',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('N_q, N_γ') + '</dt><dd>' + fmt(r.Nq, 1) + ', ' + fmt(r.Ng, 1) + '</dd><dt>' + m('σ_{z,D}') + '</dt><dd>' + fmt(r.szD, 0) + ' kPa</dd><dt>' + m('q_{ult}') + '</dt><dd>' + fmt(r.qult, 0) + ' kPa</dd><dt>' + m('B') + '</dt><dd><b>' + fmt(r.B, 2) + ' m</b></dd></dl>'; },
  steps: [
    {
      title: 'Συντελεστές φέρουσας ικανότητας', hl: ['wedge'],
      body: function (q, r) { return eq('φ = ' + fmt(q.phi, 0) + '°:\\quad N_c = ' + fmt(r.Nc, 1) + ',\\quad N_q = \\hl{' + fmt(r.Nq, 1) + '},\\quad N_γ = \\hl{' + fmt(r.Ng, 1) + '}') + TABLES.bc(q.phi); }
    },
    {
      title: 'Τάση στη στάθμη θεμελίωσης και συντελεστές μορφής', hl: ['Df', 'WT'],
      body: function (q, r) { return eqs([['σ_{z,D} = γ\\,D_f = ' + fmt(q.g, 0) + '\\times' + fmt(q.Df, 1) + ' = \\hl{' + fmt(r.szD, 0) + '\\unit{kPa}}'], ['S_q = 1 + \\tan φ = \\hl{' + fmt(r.Sq, 2) + '},\\quad S_γ = 1 - 0.4 = \\hl{0.6}', 'τετράγωνο B/L = 1'], ['c = 0 \\Rightarrow\\;\\text{ο όρος συνοχής μηδενίζεται}']]); }
    },
    {
      title: 'Οριακή φέρουσα ικανότητα συναρτήσει του B', hl: ['B', 'wedge'],
      body: function (q, r) {
        return eqs([
          ['q_{ult} = σ_{z,D}\\,N_q\\,S_q + \\frac{1}{2}\\,γ\'\\,B\\,N_γ\\,S_γ = ' + fmt(r.szD, 0) + '\\times' + fmt(r.Nq, 1) + '\\times' + fmt(r.Sq, 2) + ' + 0.5\\,(' + fmt(q.gsat, 0) + '-10)\\,B\\times' + fmt(r.Ng, 1) + '\\times 0.6'],
          ['q_{ult} = \\hl{' + fmt(r.A, 1) + ' + ' + fmt(r.k, 1) + '\\,B}']
        ]);
      }
    },
    {
      title: 'Καθαρές τάσεις και συντελεστής ασφαλείας', hl: ['V', 'B'],
      body: function (q, r) {
        return eqs([
          ['q_{ult,net} = q_{ult} - σ_{z,D} = ' + fmt(r.A - r.szD, 1) + ' + ' + fmt(r.k, 1) + '\\,B'],
          ['q_{app,net} = \\frac{V}{B^2} - σ_{z,D} = \\frac{' + fmt(q.V, 0) + '}{B^2} - ' + fmt(r.szD, 0)],
          ['FS = \\frac{q_{ult,net}}{q_{app,net}} = ' + fmt(q.FSt, 1) + ' \\;\\Rightarrow\\; ' + fmt(r.A - r.szD, 1) + ' + ' + fmt(r.k, 1) + '\\,B = ' + fmt(q.FSt, 1) + '\\left(\\frac{' + fmt(q.V, 0) + '}{B^2} - ' + fmt(r.szD, 0) + '\\right)']
        ]);
      }
    },
    {
      title: 'Λύση με δοκιμές', hl: ['B'],
      body: function (q, r) {
        var rows = r.trials.map(function (t) { return ['B = ' + fmt(t.B, 2) + ' m', fmt(t.qult, 0), fmt(t.net, 0), fmt(t.app, 0), fmt(t.FS, 2)]; });
        rows.push(['B = ' + fmt(r.B, 2) + ' m (ακριβής)', fmt(r.qult, 0), fmt(r.qnet, 0), fmt(r.qappnet, 0), fmt(q.FSt, 2)]);
        return table(['Δοκιμή', m('q_{ult}'), m('q_{ult,net}'), m('q_{app,net}'), 'FS'], rows, rows.length - 1) + eq('\\Rightarrow\\; B \\approx \\hl{' + fmt(r.B, 2) + '\\unit{m}}');
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('B \\approx ' + fmt(r.B, 1) + '\\unit{m}') + '</div><p>Τετραγωνικό θεμέλιο ' + fmt(r.B, 1) + ' × ' + fmt(r.B, 1) + ' m. Η καθαρή επιβαλλόμενη τάση μειώνεται με το B² ενώ η φέρουσα ικανότητα αυξάνει γραμμικά με το B.</p>'; }
});

/* ===================== ΑΣΚΗΣΗ 8 ===================== */
EX.push({
  id: 'b8', num: 8, group: 'Γενική εξίσωση φέρουσας ικανότητας', source: 'Άσκηση 8',
  title: 'Ελάχιστος FS ορθογωνικού θεμελίου: αστράγγιστη (TSA) και στραγγιζόμενη (ESA) ανάλυση',
  tags: ['TSA / ESA', 'Άργιλος', 'Υδροφόρος', 'Ορθογώνιο'],
  statement: p('Να υπολογιστεί ο ελάχιστος συντελεστής ασφαλείας έναντι φέρουσας ικανότητας στην κατακόρυφη διεύθυνση ορθογωνικού θεμελίου ' + m('4\\times 2\\unit{m}') + '. Ο υδροφόρος ορίζοντας βρίσκεται στη στάθμη θεμελίωσης και το έδαφος θεωρείται γενικά κορεσμένο.') +
    '<ul><li>Βάθος θεμελίωσης ' + m('D_f = 2\\unit{m}') + ', κατακόρυφο φορτίο ' + m('P = 3065\\unit{kN}') + '</li><li>Αστράγγιστη διατμητική αντοχή ' + m('c_u = 91\\unit{kPa}') + '</li><li>Γωνία τριβής υπό στραγγιζόμενες συνθήκες ' + m('φ\' = 30°') + ', ' + m('c\' = 0') + '</li><li>Κορεσμένο ειδικό βάρος ' + m('γ_{sat} = 20\\unit{kN/m³}') + '</li></ul>',
  givens: [
    { key: 'P', label: 'Κατακόρυφο φορτίο P', unit: 'kN', value: 3065, min: 1000, max: 6000, step: 5 },
    { key: 'B', label: 'Πλάτος B', unit: 'm', value: 2, min: 1, max: 4, step: 0.25 },
    { key: 'L', label: 'Μήκος L', unit: 'm', value: 4, min: 2, max: 8, step: 0.25 },
    { key: 'Df', label: 'Βάθος θεμελίωσης Df', unit: 'm', value: 2, min: 0.5, max: 4, step: 0.25 },
    { key: 'cu', label: 'Αστράγγιστη αντοχή cu', unit: 'kPa', value: 91, min: 30, max: 200, step: 1 },
    { key: 'phi', label: 'Γωνία τριβής φ′', unit: '°', value: 30, min: 20, max: 38, step: 1, dec: 0 },
    { key: 'gsat', label: 'Κορεσμένο ειδικό βάρος γsat', unit: 'kN/m³', value: 20, min: 17, max: 22, step: 0.5, dec: 1 }
  ],
  compute: function (q) {
    var B = Math.min(q.B, q.L), L = Math.max(q.B, q.L), BL = B / L, p0 = q.gsat * q.Df, qapp = q.P / (B * L), qappnet = qapp - p0, gsub = q.gsat - 10;
    // TSA
    var t = { Nc: 5.14, Nq: 1, Ng: 0, Sc: 1 + 0.2 * BL, Sq: 1, Sg: 1 - 0.4 * BL };
    t.q1 = q.cu * t.Nc * t.Sc; t.q2 = p0 * t.Nq * t.Sq; t.qult = t.q1 + t.q2; t.net = t.qult - p0; t.FS = t.net / qappnet;
    // ESA
    var e = { Nc: GEO.Nc(q.phi), Nq: GEO.Nq(q.phi), Ng: GEO.Ng(q.phi) };
    e.Sc = 1 + e.Nq / e.Nc * BL; e.Sq = 1 + BL * tand(q.phi); e.Sg = 1 - 0.4 * BL;
    e.q1 = p0 * e.Nq * e.Sq; e.q2 = 0.5 * gsub * B * e.Ng * e.Sg; e.qult = e.q1 + e.q2; e.net = e.qult - p0; e.FS = e.net / qappnet;
    return { B: B, L: L, BL: BL, p0: p0, qapp: qapp, qappnet: qappnet, gsub: gsub, t: t, e: e, FSmin: Math.min(t.FS, e.FS), governs: t.FS <= e.FS ? 'TSA' : 'ESA' };
  },
  figure: function (q, r, step) {
    var sec = footingSection({ B: r.B, Df: q.Df, Vlabel: 'P = ' + fmt(q.P, 0) + ' kN', wt: true, step: step, wedgeStep: 1, phi: step >= 2 ? q.phi : 0, lowerType: 'clay', labelsAbove: ['γκ = ' + fmt(q.gsat, 0) + ' kN/m³'], labelsBelow: ['cu = ' + fmt(q.cu, 0) + ' kPa (TSA)', 'φ′ = ' + fmt(q.phi, 0) + '°, c′ = 0 (ESA)', 'γ′ = ' + fmt(r.gsub, 0) + ' kN/m³'] });
    // comparison bars
    var W = 300, Hc = 260, h = SVG.open(W, Hc, 'aria-label="Σύγκριση συντελεστών ασφαλείας TSA και ESA"');
    var maxFS = Math.max(r.t.FS, r.e.FS, 3.5), Y = function (v) { return 220 - v / maxFS * 170; };
    h += SVG.line(40, 220, 280, 220, 'axis') + SVG.line(40, 40, 40, 220, 'axis');
    [1, 2, 3].forEach(function (v) { if (v <= maxFS) h += SVG.line(40, Y(v), 280, Y(v), 'grid') + SVG.text(34, Y(v) + 4, 'FS=' + v, 'lbl-muted', 'text-anchor="end"'); });
    var bars = [{ n: 'TSA', v: r.t.FS, x: 80, on: step >= 1 }, { n: 'ESA', v: r.e.FS, x: 180, on: step >= 3 }];
    bars.forEach(function (b) {
      if (!b.on) return;
      var gov = b.v === r.FSmin;
      h += '<g data-k="' + b.n + '" class="a-down">' + SVG.rect(b.x, Y(b.v), 60, 220 - Y(b.v), gov ? 'warnf' : 'ok') + '</g>';
      h += SVG.label(b.x + 30, Y(b.v) - 6, 'FS = ' + fmt(b.v, 2), 'math') + SVG.text(b.x + 30, 240, b.n, '', 'text-anchor="middle" font-weight="600"');
    });
    h += SVG.text(150, 20, 'Συντελεστές ασφαλείας', 'lbl-muted', 'text-anchor="middle"');
    h += SVG.close();
    return side2(sec, h);
  },
  figcap: 'Η ίδια άργιλος αναλύεται δύο φορές: αμέσως μετά τη φόρτιση (αστράγγιστα, cu, φ = 0) και μακροπρόθεσμα (στραγγιζόμενα, c′ = 0, φ′). Κρίσιμη είναι η μικρότερη τιμή FS.',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('q_{app,net}') + '</dt><dd>' + fmt(r.qappnet, 0) + ' kPa</dd><dt>' + m('q_{ult}') + ' TSA</dt><dd>' + fmt(r.t.qult, 0) + ' kPa</dd><dt>FS (TSA)</dt><dd>' + fmt(r.t.FS, 2) + '</dd><dt>' + m('q_{ult}') + ' ESA</dt><dd>' + fmt(r.e.qult, 0) + ' kPa</dd><dt>FS (ESA)</dt><dd>' + fmt(r.e.FS, 2) + '</dd><dt>FS<sub>min</sub></dt><dd><b>' + fmt(r.FSmin, 2) + ' (' + r.governs + ')</b></dd></dl>'; },
  steps: [
    {
      title: 'Επιβαλλόμενη καθαρή τάση', hl: ['V', 'Df'],
      body: function (q, r) { return eqs([['q_{app} = \\frac{P}{B\\,L} = \\frac{' + fmt(q.P, 0) + '}{' + fmt(r.B, 1) + '\\times' + fmt(r.L, 1) + '} = ' + fmt(r.qapp, 1) + '\\unit{kPa}'], ['q_{app,net} = q_{app} - γ_κ\\,D_f = ' + fmt(r.qapp, 1) + ' - ' + fmt(r.p0, 0) + ' = \\hl{' + fmt(r.qappnet, 1) + '\\unit{kPa}}']]); }
    },
    {
      title: 'TSA – ανάλυση ολικών τάσεων (αστράγγιστες συνθήκες)', hl: ['wedge', 'TSA'],
      cap: 'φ = 0: μόνο ο όρος συνοχής (cu·Nc·Sc) και το υπερκείμενο. Nγ = 0, Nq = 1.',
      body: function (q, r) {
        var t = r.t;
        return eqs([
          ['c_u = ' + fmt(q.cu, 0) + '\\unit{kPa},\\; φ = 0 \\;\\Rightarrow\\; N_c = 5.14,\\; N_q = 1,\\; N_γ = 0'],
          ['S_c = 1 + 0.2\\,\\frac{B}{L} = ' + fmt(t.Sc, 2) + ',\\quad S_q = 1,\\quad S_γ = 1 - 0.4\\,\\frac{B}{L} = ' + fmt(t.Sg, 2)],
          ['q_{ult} = c_u N_c S_c + γ_κ D_f N_q S_q + 0 = ' + fmt(q.cu, 0) + '\\times 5.14\\times' + fmt(t.Sc, 2) + ' + ' + fmt(r.p0, 0) + ' = \\hl{' + fmt(t.qult, 0) + '\\unit{kPa}}'],
          ['q_{ult,net} = ' + fmt(t.qult, 0) + ' - ' + fmt(r.p0, 0) + ' = ' + fmt(t.net, 0) + '\\unit{kPa} \\;\\Rightarrow\\; FS_{TSA} = \\frac{' + fmt(t.net, 0) + '}{' + fmt(r.qappnet, 0) + '} = \\hl{' + fmt(t.FS, 2) + '}']
        ]) + note('Στις αστράγγιστες συνθήκες χρησιμοποιούνται ολικές τάσεις: το υπερκείμενο είναι γκ·Df (όχι γ′), γιατί η πίεση πόρων δεν αφαιρείται.');
      }
    },
    {
      title: 'ESA – συντελεστές (στραγγιζόμενες συνθήκες)', hl: ['wedge', 'WT'],
      body: function (q, r) {
        var e = r.e;
        return eqs([
          ['c\' = 0,\\; φ\' = ' + fmt(q.phi, 0) + '° \\;\\Rightarrow\\; N_c = ' + fmt(e.Nc, 1) + ',\\; N_q = \\hl{' + fmt(e.Nq, 1) + '},\\; N_γ = \\hl{' + fmt(e.Ng, 1) + '}'],
          ['S_c = 1 + \\frac{N_q}{N_c}\\frac{B}{L} = ' + fmt(e.Sc, 2) + ',\\quad S_q = 1 + \\frac{B}{L}\\tan φ\' = \\hl{' + fmt(e.Sq, 2) + '},\\quad S_γ = 1 - 0.4\\frac{B}{L} = \\hl{' + fmt(e.Sg, 2) + '}']
        ]) + TABLES.bc(q.phi);
      }
    },
    {
      title: 'ESA – φέρουσα ικανότητα και FS', hl: ['ESA', 'wedge'],
      body: function (q, r) {
        var e = r.e;
        return eqs([
          ['q_{ult} = γ_κ D_f N_q S_q + \\frac{1}{2}γ\'\\,B\\,N_γ S_γ = ' + fmt(r.p0, 0) + '\\times' + fmt(e.Nq, 1) + '\\times' + fmt(e.Sq, 2) + ' + 0.5\\times' + fmt(r.gsub, 0) + '\\times' + fmt(r.B, 1) + '\\times' + fmt(e.Ng, 1) + '\\times' + fmt(e.Sg, 2)],
          ['= ' + fmt(e.q1, 0) + ' + ' + fmt(e.q2, 0) + ' = \\hl{' + fmt(e.qult, 0) + '\\unit{kPa}},\\quad q_{ult,net} = ' + fmt(e.net, 0) + '\\unit{kPa}'],
          ['FS_{ESA} = \\frac{' + fmt(e.net, 0) + '}{' + fmt(r.qappnet, 0) + '} = \\hl{' + fmt(e.FS, 2) + '}']
        ]);
      }
    },
    {
      title: 'Σύγκριση: κρίσιμη ανάλυση', hl: ['TSA', 'ESA'],
      body: function (q, r) {
        return table(['Ανάλυση', 'Παράμετροι αντοχής', m('q_{ult}') + ' (kPa)', m('q_{ult,net}') + ' (kPa)', 'FS'], [
          ['TSA (βραχυπρόθεσμα)', 'cu = ' + fmt(q.cu, 0) + ' kPa, φ = 0', fmt(r.t.qult, 0), fmt(r.t.net, 0), fmt(r.t.FS, 2)],
          ['ESA (μακροπρόθεσμα)', 'c′ = 0, φ′ = ' + fmt(q.phi, 0) + '°', fmt(r.e.qult, 0), fmt(r.e.net, 0), fmt(r.e.FS, 2)]
        ], r.governs === 'TSA' ? 0 : 1) + eq('FS_{min} = \\hl{' + fmt(r.FSmin, 2) + '}\\quad(' + r.governs + ')');
      }
    }
  ],
  result: function (q, r) { return '<div class="big">' + m('FS_{min} = ' + fmt(r.FSmin, 1) + '\\;(' + r.governs + ')') + '</div><p>' + (r.governs === 'TSA' ? 'Κρίσιμη είναι η αστράγγιστη (βραχυπρόθεσμη) κατάσταση αμέσως μετά τη φόρτιση. Με τη στερεοποίηση η αντοχή αυξάνει και ο FS μακροπρόθεσμα φτάνει ' + fmt(r.e.FS, 1) + '.' : 'Κρίσιμη είναι η στραγγιζόμενη (μακροπρόθεσμη) κατάσταση.') + '</p>'; }
});

/* ===================== ΤΥΠΟΛΟΓΙΟ ===================== */
var SHEET = [
  { title: 'Ωθήσεις γαιών (Rankine, λείος τοίχος, οριζόντια επιφάνεια)', html: eqs(['K_a = \\tan^2\\left(45° - \\frac{φ}{2}\\right),\\quad K_p = \\tan^2\\left(45° + \\frac{φ}{2}\\right)', 'σ_a = K_a\\,σ_v - 2c\\sqrt{K_a},\\quad σ_p = K_p\\,σ_v + 2c\\sqrt{K_p}', 'P_a = \\frac{1}{2}K_a γ H^2\\;\\text{(στο H/3 από τη βάση)}', 'P_q = K_a\\,q\\,H\\;\\text{(επιφόρτιση q, στο H/2)}', 'P_p = \\frac{σ_{pA}+σ_{pB}}{2}\\,h\\;\\text{(τραπεζοειδής κατανομή)}']) + '<p class="who">Σε λείο τοίχο η ώθηση λαμβάνεται στο κατακόρυφο επίπεδο στο άκρο του πέλματος και το έδαφος πάνω από το πέλμα λογίζεται ως βάρος.</p>' },
  { title: 'Ευστάθεια τοίχων: εκκεντρότητα, ανατροπή, ολίσθηση', html: eqs(['x̄ = \\frac{\\sum M_A}{\\sum V},\\quad e = x̄ - \\frac{B}{2},\\quad B\' = B - 2|e|', 'e = 0 \\;\\Leftrightarrow\\; \\frac{\\sum M_A}{\\sum V} = \\frac{B}{2}\\;\\Leftrightarrow\\;\\sum M_O = 0', 'FS_{ανατρ} = \\frac{\\sum M_{ευστ}}{\\sum M_{ανατρ}}\\;\\text{(ως προς το άκρο Α)}', 'FS_{ολ} = \\frac{c_u B\' + \\sum V\\tan δ + P_p}{\\sum H}', 'q_{max,min} = \\frac{V}{B\\,L}\\left(1 \\pm \\frac{6e}{B}\\right),\\quad e \\le \\frac{B}{6}\\;\\text{(χωρίς αδρανή περιοχή)}']) },
  { title: 'DIN 4017 – γενική εξίσωση', html: eqs(['q_{ult} = c\\,N_c\\,K_c\\,V_c + γ_2\\,B\'\\,N_b\\,K_b\\,V_b + γ_1\\,d\\,N_d\\,K_d\\,V_d']) + '<p>' + m('N_c, N_d, N_b') + ' συντελεστές φέρουσας ικανότητας (Πίνακας 1) · ' + m('V') + ' συντελεστές μορφής (Πίνακας 2) · ' + m('K') + ' μειωτικοί συντελεστές λοξής φόρτισης (Πίνακας 3) · ' + m('γ_1') + ' ειδικό βάρος πάνω από τη στάθμη έδρασης, ' + m('γ_2') + ' κάτω από αυτήν (βυθισμένο αν υπάρχει Υ.Ο.).</p>' + eqs(['e = \\frac{M}{V},\\quad B\' = B - 2e_B,\\quad L\' = L - 2e_L,\\quad A\' = B\'L\'', 'N_d = e^{π\\tan φ}\\tan^2(45°+φ/2),\\quad N_c = \\frac{N_d - 1}{\\tan φ},\\quad N_b = (N_d - 1)\\tan φ']) },
  { title: 'Συντελεστής ασφαλείας (καθαρές τάσεις)', html: eqs(['FS = \\frac{q_{ult,net}}{q_{app,net}} = \\frac{q_{ult} - γ_1 d}{\\frac{V}{A\'} - γ_1 d}']) + '<p>Η υπερκείμενη γεωστατική τάση ' + m('γ_1 d') + ' υπήρχε πριν την κατασκευή: αφαιρείται και από τις δύο τάσεις. Σε επαναληπτικές λύσεις (Kc με FS·H) ο υποτιθέμενος FS πρέπει να συμπέσει με τον υπολογιζόμενο.</p>' },
  { title: 'Γενική εξίσωση (Terzaghi–Meyerhof–Hansen)', html: eqs(['q_{ult} = c\\,N_c\\,S_c + σ\'_{z,D}\\,N_q\\,S_q + \\frac{1}{2}\\,γ\'\\,B\\,N_γ\\,S_γ', 'N_q = e^{π\\tan φ}\\tan^2\\left(45°+\\frac{φ}{2}\\right),\\quad N_c = (N_q - 1)\\cot φ\\;(= 5.14\\;\\text{για}\\;φ=0),\\quad N_γ = 1.5\\,(N_q - 1)\\tan φ\\;\\text{(Hansen)}', 'S_c = 1 + \\frac{N_q}{N_c}\\frac{B}{L}\\;\\left(= 1 + 0.2\\frac{B}{L}\\;\\text{για}\\;φ=0\\right),\\quad S_q = 1 + \\frac{B}{L}\\tan φ,\\quad S_γ = 1 - 0.4\\frac{B}{L}']) + '<p class="who">' + m('σ_{z,D}') + ': κατακόρυφη τάση στη στάθμη θεμελίωσης (ολική στην TSA, ενεργός στην ESA).</p>' },
  { title: 'Υδροφόρος ορίζοντας και TSA / ESA', html: eqs(['γ\' = γ_{sat} - γ_w,\\quad γ_w = 10\\unit{kN/m³}']) + '<p><b>Υ.Ο. στη στάθμη θεμελίωσης:</b> υπερκείμενο με ολικό γ (πάνω από τον Υ.Ο.), όρος πλάτους με γ′.</p><p><b>TSA</b> (ολικές τάσεις, βραχυπρόθεσμα): ' + m('c = c_u,\\; φ = 0 \\Rightarrow N_c = 5.14, N_q = 1, N_γ = 0') + ', υπερκείμενο ' + m('γ_{sat} D_f') + '.</p><p><b>ESA</b> (ενεργές τάσεις, μακροπρόθεσμα): ' + m('c\', φ\'') + ', ενεργές γεωστατικές τάσεις. Κρίσιμος ο μικρότερος FS, σε κορεσμένες αργίλους συνήθως η TSA.</p>' },
  { title: 'Πίνακας 1 · Συντελεστές φέρουσας ικανότητας κατά DIN 4017', html: TABLES.din1(), wide: false },
  { title: 'Πίνακας 2 · Συντελεστές μορφής κατά DIN 4017', html: TABLES.din2() },
  { title: 'Πίνακας 3 · Μειωτικοί συντελεστές λοξής φόρτισης (DIN 4017)', html: TABLES.din3() + '<p class="who">H, V: οριζόντια και κατακόρυφη συνιστώσα του φορτίου σχεδιασμού (H<sub>b</sub> = FS·H, V<sub>b</sub> = FS·V). Για c = 0 οι συντελεστές ασφαλείας απλοποιούνται.</p>' },
  { title: 'Συντελεστές Nc, Nq, Nγ (Hansen) για τη γενική εξίσωση', html: TABLES.bc() }
];

APP.init({ appName: 'Διαδραστικές Ασκήσεις · Φέρουσα Ικανότητα', version: 'v1.0', desc: 'Υποδειγματικές ασκήσεις φέρουσας ικανότητας επιφανειακών θεμελιώσεων και τοίχων αντιστήριξης', uni: 'Πανεπιστήμιο Πατρών · Τμήμα Πολιτικών Μηχανικών', title: 'Φέρουσα Ικανότητα', subtitle: 'Θεμελιώσεις · Υποδειγματικές ασκήσεις', kicker: 'Φέρουσα ικανότητα', footer: 'Βασισμένο στις Υποδειγματικές Ασκήσεις Φέρουσας Ικανότητας (Π. Πελέκης, 2024).', exercises: EX, sheet: SHEET });
