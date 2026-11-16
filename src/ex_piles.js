/* Πάσσαλοι – παραδείγματα εφαρμογής (δικά μας, ενδεικτικά δεδομένα) βάσει ύλης μαθήματος Θεμελιώσεις 17.1.0 */
'use strict';
var EX = [];
var GW = 10; // γw kN/m³

/* ---------- local helpers ---------- */
var NQS_PHI = [30, 33, 35, 38, 40], NQS_VAL = [25, 42, 60, 95, 130];
function NqStar(phi) { return interp(NQS_PHI, NQS_VAL, phi); }
function alphaAPI(cu) { if (cu <= 25) return 1; if (cu >= 70) return 0.5; return 1 - 0.5 * (cu - 25) / 45; }
var ILLU = p('<i style="color:var(--muted)">Τα δεδομένα είναι ενδεικτικά (παράδειγμα εφαρμογής, όχι από τις σημειώσεις).</i>');

/* Elevation of a pile in a layered profile.
   o = { L, D, layers:[{top,bot,type,label}], wt (depth, m) or null, Q (label on top), shaft:[{top,bot,k,label,side}], base:{k,label}, extra:string, W,H } */
function pileProfile(o) {
  var W = o.W || 660, H = o.H || 470, y0 = 70, s = Math.min(24, 360 / (o.L + 2.5)), xc = 300, pw = Math.max(o.D * s, 18);
  var Y = function (z) { return y0 + z * s; };
  var depthMax = o.L + 2.5;
  var h = SVG.open(W, H, 'aria-label="' + (o.aria || 'Πάσσαλος σε εδαφική τομή') + '"');
  o.layers.forEach(function (ly) { var bot = Math.min(ly.bot, depthMax); h += SVG.soil(60, Y(ly.top), 540, Y(bot) - Y(ly.top), ly.type); if (ly.bot < depthMax) h += SVG.line(60, Y(ly.bot), 600, Y(ly.bot), 'thin dash'); h += SVG.label(590, Y(ly.top) + 16, ly.label, 'lbl-muted', 'end'); if (ly.sub) h += SVG.label(590, Y(ly.top) + 30, ly.sub, 'lbl-muted', 'end'); });
  h += SVG.ground(60, 600, y0, 'right');
  if (o.wt !== null && o.wt !== undefined) { h += SVG.wt(110, Y(o.wt)); h += SVG.line(60, Y(o.wt), 600, Y(o.wt), 'thin dash', 'stroke="var(--water)"'); h += SVG.label(126, Y(o.wt) + 4, 'ΥΟ ' + fmt(o.wt, 1) + ' m', 'lbl-muted', 'start'); }
  // pile
  h += SVG.rect(xc - pw / 2, y0 - 14, pw, Y(o.L) - y0 + 14, 'pile');
  // load
  h += '<g data-k="Q">' + SVG.arrow(xc, 8, xc, y0 - 16, 'load', '', 4) + SVG.label(xc + 12, 24, o.Q || 'Q', 'lbl-load math', 'start') + '</g>';
  // shaft friction arrows (upward, on both sides)
  (o.shaft || []).forEach(function (sg) {
    var g = '<g data-k="' + sg.k + '">';
    var n = Math.max(2, Math.round((sg.bot - sg.top) * s / 26));
    for (var i = 0; i < n; i++) { var z = sg.top + (sg.bot - sg.top) * (i + 0.5) / n; var y = Y(z); g += SVG.arrow(xc - pw / 2 - 4, y + 9, xc - pw / 2 - 4, y - 9, 'weight', '', 2) + SVG.arrow(xc + pw / 2 + 4, y + 9, xc + pw / 2 + 4, y - 9, 'weight', '', 2); }
    g += SVG.label(xc + pw / 2 + 16, Y((sg.top + sg.bot) / 2) + 4, sg.label, 'math', 'start');
    h += g + '</g>';
  });
  if (o.base) { var yb = Y(o.L); h += '<g data-k="' + o.base.k + '">' + SVG.arrow(xc - pw / 3, yb + 26, xc - pw / 3, yb + 4, 'load', '', 2.5) + SVG.arrow(xc, yb + 30, xc, yb + 4, 'load', '', 2.5) + SVG.arrow(xc + pw / 3, yb + 26, xc + pw / 3, yb + 4, 'load', '', 2.5) + SVG.label(xc + pw / 2 + 16, yb + 22, o.base.label, 'lbl-load math', 'start') + '</g>'; }
  // dims
  h += SVG.dim(xc - pw / 2 - 70, y0, xc - pw / 2 - 70, Y(o.L), 'L = ' + fmt(o.L, 1) + ' m', -8);
  h += SVG.dim(xc - pw / 2, Y(o.L) + 44, xc + pw / 2, Y(o.L) + 44, 'D = ' + fmt(o.D, 2) + ' m', 14);
  (o.dims || []).forEach(function (d) { h += SVG.dim(xc + pw / 2 + 110, Y(d[0]), xc + pw / 2 + 110, Y(d[1]), d[2], 8); });
  h += o.extra || '';
  return h + SVG.close();
}

/* ===================== Π1: α-μέθοδος, άργιλος ===================== */
EX.push({
  id: 'p1', num: 1, group: 'Μεμονωμένος πάσσαλος – κατακόρυφη φόρτιση', source: 'Παράδειγμα 1',
  title: 'Φρεατοπάσσαλος σε ομοιογενή άργιλο (μέθοδος α)',
  tags: ['Άργιλος', 'Αστράγγιστες συνθήκες', 'Μέθοδος α'],
  statement: p('Φρεατοπάσσαλος διαμέτρου ' + m('D = 0.8\\unit{m}') + ' και μήκους ' + m('L = 15\\unit{m}') + ' κατασκευάζεται σε ομοιογενή κορεσμένη άργιλο με αστράγγιστη διατμητική αντοχή ' + m('c_u = 60\\unit{kPa}') + '. Να υπολογιστεί η οριακή φέρουσα ικανότητα του πασσάλου σε θλίψη και το επιτρεπόμενο φορτίο για συντελεστή ασφαλείας ' + m('FS = 2.5') + '.') +
    '<ul><li>Συντελεστής συνάφειας φρεατοπασσάλου ' + m('α = 0.5') + ' (ανοιχτή διάτρηση, χαλάρωση εδάφους)</li><li>Συντελεστής αιχμής ' + m('N_c = 9') + ' (βαθιά θεμελίωση, ' + m('L/D > 4') + ')</li><li>Το ίδιο βάρος του πασσάλου θεωρείται ότι αντισταθμίζεται από το βάρος του εδάφους που αφαιρέθηκε.</li></ul>' + ILLU,
  givens: [
    { key: 'D', label: 'Διάμετρος D', unit: 'm', value: 0.8, min: 0.4, max: 1.5, step: 0.05 },
    { key: 'L', label: 'Μήκος L', unit: 'm', value: 15, min: 6, max: 30, step: 0.5, dec: 1 },
    { key: 'cu', label: 'Αστράγγιστη αντοχή cu', unit: 'kPa', value: 60, min: 20, max: 150, step: 5 },
    { key: 'al', label: 'Συντελεστής συνάφειας α', unit: '', value: 0.5, min: 0.3, max: 1, step: 0.05 },
    { key: 'FS', label: 'Συντελεστής ασφαλείας FS', unit: '', value: 2.5, min: 2, max: 3, step: 0.1, dec: 1 }
  ],
  compute: function (q) {
    var Ap = Math.PI * q.D * q.D / 4, per = Math.PI * q.D, As = per * q.L;
    var fs = q.al * q.cu, Qs = fs * As, qp = 9 * q.cu, Qp = qp * Ap, Qu = Qs + Qp;
    return { Ap: Ap, per: per, As: As, fs: fs, Qs: Qs, qp: qp, Qp: Qp, Qu: Qu, Qall: Qu / q.FS, Qall2: Qs / 1.5 + Qp / 3, ratio: Qs / Qu * 100 };
  },
  figure: function (q, r, step) {
    return pileProfile({ L: q.L, D: q.D, layers: [{ top: 0, bot: 99, type: 'clay', label: 'Άργιλος', sub: 'cu = ' + fmt(q.cu, 0) + ' kPa' }], wt: 0, Q: tsub('Q', 'u'),
      shaft: [{ top: 0.3, bot: q.L - 0.3, k: 'Qs', label: tsub('f', 's') + ' = α·c' + '<tspan dy="4" font-size="10">u</tspan><tspan dy="-4"> = ' + fmt(r.fs, 0) + ' kPa</tspan>' }], base: { k: 'Qp', label: tsub('q', 'p') + ' = 9c' + '<tspan dy="4" font-size="10">u</tspan><tspan dy="-4"> = ' + fmt(r.qp, 0) + ' kPa</tspan>' },
      aria: 'Φρεατοπάσσαλος σε άργιλο με πλευρικές τριβές κατά μήκος του κορμού και αντίσταση αιχμής' });
  },
  figcap: 'Η αντίσταση του πασσάλου προκύπτει από την πλευρική τριβή (μπλε βέλη κατά μήκος του κορμού) και την αντίσταση αιχμής (κόκκινα βέλη στη βάση).',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('A_p') + '</dt><dd>' + fmt(r.Ap, 3) + ' m²</dd><dt>' + m('A_s') + '</dt><dd>' + fmt(r.As, 1) + ' m²</dd><dt>' + m('Q_s') + '</dt><dd>' + fmt(r.Qs, 0) + ' kN</dd><dt>' + m('Q_p') + '</dt><dd>' + fmt(r.Qp, 0) + ' kN</dd><dt>' + m('Q_u') + '</dt><dd><b>' + fmt(r.Qu, 0) + ' kN</b></dd><dt>' + m('Q_{all}') + '</dt><dd><b>' + fmt(r.Qall, 0) + ' kN</b></dd></dl>'; },
  steps: [
    { title: 'Γεωμετρία πασσάλου', hl: ['Q'], body: function (q, r) { return eqs([['A_p = \\frac{π D^2}{4} = \\frac{π\\times' + fmt(q.D, 2) + '^2}{4} = \\hl{' + fmt(r.Ap, 3) + '\\unit{m²}}', 'εμβαδόν αιχμής'], ['A_s = π D L = π\\times' + fmt(q.D, 2) + '\\times' + fmt(q.L, 1) + ' = \\hl{' + fmt(r.As, 2) + '\\unit{m²}}', 'παράπλευρη επιφάνεια']]); } },
    { title: 'Πλευρική τριβή (μέθοδος α)', hl: ['Qs'], cap: 'Η μοναδιαία τριβή f_s = α·c_u είναι σταθερή σε όλο το μήκος, αφού η άργιλος είναι ομοιογενής.', body: function (q, r) { return eqs([['f_s = α\\,c_u = ' + fmt(q.al, 2) + '\\times' + fmt(q.cu, 0) + ' = \\hl{' + fmt(r.fs, 1) + '\\unit{kPa}}'], ['Q_s = f_s\\,A_s = ' + fmt(r.fs, 1) + '\\times' + fmt(r.As, 2) + ' = \\hl{' + fmt(r.Qs, 0) + '\\unit{kN}}']]) + note('Για φρεατοπασσάλους σε άργιλο συνήθως ' + m('α ≈ 0.45 - 0.5') + ' (Skempton). Για εμπηγνυόμενους η σχέση API δίνει ' + m('α = ' + fmt(alphaAPI(q.cu), 2)) + ' για ' + m('c_u = ' + fmt(q.cu, 0) + '\\unit{kPa}') + ' (βλ. τυπολόγιο).'); } },
    { title: 'Αντίσταση αιχμής', hl: ['Qp'], body: function (q, r) { return eqs([['q_p = N_c\\,c_u = 9\\times' + fmt(q.cu, 0) + ' = \\hl{' + fmt(r.qp, 0) + '\\unit{kPa}}', 'φ = 0, όρος επιφόρτισης γ·L παραλείπεται (αντισταθμίζεται από το βάρος πασσάλου)'], ['Q_p = q_p\\,A_p = ' + fmt(r.qp, 0) + '\\times' + fmt(r.Ap, 3) + ' = \\hl{' + fmt(r.Qp, 0) + '\\unit{kN}}']]); } },
    { title: 'Οριακή φέρουσα ικανότητα', hl: ['Qs', 'Qp', 'Q'], body: function (q, r) { return eq('Q_u = Q_s + Q_p = ' + fmt(r.Qs, 0) + ' + ' + fmt(r.Qp, 0) + ' = \\hl{' + fmt(r.Qu, 0) + '\\unit{kN}}') + p('Η πλευρική τριβή αποτελεί το ' + fmt(r.ratio, 0) + '% της αντοχής: ο πάσσαλος σε άργιλο λειτουργεί κυρίως ως <b>πάσσαλος τριβής</b>.'); } },
    { title: 'Επιτρεπόμενο φορτίο', hl: ['Q'], body: function (q, r) { return eqs([['Q_{all} = \\frac{Q_u}{FS} = \\frac{' + fmt(r.Qu, 0) + '}{' + fmt(q.FS, 1) + '} = \\hl{' + fmt(r.Qall, 0) + '\\unit{kN}}', 'ενιαίος συντελεστής']]) + note('Εναλλακτικά με επιμέρους συντελεστές (η τριβή κινητοποιείται σε μικρή μετακίνηση, η αιχμή σε μεγάλη): ' + m('Q_{all} = \\frac{Q_s}{1.5} + \\frac{Q_p}{3} = ' + fmt(r.Qall2, 0) + '\\unit{kN}') + '.'); } }
  ],
  result: function (q, r) { return '<div class="big">' + m('Q_u = ' + fmt(r.Qu, 0) + '\\unit{kN},\\quad Q_{all} = ' + fmt(r.Qall, 0) + '\\unit{kN}') + '</div>'; }
});

/* ===================== Π2: β-μέθοδος, άμμος ===================== */
EX.push({
  id: 'p2', num: 2, group: 'Μεμονωμένος πάσσαλος – κατακόρυφη φόρτιση', source: 'Παράδειγμα 2',
  title: 'Εμπηγνυόμενος πάσσαλος σε άμμο (μέθοδος β)',
  tags: ['Άμμος', 'Στραγγιζόμενες συνθήκες', 'Μέθοδος β', 'Nq*'],
  statement: p('Εμπηγνυόμενος πάσσαλος ΩΣ διαμέτρου ' + m('D = 0.5\\unit{m}') + ' και μήκους ' + m('L = 12\\unit{m}') + ' σε ομοιογενή άμμο με ' + m('φ = 33°') + ', ' + m('γ = 18\\unit{kN/m³}') + '. Ο υδροφόρος ορίζοντας βρίσκεται πολύ βαθιά. Να υπολογιστεί η οριακή φέρουσα ικανότητα και το επιτρεπόμενο φορτίο (' + m('FS = 2.5') + ').') +
    '<ul><li>Συντελεστής πλευρικών ωθήσεων ' + m('K = 1.0') + ' (εμπηγνυόμενος πάσσαλος εκτόπισης)</li><li>Γωνία τριβής εδάφους–πασσάλου ' + m('δ = 0.75\\,φ') + '</li><li>Συντελεστής αιχμής ' + m('N_q^*') + ' από ενδεικτικό πίνακα (τύπου Berezantzev, βλ. τυπολόγιο)</li></ul>' + ILLU,
  givens: [
    { key: 'D', label: 'Διάμετρος D', unit: 'm', value: 0.5, min: 0.3, max: 1.2, step: 0.05 },
    { key: 'L', label: 'Μήκος L', unit: 'm', value: 12, min: 5, max: 25, step: 0.5, dec: 1 },
    { key: 'phi', label: 'Γωνία τριβής φ', unit: '°', value: 33, min: 30, max: 40, step: 0.5, dec: 1 },
    { key: 'g', label: 'Ειδικό βάρος γ', unit: 'kN/m³', value: 18, min: 16, max: 21, step: 0.5, dec: 1 },
    { key: 'K', label: 'Συντελεστής K', unit: '', value: 1.0, min: 0.5, max: 2, step: 0.1, dec: 1 },
    { key: 'FS', label: 'Συντελεστής ασφαλείας FS', unit: '', value: 2.5, min: 2, max: 3, step: 0.1, dec: 1 }
  ],
  compute: function (q) {
    var Ap = Math.PI * q.D * q.D / 4, As = Math.PI * q.D * q.L, delta = 0.75 * q.phi, tdel = tand(delta);
    var svm = q.g * q.L / 2, fs = q.K * svm * tdel, Qs = fs * As;
    var svL = q.g * q.L, Nq = NqStar(q.phi), qp = svL * Nq, Qp = qp * Ap, Qu = Qs + Qp;
    var zc = 15 * q.D;
    return { Ap: Ap, As: As, delta: delta, tdel: tdel, svm: svm, fs: fs, Qs: Qs, svL: svL, Nq: Nq, qp: qp, Qp: Qp, Qu: Qu, Qall: Qu / q.FS, zc: zc, ratio: Qp / Qu * 100 };
  },
  figure: function (q, r, step) {
    // stress diagram on the left: σ'v triangle
    var s = Math.min(24, 360 / (q.L + 2.5)), y0 = 70;
    var w = Math.min(70, r.svL / 4);
    var extra = '<g data-k="sv">' + SVG.poly([[150, y0], [150 + w, y0 + q.L * s], [150, y0 + q.L * s]], 'fill-blue') + SVG.label(150, y0 + q.L * s + 16, 'σ′' + '<tspan dy="4" font-size="10">v</tspan><tspan dy="-4">(L) = ' + fmt(r.svL, 0) + ' kPa</tspan>', 'lbl-muted', 'start') + SVG.line(150, y0 + q.L * s / 2, 150 + w / 2, y0 + q.L * s / 2, 'guide') + SVG.label(150 + w / 2 + 4, y0 + q.L * s / 2 + 4, fmt(r.svm, 0) + ' kPa', 'lbl-muted', 'start') + '</g>';
    return pileProfile({ L: q.L, D: q.D, layers: [{ top: 0, bot: 99, type: 'sand', label: 'Άμμος', sub: 'φ = ' + fmt(q.phi, 1) + '°, γ = ' + fmt(q.g, 0) + ' kN/m³' }], wt: null, Q: tsub('Q', 'u'),
      shaft: [{ top: 0.3, bot: q.L - 0.3, k: 'Qs', label: tsub('f', 's') + ' = K·σ′' + '<tspan dy="4" font-size="10">v</tspan><tspan dy="-4">·tanδ</tspan>' }], base: { k: 'Qp', label: tsub('q', 'p') + ' = σ′' + '<tspan dy="4" font-size="10">v</tspan><tspan dy="-4">·N</tspan><tspan dy="4" font-size="10">q</tspan><tspan dy="-4">* = ' + fmt(r.qp, 0) + ' kPa</tspan>' },
      extra: extra, aria: 'Εμπηγνυόμενος πάσσαλος σε άμμο με τριγωνική κατανομή ενεργού κατακόρυφης τάσης' });
  },
  figcap: 'Η πλευρική τριβή σε άμμο αυξάνει με το βάθος (ανάλογη της σ′v). Αριστερά: το διάγραμμα της ενεργού κατακόρυφης τάσης.',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('δ') + '</dt><dd>' + fmt(r.delta, 2) + '°</dd><dt>' + m('N_q^*') + '</dt><dd>' + fmt(r.Nq, 0) + '</dd><dt>' + m('Q_s') + '</dt><dd>' + fmt(r.Qs, 0) + ' kN</dd><dt>' + m('Q_p') + '</dt><dd>' + fmt(r.Qp, 0) + ' kN</dd><dt>' + m('Q_u') + '</dt><dd><b>' + fmt(r.Qu, 0) + ' kN</b></dd><dt>' + m('Q_{all}') + '</dt><dd><b>' + fmt(r.Qall, 0) + ' kN</b></dd></dl>'; },
  steps: [
    { title: 'Ενεργός κατακόρυφη τάση', hl: ['sv'], body: function (q, r) { return eqs([['σ\'_{v}(z) = γ z', 'χωρίς υδροφόρο'], ['σ\'_{v,avg} = \\frac{γ L}{2} = \\frac{' + fmt(q.g, 0) + '\\times' + fmt(q.L, 1) + '}{2} = \\hl{' + fmt(r.svm, 0) + '\\unit{kPa}}', 'μέση τιμή στο μέσο του μήκους'], ['σ\'_{v}(L) = γ L = \\hl{' + fmt(r.svL, 0) + '\\unit{kPa}}', 'στη στάθμη της αιχμής']]); } },
    { title: 'Πλευρική τριβή (μέθοδος β)', hl: ['Qs', 'sv'], body: function (q, r) { return eqs([['δ = 0.75\\,φ = ' + fmt(r.delta, 2) + '°,\\quad β = K\\tan δ = ' + fmt(q.K, 1) + '\\times' + fmt(r.tdel, 3) + ' = ' + fmt(q.K * r.tdel, 3)], ['f_{s,avg} = β\\,σ\'_{v,avg} = ' + fmt(q.K * r.tdel, 3) + '\\times' + fmt(r.svm, 0) + ' = \\hl{' + fmt(r.fs, 1) + '\\unit{kPa}}'], ['Q_s = f_{s,avg}\\,π D L = ' + fmt(r.fs, 1) + '\\times π\\times' + fmt(q.D, 2) + '\\times' + fmt(q.L, 1) + ' = \\hl{' + fmt(r.Qs, 0) + '\\unit{kN}}']]) + note('Κρίσιμο βάθος: πειραματικά η ' + m('f_s') + ' παύει να αυξάνει κάτω από ' + m('z_c ≈ 15 - 20\\,D = ' + fmt(r.zc, 1) + ' - ' + fmt(20 * q.D, 1) + '\\unit{m}') + '. Εδώ, για απλότητα, η σ′v λαμβάνεται χωρίς περικοπή (συντηρητικότερο θα ήταν να περιοριστεί).'); } },
    { title: 'Αντίσταση αιχμής', hl: ['Qp'], body: function (q, r) { return eqs([['N_q^* = ' + fmt(r.Nq, 0), 'από ενδεικτικό πίνακα για φ = ' + fmt(q.phi, 1) + '° (παρεμβολή)'], ['q_p = σ\'_{v}(L)\\,N_q^* = ' + fmt(r.svL, 0) + '\\times' + fmt(r.Nq, 0) + ' = \\hl{' + fmt(r.qp, 0) + '\\unit{kPa}}'], ['Q_p = q_p A_p = ' + fmt(r.qp, 0) + '\\times' + fmt(r.Ap, 4) + ' = \\hl{' + fmt(r.Qp, 0) + '\\unit{kN}}']]); } },
    { title: 'Οριακή και επιτρεπόμενη αντοχή', hl: ['Qs', 'Qp', 'Q'], body: function (q, r) { return eqs([['Q_u = Q_s + Q_p = ' + fmt(r.Qs, 0) + ' + ' + fmt(r.Qp, 0) + ' = \\hl{' + fmt(r.Qu, 0) + '\\unit{kN}}'], ['Q_{all} = \\frac{Q_u}{FS} = \\frac{' + fmt(r.Qu, 0) + '}{' + fmt(q.FS, 1) + '} = \\hl{' + fmt(r.Qall, 0) + '\\unit{kN}}']]) + p('Η αιχμή συνεισφέρει το ' + fmt(r.ratio, 0) + '%: σε άμμο ο πάσσαλος λειτουργεί σε μεγάλο βαθμό ως <b>πάσσαλος αιχμής</b>, αντίθετα με την άργιλο του Παραδείγματος 1.'); } }
  ],
  result: function (q, r) { return '<div class="big">' + m('Q_u = ' + fmt(r.Qu, 0) + '\\unit{kN},\\quad Q_{all} = ' + fmt(r.Qall, 0) + '\\unit{kN}') + '</div>'; }
});

/* ===================== Π3: στρωματωμένο έδαφος ===================== */
EX.push({
  id: 'p3', num: 3, group: 'Μεμονωμένος πάσσαλος – κατακόρυφη φόρτιση', source: 'Παράδειγμα 3',
  title: 'Εμπηγνυόμενος πάσσαλος μέσω μαλακής αργίλου σε άμμο',
  tags: ['Στρωματωμένο έδαφος', 'Μέθοδος α + β', 'Υδροφόρος'],
  statement: p('Εμπηγνυόμενος πάσσαλος ' + m('D = 0.6\\unit{m}') + ', ' + m('L = 14\\unit{m}') + ' διαπερνά στρώμα μαλακής αργίλου (0–6 m: ' + m('c_u = 40\\unit{kPa}') + ', ' + m('γ = 17\\unit{kN/m³}') + ', ' + m('α = 0.9') + ') και εισχωρεί σε άμμο (6–14 m: ' + m('φ = 35°') + ', ' + m('γ = 19\\unit{kN/m³}') + ', ' + m('K = 1') + ', ' + m('δ = 0.75φ') + '). Ο υδροφόρος ορίζοντας βρίσκεται σε βάθος 2 m. Να υπολογιστεί η οριακή φέρουσα ικανότητα και το επιτρεπόμενο φορτίο (' + m('FS = 2.5') + '). Για την αιχμή ' + m('N_q^* = 60') + '.') + ILLU,
  givens: [
    { key: 'D', label: 'Διάμετρος D', unit: 'm', value: 0.6, min: 0.4, max: 1.2, step: 0.05 },
    { key: 'L', label: 'Μήκος L (> 6 m, στην άμμο)', unit: 'm', value: 14, min: 8, max: 22, step: 0.5, dec: 1 },
    { key: 'cu', label: 'cu αργίλου', unit: 'kPa', value: 40, min: 15, max: 80, step: 5 },
    { key: 'al', label: 'α αργίλου', unit: '', value: 0.9, min: 0.5, max: 1, step: 0.05 },
    { key: 'phi', label: 'φ άμμου', unit: '°', value: 35, min: 30, max: 40, step: 0.5, dec: 1 },
    { key: 'wt', label: 'Βάθος υδροφόρου', unit: 'm', value: 2, min: 0, max: 6, step: 0.5, dec: 1 },
    { key: 'FS', label: 'Συντελεστής ασφαλείας FS', unit: '', value: 2.5, min: 2, max: 3, step: 0.1, dec: 1 }
  ],
  compute: function (q) {
    var g1 = 17, g2 = 19, zc = 6, K = 1, Nq = NqStar(q.phi);
    var Ap = Math.PI * q.D * q.D / 4;
    function sv(z) { // effective vertical stress
      var s = 0;
      var zz = Math.min(z, zc); s += (zz <= q.wt) ? g1 * zz : g1 * q.wt + (g1 - GW) * (zz - q.wt);
      if (z > zc) { var zw = Math.max(q.wt, zc); s += (zw > zc ? g2 * (Math.min(z, zw) - zc) : 0) + (z > zw ? (g2 - GW) * (z - zw) : 0); }
      return s;
    }
    var Qs1 = q.al * q.cu * Math.PI * q.D * zc;
    var Ls = q.L - zc, zm = zc + Ls / 2, svm = sv(zm), delta = 0.75 * q.phi, fs2 = K * svm * tand(delta), Qs2 = fs2 * Math.PI * q.D * Ls;
    var svL = sv(q.L), qp = svL * Nq, Qp = qp * Ap, Qu = Qs1 + Qs2 + Qp;
    return { g1: g1, g2: g2, zc: zc, Nq: Nq, Ap: Ap, sv6: sv(zc), Qs1: Qs1, Ls: Ls, zm: zm, svm: svm, delta: delta, fs2: fs2, Qs2: Qs2, svL: svL, qp: qp, Qp: Qp, Qu: Qu, Qall: Qu / q.FS, fs1: q.al * q.cu, svwt: sv(q.wt) };
  },
  figure: function (q, r, step) {
    var s = Math.min(24, 360 / (q.L + 2.5)), y0 = 70, w = Math.min(70, r.svL / 3);
    var X = function (sv) { return 150 + sv / r.svL * w; }, Y = function (z) { return y0 + z * s; };
    var extra = '<g data-k="sv"><path d="M150,' + Y(0) + ' L' + X(r.svwt) + ',' + Y(q.wt) + ' L' + X(r.sv6) + ',' + Y(6) + ' L' + X(r.svL) + ',' + Y(q.L) + ' L150,' + Y(q.L) + ' Z" class="fill-blue"/>' +
      SVG.label(150, Y(q.L) + 16, 'σ′v(L) = ' + fmt(r.svL, 0) + ' kPa', 'lbl-muted', 'start') + SVG.label(X(r.svm) + 4, Y(r.zm) + 4, fmt(r.svm, 0) + ' kPa', 'lbl-muted', 'start') + SVG.circle(X(r.svm), Y(r.zm), 4, 'marker') + '</g>';
    return pileProfile({ L: q.L, D: q.D, layers: [{ top: 0, bot: 6, type: 'clay', label: 'Μαλακή άργιλος', sub: 'cu = ' + fmt(q.cu, 0) + ' kPa, γ = 17' }, { top: 6, bot: 99, type: 'sand', label: 'Άμμος', sub: 'φ = ' + fmt(q.phi, 1) + '°, γ = 19' }], wt: q.wt, Q: tsub('Q', 'u'),
      shaft: [{ top: 0.3, bot: 5.7, k: 'Qs1', label: tsub('Q', 's1') + ' (α)' }, { top: 6.3, bot: q.L - 0.3, k: 'Qs2', label: tsub('Q', 's2') + ' (β)' }], base: { k: 'Qp', label: tsub('Q', 'p') + ' = σ′v·N' + '<tspan dy="4" font-size="10">q</tspan><tspan dy="-4">*·A</tspan><tspan dy="4" font-size="10">p</tspan>' },
      extra: extra, aria: 'Πάσσαλος μέσω αργίλου σε άμμο, με διάγραμμα ενεργού τάσης και πλευρικές τριβές ανά στρώμα' });
  },
  figcap: 'Κάθε στρώμα συνεισφέρει με τη δική του μέθοδο: α στην άργιλο, β στην άμμο. Η αιχμή στηρίζεται στην άμμο. Αριστερά το διάγραμμα σ′v με αλλαγή κλίσης στον υδροφόρο.',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('Q_{s1}') + ' (άργιλος)</dt><dd>' + fmt(r.Qs1, 0) + ' kN</dd><dt>' + m('Q_{s2}') + ' (άμμος)</dt><dd>' + fmt(r.Qs2, 0) + ' kN</dd><dt>' + m('Q_p') + '</dt><dd>' + fmt(r.Qp, 0) + ' kN</dd><dt>' + m('Q_u') + '</dt><dd><b>' + fmt(r.Qu, 0) + ' kN</b></dd><dt>' + m('Q_{all}') + '</dt><dd><b>' + fmt(r.Qall, 0) + ' kN</b></dd></dl>'; },
  steps: [
    { title: 'Ενεργές κατακόρυφες τάσεις', hl: ['sv'], cap: 'Κάτω από τον υδροφόρο χρησιμοποιείται το υπό άνωση ειδικό βάρος γ′ = γ − γw.', body: function (q, r) { return eqs([['σ\'_{v}(' + fmt(q.wt, 1) + ') = 17\\times' + fmt(q.wt, 1) + ' = ' + fmt(r.svwt, 0) + '\\unit{kPa}', 'στάθμη υδροφόρου'], ['σ\'_{v}(6) = ' + fmt(r.svwt, 0) + ' + (17-10)\\times' + fmt(6 - q.wt, 1) + ' = \\hl{' + fmt(r.sv6, 0) + '\\unit{kPa}}', 'βάση αργίλου'], ['σ\'_{v}(' + fmt(r.zm, 1) + ') = ' + fmt(r.sv6, 0) + ' + (19-10)\\times' + fmt(r.zm - 6, 1) + ' = \\hl{' + fmt(r.svm, 0) + '\\unit{kPa}}', 'μέσο τμήματος στην άμμο'], ['σ\'_{v}(L) = ' + fmt(r.sv6, 0) + ' + 9\\times' + fmt(r.Ls, 1) + ' = \\hl{' + fmt(r.svL, 0) + '\\unit{kPa}}', 'στάθμη αιχμής']]); } },
    { title: 'Τριβή στην άργιλο (μέθοδος α)', hl: ['Qs1'], body: function (q, r) { return eqs([['f_{s1} = α\\,c_u = ' + fmt(q.al, 2) + '\\times' + fmt(q.cu, 0) + ' = ' + fmt(r.fs1, 0) + '\\unit{kPa}'], ['Q_{s1} = f_{s1}\\,π D\\,L_1 = ' + fmt(r.fs1, 0) + '\\times π\\times' + fmt(q.D, 2) + '\\times 6 = \\hl{' + fmt(r.Qs1, 0) + '\\unit{kN}}']]); } },
    { title: 'Τριβή στην άμμο (μέθοδος β)', hl: ['Qs2', 'sv'], body: function (q, r) { return eqs([['δ = 0.75φ = ' + fmt(r.delta, 2) + '°,\\quad f_{s2} = K\\,σ\'_{v,m}\\tan δ = 1\\times' + fmt(r.svm, 0) + '\\times' + fmt(tand(r.delta), 3) + ' = \\hl{' + fmt(r.fs2, 1) + '\\unit{kPa}}'], ['Q_{s2} = f_{s2}\\,π D\\,L_2 = ' + fmt(r.fs2, 1) + '\\times π\\times' + fmt(q.D, 2) + '\\times' + fmt(r.Ls, 1) + ' = \\hl{' + fmt(r.Qs2, 0) + '\\unit{kN}}']]); } },
    { title: 'Αντίσταση αιχμής στην άμμο', hl: ['Qp'], body: function (q, r) { return eqs([['q_p = σ\'_{v}(L)\\,N_q^* = ' + fmt(r.svL, 0) + '\\times' + fmt(r.Nq, 0) + ' = ' + fmt(r.qp, 0) + '\\unit{kPa}'], ['Q_p = q_p\\,A_p = ' + fmt(r.qp, 0) + '\\times' + fmt(r.Ap, 3) + ' = \\hl{' + fmt(r.Qp, 0) + '\\unit{kN}}']]) + note('Η μαλακή άργιλος πάνω από την άμμο δεν επηρεάζει τον ' + m('N_q^*') + ' εφόσον ο πάσσαλος εισχωρεί στην άμμο περισσότερο από ≈ 10D (' + fmt(r.Ls / q.D, 1) + 'D εδώ).'); } },
    { title: 'Άθροιση και επιτρεπόμενο φορτίο', hl: ['Qs1', 'Qs2', 'Qp', 'Q'], body: function (q, r) { return table(['Συνιστώσα', 'kN', '% του Qu'], [[m('Q_{s1}') + ' άργιλος', fmt(r.Qs1, 0), fmt(100 * r.Qs1 / r.Qu, 0)], [m('Q_{s2}') + ' άμμος', fmt(r.Qs2, 0), fmt(100 * r.Qs2 / r.Qu, 0)], [m('Q_p') + ' αιχμή', fmt(r.Qp, 0), fmt(100 * r.Qp / r.Qu, 0)], ['<b>' + m('Q_u') + '</b>', '<b>' + fmt(r.Qu, 0) + '</b>', '100']]) + eq('Q_{all} = \\frac{Q_u}{FS} = \\frac{' + fmt(r.Qu, 0) + '}{' + fmt(q.FS, 1) + '} = \\hl{' + fmt(r.Qall, 0) + '\\unit{kN}}'); } }
  ],
  result: function (q, r) { return '<div class="big">' + m('Q_u = ' + fmt(r.Qu, 0) + '\\unit{kN},\\quad Q_{all} = ' + fmt(r.Qall, 0) + '\\unit{kN}') + '</div>'; }
});

/* ===================== Π4: ομάδα πασσάλων σε άργιλο ===================== */
EX.push({
  id: 'p4', num: 4, group: 'Ομάδες πασσάλων', source: 'Παράδειγμα 4',
  title: 'Φέρουσα ικανότητα ομάδας 3×3 πασσάλων σε άργιλο',
  tags: ['Ομάδα πασσάλων', 'Απόδοση ομάδας', 'Αστοχία μπλοκ'],
  statement: p('Ομάδα 3×3 φρεατοπασσάλων ' + m('D = 0.5\\unit{m}') + ', ' + m('L = 15\\unit{m}') + ' με αξονική απόσταση ' + m('s = 1.5\\unit{m}\\;(3D)') + ' σε ομοιογενή άργιλο ' + m('c_u = 50\\unit{kPa}') + ', ' + m('α = 0.55') + '. Να υπολογιστεί η οριακή φέρουσα ικανότητα της ομάδας (α) ως άθροισμα μεμονωμένων πασσάλων με συντελεστή απόδοσης Converse–Labarre και (β) ως αστοχία μπλοκ, και το επιτρεπόμενο φορτίο της ομάδας (' + m('FS = 2.5') + ').') + ILLU,
  givens: [
    { key: 'D', label: 'Διάμετρος D', unit: 'm', value: 0.5, min: 0.3, max: 1.0, step: 0.05 },
    { key: 's', label: 'Αξονική απόσταση s', unit: 'm', value: 1.5, min: 0.9, max: 4, step: 0.1, dec: 1 },
    { key: 'L', label: 'Μήκος L', unit: 'm', value: 15, min: 8, max: 25, step: 0.5, dec: 1 },
    { key: 'cu', label: 'cu', unit: 'kPa', value: 50, min: 20, max: 120, step: 5 },
    { key: 'al', label: 'α', unit: '', value: 0.55, min: 0.3, max: 1, step: 0.05 }
  ],
  compute: function (q) {
    var n = 9, Ap = Math.PI * q.D * q.D / 4, Qs = q.al * q.cu * Math.PI * q.D * q.L, Qp = 9 * q.cu * Ap, Qu = Qs + Qp;
    var eta = GEO.converseLabarre(3, 3, q.D, q.s), theta = Math.atan(q.D / q.s) / DEG, Qg1 = n * eta * Qu;
    var Bg = 2 * q.s + q.D, Lg = Bg, Ncs = Math.min(9, 5 * (1 + 0.2 * Bg / Lg) * (1 + 0.2 * q.L / Bg)), Ncs0 = 5 * (1 + 0.2 * Bg / Lg) * (1 + 0.2 * q.L / Bg);
    var Qbs = 2 * (Bg + Lg) * q.L * q.cu, Qbp = Bg * Lg * q.cu * Ncs, Qblock = Qbs + Qbp;
    var Qg = Math.min(Qg1, Qblock);
    return { n: n, Ap: Ap, Qs: Qs, Qp: Qp, Qu: Qu, eta: eta, theta: theta, Qg1: Qg1, Bg: Bg, Lg: Lg, Ncs: Ncs, Ncs0: Ncs0, Qbs: Qbs, Qbp: Qbp, Qblock: Qblock, Qg: Qg, Qall: Qg / 2.5, govern: Qg1 <= Qblock ? 'ind' : 'block', sD: q.s / q.D };
  },
  figure: function (q, r, step) {
    var W = 660, H = 420; var h = SVG.open(W, H, 'aria-label="Κάτοψη ομάδας 3×3 πασσάλων με το περίγραμμα του ισοδύναμου μπλοκ και τομή"');
    // plan
    var sc = Math.min(40, 200 / r.Bg), cx = 170, cy = 200, S = q.s * sc, Rp = q.D * sc / 2;
    var bx = cx - r.Bg * sc / 2, by = cy - r.Bg * sc / 2;
    h += SVG.label(cx, 30, 'Κάτοψη', 'lbl-muted');
    h += '<g data-k="block">' + SVG.rect(bx, by, r.Bg * sc, r.Bg * sc, 'fill-red dash') + '</g>';
    h += '<g data-k="piles">';
    for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) h += SVG.circle(cx + i * S, cy + j * S, Rp, 'pile');
    h += '</g>';
    h += SVG.dim(cx - S, cy + S + Rp + 16, cx, cy + S + Rp + 16, 's = ' + fmt(q.s, 1), 14) + SVG.dim(cx, cy + S + Rp + 16, cx + S, cy + S + Rp + 16, 's', 14);
    h += SVG.dim(bx, by - 14, bx + r.Bg * sc, by - 14, tsub('B', 'g') + ' = ' + fmt(r.Bg, 2) + ' m', -14);
    h += SVG.dim(bx - 20, by, bx - 20, by + r.Bg * sc, tsub('L', 'g'), -8);
    // section
    var sx = 400, sy = 60, sw = 220, L = q.L, zs = Math.min(18, 300 / (L + 2));
    h += SVG.label(sx + sw / 2, 30, 'Τομή', 'lbl-muted');
    h += SVG.soil(sx - 30, sy, sw + 60, (L + 2) * zs + 20, 'clay') + SVG.ground(sx - 30, sx + sw + 30, sy, 'right');
    var pw = Math.max(q.D * zs, 8), gs = sw / 2 - q.s * zs; // positions
    var xs3 = [sx + sw / 2 - q.s * zs, sx + sw / 2, sx + sw / 2 + q.s * zs];
    h += '<g data-k="piles">'; xs3.forEach(function (x) { h += SVG.rect(x - pw / 2, sy - 8, pw, L * zs + 8, 'pile'); }); h += '</g>';
    h += SVG.rect(sx + sw / 2 - (q.s + q.D / 2) * zs - 10, sy - 26, (2 * q.s + q.D) * zs + 20, 20, 'conc');
    h += '<g data-k="block">' + SVG.rect(sx + sw / 2 - r.Bg * zs / 2, sy, r.Bg * zs, L * zs, 'fill-red dash') + '</g>';
    h += '<g data-k="eta">' + SVG.arrow(sx + sw / 2, sy - 60, sx + sw / 2, sy - 28, 'load', '', 4) + SVG.label(sx + sw / 2 + 10, sy - 42, tsub('Q', 'g'), 'lbl-load math', 'start') + '</g>';
    h += SVG.dim(sx - 48, sy, sx - 48, sy + L * zs, 'L = ' + fmt(L, 0) + ' m', -8);
    h += SVG.label(sx + sw / 2, sy + L * zs + 36, 'άργιλος cu = ' + fmt(q.cu, 0) + ' kPa', 'lbl-muted');
    return h + SVG.close();
  },
  figcap: 'Δύο μηχανισμοί: αστοχία κάθε πασσάλου χωριστά (με μειωμένη απόδοση λόγω αλληλεπίδρασης) ή αστοχία ολόκληρου του μπλοκ εδάφους–πασσάλων (κόκκινο περίγραμμα).',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('Q_u') + ' μεμονωμένου</dt><dd>' + fmt(r.Qu, 0) + ' kN</dd><dt>' + m('η') + '</dt><dd>' + fmt(r.eta, 3) + '</dd><dt>' + m('n\\,η\\,Q_u') + '</dt><dd>' + fmt(r.Qg1, 0) + ' kN</dd><dt>' + m('Q_{block}') + '</dt><dd>' + fmt(r.Qblock, 0) + ' kN</dd><dt>' + m('Q_{g,all}') + '</dt><dd><b>' + fmt(r.Qall, 0) + ' kN</b></dd></dl>'; },
  steps: [
    { title: 'Μεμονωμένος πάσσαλος', hl: ['piles'], body: function (q, r) { return eqs([['Q_s = α c_u π D L = ' + fmt(q.al, 2) + '\\times' + fmt(q.cu, 0) + '\\times π\\times' + fmt(q.D, 2) + '\\times' + fmt(q.L, 1) + ' = ' + fmt(r.Qs, 0) + '\\unit{kN}'], ['Q_p = 9 c_u A_p = 9\\times' + fmt(q.cu, 0) + '\\times' + fmt(r.Ap, 3) + ' = ' + fmt(r.Qp, 0) + '\\unit{kN}'], ['Q_u = \\hl{' + fmt(r.Qu, 0) + '\\unit{kN}},\\quad n = 9 \\Rightarrow \\sum Q_u = ' + fmt(9 * r.Qu, 0) + '\\unit{kN}', 'χωρίς αλληλεπίδραση']]); } },
    { title: 'Συντελεστής απόδοσης ομάδας (Converse–Labarre)', hl: ['eta', 'piles'], body: function (q, r) { return eqs([['θ = \\arctan\\frac{D}{s} = \\arctan\\frac{' + fmt(q.D, 2) + '}{' + fmt(q.s, 1) + '} = ' + fmt(r.theta, 2) + '°'], ['η = 1 - \\frac{θ}{90}\\,\\frac{(n_1-1)n_2 + (n_2-1)n_1}{n_1 n_2} = 1 - \\frac{' + fmt(r.theta, 2) + '}{90}\\,\\frac{2\\cdot 3 + 2\\cdot 3}{9} = \\hl{' + fmt(r.eta, 3) + '}', 'n₁ = n₂ = 3'], ['Q_{g,1} = n\\,η\\,Q_u = 9\\times' + fmt(r.eta, 3) + '\\times' + fmt(r.Qu, 0) + ' = \\hl{' + fmt(r.Qg1, 0) + '\\unit{kN}}']]) + note('Η απόδοση μειώνεται όσο πυκνώνουν οι πάσσαλοι (εδώ s/D = ' + fmt(r.sD, 1) + ').'); } },
    { title: 'Αστοχία μπλοκ', hl: ['block'], cap: 'Το μπλοκ αστοχεί ως ένα μεγάλο «θεμέλιο» διαστάσεων Bg×Lg και βάθους L: τριβή στην παράπλευρη επιφάνεια + αντοχή βάσης.', body: function (q, r) { return eqs([['B_g = L_g = 2s + D = 2\\times' + fmt(q.s, 1) + ' + ' + fmt(q.D, 2) + ' = ' + fmt(r.Bg, 2) + '\\unit{m}'], ['N_c^* = 5\\left(1+0.2\\frac{B_g}{L_g}\\right)\\left(1+0.2\\frac{L}{B_g}\\right) = ' + fmt(r.Ncs0, 2) + (r.Ncs0 > 9 ? ' \\Rightarrow 9 \\;\\text{(άνω όριο)}' : '')], ['Q_{block} = 2(B_g+L_g)\\,L\\,c_u + B_g L_g\\,c_u\\,N_c^* = ' + fmt(r.Qbs, 0) + ' + ' + fmt(r.Qbp, 0) + ' = \\hl{' + fmt(r.Qblock, 0) + '\\unit{kN}}']]); } },
    { title: 'Σύγκριση μηχανισμών και επιτρεπόμενο φορτίο', hl: ['block', 'piles', 'eta'], body: function (q, r) { return table(['Μηχανισμός', m('Q_g') + ' (kN)', ''], [['Μεμονωμένοι × απόδοση: ' + m('n\\,η\\,Q_u'), fmt(r.Qg1, 0), r.govern === 'ind' ? '<b style="color:var(--ok)">κρίσιμος</b>' : ''], ['Αστοχία μπλοκ', fmt(r.Qblock, 0), r.govern === 'block' ? '<b style="color:var(--ok)">κρίσιμος</b>' : '']]) + eqs([['Q_g = \\min(' + fmt(r.Qg1, 0) + ',\\;' + fmt(r.Qblock, 0) + ') = \\hl{' + fmt(r.Qg, 0) + '\\unit{kN}}'], ['Q_{g,all} = \\frac{Q_g}{2.5} = \\hl{' + fmt(r.Qall, 0) + '\\unit{kN}}', 'ανά πάσσαλο ' + fmt(r.Qall / 9, 0) + ' kN']]) + note('Η αστοχία μπλοκ γίνεται κρίσιμη για πυκνές ομάδες (s/D ≲ 2) ή μεγάλο αριθμό πασσάλων. Δοκιμάστε μικρότερο s.'); } }
  ],
  result: function (q, r) { return '<div class="big">' + m('Q_g = ' + fmt(r.Qg, 0) + '\\unit{kN},\\quad Q_{g,all} = ' + fmt(r.Qall, 0) + '\\unit{kN}') + '</div><p>Κρίσιμος μηχανισμός: ' + (r.govern === 'ind' ? 'μεμονωμένοι πάσσαλοι με απόδοση ομάδας η = ' + fmt(r.eta, 2) : 'αστοχία μπλοκ') + '.</p>'; }
});

/* ===================== Π5: καθίζηση ομάδας ===================== */
EX.push({
  id: 'p5', num: 5, group: 'Ομάδες πασσάλων', source: 'Παράδειγμα 5',
  title: 'Καθίζηση ομάδας πασσάλων σε άργιλο (ισοδύναμη κοιτόστρωση)',
  tags: ['Καθίζηση ομάδας', 'Ισοδύναμο θεμέλιο 2L/3', 'Μέθοδος 2:1', 'Vesic'],
  statement: p('Η ομάδα 3×3 του Παραδείγματος 4 (' + m('B_g = L_g = 3.5\\unit{m}') + ', ' + m('L = 15\\unit{m}') + ', ' + m('D = 0.5\\unit{m}') + ') μεταφέρει φορτίο λειτουργίας ' + m('Q_g = 3000\\unit{kN}') + ' σε κανονικά στερεοποιημένη άργιλο πάχους 30 m (' + m('γ = 18\\unit{kN/m³}') + ', υδροφόρος στην επιφάνεια, ' + m('c_c = 0.2') + ', ' + m('e_0 = 0.9') + '). Να υπολογιστεί η καθίζηση στερεοποίησης της ομάδας με τη μέθοδο της ισοδύναμης κοιτόστρωσης σε βάθος ' + m('2L/3') + ' και κατανομή τάσεων 2:1, με υποστρώματα 10–15, 15–20 και 20–30 m. Επιπλέον, η ελαστική καθίζηση ενός μεμονωμένου πασσάλου (Vesic) υπό το φορτίο λειτουργίας του.') + ILLU,
  givens: [
    { key: 'Q', label: 'Φορτίο ομάδας Qg', unit: 'kN', value: 3000, min: 1000, max: 6000, step: 100 },
    { key: 'L', label: 'Μήκος πασσάλων L', unit: 'm', value: 15, min: 9, max: 24, step: 0.5, dec: 1 },
    { key: 'Bg', label: 'Πλάτος ομάδας Bg = Lg', unit: 'm', value: 3.5, min: 2.5, max: 8, step: 0.1, dec: 1 },
    { key: 'cc', label: 'Δείκτης συμπίεσης cc', unit: '', value: 0.2, min: 0.05, max: 0.4, step: 0.01 },
    { key: 'e0', label: 'Αρχικός δείκτης πόρων e0', unit: '', value: 0.9, min: 0.5, max: 1.5, step: 0.05 }
  ],
  compute: function (q) {
    var g = 18, gp = g - GW, zr = 2 * q.L / 3, Hc = 30;
    var bounds = [zr, zr + 5, zr + 10, Hc].filter(function (z, i, a) { return z <= Hc && (i === 0 || z > a[i - 1]); });
    if (bounds[bounds.length - 1] < Hc) bounds.push(Hc);
    var layers = [];
    for (var i = 0; i < bounds.length - 1; i++) {
      var top = bounds[i], bot = bounds[i + 1], H = bot - top, zm = (top + bot) / 2, zp = zm - zr;
      var s0 = gp * zm, ds = q.Q / ((q.Bg + zp) * (q.Bg + zp)), dh = H * q.cc / (1 + q.e0) * Math.log10((s0 + ds) / s0);
      layers.push({ top: top, bot: bot, H: H, zm: zm, zp: zp, s0: s0, ds: ds, dh: dh });
    }
    var S = layers.reduce(function (a, l) { return a + l.dh; }, 0);
    // Vesic single pile
    var D = 0.5, cu = 50, al = 0.55, Ap = Math.PI * D * D / 4, Qs = al * cu * Math.PI * D * q.L, Qp = 9 * cu * Ap, Qw = q.Q / 9, Qwp = Qw * Qp / (Qs + Qp), Qws = Qw - Qwp;
    var Ep = 25e6, xi = 0.5, S1 = (Qwp + xi * Qws) * q.L / (Ap * Ep), qp = 9 * cu, Cp = 0.03, S2 = Cp * Qwp / (D * qp), Cs = (0.93 + 0.16 * Math.sqrt(q.L / D)) * Cp, S3 = Cs * Qws / (q.L * qp);
    return { gp: gp, zr: zr, layers: layers, S: S, D: D, cu: cu, Qs: Qs, Qp: Qp, Qw: Qw, Qwp: Qwp, Qws: Qws, Ap: Ap, S1: S1, S2: S2, S3: S3, Sp: S1 + S2 + S3, Cs: Cs, qp: qp, Cp: Cp, Ep: Ep };
  },
  figure: function (q, r, step) {
    var W = 660, H = 480, y0 = 50, zs = 400 / 31, xc = 330, X = function (x) { return xc + x * 14; }, Y = function (z) { return y0 + z * zs; };
    var h = SVG.open(W, H, 'aria-label="Τομή ομάδας πασσάλων με ισοδύναμη κοιτόστρωση σε βάθος 2L/3 και κατανομή τάσεων 2:1"');
    h += SVG.soil(40, y0, 580, 30 * zs, 'clay') + SVG.rect(40, Y(30), 580, 24, 'rock') + SVG.ground(40, 620, y0, 'right') + SVG.wt(70, y0 + 2);
    h += SVG.label(600, Y(30) + 16, 'ασυμπίεστο', 'lbl-w', 'end');
    // piles
    var bw = q.Bg * 14; [-1, 0, 1].forEach(function (i) { h += SVG.rect(xc + i * (bw / 2 - 5) - 4, y0 - 6, 8, q.L * zs + 6, 'pile'); });
    h += SVG.rect(xc - bw / 2 - 10, y0 - 22, bw + 20, 16, 'conc');
    h += '<g data-k="Q">' + SVG.arrow(xc, y0 - 60, xc, y0 - 24, 'load', '', 4) + SVG.label(xc + 10, y0 - 40, tsub('Q', 'g') + ' = ' + fmt(q.Q, 0) + ' kN', 'lbl-load math', 'start') + '</g>';
    // equivalent raft
    h += '<g data-k="raft">' + SVG.rect(xc - bw / 2, Y(r.zr) - 3, bw, 6, 'fill-red') + SVG.label(xc + bw / 2 + 8, Y(r.zr) + 4, 'ισοδύναμη κοιτόστρωση, z = 2L/3 = ' + fmt(r.zr, 1) + ' m', 'lbl-load', 'start') + '</g>';
    h += SVG.dim(xc - bw / 2 - 60, y0, xc - bw / 2 - 60, Y(q.L), 'L', -8);
    // 2:1 spread
    var zb = 30 - r.zr;
    h += '<g data-k="spread">' + SVG.line(xc - bw / 2, Y(r.zr), xc - bw / 2 - zb * 14 / 2, Y(30), 'guide') + SVG.line(xc + bw / 2, Y(r.zr), xc + bw / 2 + zb * 14 / 2, Y(30), 'guide') + SVG.label(xc + bw / 2 + zb * 14 / 4 + 12, Y(r.zr + zb / 2), '2:1', 'lbl-load', 'start') + '</g>';
    // sublayers
    r.layers.forEach(function (l, i) {
      h += '<g data-k="L' + (i + 1) + '">' + SVG.line(60, Y(l.bot), 600, Y(l.bot), 'thin dash') + SVG.circle(80, Y(l.zm), 4, 'marker') + SVG.label(90, Y(l.zm) + 4, (i + 1) + ': z=' + fmt(l.zm, 1) + ' m, Δσ=' + fmt(l.ds, 0) + ' kPa', 'lbl-muted', 'start') + '</g>';
    });
    h += SVG.dim(600, y0, 600, Y(30), '30 m', 8);
    return h + SVG.close();
  },
  figcap: 'Το φορτίο της ομάδας θεωρείται ότι ασκείται σε ισοδύναμη κοιτόστρωση στα 2/3 του μήκους των πασσάλων και διαχέεται κάτω από αυτή με κλίση 2:1.',
  quick: function (q, r) { return '<dl class="given"><dt>Βάθος ισοδ. κοιτόστρωσης</dt><dd>' + fmt(r.zr, 1) + ' m</dd>' + r.layers.map(function (l, i) { return '<dt>' + m('Δh_' + (i + 1)) + '</dt><dd>' + fmt(l.dh * 1000, 0) + ' mm</dd>'; }).join('') + '<dt>' + m('S_{group}') + '</dt><dd><b>' + fmt(r.S * 1000, 0) + ' mm</b></dd><dt>' + m('S_{pile}') + ' (Vesic)</dt><dd>' + fmt(r.Sp * 1000, 1) + ' mm</dd></dl>'; },
  steps: [
    { title: 'Ισοδύναμη κοιτόστρωση', hl: ['raft', 'Q'], body: function (q, r) { return eqs([['z_r = \\frac{2L}{3} = \\frac{2\\times' + fmt(q.L, 1) + '}{3} = \\hl{' + fmt(r.zr, 1) + '\\unit{m}}', 'πάσσαλοι τριβής σε άργιλο'], ['q_r = \\frac{Q_g}{B_g L_g} = \\frac{' + fmt(q.Q, 0) + '}{' + fmt(q.Bg, 1) + '^2} = ' + fmt(q.Q / q.Bg / q.Bg, 0) + '\\unit{kPa}']]); } },
    { title: 'Αύξηση τάσης με τη μέθοδο 2:1', hl: ['spread', 'L1', 'L2', 'L3'], body: function (q, r) { return eq('Δσ(z\') = \\frac{Q_g}{(B_g + z\')(L_g + z\')}', 'z′ = βάθος κάτω από την ισοδύναμη κοιτόστρωση') + table(['Στρώμα', 'Βάθη (m)', 'H (m)', 'z′ στο μέσο (m)', m('σ\'_{v0} = γ\' z') + ' (kPa)', 'Δσ (kPa)'], r.layers.map(function (l, i) { return [String(i + 1), fmt(l.top, 1) + ' – ' + fmt(l.bot, 1), fmt(l.H, 1), fmt(l.zp, 1), fmt(l.s0, 0), fmt(l.ds, 1)]; })); } },
    { title: 'Συμπίεση κάθε υποστρώματος (μέθοδος cc)', hl: ['L1', 'L2', 'L3'], body: function (q, r) { return eq('Δh_i = \\frac{H_i\\,c_c}{1+e_0}\\log\\frac{σ\'_{v0}+Δσ}{σ\'_{v0}}') + eqs(r.layers.map(function (l, i) { return ['Δh_' + (i + 1) + ' = \\frac{' + fmt(l.H, 0) + '\\times' + fmt(q.cc, 2) + '}{1+' + fmt(q.e0, 2) + '}\\log\\frac{' + fmt(l.s0, 0) + '+' + fmt(l.ds, 1) + '}{' + fmt(l.s0, 0) + '} = \\hl{' + fmt(l.dh * 1000, 0) + '\\unit{mm}}']; })); } },
    { title: 'Καθίζηση ομάδας', hl: ['raft'], body: function (q, r) { return eq('S_{group} = \\sum Δh_i = ' + r.layers.map(function (l) { return fmt(l.dh * 1000, 0); }).join(' + ') + ' = \\hl{' + fmt(r.S * 1000, 0) + '\\unit{mm}}') + note('Μεγάλη τιμή: η καθίζηση μιας ομάδας είναι πολλαπλάσια του μεμονωμένου πασσάλου, γιατί το φορτίο διαχέεται σε μεγάλο βάθος. Μακρύτεροι πάσσαλοι (↑L, ↑zr) ή μικρότερο φορτίο τη μειώνουν. Στη μέθοδο αυτή προστίθεται συνήθως και η ελαστική συμπίεση των ίδιων των πασσάλων.'); } },
    { title: 'Ελαστική καθίζηση μεμονωμένου πασσάλου (Vesic)', hl: ['Q'], body: function (q, r) { return p('Φορτίο λειτουργίας ανά πάσσαλο ' + m('Q_w = ' + fmt(q.Q, 0) + '/9 = ' + fmt(r.Qw, 0) + '\\unit{kN}') + ', που κατανέμεται σε αιχμή/κορμό αναλογικά με ' + m('Q_p : Q_s') + ' του Παραδείγματος 4: ' + m('Q_{wp} = ' + fmt(r.Qwp, 0) + ',\\; Q_{ws} = ' + fmt(r.Qws, 0) + '\\unit{kN}') + '.') + eqs([['S_1 = \\frac{(Q_{wp} + ξ Q_{ws})L}{A_p E_p} = \\frac{(' + fmt(r.Qwp, 0) + ' + 0.5\\times' + fmt(r.Qws, 0) + ')\\times' + fmt(q.L, 0) + '}{' + fmt(r.Ap, 3) + '\\times 25\\cdot 10^6} = ' + fmt(r.S1 * 1000, 2) + '\\unit{mm}', 'ελαστική βράχυνση πασσάλου, ξ = 0.5'], ['S_2 = \\frac{C_p Q_{wp}}{D\\,q_p} = \\frac{0.03\\times' + fmt(r.Qwp, 0) + '}{0.5\\times' + fmt(r.qp, 0) + '} = ' + fmt(r.S2 * 1000, 2) + '\\unit{mm}', 'καθίζηση αιχμής, Cp = 0.03 (φρεατοπάσσαλος σε άργιλο)'], ['S_3 = \\frac{C_s Q_{ws}}{L\\,q_p},\\; C_s = (0.93+0.16\\sqrt{L/D})C_p = ' + fmt(r.Cs, 4) + ' \\Rightarrow S_3 = ' + fmt(r.S3 * 1000, 2) + '\\unit{mm}', 'από το φορτίο κορμού'], ['S_{pile} = S_1+S_2+S_3 = \\hl{' + fmt(r.Sp * 1000, 1) + '\\unit{mm}}']]) + note('Σύγκριση: ομάδα ' + fmt(r.S * 1000, 0) + ' mm έναντι μεμονωμένου ' + fmt(r.Sp * 1000, 1) + ' mm, λόγος ≈ ' + fmt(r.S / r.Sp, 0) + '.'); } }
  ],
  result: function (q, r) { return '<div class="big">' + m('S_{group} \\approx ' + fmt(r.S * 1000, 0) + '\\unit{mm},\\quad S_{pile} \\approx ' + fmt(r.Sp * 1000, 1) + '\\unit{mm}') + '</div>'; }
});

/* ---------- lateral figure helper ---------- */
function lateralFig(o) {
  // o: {L, D, e, H label, react: 'clay'|'sand', f (depth of hinge from 1.5D), mech 'long'|'short', widthFn(z) px, W,H}
  var W = 660, Hh = 470, y0 = 90, s = Math.min(28, 340 / (o.L + 1)), xc = 260, pw = Math.max(o.D * s, 16), Y = function (z) { return y0 + z * s; };
  var h = SVG.open(W, Hh, 'aria-label="' + (o.aria || 'Πάσσαλος υπό οριζόντιο φορτίο με κατανομή εδαφικής αντίδρασης') + '"');
  h += SVG.soil(60, y0, 540, (o.L + 1) * s + 10, o.react === 'clay' ? 'clay' : 'sand') + SVG.ground(60, 600, y0, 'right');
  h += SVG.label(590, y0 + 18, o.soilLabel || '', 'lbl-muted', 'end');
  // deflected shape (dashed) – amplitude decays with depth
  var amp = 26, zd = o.mech === 'long' ? Math.min(o.L, 1.5 * o.D + o.f + 3) : o.L;
  var d = 'M' + (xc + amp) + ',' + (y0 - o.e * s); for (var z = 0; z <= o.L; z += 0.25) { var t = z / zd; var dx = o.mech === 'long' ? amp * Math.max(0, 1 - t) * Math.max(0, 1 - t) : amp * (1 - 1.5 * z / o.L); d += ' L' + (xc + dx) + ',' + Y(z); }
  // pile, then deflected axis on top
  h += SVG.rect(xc - pw / 2, y0 - o.e * s - 6, pw, o.L * s + o.e * s + 6, 'pile', 'opacity=".85"');
  h += '<g data-k="defl"><path d="' + d + '" class="blue dash a-draw"/>' + SVG.label(xc + amp + 10, y0 + 14, 'παραμορφωμένος άξονας', 'lbl-muted', 'start') + '</g>';
  // load
  h += '<g data-k="H">' + SVG.arrow(xc - pw / 2 - 90, y0 - o.e * s, xc - pw / 2 - 4, y0 - o.e * s, 'load', '', 4) + SVG.label(xc - pw / 2 - 94, y0 - o.e * s - 10, o.Hlabel, 'lbl-load math', 'end') + '</g>';
  h += SVG.dim(xc + pw / 2 + 6, y0 - o.e * s, xc + pw / 2 + 6, y0, 'e = ' + fmt(o.e, 1) + ' m', 6);
  // reaction distribution on the right (soil pushes pile to the left -> arrows pointing left)
  var z1 = 1.5 * o.D, z2 = o.mech === 'long' ? z1 + o.f : o.L;
  var pts = [[xc + pw / 2, Y(z1)]]; for (var zz = z1; zz <= z2 + 1e-9; zz += (z2 - z1) / 12) pts.push([xc + pw / 2 + o.widthFn(zz), Y(zz)]); pts.push([xc + pw / 2, Y(z2)]);
  var g = '<g data-k="react">' + SVG.poly(pts, 'load-fill');
  for (var k = 1; k <= 5; k++) { var zk = z1 + (z2 - z1) * k / 6, wk = o.widthFn(zk); if (wk > 8) g += SVG.arrow(xc + pw / 2 + wk, Y(zk), xc + pw / 2 + 3, Y(zk), 'load', '', 1.5); }
  g += SVG.label(xc + pw / 2 + o.widthFn(z2) + 8, Y((z1 + z2) / 2) + 4, o.reactLabel, 'lbl-load math', 'start') + '</g>';
  h += g;
  var xr = xc + pw / 2 + o.widthFn(z2) + 110;
  if (o.mech === 'long') { h += '<g data-k="hinge">' + SVG.circle(xc, Y(z2), 7, 'marker a-pulse') + SVG.label(xc + pw / 2 + 12, Y(z2) + 18, 'πλαστική άρθρωση, M = M' + '<tspan dy="4" font-size="10">y</tspan>', 'lbl-load', 'start') + SVG.dim(xr, y0, xr, Y(z2), '1.5D + f = ' + fmt(z2, 2) + ' m', 8) + '</g>'; }
  else { h += '<g data-k="rot">' + SVG.circle(xc, Y(o.rotZ || 0.7 * o.L), 6, 'marker a-pulse') + SVG.label(xc - pw / 2 - 10, Y(o.rotZ || 0.7 * o.L) + 4, 'κέντρο στροφής', 'lbl-muted', 'end') + '</g>'; }
  h += SVG.dim(xc - pw / 2 - 100, y0, xc - pw / 2 - 100, Y(o.L), 'L = ' + fmt(o.L, 1) + ' m', -8);
  h += SVG.dim(xc - pw / 2, Y(o.L) + 26, xc + pw / 2, Y(o.L) + 26, 'D = ' + fmt(o.D, 2), 14);
  h += SVG.label(xc - pw / 2 - 8, Y(z1) + 4, '1.5D', 'lbl-muted', 'end');
  return h + SVG.close();
}

/* ===================== Π6: Broms άργιλος ===================== */
EX.push({
  id: 'p6', num: 6, group: 'Πλευρική φόρτιση', source: 'Παράδειγμα 6',
  title: 'Οριακό οριζόντιο φορτίο πασσάλου ελεύθερης κεφαλής σε άργιλο (Broms)',
  tags: ['Broms', 'Άργιλος', 'Ελεύθερη κεφαλή', 'Winkler'],
  statement: p('Πάσσαλος ΩΣ ' + m('D = 0.6\\unit{m}') + ', ' + m('L = 12\\unit{m}') + ' με ελεύθερη κεφαλή σε άργιλο ' + m('c_u = 50\\unit{kPa}') + ' δέχεται οριζόντιο φορτίο σε ύψος ' + m('e = 0.5\\unit{m}') + ' πάνω από την επιφάνεια. Η ροπή διαρροής της διατομής είναι ' + m('M_y = 600\\unit{kNm}') + '. Να υπολογιστεί το οριακό οριζόντιο φορτίο ' + m('H_u') + ' κατά Broms (μηχανισμοί «μακρού» και «κοντού» πασσάλου), το επιτρεπόμενο ' + m('H_{all} = H_u/2.5') + ' και η μετακίνηση στην επιφάνεια για το ' + m('H_{all}') + ' με το μοντέλο Winkler (' + m('k_h = 5\\unit{MN/m³}') + ', ' + m('E_p = 25\\unit{GPa}') + ').') + ILLU,
  givens: [
    { key: 'D', label: 'Διάμετρος D', unit: 'm', value: 0.6, min: 0.4, max: 1.2, step: 0.05 },
    { key: 'L', label: 'Μήκος L', unit: 'm', value: 12, min: 3, max: 20, step: 0.5, dec: 1 },
    { key: 'cu', label: 'cu', unit: 'kPa', value: 50, min: 20, max: 150, step: 5 },
    { key: 'e', label: 'Ύψος φόρτισης e', unit: 'm', value: 0.5, min: 0, max: 3, step: 0.1, dec: 1 },
    { key: 'My', label: 'Ροπή διαρροής My', unit: 'kNm', value: 600, min: 100, max: 3000, step: 50 },
    { key: 'kh', label: 'kh (Winkler)', unit: 'MN/m³', value: 5, min: 1, max: 30, step: 0.5, dec: 1 }
  ],
  compute: function (q) {
    var pu = 9 * q.cu * q.D; // kN/m
    var a = q.e + 1.5 * q.D;
    // long: H(a + 0.5 H/pu) = My -> H²/(2pu) + aH - My = 0
    var Hl = (-a + Math.sqrt(a * a + 2 * q.My / pu)) * pu, fl = Hl / pu;
    // short: H(a + 0.5f) = 2.25 cu D g², g = L - 1.5D - f, f = H/pu
    var Hs = solve(function (H) { var f = H / pu, g = q.L - 1.5 * q.D - f; return H * (a + 0.5 * f) - 2.25 * q.cu * q.D * g * g; }, 1, pu * (q.L - 1.5 * q.D));
    var fs = Hs / pu, gs = q.L - 1.5 * q.D - fs, Ms = Hs * (a + 0.5 * fs);
    var isLong = Hl < Hs, Hu = Math.min(Hl, Hs), f = Hu / pu, Hall = Hu / 2.5;
    var Ip = Math.PI * Math.pow(q.D, 4) / 64, EI = 25e6 * Ip, kh = q.kh * 1000, beta = Math.pow(kh * q.D / (4 * EI), 0.25), y0 = 2 * Hall * beta / (kh * q.D), bL = beta * q.L;
    return { pu: pu, a: a, Hl: Hl, fl: fl, Hs: Hs, fs: fs, gs: gs, Ms: Ms, isLong: isLong, Hu: Hu, f: f, Hall: Hall, Ip: Ip, EI: EI, beta: beta, y0: y0, bL: bL, Ml: Hl * (a + 0.5 * fl) };
  },
  figure: function (q, r, step) {
    var pw = Math.min(90, r.pu / 4);
    return lateralFig({ L: q.L, D: q.D, e: q.e, Hlabel: tsub('H', 'u') + ' = ' + fmt(r.Hu, 0) + ' kN', react: 'clay', mech: r.isLong ? 'long' : 'short', f: r.f, widthFn: function (z) { return pw; }, reactLabel: '9c' + '<tspan dy="4" font-size="10">u</tspan><tspan dy="-4">D = ' + fmt(r.pu, 0) + ' kN/m</tspan>', soilLabel: 'άργιλος cu = ' + fmt(q.cu, 0) + ' kPa', aria: 'Πάσσαλος σε άργιλο υπό οριζόντιο φορτίο, ορθογωνική εδαφική αντίδραση 9cuD από βάθος 1.5D και πλαστική άρθρωση' });
  },
  figcap: 'Broms (άργιλος): η οριακή εδαφική αντίδραση λαμβάνεται μηδενική στα πρώτα 1.5D και σταθερή 9·cu·D από εκεί και κάτω. Μακρύς πάσσαλος: σχηματίζεται πλαστική άρθρωση σε βάθος 1.5D + f.',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('9c_uD') + '</dt><dd>' + fmt(r.pu, 0) + ' kN/m</dd><dt>' + m('H_u') + ' (μακρύς)</dt><dd>' + fmt(r.Hl, 0) + ' kN</dd><dt>' + m('H_u') + ' (κοντός)</dt><dd>' + fmt(r.Hs, 0) + ' kN</dd><dt>' + m('H_u') + '</dt><dd><b>' + fmt(r.Hu, 0) + ' kN</b></dd><dt>' + m('H_{all}') + '</dt><dd><b>' + fmt(r.Hall, 0) + ' kN</b></dd><dt>' + m('y_0') + '</dt><dd>' + fmt(r.y0 * 1000, 1) + ' mm</dd></dl>'; },
  steps: [
    { title: 'Οριακή εδαφική αντίδραση', hl: ['react'], body: function (q, r) { return eq('p_u = 9\\,c_u\\,D = 9\\times' + fmt(q.cu, 0) + '\\times' + fmt(q.D, 2) + ' = \\hl{' + fmt(r.pu, 0) + '\\unit{kN/m}}', 'από βάθος 1.5D = ' + fmt(1.5 * q.D, 2) + ' m και κάτω') + p('Η μέγιστη ροπή εμφανίζεται στο βάθος όπου μηδενίζεται η τέμνουσα: ' + m('f = \\frac{H}{9c_uD}') + '.'); } },
    { title: 'Μηχανισμός μακρού πασσάλου (πλαστική άρθρωση)', hl: ['hinge', 'react', 'H'], body: function (q, r) { return eqs([['M_{max} = H_u\\left(e + 1.5D + \\frac{f}{2}\\right) = M_y,\\quad f = \\frac{H_u}{9c_uD}'], ['\\frac{H_u^2}{2\\cdot' + fmt(r.pu, 0) + '} + ' + fmt(r.a, 2) + '\\,H_u - ' + fmt(q.My, 0) + ' = 0 \\Rightarrow H_{u,long} = \\hl{' + fmt(r.Hl, 0) + '\\unit{kN}}', 'δευτεροβάθμια'], ['f = ' + fmt(r.Hl, 0) + '/' + fmt(r.pu, 0) + ' = ' + fmt(r.fl, 2) + '\\unit{m}', 'βάθος άρθρωσης 1.5D + f = ' + fmt(1.5 * q.D + r.fl, 2) + ' m']]); } },
    { title: 'Μηχανισμός κοντού πασσάλου (στροφή στερεού σώματος)', hl: ['defl', 'react'], body: function (q, r) { return eqs([['H_u\\left(e+1.5D+\\frac{f}{2}\\right) = 2.25\\,c_u\\,D\\,g^2,\\quad g = L - 1.5D - f'], ['\\Rightarrow H_{u,short} = \\hl{' + fmt(r.Hs, 0) + '\\unit{kN}},\\; f = ' + fmt(r.fs, 2) + '\\unit{m},\\; g = ' + fmt(r.gs, 2) + '\\unit{m}', 'επίλυση με δοκιμές'], ['M_{max} = H_{u,short}\\left(e+1.5D+\\frac{f}{2}\\right) = ' + fmt(r.Ms, 0) + '\\unit{kNm}' + (r.Ms > q.My ? ' > M_y' : ' \\le M_y')]]) + p(r.Ms > q.My ? 'Η ροπή αυτή υπερβαίνει τη ροπή διαρροής, άρα ο πάσσαλος θα αστοχήσει πρώτα ως «μακρύς» (δομική αστοχία).' : 'Η ροπή δεν φθάνει τη ροπή διαρροής, άρα ο πάσσαλος αστοχεί ως «κοντός» (αστοχία εδάφους).'); } },
    { title: 'Κρίσιμο φορτίο και επιτρεπόμενο', hl: ['H'], body: function (q, r) { return eqs([['H_u = \\min(H_{u,long},\\,H_{u,short}) = \\min(' + fmt(r.Hl, 0) + ',\\;' + fmt(r.Hs, 0) + ') = \\hl{' + fmt(r.Hu, 0) + '\\unit{kN}}', r.isLong ? 'κρίσιμος ο μακρύς πάσσαλος' : 'κρίσιμος ο κοντός πάσσαλος'], ['H_{all} = \\frac{H_u}{2.5} = \\hl{' + fmt(r.Hall, 0) + '\\unit{kN}}']]); } },
    { title: 'Μετακίνηση κεφαλής (Winkler, μακρύς εύκαμπτος πάσσαλος)', hl: ['defl', 'H'], body: function (q, r) { return eqs([['I_p = \\frac{π D^4}{64} = ' + fmt(r.Ip, 5) + '\\unit{m⁴},\\quad E_pI_p = ' + fmt(r.EI / 1000, 0) + '\\unit{MNm²}'], ['β = \\left(\\frac{k_h D}{4E_pI_p}\\right)^{1/4} = \\left(\\frac{' + fmt(q.kh * 1000, 0) + '\\times' + fmt(q.D, 2) + '}{4\\times' + fmt(r.EI, 0) + '}\\right)^{1/4} = \\hl{' + fmt(r.beta, 3) + '\\unit{m⁻¹}}', 'βL = ' + fmt(r.bL, 2) + (r.bL > 2.5 ? ' > 2.5: εύκαμπτος (μακρύς)' : ' < 2.5: η λύση μακρού πασσάλου είναι προσεγγιστική')], ['y_0 = \\frac{2 H β}{k_h D} = \\frac{2\\times' + fmt(r.Hall, 0) + '\\times' + fmt(r.beta, 3) + '}{' + fmt(q.kh * 1000, 0) + '\\times' + fmt(q.D, 2) + '} = \\hl{' + fmt(r.y0 * 1000, 1) + '\\unit{mm}}', 'μόνο οριζόντιο φορτίο στην επιφάνεια, ο όρος της ροπής H·e παραλείπεται']]); } }
  ],
  result: function (q, r) { return '<div class="big">' + m('H_u = ' + fmt(r.Hu, 0) + '\\unit{kN}\\;(' + (r.isLong ? 'μακρύς' : 'κοντός') + '),\\quad H_{all} = ' + fmt(r.Hall, 0) + '\\unit{kN},\\quad y_0 \\approx ' + fmt(r.y0 * 1000, 0) + '\\unit{mm}') + '</div>'; }
});

/* ===================== Π7: Broms άμμος ===================== */
EX.push({
  id: 'p7', num: 7, group: 'Πλευρική φόρτιση', source: 'Παράδειγμα 7',
  title: 'Οριακό οριζόντιο φορτίο πασσάλου ελεύθερης κεφαλής σε άμμο (Broms)',
  tags: ['Broms', 'Άμμος', 'Ελεύθερη κεφαλή', 'Κοντός / μακρύς'],
  statement: p('Πάσσαλος ' + m('D = 0.5\\unit{m}') + ', ' + m('L = 6\\unit{m}') + ' (' + m('L/D = 12') + ') με ελεύθερη κεφαλή σε άμμο ' + m('φ = 35°') + ', ' + m('γ = 18\\unit{kN/m³}') + ' δέχεται οριζόντιο φορτίο σε ύψος ' + m('e = 0.3\\unit{m}') + '. Ροπή διαρροής διατομής ' + m('M_y = 300\\unit{kNm}') + '. Να υπολογιστεί το οριακό οριζόντιο φορτίο κατά Broms. Ελέγξτε αν ισχύει ο μηχανισμός «κοντού» πασσάλου (στροφή χωρίς διαρροή) ή ο μηχανισμός «μακρού» πασσάλου, και δώστε ' + m('H_{all} = H_u/2.5') + '.') + ILLU,
  givens: [
    { key: 'D', label: 'Διάμετρος D', unit: 'm', value: 0.5, min: 0.3, max: 1.0, step: 0.05 },
    { key: 'L', label: 'Μήκος L', unit: 'm', value: 6, min: 2, max: 12, step: 0.5, dec: 1 },
    { key: 'phi', label: 'φ', unit: '°', value: 35, min: 28, max: 42, step: 0.5, dec: 1 },
    { key: 'g', label: 'γ', unit: 'kN/m³', value: 18, min: 15, max: 21, step: 0.5, dec: 1 },
    { key: 'e', label: 'Ύψος φόρτισης e', unit: 'm', value: 0.3, min: 0, max: 3, step: 0.1, dec: 1 },
    { key: 'My', label: 'Ροπή διαρροής My', unit: 'kNm', value: 300, min: 50, max: 2000, step: 25 }
  ],
  compute: function (q) {
    var Kp = GEO.Kp(q.phi), c = q.g * q.D * Kp;
    var Hs = 0.5 * q.g * q.D * Math.pow(q.L, 3) * Kp / (q.e + q.L), fs = 0.82 * Math.sqrt(Hs / c), Ms = Hs * (q.e + 0.67 * fs);
    var Hl = solve(function (H) { return H * (q.e + 0.54 * Math.sqrt(H / c)) - q.My; }, 0.1, 1e5), fl = 0.82 * Math.sqrt(Hl / c);
    var shortOK = Ms <= q.My, Hu = shortOK ? Hs : Hl, f = shortOK ? fs : fl;
    return { Kp: Kp, c: c, Hs: Hs, fs: fs, Ms: Ms, Hl: Hl, fl: fl, shortOK: shortOK, Hu: Hu, f: f, Hall: Hu / 2.5, pL: 3 * c * q.L };
  },
  figure: function (q, r, step) {
    var zmax = r.shortOK ? q.L : 1.5 * q.D + r.f; var wmax = 90;
    return lateralFig({ L: q.L, D: q.D, e: q.e, Hlabel: tsub('H', 'u') + ' = ' + fmt(r.Hu, 0) + ' kN', react: 'sand', mech: r.shortOK ? 'short' : 'long', f: r.f, rotZ: 0.75 * q.L, widthFn: function (z) { return wmax * z / Math.max(zmax, 0.1); }, reactLabel: '3γDK' + '<tspan dy="4" font-size="10">p</tspan><tspan dy="-4">·z</tspan>', soilLabel: 'άμμος φ = ' + fmt(q.phi, 1) + '°, γ = ' + fmt(q.g, 0) + ' kN/m³', aria: 'Πάσσαλος σε άμμο υπό οριζόντιο φορτίο με τριγωνική εδαφική αντίδραση 3γDKp·z' });
  },
  figcap: 'Broms (άμμος): η οριακή εδαφική αντίδραση αυξάνει γραμμικά με το βάθος, p = 3·γ·D·Kp·z. Κοντός πάσσαλος: στρέφεται ως στερεό γύρω από σημείο κοντά στην αιχμή. Μακρύς: πλαστική άρθρωση σε βάθος f.',
  quick: function (q, r) { return '<dl class="given"><dt>' + m('K_p') + '</dt><dd>' + fmt(r.Kp, 2) + '</dd><dt>' + m('H_u') + ' (κοντός)</dt><dd>' + fmt(r.Hs, 0) + ' kN</dd><dt>' + m('M_{max}') + ' (κοντός)</dt><dd>' + fmt(r.Ms, 0) + ' kNm</dd><dt>' + m('H_u') + ' (μακρύς)</dt><dd>' + fmt(r.Hl, 0) + ' kN</dd><dt>' + m('H_u') + '</dt><dd><b>' + fmt(r.Hu, 0) + ' kN</b></dd><dt>' + m('H_{all}') + '</dt><dd><b>' + fmt(r.Hall, 0) + ' kN</b></dd></dl>'; },
  steps: [
    { title: 'Παθητικός συντελεστής και εδαφική αντίδραση', hl: ['react'], body: function (q, r) { return eqs([['K_p = \\tan^2\\left(45°+\\frac{φ}{2}\\right) = \\tan^2(' + fmt(45 + q.phi / 2, 2) + '°) = \\hl{' + fmt(r.Kp, 2) + '}'], ['p_u(z) = 3\\,γ\\,D\\,K_p\\,z = 3\\times' + fmt(q.g, 0) + '\\times' + fmt(q.D, 2) + '\\times' + fmt(r.Kp, 2) + '\\,z = ' + fmt(3 * r.c, 1) + '\\,z\\;\\unit{kN/m}', 'στην αιχμή: ' + fmt(r.pL, 0) + ' kN/m']]); } },
    { title: 'Μηχανισμός κοντού πασσάλου', hl: ['rot', 'react', 'H'], body: function (q, r) { return eqs([['H_u = \\frac{0.5\\,γ\\,D\\,L^3 K_p}{e + L} = \\frac{0.5\\times' + fmt(q.g, 0) + '\\times' + fmt(q.D, 2) + '\\times' + fmt(q.L, 1) + '^3\\times' + fmt(r.Kp, 2) + '}{' + fmt(q.e, 1) + ' + ' + fmt(q.L, 1) + '} = \\hl{' + fmt(r.Hs, 0) + '\\unit{kN}}', 'ισορροπία ροπών ως προς την αιχμή'], ['f = 0.82\\sqrt{\\frac{H_u}{γ D K_p}} = 0.82\\sqrt{\\frac{' + fmt(r.Hs, 0) + '}{' + fmt(r.c, 1) + '}} = ' + fmt(r.fs, 2) + '\\unit{m}', 'βάθος μέγιστης ροπής'], ['M_{max} = H_u (e + 0.67 f) = ' + fmt(r.Hs, 0) + '\\times(' + fmt(q.e, 1) + ' + 0.67\\times' + fmt(r.fs, 2) + ') = \\hl{' + fmt(r.Ms, 0) + '\\unit{kNm}}' + (r.shortOK ? ' \\le M_y' : ' > M_y = ' + fmt(q.My, 0))]]) + p(r.shortOK ? 'Η διατομή αντέχει τη ροπή: ο μηχανισμός κοντού πασσάλου <b>ισχύει</b>.' : 'Η ροπή ξεπερνά τη ροπή διαρροής: ο πάσσαλος θα διαρρεύσει πριν στραφεί ως στερεό, άρα ο μηχανισμός κοντού πασσάλου <b>δεν ισχύει</b> και εξετάζεται ο μακρύς.'); } },
    { title: 'Μηχανισμός μακρού πασσάλου', hl: ['hinge', 'defl'], body: function (q, r) { return eqs([['H_u = \\frac{M_y}{e + 0.54\\sqrt{H_u/(γ D K_p)}}', 'πεπλεγμένη, επίλυση με δοκιμές'], ['\\Rightarrow H_{u,long} = \\hl{' + fmt(r.Hl, 0) + '\\unit{kN}},\\quad f = 0.82\\sqrt{H_u/(γDK_p)} = ' + fmt(r.fl, 2) + '\\unit{m}']]) + note('Έλεγχος: ' + m(fmt(r.Hl, 0) + '\\times(' + fmt(q.e, 1) + ' + 0.54\\sqrt{' + fmt(r.Hl, 0) + '/' + fmt(r.c, 1) + '}) = ' + fmt(r.Hl * (q.e + 0.54 * Math.sqrt(r.Hl / r.c)), 0) + ' = M_y') + '.'); } },
    { title: 'Κρίσιμο φορτίο και επιτρεπόμενο', hl: ['H'], body: function (q, r) { return eqs([['H_u = ' + (r.shortOK ? 'H_{u,short}' : 'H_{u,long}') + ' = \\hl{' + fmt(r.Hu, 0) + '\\unit{kN}}', r.shortOK ? 'αστοχία εδάφους (κοντός πάσσαλος)' : 'δομική αστοχία (μακρύς πάσσαλος)'], ['H_{all} = \\frac{H_u}{2.5} = \\hl{' + fmt(r.Hall, 0) + '\\unit{kN}}']]) + note('Δοκιμάστε μεγαλύτερο My ή μικρότερο L: όταν ' + m('M_{max,short} \\le M_y') + ' το κρίσιμο γίνεται ο κοντός πάσσαλος και το ' + m('H_u') + ' αυξάνει με το L³.'); } }
  ],
  result: function (q, r) { return '<div class="big">' + m('H_u = ' + fmt(r.Hu, 0) + '\\unit{kN}\\;(' + (r.shortOK ? 'κοντός' : 'μακρύς') + '),\\quad H_{all} = ' + fmt(r.Hall, 0) + '\\unit{kN}') + '</div>'; }
});

/* ===================== ΤΥΠΟΛΟΓΙΟ ===================== */
var SHEET = [
  { title: 'Φέρουσα ικανότητα μεμονωμένου πασσάλου', html: eqs(['Q_u = Q_p + Q_s = q_p A_p + \\sum f_{s,i}\\,A_{s,i}', 'A_p = \\frac{π D^2}{4},\\quad A_s = π D L', 'Q_{all} = \\frac{Q_u}{FS},\\; FS = 2 - 3\\quad\\text{ή}\\quad Q_{all} = \\frac{Q_s}{1.5} + \\frac{Q_p}{3}']) + p('<span class="who">Το βάρος του πασσάλου συνήθως αγνοείται (αντισταθμίζεται από το βάρος του εδάφους που εκτοπίζεται).</span>') },
  { title: 'Μέθοδος α (άργιλος, αστράγγιστες συνθήκες)', html: eqs(['f_s = α\\,c_u,\\quad q_p = N_c c_u = 9\\,c_u\\;(L/D > 4)']) + table(['cu (kPa)', 'α (API, εμπηγνυόμενοι)'], [['≤ 25', '1.0'], ['25 – 70', m('1 - 0.5\\,\\frac{c_u - 25}{45}') + ' (γραμμικά)'], ['≥ 70', '0.5']]) + p('<span class="who">Φρεατοπάσσαλοι: α ≈ 0.45–0.5 (Skempton), λόγω χαλάρωσης του εδάφους.</span>') },
  { title: 'Μέθοδος β (άμμος, στραγγιζόμενες συνθήκες)', html: eqs(['f_s = β\\,σ\'_v = K\\,\\tan δ\\,σ\'_v', 'q_p = σ\'_v(L)\\,N_q^*']) + table(['Τύπος πασσάλου', 'K', 'δ'], [['Φρεατοπάσσαλος', m('0.7 - 1.0\\,K_0'), m('0.5 - 0.8\\,φ')], ['Εμπηγνυόμενος, μικρής εκτόπισης', m('1.0 - 1.5\\,K_0'), m('0.75\\,φ')], ['Εμπηγνυόμενος, μεγάλης εκτόπισης', m('1.5 - 2.0\\,K_0'), m('0.75 - 1.0\\,φ')]]) + p('<span class="who">K₀ = 1 − sinφ. Κρίσιμο βάθος: κάτω από z_c ≈ 15–20 D οι f_s και q_p θεωρούνται πρακτικά σταθερές.</span>') },
  { title: 'Συντελεστής αιχμής N_q* (ενδεικτικά, τύπου Berezantzev)', html: table(['φ', '30°', '33°', '35°', '38°', '40°'], [[m('N_q^*'), '25', '42', '60', '95', '130']]) + p('<span class="who">Οι τιμές για βαθιά θεμελίωση είναι πολύ μεγαλύτερες από τα N_q των επιφανειακών θεμελίων. Σε μαλακή άργιλο πάνω από την άμμο απαιτείται έμπηξη ≥ 10D στην άμμο.</span>') },
  { title: 'Ομάδες πασσάλων – απόδοση και μπλοκ', html: eqs(['η = 1 - \\frac{θ}{90°}\\,\\frac{(n_1-1)n_2 + (n_2-1)n_1}{n_1 n_2},\\quad θ = \\arctan\\frac{D}{s}', 'Q_{g} = \\min\\left(n\\,η\\,Q_u,\\; Q_{block}\\right)', 'Q_{block} = 2(B_g+L_g)\\,L\\,c_u + B_g L_g\\,c_u\\,N_c^*', 'N_c^* = 5\\left(1+0.2\\frac{B_g}{L_g}\\right)\\left(1+0.2\\frac{L}{B_g}\\right) \\le 9']) + p('<span class="who">Converse–Labarre: n₁ × n₂ πάσσαλοι. Σε άμμο η απόδοση ομάδας εμπηγνυόμενων πασσάλων μπορεί να ξεπερνά το 1 (συμπύκνωση), συνήθως λαμβάνεται η = 1.</span>') },
  { title: 'Καθίζηση ομάδας – ισοδύναμη κοιτόστρωση', html: eqs(['\\text{πάσσαλοι τριβής: κοιτόστρωση σε βάθος } \\tfrac{2}{3}L,\\quad \\text{πάσσαλοι αιχμής: στη στάθμη αιχμής}', 'Δσ(z\') = \\frac{Q_g}{(B_g+z\')(L_g+z\')}\\quad\\text{(2:1)}', 'Δh_i = \\frac{H_i\\,c_c}{1+e_0}\\log\\frac{σ\'_{v0}+Δσ}{σ\'_{v0}}\\quad\\text{(NC άργιλος)}']) },
  { title: 'Ελαστική καθίζηση μεμονωμένου πασσάλου (Vesic)', html: eqs(['S = S_1 + S_2 + S_3', 'S_1 = \\frac{(Q_{wp} + ξ Q_{ws})L}{A_p E_p},\\quad ξ = 0.5 \\;(\\text{ομοιόμορφη ή παραβολική } f_s)', 'S_2 = \\frac{C_p\\,Q_{wp}}{D\\,q_p},\\quad S_3 = \\frac{C_s\\,Q_{ws}}{L\\,q_p},\\quad C_s = \\left(0.93+0.16\\sqrt{L/D}\\right)C_p']) + table(['Έδαφος', 'Cp εμπηγνυόμενος', 'Cp φρεατοπάσσαλος'], [['Άμμος', '0.02–0.04', '0.09–0.18'], ['Άργιλος', '0.02–0.03', '0.03–0.06'], ['Ιλύς', '0.03–0.05', '0.09–0.12']]) },
  { title: 'Broms – ελεύθερη κεφαλή, άργιλος', html: eqs(['p_u = 9\\,c_u\\,D\\;\\text{ για } z > 1.5D,\\quad f = \\frac{H_u}{9c_uD}', '\\text{κοντός: } H_u\\left(e+1.5D+\\tfrac{f}{2}\\right) = 2.25\\,c_u D\\,g^2,\\; g = L-1.5D-f', '\\text{μακρύς: } H_u\\left(e+1.5D+\\tfrac{f}{2}\\right) = M_y', 'H_u = \\min(H_{u,short}, H_{u,long})']) },
  { title: 'Broms – ελεύθερη κεφαλή, άμμος', html: eqs(['p_u(z) = 3\\,γ\\,D\\,K_p\\,z,\\quad K_p = \\tan^2(45°+φ/2)', '\\text{κοντός: } H_u = \\frac{0.5\\,γ D L^3 K_p}{e+L},\\quad M_{max} = H_u(e+0.67f),\\; f = 0.82\\sqrt{\\frac{H_u}{γDK_p}}', '\\text{μακρύς: } H_u = \\frac{M_y}{e + 0.54\\sqrt{H_u/(γDK_p)}}', '\\text{κοντός ισχύει αν } M_{max} \\le M_y']) },
  { title: 'Ελαστική ανάλυση (Winkler) – μακρύς πάσσαλος', html: eqs(['β = \\left(\\frac{k_h D}{4E_pI_p}\\right)^{1/4},\\quad I_p = \\frac{πD^4}{64}', 'βL > 2.5 \\Rightarrow \\text{εύκαμπτος (μακρύς)},\\quad βL < 2.5 \\Rightarrow \\text{άκαμπτος (κοντός)}', 'y_0 = \\frac{2Hβ}{k_h D}\\;(\\text{ελεύθερη κεφαλή, μόνο } H),\\quad M_{max} \\approx 0.32\\,\\frac{H}{β}']) + p('<span class="who">k_h σε άργιλο ≈ 67·c_u/D (ενδεικτικά), σε άμμο αυξάνει γραμμικά με το βάθος, k_h = n_h·z/D.</span>') },
  { title: 'Μονάδες και σύμβολα', html: p('Q (kN), q (kPa = kN/m²), c_u (kPa), γ (kN/m³), E_p (kPa: 25 GPa = 25·10⁶ kPa), k_h (kN/m³), M (kNm), β (m⁻¹).') + p('<span class="who">Δείκτες: p = αιχμή (point), s = κορμός (shaft), u = οριακό (ultimate), all = επιτρεπόμενο, g = ομάδα (group), w = φορτίο λειτουργίας (working).</span>') }
];

APP.init({ appName: 'Διαδραστικά Παραδείγματα · Πάσσαλοι', version: 'v1.0', desc: 'Παραδείγματα πασσάλων υπό κατακόρυφη και πλευρική φόρτιση', uni: 'Πανεπιστήμιο Πατρών · Τμήμα Πολιτικών Μηχανικών', title: 'Πάσσαλοι', subtitle: 'Θεμελιώσεις · Παραδείγματα εφαρμογής', kicker: 'Πάσσαλοι', footer: 'Παραδείγματα βασισμένα στην ύλη του μαθήματος Θεμελιώσεις (17.1.0): πάσσαλοι υπό κατακόρυφη και πλευρική φόρτιση.', exercises: EX, sheet: SHEET });
