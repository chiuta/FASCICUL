#!/usr/bin/env node
// Asamblează fascicul.html (un singur fișier) din src/app.html + fascicul-releu.js.
'use strict';
const fs = require('fs'), path = require('path');
const dir = __dirname;
const app = fs.readFileSync(path.join(dir, 'src', 'app.html'), 'utf8');
const relay = fs.readFileSync(path.join(dir, 'fascicul-releu.js'), 'utf8');
if (/<\/script/i.test(relay)) throw new Error('releul conține </script');
const MARK = '/*__RELAY_SRC__*/';
if (app.split(MARK).length !== 2) throw new Error('marcajul releului lipsește sau e dublat');
const out = app.replace(MARK, () => relay);
fs.writeFileSync(path.join(dir, 'fascicul.html'), out);
// index.html = aceeași aplicație, pentru GitHub Pages (https://chiuta.github.io/FASCICUL/)
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('fascicul.html + index.html: ' + out.length + ' octeți');
