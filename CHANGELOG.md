# Jurnal de modificări — FASCICUL

## 2.1.0 — 2026-10-27 (anterior: 2.0.1)
- Nou: ghid animat pas cu pas, direct în aplicație, pe pagina de start (secțiune pliabilă „Ghid animat pas cu pas (în loc de video)”): 5 pași (aceeași rețea, pornește ecranul, scanează codul, aprobă telefonul, ce faci dacă nu se conectează), butoane Înapoi / Înainte, redare automată doar la cerere, animații dezactivate la `prefers-reduced-motion`. Text în cele 8 limbi (RO și EN scrise; fr/it/es/pt/de/hu traducere automată, neverificată nativ). Nu este un videoclip: nu s-a produs nicio înregistrare video.
- Test nou `tests/guide.test.mjs` (24 verificări, inclusiv cele 8 limbi). Rulate și cele existente: `tests/rec.test.mjs` 20/20, `test/relay.test.js` 16/16.
- Neimplementat: videoclip real (nu pot înregistra); test pe iOS Safari real (necesită dispozitiv).

## 2.0.1 — 2026-10-27 (anterior: 2.0.0)
Doar documentare; logica aplicației nu s-a schimbat (doar numărul versiunii).
- README (EN, RO): secțiunea „Netestat pe iOS și ghid de conectare în text”. Aplicația NU a fost testată pe iPhone/iPad real.
- „Stare: experimental” și „Offline” în toate cele 8 README.
- Neimplementat: ghid video (planificat), testare pe iOS Safari real (necesită dispozitiv).
