#!/usr/bin/env bash
# Build the apps and publish them to GitHub Pages (main + gh-pages). Usage: ./publish.sh "μήνυμα"
set -e
cd "$(dirname "$0")"
(cd src && node test.js ex_settle.js >/dev/null && node test.js ex_bearing.js >/dev/null && node test.js ex_piles.js >/dev/null && node build.js)
git add -A
git commit -q -m "${1:-Ενημέρωση διαδραστικών ασκήσεων}" || echo "nothing to commit"
git push -q origin main && git push -q -f origin main:gh-pages
echo "published: https://takispelekis-lgtm.github.io/foundations-exercises/"
