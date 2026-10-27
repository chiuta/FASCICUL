// FASCICUL 2.1.0 — ghid animat pas cu pas în aplicație (în loc de video)
import {launch, check, summary} from "./_lib.mjs";
const LANGS = ["ro", "en", "fr", "it", "es", "pt", "de", "hu"];
const {browser, page, st} = await launch({w: 1000, h: 900, init: () => { try { localStorage.setItem("fsc_lang", "ro"); } catch (e) {} }});
check("ghidul există pe pagina de start", await page.locator("#gd").count() === 1);
check("ghidul e închis implicit", !(await page.evaluate(() => document.getElementById("gd").open)));
await page.evaluate(() => { document.getElementById("gd").open = true; });
check("pasul 1 din 5 (RO)", (await page.textContent("#gdN")) === "Pasul 1 din 5", await page.textContent("#gdN"));
check("Înapoi dezactivat la primul pas", await page.isDisabled("#gdPrev"));
for (let i = 2; i <= 5; i++) { await page.click("#gdNext"); check("pasul " + i, (await page.textContent("#gdN")) === `Pasul ${i} din 5`); }
check("Înainte dezactivat la ultimul pas", await page.isDisabled("#gdNext"));
check("ultimul pas vorbește despre împerechere manuală", /manual/i.test(await page.textContent("#gdD")));
await page.click("#gdPrev");
check("Înapoi funcționează", (await page.textContent("#gdN")) === "Pasul 4 din 5");
// redare automată: pornește și se oprește la cerere
await page.click("#gdPlay");
check("redare automată pornită (aria-pressed)", (await page.getAttribute("#gdPlay", "aria-pressed")) === "true");
await page.click("#gdPlay");
check("redare automată oprită", (await page.getAttribute("#gdPlay", "aria-pressed")) === "false");
// toate limbile: titlu + descriere nenule, fără chei goale
for (const L of LANGS) {
  await page.evaluate(l => { const s = document.querySelector(".langsel"); s.value = l; s.dispatchEvent(new Event("change", {bubbles: true})); }, L);
  let okAll = true; const seen = new Set();
  await page.evaluate(() => { document.getElementById("gd").open = true; for (let i = 0; i < 6; i++) { const b = document.getElementById("gdPrev"); if (!b.disabled) b.click(); } });
  for (let i = 0; i < 5; i++) {
    const t = await page.textContent("#gdT"), d = await page.textContent("#gdD");
    if (!t || !d || /^gd\./.test(d) || /gd\.(t|d)\d/.test(t + d)) okAll = false;
    seen.add(d);
    if (!(await page.isDisabled("#gdNext"))) await page.click("#gdNext");
  }
  check("limba " + L + ": 5 pași distincți, fără chei lipsă", okAll && seen.size === 5, [...seen].length);
  await page.evaluate(() => { for (let i = 0; i < 6; i++) { const b = document.getElementById("gdPrev"); if (!b.disabled) b.click(); } });
}
check("fără orizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 0);
check("fără erori", st.errs.length === 0, st.errs);
check("fără cereri de rețea", st.net.length === 0, st.net);
await browser.close(); summary();
