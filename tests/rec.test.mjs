// FASCICUL 2.0 — sesiuni înregistrate: jurnal de evenimente, redare, export PDF / GIF, salvare/încărcare.
import fs from "fs";
import {launch, check, summary} from "./_lib.mjs";

async function draw(page, pts) {
  const b = await page.locator("#cv").boundingBox();
  await page.mouse.move(b.x + pts[0][0] * b.width, b.y + pts[0][1] * b.height);
  await page.mouse.down();
  for (const [x, y] of pts.slice(1)) await page.mouse.move(b.x + x * b.width, b.y + y * b.height, {steps: 4});
  await page.mouse.up();
}
const pixel = (page, fx, fy) => page.evaluate(([fx, fy]) => { const c = document.getElementById("rpCv"), d = c.getContext("2d").getImageData(Math.round(fx * c.width), Math.round(fy * c.height), 1, 1).data; return [d[0], d[1], d[2]]; }, [fx, fy]);
const lit = ([r, g, b]) => r + g + b > 400;
const bandLit = (page, fx, y0, y1) => page.evaluate(([fx, y0, y1]) => { const c = document.getElementById("rpCv"), x = c.getContext("2d"); for (let y = y0; y <= y1; y += .004) { const d = x.getImageData(Math.round(fx * c.width), Math.round(y * c.height), 1, 1).data; if (d[0] + d[1] + d[2] > 400) return true; } return false; }, [fx, y0, y1]);

console.log("1. înregistrare, redare");
const {browser, page, st, ctx} = await launch({w: 1280, h: 800, init: () => { try { localStorage.setItem("fsc_lang", "ro"); } catch (e) {} }});
await page.click("#goHost");
await page.waitForSelector("#board.on");
await page.evaluate(() => document.querySelectorAll(".modal.on").forEach(m => m.classList.remove("on")));
await draw(page, [[.2, .3], [.4, .3]]); // înainte de înregistrare: se vede în sămânță
check("butonul de înregistrare există", await page.isVisible("#bRec"));
await page.click("#bRec");
check("înregistrarea pornește (aria-pressed)", (await page.getAttribute("#bRec", "aria-pressed")) === "true");
await draw(page, [[.3, .6], [.5, .62], [.7, .6]]);
await page.waitForTimeout(300);
await page.click('.tb[data-t="note"]');
const b = await page.locator("#cv").boundingBox();
await page.mouse.click(b.x + b.width * .6, b.y + b.height * .25);
await page.fill("#dlgT", "Nota din înregistrare");
await page.click("#dlgOk");
await page.waitForTimeout(300);
await page.click("#bRec");
check("înregistrarea s-a oprit", (await page.getAttribute("#bRec", "aria-pressed")) === "false");
await page.click("#bRecs");
await page.waitForSelector("#rec.on");
const info = await page.textContent("#rpInfo");
check("panoul arată evenimentele înregistrate (sămânță + desen + notă)", /^\d+ evenimente/.test(info) && parseInt(info) >= 5, info);
// final = tot ce e pe tablă
check("la final apare trasul din timpul înregistrării", await bandLit(page, .5, .5, .7));
await page.fill("#rpSeek", "0"); await page.dispatchEvent("#rpSeek", "input");
check("la început nu există încă trasul din timpul înregistrării", !(await bandLit(page, .5, .5, .7)));
check("la început există trasul din sămânță (făcut înainte de pornire)", await bandLit(page, .3, .2, .4));
await page.click("#rpPlay");
await page.waitForFunction(() => /Redă/.test(document.getElementById("rpPlay").textContent), null, {timeout: 20000});
check("redarea ajunge la capăt și se oprește", true);
check("după redare trasul e vizibil", await bandLit(page, .5, .5, .7));
await page.fill("#rpSeek", "500"); await page.dispatchEvent("#rpSeek", "input");
check("poziția se actualizează la derulare", /^0:\d\d \/ 0:\d\d$/.test(await page.textContent("#rpTime")));

console.log("2. export PDF și GIF, salvare/încărcare");
let dl = page.waitForEvent("download");
await page.click("#rpPdf");
const pdfPath = await (await dl).path();
const pdf = fs.readFileSync(pdfPath);
check("PDF valid (antet, EOF, /Count ≥ 1, DCT)", pdf.slice(0, 5).toString() === "%PDF-" && pdf.slice(-6).toString().includes("%%EOF") && /\/Count [1-9]/.test(pdf.toString("latin1")) && pdf.toString("latin1").includes("DCTDecode"));
fs.copyFileSync(pdfPath, "/tmp/fsc-test.pdf");
dl = page.waitForEvent("download");
await page.click("#rpGif");
const gifPath = await (await dl).path();
const gif = fs.readFileSync(gifPath);
check("GIF89a cu dimensiuni 480×270 și terminator", gif.slice(0, 6).toString() === "GIF89a" && gif.readUInt16LE(6) === 480 && gif.readUInt16LE(8) === 270 && gif[gif.length - 1] === 0x3B);
fs.copyFileSync(gifPath, "/tmp/fsc-test.gif");
// GIF decodat de browser
const gdim = await page.evaluate(async b64 => { const im = new Image(); im.src = "data:image/gif;base64," + b64; await im.decode(); return [im.naturalWidth, im.naturalHeight]; }, gif.toString("base64"));
check("browserul decodează GIF-ul", gdim[0] === 480 && gdim[1] === 270, gdim);
dl = page.waitForEvent("download");
await page.click("#rpSave");
const jpath = await (await dl).path();
const J = JSON.parse(fs.readFileSync(jpath, "utf8"));
check("JSON salvat: fascicul_rec=1 cu evenimente", J.fascicul_rec === 1 && J.ev.length >= 5 && typeof J.ev[0].t === "number");
fs.copyFileSync(jpath, "/tmp/fsc-test.rec.json");

console.log("3. încărcare într-o pagină nouă");
const p2 = await ctx.newPage();
await p2.addInitScript(() => { try { localStorage.setItem("fsc_lang", "ro"); } catch (e) {} });
await p2.goto("file://" + process.cwd() + "/index.html");
await p2.click("#goHost"); await p2.waitForSelector("#board.on");
await p2.evaluate(() => document.querySelectorAll(".modal.on").forEach(m => m.classList.remove("on")));
await p2.click("#bRecs");
check("pagină nouă: nicio înregistrare, butoanele dezactivate", (await p2.textContent("#rpInfo")).includes("Nicio") && await p2.isDisabled("#rpPlay"));
await p2.setInputFiles("#rpFile", jpath);
await p2.waitForFunction(() => /^\d+ evenimente/.test(document.getElementById("rpInfo").textContent), null, {timeout: 8000});
check("înregistrarea încărcată se redă (trasul apare la final)", await bandLit(p2, .5, .5, .7));
fs.writeFileSync("/tmp/fsc-bad.json", '{"fascicul_rec":1,"ev":"x"}');
await p2.setInputFiles("#rpFile", "/tmp/fsc-bad.json");
await p2.waitForTimeout(400);
check("fișier invalid respins fără excepție", (await p2.textContent("#toast")).includes("nu este o înregistrare"));
// injecție: evenimente cu câmpuri ostile sunt curățate
fs.writeFileSync("/tmp/fsc-evil.json", JSON.stringify({fascicul_rec: 1, ev: [{t: 0, m: {o: "add", ob: {id: "a b", k: "n", x: 1, y: 1, t: "x"}}}, {t: 10, m: {o: "add", ob: {id: "ok1", k: "n", x: 100, y: 100, w: 340, t: "<img src=x onerror=alert(1)>", c: "red;x"}}}, {t: 20, m: {o: "zzz"}}]}));
await p2.setInputFiles("#rpFile", "/tmp/fsc-evil.json");
await p2.waitForFunction(() => /^1 evenimente/.test(document.getElementById("rpInfo").textContent), null, {timeout: 8000});
check("evenimentele nevalide sunt eliminate (rămâne 1)", true);
check("fără erori de pagină și rețea", st.errs.length === 0 && st.net.length === 0, [st.errs, st.net]);
check("fără violări CSP", (await page.evaluate(() => window.__csp)).length === 0);
await browser.close();
summary();
