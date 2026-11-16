// Build standalone HTML apps: node build.js
// Produces ../<name>.html (full documents for local use) and <scratch>/artifact/<name>.html (fragments for claude.ai artifacts)
const fs = require('fs'), path = require('path');
const src = __dirname, outLocal = path.join(src, '..');
const outArtifact = process.argv[2] || path.join(src, '..', '_artifact');
fs.mkdirSync(outArtifact, { recursive: true });
const css = fs.readFileSync(path.join(src, 'engine.css'), 'utf8');
const engine = fs.readFileSync(path.join(src, 'engine.js'), 'utf8');
const apps = [
  { file: 'bearing.html', content: 'ex_bearing.js', title: 'Φέρουσα Ικανότητα', desc: 'Διαδραστικές ασκήσεις φέρουσας ικανότητας επιφανειακών θεμελιώσεων και τοίχων αντιστήριξης' },
  { file: 'settlements.html', content: 'ex_settle.js', title: 'Καθιζήσεις', desc: 'Διαδραστικές ασκήσεις καθιζήσεων επιφανειακών θεμελιώσεων' },
  { file: 'piles.html', content: 'ex_piles.js', title: 'Πάσσαλοι', desc: 'Διαδραστικά παραδείγματα πασσάλων υπό κατακόρυφη και πλευρική φόρτιση' }
];
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,400;0,600;1,400&family=Fira+Sans+Condensed:wght@600;700&family=STIX+Two+Text:ital,wght@0,400;0,600;1,400&display=swap">';
for (const a of apps) {
  const cp = path.join(src, a.content);
  if (!fs.existsSync(cp)) { console.log('skip', a.file, '(no', a.content + ')'); continue; }
  const content = fs.readFileSync(cp, 'utf8');
  const body = '<title>' + a.title + ' · Θεμελιώσεις</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' + fonts + '\n<style>\n' + css + '\n</style>\n' +
    '<script>\n' + engine + '\n</script>\n<script>\n' + content + '\n</script>\n';
  fs.writeFileSync(path.join(outArtifact, a.file), body, 'utf8');
  const full = '<!doctype html>\n<html lang="el">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n/, '') + '</head>\n<body></body>\n</html>\n';
  fs.writeFileSync(path.join(outLocal, a.file), full, 'utf8');
  console.log('built', a.file, Math.round(full.length / 1024) + ' KB');
}
