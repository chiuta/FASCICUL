# FASCICUL

[English](README.md) · **Română** · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versiune:** 1.2.1 · **Ultima actualizare:** 2026-10-22

Limbile interfeței: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

**Telefoane ↔ videoproiector.** Un singur fișier HTML (`fascicul.html`) care leagă telefoanele participanților de dispozitivul conectat la videoproiector și le dă o tablă comună: desen, note, imagini, laser, cameră live. Fără cont, fără urmărire, fără servere terțe, fără dependențe. Parte din seria „fără frontiere” / trade‑free.

Conținutul tablei circulă **direct între dispozitive** (WebRTC), nu prin vreun server.

## Pornire rapidă

1. Toate dispozitivele în aceeași rețea (Wi‑Fi sau hotspotul unui telefon).
2. Pe dispozitivul de la proiector deschide `fascicul.html` și alege **Ecran**. Apare un cod QR.
3. Pe telefoane scanează codul cu aplicația **Cameră**: se deschide pagina și telefonul se alătură singur. Ecranul cere aprobare pentru fiecare telefon nou (se poate opri).

Pentru pasul 3 telefoanele au nevoie de aplicație. Trei variante:

| Variantă | Cum | Observații |
|---|---|---|
| **Releu pe telefonul‑hotspot** (recomandat) | `node fascicul-releu.js` în Termux, vezi mai jos | Releul servește și aplicația; nimic de instalat pe celelalte telefoane |
| **Adresă web** | deschide <https://chiuta.github.io/FASCICUL/> sau pune `fascicul.html` pe orice găzduire statică (YunoHost…) | HTTPS ⇒ camera foto, scanarea QR și camera live merg peste tot |
| **Fișier trimis** | trimite `fascicul.html` pe telefoane | Se folosește „împerechere manuală” (două coduri QR per telefon) |

## Releu pe telefonul‑hotspot (Android + Termux)

Telefonul care face hotspot rulează un mic releu de semnalizare compatibil cu `ntfy` (Node, fără dependențe). Releul transmite doar mesajele scurte de conectare; **nu vede conținutul tablei**.

```sh
pkg install nodejs
termux-setup-storage
# pornește hotspotul (cu parolă WPA2), apoi:
cd ~/storage/downloads          # aici stau fascicul-releu.js și fascicul.html
termux-wake-lock
node fascicul-releu.js
```

Releul afișează adresa (de obicei `http://192.168.43.1:8080`) și o reafișează dacă se schimbă. Pe dispozitivul de la proiector deschide adresa, alege **Ecran** și arată codul QR telefoanelor. Variabile: `PORT`, `HOST`, `ALLOW_ORIGIN` (origini suplimentare, separate prin virgulă).

Pe `http://` (releu local) browserele blochează camera foto: scanarea QR *din aplicație* și camera live nu merg acolo; tabla, notele, pozele din galerie și laserul merg, iar scanarea cu aplicația Cameră a telefonului merge oricum. Cine are nevoie de camera live deschide `fascicul.html` local pe telefon (context sigur) și pune adresa releului la *Setări avansate*.

## Ce poate tabla

- creion (4 grosimi, 6 culori), note, imagini (JPEG/PNG, redimensionate), radieră, laser, mutare / redimensionare, zoom cu două degete;
- cameră live a unui telefon pe ecran (cu comutare față/spate);
- mod **Prezentare** (fără butoane; colțul stânga‑sus sau Esc le readuc), ecran complet, fundal negru sau alb;
- blocare editare (telefoanele rămân doar cu laserul);
- export **PNG**; salvare / încărcare **sesiune** (`.json`, cu imagini);
- Ctrl+Z, Delete, Esc pe tastatura ecranului.

## Securitate și limite (de citit)

- **Camera de conectare** are un cod secret aleator (în QR). Cine nu l-a primit nu poate trimite cereri de alăturare. Hotspotul trebuie să aibă parolă.
- Fiecare telefon nou trebuie **aprobat** de ecran (opțional: «Acceptă toți»).
- Mesajele de la participanți sunt validate și limitate (obiecte, imagini, ritm); un telefon care inundă canalul este deconectat. Pot șterge sau muta orice element de pe tablă: e o tablă colaborativă, nu are drepturi pe autor.
- Politica de conținut (CSP) interzice scripturi externe și `eval`; aplicația nu încarcă nimic de pe internet.
- Pe `http://` traficul din rețeaua locală nu este criptat de transport (conținutul tablei merge criptat prin WebRTC, codurile de conectare nu). Nu folosi un releu pe rețele publice nesigure.
- iPhone: poate fi telefon participant și ecran, dar nu poate rula releul (Node). `BarcodeDetector` (scanare în aplicație) lipsește din Safari/Firefox — folosește aplicația Cameră.
- Wi‑Fi cu „izolare clienți” (rețele de oaspeți) blochează conexiunea directă: folosește hotspotul unui telefon.
- Fără server STUN/TURN: merge în aceeași rețea locală. Un STUN propriu se poate pune în *Setări avansate*.

## Dezvoltare

```
src/app.html          sursa aplicației (cu marcajul /*__RELAY_SRC__*/)
fascicul-releu.js     releul (sursa unică; se încorporează în aplicație)
build.js              node build.js  →  fascicul.html (un singur fișier) + index.html (copie identică, pentru GitHub Pages)
```

Teste efectuate în dezvoltare (Chromium + Playwright): împerechere prin releu cu candidate mDNS active, aprobare / respingere, participanți ostili (mesaje malformate, inundație, spoofing, imagini în zbor), reconectare automată, heartbeat, cameră live cu dispozitiv fals, decodarea codurilor QR randate cu OpenCV, sesiune salvată/încărcată.

## Istoric / Changelog

### 1.2.1 — 2026-10-22
- Corecție de traducere: titlul camerei automate, ecranul „Conexiune pierdută” și textul-ghid din câmpul de împerechere manuală urmează acum limba interfeței.

## Licență

[MIT](LICENSE) © Alexio (Alexandru‑Ionuț Chiuță)
