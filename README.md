# FASCICUL

**English** · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version:** 1.2.0 · **Last updated:** 2026-10-19

Interface languages: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

**Phones ↔ video projector.** A single HTML file (`fascicul.html`) that links the participants' phones to the device connected to the video projector and gives them a shared board: drawing, notes, images, laser pointer, live camera. No account, no tracking, no third-party servers, no dependencies. Part of the "without borders" / trade‑free series.

The board's content travels **directly between devices** (WebRTC), not through any server.

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
# pornește hotspotul (cu parolă WPA2), apoi:
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
src/app.html          sursa aplicației (cu marcajul /*__RELAY_SRC__*/)
fascicul-releu.js     releul (sursa unică; se încorporează în aplicație)
build.js              node build.js  →  fascicul.html (un singur fișier) + index.html (copie identică, pentru GitHub Pages)
```

Tests carried out during development (Chromium + Playwright): pairing through the relay with active mDNS candidates, approval / rejection, hostile participants (malformed messages, flooding, spoofing, in-flight images), automatic reconnection, heartbeat, live camera with a fake device, decoding of QR codes rendered with OpenCV, saved/loaded session.

## License

[MIT](LICENSE) © Alexio (Alexandru‑Ionuț Chiuță)
