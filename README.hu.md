# FASCICUL

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Magyar**

**Verzió:** 1.2.9 · **Utolsó frissítés:** 2026-10-26

A felület nyelvei: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

**Telefonok ↔ projektor.** Egyetlen HTML-fájl (`fascicul.html`), amely összekapcsolja a résztvevők telefonjait a projektorhoz csatlakoztatott eszközzel, és közös táblát ad nekik: rajz, jegyzetek, képek, lézermutató, élő kamera. Fiók nélkül, követés nélkül, harmadik felek szerverei nélkül, függőségek nélkül. A „határok nélkül” / trade‑free sorozat része.

A tábla tartalma **közvetlenül az eszközök között** halad (WebRTC), nem megy át egyetlen szerveren sem.

## Gyorsindítás

1. Minden eszköz ugyanazon a hálózaton (Wi‑Fi vagy egy telefon hotspotja).
2. A projektornál lévő eszközön nyisd meg a `fascicul.html` fájlt, és válaszd a **Képernyő** lehetőséget. Megjelenik egy QR-kód.
3. A telefonokon olvasd be a kódot a **Kamera** alkalmazással: megnyílik az oldal, és a telefon magától csatlakozik. A képernyő minden új telefonnál jóváhagyást kér (kikapcsolható).

A 3. lépéshez a telefonoknak szükségük van az alkalmazásra. Három lehetőség:

| Változat | Hogyan | Megjegyzések |
|---|---|---|
| **Relé a hotspot‑telefonon** (ajánlott) | `node fascicul-releu.js` Termuxban, lásd lent | A relé az alkalmazást is kiszolgálja; a többi telefonra semmit sem kell telepíteni |
| **Webcím** | nyisd meg a <https://chiuta.github.io/FASCICUL/> címet, vagy tedd a `fascicul.html` fájlt bármely statikus tárhelyre (YunoHost…) | HTTPS ⇒ a fényképezőgép, a QR-olvasás és az élő kamera mindenhol működik |
| **Elküldött fájl** | küldd el a `fascicul.html` fájlt a telefonokra | „Kézi párosítást” használ (telefononként két QR-kód) |

## Relé a hotspot‑telefonon (Android + Termux)

A hotspotot nyújtó telefon egy kis, `ntfy`-kompatibilis jelzésközvetítő relét futtat (Node, függőségek nélkül). A relé csak a rövid csatlakozási üzeneteket továbbítja; **nem látja a tábla tartalmát**.

```sh
pkg install nodejs
termux-setup-storage
# indítsd el a hotspotot (WPA2 jelszóval), majd:
cd ~/storage/downloads          # aici stau fascicul-releu.js și fascicul.html
termux-wake-lock
node fascicul-releu.js
```

A relé kiírja a címet (általában `http://192.168.43.1:8080`), és újra kiírja, ha megváltozik. A projektornál lévő eszközön nyisd meg a címet, válaszd a **Képernyő** lehetőséget, és mutasd meg a QR-kódot a telefonoknak. Változók: `PORT`, `HOST`, `ALLOW_ORIGIN` (további origin-ek, vesszővel elválasztva).

`http://` esetén (helyi relé) a böngészők letiltják a fényképezőgépet: a QR-olvasás *az alkalmazáson belül* és az élő kamera ott nem működik; a tábla, a jegyzetek, a galériából származó fotók és a lézermutató működik, a telefon Kamera alkalmazásával történő beolvasás pedig mindenképp működik. Akinek élő kamerára van szüksége, a `fascicul.html` fájlt helyben nyissa meg a telefonon (biztonságos környezet), és a relé címét adja meg a *Speciális beállításokban*.

## Mit tud a tábla

- toll (4 vastagság, 6 szín), jegyzetek, képek (JPEG/PNG, átméretezve), radír, lézermutató, mozgatás / átméretezés, kétujjas nagyítás;
- egy telefon élő kamerája a képernyőn (elülső/hátsó váltással);
- **Előadás** mód (gombok nélkül; a bal felső sarok vagy az Esc visszahozza őket), teljes képernyő, fekete vagy fehér háttér;
- szerkesztészár (a telefonoknak csak a lézermutató marad);
- **PNG**-export; **munkamenet** mentése / betöltése (`.json`, képekkel);
- Ctrl+Z, Delete, Esc a képernyő billentyűzetén.

## Biztonság és korlátok (olvasd el)

- A **csatlakozási szobának** véletlenszerű titkos kódja van (a QR-ben). Aki nem kapta meg, nem tud csatlakozási kérést küldeni. A hotspotnak jelszóval kell rendelkeznie.
- Minden új telefont a képernyőnek **jóvá kell hagynia** (opcionálisan: „Mindenkit elfogad”).
- A résztvevők üzeneteit ellenőrzi és korlátozza a rendszer (objektumok, képek, sebesség); a csatornát elárasztó telefont lecsatlakoztatja. Bármely elemet törölhetnek vagy mozgathatnak a táblán: ez egy együttműködő tábla, szerzőnkénti jogosultságok nélkül.
- A tartalombiztonsági szabályzat (CSP) tiltja a külső szkripteket és az `eval`-t; az alkalmazás semmit sem tölt le az internetről.
- `http://` esetén a helyi hálózati forgalmat a szállítási réteg nem titkosítja (a tábla tartalma titkosítva halad a WebRTC-n keresztül, a csatlakozási kódok nem). Ne használj relét nem biztonságos nyilvános hálózatokon.
- iPhone: lehet résztvevő telefon és képernyő is, de a relét (Node) nem tudja futtatni. A `BarcodeDetector` (olvasás az alkalmazásban) hiányzik a Safariból/Firefoxból — használd a Kamera alkalmazást.
- A „kliensizolációs” Wi‑Fi (vendéghálózatok) blokkolja a közvetlen kapcsolatot: használd egy telefon hotspotját.
- STUN/TURN-szerver nélkül: ugyanazon a helyi hálózaton működik. Saját STUN a *Speciális beállításokban* adható meg.

## Fejlesztés

```
src/app.html          az alkalmazás forrása (a /*__RELAY_SRC__*/ jelölővel)
fascicul-releu.js     az átjátszó (egyetlen forrás; beágyazódik az alkalmazásba)
build.js              node build.js  →  fascicul.html (egyetlen fájl) + index.html (azonos másolat, a GitHub Pagesnek)
```

A fejlesztés során elvégzett tesztek (Chromium + Playwright): párosítás a reléen keresztül aktív mDNS-jelöltekkel, jóváhagyás / elutasítás, ellenséges résztvevők (hibás formátumú üzenetek, elárasztás, megszemélyesítés, úton lévő képek), automatikus újracsatlakozás, heartbeat, élő kamera hamis eszközzel, OpenCV-vel megjelenített QR-kódok dekódolása, mentett/betöltött munkamenet.

## Előzmények / Changelog

### 1.2.8 — 2026-10-23

- Fix: the relay no longer corrupts UTF-8 characters (e.g. diacritics in a phone's name) split across TCP chunks.

### 1.2.7 — 2026-10-23
- A natív alert/confirm/prompt ablakokat akadálymentes, lefordított FFF.dialog párbeszédablakok váltották fel (fff-kit 1.2.0).

### 1.2.5 — 2026-10-22

fff-kit 1.1.4: érintési célok és minimális szövegméret. Érintési célok/szöveg javítva az alkalmazásban.

### 1.2.4 — 2026-10-22

fff-kit 1.1.2: PBKDF2 600 000 iterációval, clickjacking elleni védelem.

### 1.2.3 — 2026-10-22
- A kétujjas nagyítás már nem tiltott a telefonon (a user-scalable=no eltávolítva); képernyőnként pontosan egy H1 és egy main tereptárgy; a csak olvasható kódmezőknek hozzáférhető nevük van.
- Nyilvános tárhelyen (pl. GitHub Pages) az alkalmazás már nem kérdezi le a /fsc-health címet, amely csak 404-et és konzolhibát adott; a közvetítőt csak helyi hálózati címeken (IP, localhost, .local) vagy a Speciális beállításokban megadott címen keresi.
- Offline: valódi service worker és ikonokkal ellátott webalkalmazás-manifest (telepíthető; az oldal internet nélkül is megnyílik, ami hotspot-only hálózaton fontos).
- Biztonság: a script-src már nem használ 'unsafe-inline'-t (soron belüli szkriptek csak hash alapján; az egyetlen soron belüli eseménykezelő a kódba került). A közvetítő címe mező a Speciális beállításokban ellenőrzött (csak http/https), lefordított üzenettel.

### 1.2.2 — 2026-10-22
- olasz: a relé beállítási lépése most olaszul nevezi meg a letöltések mappát („cartella dei download”), nem csupán egy angol szót.

### 1.2.1 — 2026-10-22
- Fordítási javítás: az automatikus szoba címe, a „A kapcsolat megszakadt” képernyő és a kézi párosítás súgószövege mostantól a felület nyelvét követi; a README kódmegjegyzései le vannak fordítva.

## Licenc

[MIT](LICENSE) © Alexio (Alexandru‑Ionuț Chiuță)
