# FASCICUL

**English** · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version:** 2.1.0 · **Last updated:** 2026-10-27

**Status:** experimental · **Offline:** complete after the page is loaded; the phone link works only on the same local network (no STUN/TURN)

Interface languages: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

**Phones ↔ video projector.** A single HTML file (`fascicul.html`) that links the participants' phones to the device connected to the video projector and gives them a shared board: drawing, notes, images, laser pointer, live camera. No account, no tracking, no third-party servers, no dependencies. Part of the "without borders" / trade‑free series.

The board's content travels **directly between devices** (WebRTC), not through any server.

## Recorded sessions (v2.0.0)

**⏺ Record** (top bar) keeps the board as an **event log**: strokes, notes, images, moves and deletions with their timing (starting from the current board). **🎞️ Recordings** opens playback (play/pause, seek, 1×/2×/4×; long pauses are shortened to 1.5 s) and export: **PDF** (up to 8 pages of session stages), animated **GIF** 480×270 (fixed 216+40-colour palette) and **.rec.json** (save/reload, every event validated). **Limits:** laser and live cameras are not recorded; the recording lives in page memory (about 12 MB max) until you save it.

## Quick start

1. All devices on the same network (Wi‑Fi or a phone's hotspot).
2. On the device at the projector, open `fascicul.html` and choose **Screen**. A QR code appears.
3. On the phones, scan the code with the **Camera** app: the page opens and the phone joins on its own. The screen asks for approval for every new phone (this can be turned off).

For step 3 the phones need the app. Three options:

| Option | How | Notes |
|---|---|---|
| **Relay on the hotspot phone** (recommended) | `node fascicul-releu.js` in Termux, see below | The relay also serves the app; nothing to install on the other phones |
| **Web address** | open <https://chiuta.github.io/FASCICUL/> or put `fascicul.html` on any static hosting (YunoHost…) | HTTPS ⇒ the photo camera, QR scanning and live camera work everywhere |
| **Sent file** | send `fascicul.html` to the phones | "Manual pairing" is used (two QR codes per phone) |

## Relay on the hotspot phone (Android + Termux)

The phone that provides the hotspot runs a small signalling relay compatible with `ntfy` (Node, no dependencies). The relay only passes the short connection messages; **it cannot see the board's content**.

```sh
pkg install nodejs
termux-setup-storage
# start the hotspot (with a WPA2 password), then:
cd ~/storage/downloads          # aici stau fascicul-releu.js și fascicul.html
termux-wake-lock
node fascicul-releu.js
```

The relay prints the address (usually `http://192.168.43.1:8080`) and prints it again if it changes. On the device at the projector, open the address, choose **Screen** and show the QR code to the phones. Variables: `PORT`, `HOST`, `ALLOW_ORIGIN` (additional origins, comma-separated).

Over `http://` (local relay) browsers block the photo camera: QR scanning *from within the app* and the live camera do not work there; the board, notes, gallery photos and the laser do work, and scanning with the phone's Camera app works anyway. Anyone who needs the live camera opens `fascicul.html` locally on the phone (secure context) and enters the relay address under *Advanced settings*.

## What the board can do

- pen (4 thicknesses, 6 colours), notes, images (JPEG/PNG, resized), eraser, laser, move / resize, two-finger zoom;
- a phone's live camera on the screen (with front/back switching);
- **Presentation** mode (no buttons; the top-left corner or Esc brings them back), full screen, black or white background;
- editing lock (phones are left with the laser only);
- **PNG** export; saving / loading a **session** (`.json`, with images);
- Ctrl+Z, Delete, Esc on the screen's keyboard.

## Not tested on iOS, and a text connection guide

**Not tested on iOS:** the app has not been tested on a real iPhone/iPad or in iOS Safari. Nothing here claims it works there; the iPhone notes in this README are expectations from browser capabilities, not test results. Reports from iOS users are welcome.

**Connection guide (text):**
1. Put all devices on the same network: the Wi-Fi of the room, or the hotspot of one phone (with a WPA2 password). Guest networks with "client isolation" block the link.
2. On the device at the projector, open the app, press **Screen**. A QR code appears.
3. On each phone, open the Camera app and point it at the QR code; open the link that appears. The phone joins by itself.
4. On the screen, approve each new phone (unless "Accept all" is on).
5. If a phone does not join: check it is on the same network, reload the page on the phone and scan again; if it still fails, use "Manual pairing" (two QR codes per phone) or a relay on the hotspot phone (see above).

The home page now has a collapsible **animated step-by-step guide** (5 steps, Back/Next, optional auto-play, animations off with reduced-motion) in all 8 languages (RO and EN written; the others are automatic translations). A real **video** guide has not been made.

## Security and limits (please read)

- The **connection room** has a random secret code (in the QR). Whoever has not received it cannot send join requests. The hotspot must have a password.
- Every new phone must be **approved** by the screen (optional: "Accept all").
- Messages from participants are validated and limited (objects, images, rate); a phone that floods the channel is disconnected. Participants can delete or move any element on the board: it is a collaborative board and has no per-author rights.
- The content security policy (CSP) forbids external scripts and `eval`; the app loads nothing from the internet.
- Over `http://` the traffic on the local network is not encrypted by the transport (the board's content travels encrypted through WebRTC, the connection codes do not). Do not use a relay on insecure public networks.
- iPhone: it can be a participant phone and a screen, but it cannot run the relay (Node). `BarcodeDetector` (in-app scanning) is missing from Safari/Firefox — use the Camera app.
- Wi‑Fi with "client isolation" (guest networks) blocks the direct connection: use a phone's hotspot.
- No STUN/TURN server: it works on the same local network. Your own STUN can be set under *Advanced settings*.

## Development

```
src/app.html          application source (with the /*__RELAY_SRC__*/ marker)
fascicul-releu.js     the relay (single source; embedded into the app)
build.js              node build.js  →  fascicul.html (single file) + index.html (identical copy, for GitHub Pages)
```

Tests carried out during development (Chromium + Playwright): pairing through the relay with active mDNS candidates, approval / rejection, hostile participants (malformed messages, flooding, spoofing, in-flight images), automatic reconnection, heartbeat, live camera with a fake device, decoding of QR codes rendered with OpenCV, saved/loaded session.

## History / Changelog

### 1.2.8 — 2026-10-23

- Fix: the relay no longer corrupts UTF-8 characters (e.g. diacritics in a phone's name) split across TCP chunks.

### 1.2.7 — 2026-10-23
- Native alert/confirm/prompt replaced with accessible, translated FFF.dialog dialogs (fff-kit 1.2.0).

### 1.2.5 — 2026-10-22

fff-kit 1.1.4: touch targets and minimum text size. Touch targets/text fixed in the app.

### 1.2.4 — 2026-10-22

fff-kit 1.1.2: PBKDF2 with 600,000 iterations, anti-clickjacking protection.

### 1.2.3 — 2026-10-22
- Pinch-zoom is no longer blocked on phones (removed user-scalable=no); exactly one H1 per screen and a main landmark; the read-only code boxes have accessible names.
- On public hosting (e.g. GitHub Pages) the app no longer probes /fsc-health, which only returned a 404 and a console error; the relay is looked for only on local-network addresses (IP, localhost, .local) or at the address configured in Advanced settings.
- Offline: real service worker and web app manifest with icons (installable; the page opens without internet, which matters on a hotspot-only network).
- Security: script-src no longer uses 'unsafe-inline' (inline scripts by hash only; the one inline handler was moved into the code). The relay address field in Advanced settings is validated (http/https only), with a translated message.

### 1.2.2 — 2026-10-22
- Italian: the relay setup step now names the downloads folder in Italian ("cartella dei download") instead of a bare English word.

### 1.2.1 — 2026-10-22
- Translation fix: the automatic-room title, the “connection lost” screen and the manual-pairing placeholder now follow the interface language; code comments in the README are localized.

## License

[MIT](LICENSE) © Alexio (Alexandru‑Ionuț Chiuță)
