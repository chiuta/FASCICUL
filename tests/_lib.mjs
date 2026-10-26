// Ajutoare comune pentru testele Playwright (rețea blocată, CSP real, axe opțional).
// [fff-portable] axe-core: FFF_AXE / AXE_PATH, apoi pachetul `axe-core` (npm i -D axe-core). Dacă lipsește: undefined (testele cu axe pică cu mesaj clar).
import {createRequire as __fffCR} from 'node:module';
const __fffAxe = () => process.env.FFF_AXE || process.env.AXE_PATH || (() => { try { return __fffCR(import.meta.url).resolve('axe-core/axe.min.js'); } catch { return undefined; } })();
import {createRequire} from "module";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
const require = createRequire(process.env.PW_ROOT || import.meta.url);
export const {chromium} = require("playwright");
export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const INDEX = path.resolve(HERE, "..", "index.html");
const AXE_PATH = process.env.AXE_PATH || __fffAxe();
export const AXE = (AXE_PATH && fs.existsSync(AXE_PATH)) ? fs.readFileSync(AXE_PATH, "utf8") : null;
let fails = 0, passes = 0;
export function check(name, cond, extra) { if (cond) { passes++; console.log("  ok  " + name); } else { fails++; console.log("FAIL  " + name + (extra !== undefined ? "  -> " + JSON.stringify(extra) : "")); } }
export function summary() { console.log(`\n${passes} reușite, ${fails} eșuate`); process.exit(fails ? 1 : 0); }
export async function launch({w = 1280, h = 800, args = [], perm = [], bypassCSP = false, colorScheme, reducedMotion, init, file} = {}) {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args});
  const ctx = await browser.newContext({viewport: {width: w, height: h}, bypassCSP, permissions: perm, colorScheme, reducedMotion, acceptDownloads: true});
  await ctx.route(/^https?:/, r => r.abort());
  const page = await ctx.newPage();
  const st = {errs: [], net: [], csp: []};
  page.on("pageerror", e => st.errs.push(String(e)));
  page.on("console", m => { if (m.type() === "error") st.errs.push("console:" + m.text()); });
  page.on("request", r => { if (/^https?:/.test(r.url())) st.net.push(r.url()); });
  await page.addInitScript(() => { window.__csp = []; document.addEventListener("securitypolicyviolation", e => window.__csp.push(e.violatedDirective + " " + e.blockedURI)); });
  if (init) await page.addInitScript(init);
  await page.goto("file://" + (file || INDEX));
  return {browser, ctx, page, st};
}
export async function axeRun(page) {
  if (!AXE) return null;
  await page.addScriptTag({content: AXE});
  return page.evaluate(async () => { const r = await window.axe.run(document, {resultTypes: ["violations"]}); return r.violations.map(v => v.id + ":" + v.nodes.length + ":" + v.nodes.slice(0, 2).map(n => n.target.join(" ")).join("|")); });
}
export async function hOverflow(page) { return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); }

// Verificări pentru kitul fff-kit lipit în pagină: Transparență (etichetă) + copie de siguranță (export/import/ștergere).
export async function kitSmoke(page, slug, [seedKey, seedVal]) {
  const fs = await import("fs");
  check(`kit (${slug}): FFF.core/label/bundle încărcate`, await page.evaluate(() => !!(window.FFF && FFF.label && FFF.bundle && FFF.store)));
  check(`kit (${slug}): slug corect`, (await page.evaluate(() => FFF.app && FFF.app.slug)) === slug);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [seedKey, seedVal]);
  const dl = page.waitForEvent("download");
  await page.evaluate(() => FFF.bundle.export());
  const J = JSON.parse(fs.readFileSync(await (await dl).path(), "utf8"));
  check(`kit (${slug}): export .fff.json cu format, aplicație și cheia aplicației`, J.format === "fff-bundle" && J.app === slug && J.data[seedKey] === seedVal, [J.format, J.app, Object.keys(J.data)]);
  await page.evaluate(k => localStorage.removeItem(k), seedKey);
  const r = await page.evaluate(async t => { const x = await FFF.bundle.import(new File([t], "b.fff.json"), {confirm: false, reload: false}); return x; }, JSON.stringify(J));
  check(`kit (${slug}): importul restabilește cheia`, (await page.evaluate(k => localStorage.getItem(k), seedKey)) === seedVal && r.keys >= 1, r);
  const w = await page.evaluate(() => FFF.bundle.wipe({confirm: false, reload: false}));
  check(`kit (${slug}): ștergerea scoate cheia aplicației`, (await page.evaluate(k => localStorage.getItem(k), seedKey)) === null && w.keys >= 1, w);
}
export async function kitLabel(page, slug) {
  await page.click("#app-version");
  const d = page.locator("dialog.fff-dlg").first();
  check(`kit (${slug}): fereastra Transparență se deschide din versiune`, await d.isVisible());
  const t = await d.innerText();
  check(`kit (${slug}): afișează 0 cereri externe și SHA-256`, /0 cereri externe/i.test(t) && /SHA-256/i.test(t), t.slice(0, 300));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}

// FFF.dialog (kit 1.2.0) înlocuiește window.confirm: răspunde la dialogul <dialog data-fff-dialog> (yes = ultimul buton, no = primul). Se apelează ÎNAINTE de acțiune, apoi `await r.done`.
export function answerDialog(page, yes = true, timeout = 2500) {
  const out = {msg: "", shown: false};
  out.done = (async () => {
    try {
      await page.waitForSelector("dialog[data-fff-dialog][open]", {timeout, state: "attached"});
      out.msg = await page.evaluate(() => { const d = document.querySelector("dialog[data-fff-dialog]"); const m = document.getElementById(d.getAttribute("aria-describedby") || d.getAttribute("aria-labelledby")); return m ? m.textContent : ""; });
      const b = page.locator("dialog[data-fff-dialog] button");
      await (yes ? b.last() : b.first()).click();
      out.shown = true;
    } catch (e) { out.shown = false; }
  })();
  return out;
}
