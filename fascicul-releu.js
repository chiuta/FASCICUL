#!/usr/bin/env node
// FASCICUL — releu de semnalizare compatibil ntfy (subset). Fără dependențe.
//
// Pornire (Termux pe telefonul-hotspot):   node fascicul-releu.js
// Variabile:  PORT=8080  HOST=0.0.0.0  ALLOW_ORIGIN=https://exemplu.ro,https://alt.ro
//
// Dacă fascicul.html e în același folder, releul îl servește la adresa de bază,
// iar telefoanele nu mai au nevoie să primească fișierul separat.
// Releul NU stochează nimic și NU vede conținutul tablei: doar transmite
// mesajele scurte de conectare (coduri SDP) între cei din aceeași cameră.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');

const PORT = +process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const APP = path.join(__dirname, 'fascicul.html');
const EXTRA_ORIGINS = (process.env.ALLOW_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);

const MAX_BODY = 16384;      // octeți per mesaj
const MAX_SUBS = 64;         // conexiuni SSE simultane, în total
const MAX_TOPICS = 16;       // camere simultane
const RATE_N = 120, RATE_MS = 10000;   // cereri / IP / fereastră
const TOPIC_RE = /^[A-Za-z0-9_-]{6,64}$/;

const topics = new Map();    // topic -> Set<res>
let subCount = 0;
const hits = new Map();      // ip -> [timestamps]

const ipOf = req => String(req.socket.remoteAddress || '').replace(/^::ffff:/, '');
function limited(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < RATE_MS);
  a.push(now); hits.set(ip, a);
  return a.length > RATE_N;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, a] of hits) if (!a.length || now - a[a.length - 1] > RATE_MS) hits.delete(ip);
}, 30000).unref();

// Originea cererii: fișier local ("null"), același releu sau adrese din rețele private.
function originOk(origin, req) {
  if (!origin) return true;
  if (origin === 'null') return true;
  if (EXTRA_ORIGINS.includes(origin)) return true;
  try {
    const u = new URL(origin), h = u.hostname;
    if (req.headers.host && u.host === req.headers.host) return true;
    if (h === 'localhost' || h.endsWith('.local')) return true;
    const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (m) {
      const a = +m[1], b = +m[2];
      return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
    }
  } catch (e) {}
  return false;
}

function send(res, code, type, body, extra) {
  res.writeHead(code, Object.assign({
    'Content-Type': type, 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer'
  }, extra || {}));
  res.end(body);
}

function handle(req, res) {
  const origin = req.headers.origin;
  if (!originOk(origin, req)) return send(res, 403, 'text/plain', 'origin refuzat');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const ip = ipOf(req);
  let p;
  try { p = new URL(req.url, 'http://x').pathname; } catch (e) { return send(res, 400, 'text/plain', 'url invalid'); }

  if (p === '/fsc-health') return send(res, 200, 'text/plain', 'fascicul-relay');

  if (p === '/' || p === '/fascicul.html') {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'text/plain', '');
    fs.readFile(APP, (err, buf) => {
      if (err) return send(res, 404, 'text/plain; charset=utf-8', 'Pune fascicul.html lângă fascicul-releu.js');
      send(res, 200, 'text/html; charset=utf-8', req.method === 'HEAD' ? '' : buf);
    });
    return;
  }

  const m = p.match(/^\/([^/]+)(\/sse)?$/);
  if (!m || !TOPIC_RE.test(m[1])) return send(res, 404, 'text/plain', '');
  const topic = m[1];
  if (limited(ip)) return send(res, 429, 'text/plain', 'prea multe cereri');

  // abonare (Server-Sent Events), ca la ntfy
  if (req.method === 'GET' && m[2]) {
    if (subCount >= MAX_SUBS || (!topics.has(topic) && topics.size >= MAX_TOPICS)) return send(res, 503, 'text/plain', 'plin');
    res.writeHead(200, {
      'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store',
      'Connection': 'keep-alive', 'X-Accel-Buffering': 'no', 'X-Content-Type-Options': 'nosniff'
    });
    res.write('data: {"event":"open"}\n\n');
    if (!topics.has(topic)) topics.set(topic, new Set());
    topics.get(topic).add(res);
    subCount++;
    const keep = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 25000);
    let closed = false;
    const done = () => {
      if (closed) return; closed = true;
      clearInterval(keep); subCount--;
      const s = topics.get(topic);
      if (s) { s.delete(res); if (!s.size) topics.delete(topic); }
    };
    req.on('close', done); res.on('close', done); res.on('error', done);
    return;
  }

  // publicare
  if (req.method === 'POST') {
    let body = '', over = false;
    req.on('data', c => {
      if (over) return;
      body += c;
      if (body.length > MAX_BODY) { over = true; send(res, 413, 'text/plain', 'prea mare'); req.destroy(); }
    });
    req.on('end', () => {
      if (over) return;
      const ev = JSON.stringify({
        id: Date.now().toString(36), time: Math.floor(Date.now() / 1000),
        event: 'message', topic, message: body, ip   // ip = adresa expeditorului, văzută de releu
      });
      const subs = topics.get(topic);
      if (subs) for (const r of subs) {
        try { r.write('data: ' + ev + '\n\n'); if (r.writableLength > 1048576) r.destroy(); } catch (e) {}
      }
      send(res, 200, 'application/json', ev);
    });
    return;
  }
  send(res, 405, 'text/plain', '');
}
const server = http.createServer((req, res) => {
  try { handle(req, res); }
  catch (e) { console.error('eroare cerere:', e.message); try { send(res, 500, 'text/plain', ''); } catch (x) {} }
});

server.on('clientError', (e, sock) => { try { sock.destroy(); } catch (x) {} });
function addrs() {
  try {
    const out = [];
    for (const l of Object.values(os.networkInterfaces()))
      for (const i of l || []) if ((i.family === 'IPv4' || i.family === 4) && !i.internal) out.push(i.address);
    return out;
  } catch (e) { return null; }   // ex. Termux pe Android 11+ poate refuza listarea
}
let lastA = null;
function announce() {
  const a = addrs();
  if (a === null) { if (lastA === null) { lastA = 'n/a'; console.log('  (nu pot lista adresele aici — află-o cu:  ip addr  sau  ifconfig)'); } return; }
  const k = a.join(',');
  if (k === lastA) return;
  lastA = k;
  if (!a.length) { console.log('  (nicio rețea activă încă — pornește hotspotul)'); return; }
  console.log('Adrese pentru ecran / telefoane:');
  a.forEach(x => console.log('  http://' + x + ':' + PORT));
}
server.on('error', e => { console.error('Nu pot porni releul:', e.message); process.exit(1); });
server.listen(PORT, HOST, () => {
  console.log('FASCICUL releu pornit pe portul ' + PORT + '.');
  announce();
  setInterval(announce, 5000).unref();
  console.log(fs.existsSync(APP) ? 'Servesc și fascicul.html de la adresa de bază.' : 'fascicul.html nu e în acest folder — doar semnalizare.');
});
process.on('uncaughtException', e => console.error('eroare neprevăzută:', e && e.message));
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => process.exit(0));
