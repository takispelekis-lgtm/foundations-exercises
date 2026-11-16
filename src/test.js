// node test.js ex_bearing.js  -> runs compute()/figure()/steps for every exercise with default data, prints key results
const fs = require('fs'), path = require('path'), vm = require('vm');
const file = process.argv[2];
const ctx = {
  console: console, Math: Math, Number: Number, String: String, Array: Array, Object: Object, isNaN: isNaN, isFinite: isFinite, parseFloat: parseFloat,
  document: { body: null, addEventListener: function () { }, title: '' }, window: {}, location: { hash: '' }, history: { replaceState: function () { } }, matchMedia: function () { return { matches: false }; }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8'), ctx, { filename: 'engine.js' });
vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), ctx, { filename: file });
const EX = ctx.EX;
let bad = 0;
for (const e of EX) {
  const q = {}; (e.givens || []).forEach(g => q[g.key] = g.value);
  try {
    const r = e.compute(q);
    const keys = Object.keys(r).filter(k => typeof r[k] === 'number').map(k => k + '=' + (Math.abs(r[k]) >= 100 ? r[k].toFixed(1) : r[k].toFixed(3)));
    console.log('\n[' + e.id + '] ' + e.title + '\n   ' + keys.join('  '));
    for (let s = -1; s < e.steps.length; s++) { const f = e.figure(q, r, s); if (typeof f !== 'string' || f.indexOf('<svg') < 0) throw new Error('figure step ' + s); if (/NaN/.test(f)) console.log('   ! NaN in figure at step ' + s); }
    e.steps.forEach((st, i) => { const b = st.body(q, r); if (typeof b !== 'string') throw new Error('step ' + (i + 1)); if (/NaN|undefined/.test(b)) console.log('   ! NaN/undefined in step ' + (i + 1)); });
    if (e.result) { const b = e.result(q, r); if (/NaN|undefined/.test(b)) console.log('   ! NaN/undefined in result'); }
    if (e.quick) { const b = e.quick(q, r); if (/NaN|undefined/.test(b)) console.log('   ! NaN/undefined in quick'); }
    if (/NaN|undefined/.test(e.statement)) console.log('   ! NaN/undefined in statement');
  } catch (err) { bad++; console.log('\n[' + e.id + '] ERROR: ' + err.stack); }
}
(ctx.SHEET || []).forEach((c, i) => { if (typeof c.html !== 'string') { bad++; console.log('sheet card ' + i + ' bad'); } });
console.log('\n' + EX.length + ' exercises, ' + bad + ' errors, ' + (ctx.SHEET || []).length + ' sheet cards');
process.exit(bad ? 1 : 0);
