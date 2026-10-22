# FASCICUL

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · **Italiano** · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versione:** 1.2.4 · **Ultimo aggiornamento:** 2026-10-22

Lingue dell'interfaccia: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

**Telefoni ↔ videoproiettore.** Un unico file HTML (`fascicul.html`) che collega i telefoni dei partecipanti al dispositivo collegato al videoproiettore e offre loro una lavagna condivisa: disegno, note, immagini, laser, fotocamera in diretta. Senza account, senza tracciamento, senza server di terzi, senza dipendenze. Parte della serie «senza frontiere» / trade‑free.

Il contenuto della lavagna circola **direttamente tra i dispositivi** (WebRTC), non passa da alcun server.

## Avvio rapido

1. Tutti i dispositivi sulla stessa rete (Wi‑Fi o hotspot di un telefono).
2. Sul dispositivo del proiettore apri `fascicul.html` e scegli **Schermo**. Compare un codice QR.
3. Sui telefoni scansiona il codice con l'app **Fotocamera**: si apre la pagina e il telefono si unisce da solo. Lo schermo chiede l'approvazione per ogni nuovo telefono (si può disattivare).

Per il passaggio 3 i telefoni hanno bisogno dell'app. Tre possibilità:

| Opzione | Come | Note |
|---|---|---|
| **Relay sul telefono‑hotspot** (consigliato) | `node fascicul-releu.js` in Termux, vedi sotto | Il relay serve anche l'app; niente da installare sugli altri telefoni |
| **Indirizzo web** | apri <https://chiuta.github.io/FASCICUL/> oppure metti `fascicul.html` su un qualsiasi hosting statico (YunoHost…) | HTTPS ⇒ la fotocamera, la scansione del QR e la fotocamera in diretta funzionano ovunque |
| **File inviato** | invia `fascicul.html` ai telefoni | Si usa l'«abbinamento manuale» (due codici QR per telefono) |

## Relay sul telefono‑hotspot (Android + Termux)

Il telefono che fa da hotspot esegue un piccolo relay di segnalazione compatibile con `ntfy` (Node, senza dipendenze). Il relay trasmette soltanto i brevi messaggi di connessione; **non vede il contenuto della lavagna**.

```sh
pkg install nodejs
termux-setup-storage
# avvia l’hotspot (con password WPA2), poi:
cd ~/storage/downloads          # aici stau fascicul-releu.js și fascicul.html
termux-wake-lock
node fascicul-releu.js
```

Il relay mostra l'indirizzo (di solito `http://192.168.43.1:8080`) e lo mostra di nuovo se cambia. Sul dispositivo del proiettore apri l'indirizzo, scegli **Schermo** e mostra il codice QR ai telefoni. Variabili: `PORT`, `HOST`, `ALLOW_ORIGIN` (origini aggiuntive, separate da virgole).

Su `http://` (relay locale) i browser bloccano la fotocamera: la scansione del QR *dall'interno dell'app* e la fotocamera in diretta non funzionano; la lavagna, le note, le foto della galleria e il laser funzionano, e la scansione con l'app Fotocamera del telefono funziona comunque. Chi ha bisogno della fotocamera in diretta apre `fascicul.html` in locale sul telefono (contesto sicuro) e inserisce l'indirizzo del relay in *Impostazioni avanzate*.

## Cosa può fare la lavagna

- penna (4 spessori, 6 colori), note, immagini (JPEG/PNG, ridimensionate), gomma, laser, spostamento / ridimensionamento, zoom con due dita;
- fotocamera in diretta di un telefono sullo schermo (con passaggio anteriore/posteriore);
- modalità **Presentazione** (senza pulsanti; l'angolo in alto a sinistra o Esc li riporta), schermo intero, sfondo nero o bianco;
- blocco della modifica (i telefoni restano solo con il laser);
- esportazione **PNG**; salvataggio / caricamento della **sessione** (`.json`, con le immagini);
- Ctrl+Z, Canc, Esc sulla tastiera dello schermo.

## Sicurezza e limiti (da leggere)

- La **stanza di connessione** ha un codice segreto casuale (nel QR). Chi non lo ha ricevuto non può inviare richieste di accesso. L'hotspot deve avere una password.
- Ogni nuovo telefono deve essere **approvato** dallo schermo (opzionale: «Accetta tutti»).
- I messaggi dei partecipanti sono convalidati e limitati (oggetti, immagini, frequenza); un telefono che inonda il canale viene disconnesso. Possono cancellare o spostare qualsiasi elemento della lavagna: è una lavagna collaborativa, senza diritti per autore.
- La politica sui contenuti (CSP) vieta gli script esterni e `eval`; l'app non carica nulla da Internet.
- Su `http://` il traffico della rete locale non è cifrato dal trasporto (il contenuto della lavagna viaggia cifrato tramite WebRTC, i codici di connessione no). Non usare un relay su reti pubbliche non sicure.
- iPhone: può essere telefono partecipante e schermo, ma non può eseguire il relay (Node). `BarcodeDetector` (scansione nell'app) manca in Safari/Firefox — usa l'app Fotocamera.
- Il Wi‑Fi con «isolamento dei client» (reti per ospiti) blocca la connessione diretta: usa l'hotspot di un telefono.
- Nessun server STUN/TURN: funziona nella stessa rete locale. Un STUN proprio si può inserire in *Impostazioni avanzate*.

## Sviluppo

```
src/app.html          sorgente dell’app (con il marcatore /*__RELAY_SRC__*/)
fascicul-releu.js     il relay (sorgente unica; incorporato nell’app)
build.js              node build.js  →  fascicul.html (file unico) + index.html (copia identica, per GitHub Pages)
```

Test eseguiti durante lo sviluppo (Chromium + Playwright): abbinamento tramite relay con candidati mDNS attivi, approvazione / rifiuto, partecipanti ostili (messaggi malformati, inondazione, spoofing, immagini in volo), riconnessione automatica, heartbeat, fotocamera in diretta con dispositivo finto, decodifica di codici QR renderizzati con OpenCV, sessione salvata/caricata.

## Cronologia / Changelog

### 1.2.4 — 2026-10-22

fff-kit 1.1.2: PBKDF2 a 600.000 iterazioni, protezione anti-clickjacking.

### 1.2.3 — 2026-10-22
- Lo zoom con due dita non è più bloccato sul telefono (rimosso user-scalable=no); esattamente un H1 per schermata e un punto di riferimento main; le caselle di codice in sola lettura hanno un nome accessibile.
- Su hosting pubblico (ad es. GitHub Pages) l'app non sonda più /fsc-health, che restituiva solo un 404 e un errore in console; il relay viene cercato solo a indirizzi della rete locale (IP, localhost, .local) o all'indirizzo impostato nelle Impostazioni avanzate.
- Offline: vero service worker e manifest di web app con icone (installabile; la pagina si apre senza Internet, importante in una rete solo hotspot).
- Sicurezza: script-src non usa più 'unsafe-inline' (script inline solo tramite hash; l'unico gestore inline è stato spostato nel codice). Il campo dell'indirizzo del relay nelle Impostazioni avanzate è convalidato (solo http/https), con messaggio tradotto.

### 1.2.2 — 2026-10-22
- l'istruzione di configurazione del relay ora indica la cartella dei download in italiano («cartella dei download») invece della sola parola inglese.

### 1.2.1 — 2026-10-22
- Correzione di traduzione: il titolo della stanza automatica, la schermata «Connessione persa» e il testo guida dell’accoppiamento manuale seguono ora la lingua dell’interfaccia; i commenti di codice nel README sono localizzati.

## Licenza

[MIT](LICENSE) © Alexio (Alexandru‑Ionuț Chiuță)
