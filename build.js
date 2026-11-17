#!/usr/bin/env node
// Asamblează fascicul.html (un singur fișier) din src/app.html + fascicul-releu.js.   (node build.js --from-index: vezi mai jos)
'use strict';
const fs = require('fs'), path = require('path');
const dir = __dirname;
const app = fs.readFileSync(path.join(dir, 'src', 'app.html'), 'utf8');
const relay = fs.readFileSync(path.join(dir, 'fascicul-releu.js'), 'utf8');
if (/<\/script/i.test(relay)) throw new Error('releul conține </script');
const MARK = '/*__RELAY_SRC__*/';
// node build.js --from-index: după ce kitul (fff-kit/build.mjs release) sau lower.mjs au modificat index.html pe loc, aduce modificările înapoi în sursă
// (releul revine la marcaj), ca un build ulterior să nu le piardă; apoi node build.js refolosește exact același conținut.
if (process.argv.includes('--from-index')) {
  const idx = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  if (idx.split(relay).length !== 2) throw new Error('releul din index.html nu coincide cu fascicul-releu.js (trebuie să apară exact o dată)');
  fs.writeFileSync(path.join(dir, 'src', 'app.html'), idx.replace(relay, () => MARK));
  console.log('src/app.html rescris din index.html');
  process.exit(0);
}
if (app.split(MARK).length !== 2) throw new Error('marcajul releului lipsește sau e dublat');
const out = app.replace(MARK, () => relay);
fs.writeFileSync(path.join(dir, 'fascicul.html'), out);
// index.html = aceeași aplicație, pentru GitHub Pages (https://chiuta.github.io/FASCICUL/)
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('fascicul.html + index.html: ' + out.length + ' octeți');
