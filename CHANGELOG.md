# Jurnal de modificări — FASCICUL

## 2.1.5 — 2026-11-08
Doar documentare + sincronizare: README (EN/RO) are un tabel «testat / netestat» (Chromium emulat și releul = testate; telefoane Android reale, iOS, Firefox/Safari, proiector și rețele reale = netestate; fără rezultate inventate). `fascicul.html` reconstruit din `src/app.html` (rămăsese în urmă față de sursă); versiunea sincronizată în sursă.

## 2.1.2 — 2026-11-03

Destinații «Trimite către…» pentru pașaportul de învățare: adăugate FENARIUM și MENSURA (registrul de aplicații-țintă reinjectat din hub).

## 2.1.1 — 2026-11-03

Pașaport de învățare comun (FFF): „Notează în pașaport”, repetări eșalonate, export/import passport/fff și certificat tipărabil auto-declarat; local, fără server.

## 2.1.0 — 2026-11-02 (reîmprospătare kit)

- Nou (kit): **Sincronizare între dispozitive** (`FFF.sync`) — în dialogul «Transparență» (clic pe versiune → Copie de siguranță): conectezi două dispozitive direct (WebRTC, cod/QR, fără server și fără cont) și își schimbă datele aplicației; cea mai recentă valoare câștigă, secretele (chei API, parole) nu se trimit, ștergerile nu se propagă. Aplicarea trece prin importul kitului (confirmare, chei permise, rollback).
- Nou (kit): **Istoric local — «mașina timpului»** (`FFF.history`) — instantanee automate ale datelor (IndexedDB, fără secrete), diferență față de starea curentă și restaurare reversibilă; «Șterge datele aplicației» șterge și istoricul.
- Module adăugate: `qr`, `p2p`, `sync`, `history` (+~140 KB). Versiunea aplicației nu se schimbă.

## 2.1.0 — 2026-10-27 (anterior: 2.0.1)
- Nou: ghid animat pas cu pas, direct în aplicație, pe pagina de start (secțiune pliabilă „Ghid animat pas cu pas (în loc de video)”): 5 pași (aceeași rețea, pornește ecranul, scanează codul, aprobă telefonul, ce faci dacă nu se conectează), butoane Înapoi / Înainte, redare automată doar la cerere, animații dezactivate la `prefers-reduced-motion`. Text în cele 8 limbi (RO și EN scrise; fr/it/es/pt/de/hu traducere automată, neverificată nativ). Nu este un videoclip: nu s-a produs nicio înregistrare video.
- Test nou `tests/guide.test.mjs` (24 verificări, inclusiv cele 8 limbi). Rulate și cele existente: `tests/rec.test.mjs` 20/20, `test/relay.test.js` 16/16.
- Neimplementat: videoclip real (nu pot înregistra); test pe iOS Safari real (necesită dispozitiv).

## 2.0.1 — 2026-10-27 (anterior: 2.0.0)
Doar documentare; logica aplicației nu s-a schimbat (doar numărul versiunii).
- README (EN, RO): secțiunea „Netestat pe iOS și ghid de conectare în text”. Aplicația NU a fost testată pe iPhone/iPad real.
- „Stare: experimental” și „Offline” în toate cele 8 README.
- Neimplementat: ghid video (planificat), testare pe iOS Safari real (necesită dispozitiv).
