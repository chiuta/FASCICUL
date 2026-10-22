# FASCICUL

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · **Deutsch** · [Magyar](README.hu.md)

**Version:** 1.2.4 · **Zuletzt aktualisiert:** 2026-10-22

Oberflächensprachen: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

**Smartphones ↔ Beamer.** Eine einzige HTML-Datei (`fascicul.html`), die die Smartphones der Teilnehmenden mit dem am Beamer angeschlossenen Gerät verbindet und ihnen eine gemeinsame Tafel gibt: Zeichnen, Notizen, Bilder, Laserpointer, Live-Kamera. Ohne Konto, ohne Tracking, ohne Server Dritter, ohne Abhängigkeiten. Teil der Reihe „ohne Grenzen“ / trade‑free.

Der Inhalt der Tafel läuft **direkt zwischen den Geräten** (WebRTC), nicht über irgendeinen Server.

## Schnellstart

1. Alle Geräte im selben Netzwerk (WLAN oder Hotspot eines Smartphones).
2. Öffne auf dem Gerät am Beamer `fascicul.html` und wähle **Bildschirm**. Ein QR-Code erscheint.
3. Scanne den Code auf den Smartphones mit der **Kamera**-App: Die Seite öffnet sich und das Smartphone tritt von selbst bei. Der Bildschirm verlangt für jedes neue Smartphone eine Freigabe (abschaltbar).

Für Schritt 3 brauchen die Smartphones die App. Drei Varianten:

| Variante | Wie | Hinweise |
|---|---|---|
| **Relay auf dem Hotspot‑Smartphone** (empfohlen) | `node fascicul-releu.js` in Termux, siehe unten | Das Relay liefert auch die App aus; auf den anderen Smartphones muss nichts installiert werden |
| **Webadresse** | öffne <https://chiuta.github.io/FASCICUL/> oder lege `fascicul.html` auf ein beliebiges statisches Hosting (YunoHost…) | HTTPS ⇒ Fotokamera, QR-Scan und Live-Kamera funktionieren überall |
| **Gesendete Datei** | sende `fascicul.html` an die Smartphones | Es wird die „manuelle Kopplung“ verwendet (zwei QR-Codes pro Smartphone) |

## Relay auf dem Hotspot‑Smartphone (Android + Termux)

Das Smartphone, das den Hotspot bereitstellt, führt ein kleines, zu `ntfy` kompatibles Signalisierungs-Relay aus (Node, ohne Abhängigkeiten). Das Relay leitet nur die kurzen Verbindungsnachrichten weiter; **es sieht den Inhalt der Tafel nicht**.

```sh
pkg install nodejs
termux-setup-storage
# Hotspot starten (mit WPA2-Passwort), dann:
cd ~/storage/downloads          # aici stau fascicul-releu.js și fascicul.html
termux-wake-lock
node fascicul-releu.js
```

Das Relay zeigt die Adresse an (meist `http://192.168.43.1:8080`) und zeigt sie erneut an, wenn sie sich ändert. Öffne die Adresse auf dem Gerät am Beamer, wähle **Bildschirm** und zeige den Smartphones den QR-Code. Variablen: `PORT`, `HOST`, `ALLOW_ORIGIN` (zusätzliche Origins, durch Kommas getrennt).

Über `http://` (lokales Relay) sperren Browser die Fotokamera: Das QR-Scannen *in der App* und die Live-Kamera funktionieren dort nicht; Tafel, Notizen, Fotos aus der Galerie und der Laserpointer funktionieren, und das Scannen mit der Kamera-App des Smartphones funktioniert ohnehin. Wer die Live-Kamera braucht, öffnet `fascicul.html` lokal auf dem Smartphone (sicherer Kontext) und trägt die Relay-Adresse unter *Erweiterte Einstellungen* ein.

## Was die Tafel kann

- Stift (4 Stärken, 6 Farben), Notizen, Bilder (JPEG/PNG, verkleinert), Radiergummi, Laserpointer, Verschieben / Skalieren, Zoom mit zwei Fingern;
- Live-Kamera eines Smartphones auf dem Bildschirm (mit Umschalten Front/Rückseite);
- **Präsentations**modus (ohne Schaltflächen; die obere linke Ecke oder Esc bringen sie zurück), Vollbild, schwarzer oder weißer Hintergrund;
- Bearbeitungssperre (den Smartphones bleibt nur der Laserpointer);
- **PNG**-Export; Speichern / Laden einer **Sitzung** (`.json`, mit Bildern);
- Strg+Z, Entf, Esc auf der Tastatur des Bildschirms.

## Sicherheit und Grenzen (bitte lesen)

- Der **Verbindungsraum** hat einen zufälligen geheimen Code (im QR). Wer ihn nicht erhalten hat, kann keine Beitrittsanfragen senden. Der Hotspot muss ein Passwort haben.
- Jedes neue Smartphone muss vom Bildschirm **freigegeben** werden (optional: „Alle akzeptieren“).
- Nachrichten der Teilnehmenden werden geprüft und begrenzt (Objekte, Bilder, Rate); ein Smartphone, das den Kanal überflutet, wird getrennt. Sie können jedes Element auf der Tafel löschen oder verschieben: Es ist eine kollaborative Tafel, ohne Rechte pro Urheber.
- Die Content-Security-Policy (CSP) verbietet externe Skripte und `eval`; die App lädt nichts aus dem Internet.
- Über `http://` wird der Verkehr im lokalen Netz nicht durch den Transport verschlüsselt (der Inhalt der Tafel läuft über WebRTC verschlüsselt, die Verbindungscodes nicht). Verwende kein Relay in unsicheren öffentlichen Netzen.
- iPhone: Es kann teilnehmendes Smartphone und Bildschirm sein, aber das Relay (Node) nicht ausführen. `BarcodeDetector` (Scannen in der App) fehlt in Safari/Firefox — nutze die Kamera-App.
- WLAN mit „Client-Isolation“ (Gastnetzwerke) blockiert die direkte Verbindung: Nutze den Hotspot eines Smartphones.
- Kein STUN/TURN-Server: Es funktioniert im selben lokalen Netz. Ein eigener STUN kann unter *Erweiterte Einstellungen* eingetragen werden.

## Entwicklung

```
src/app.html          Quelltext der App (mit der Markierung /*__RELAY_SRC__*/)
fascicul-releu.js     das Relay (einzige Quelle; wird in die App eingebettet)
build.js              node build.js  →  fascicul.html (einzelne Datei) + index.html (identische Kopie, für GitHub Pages)
```

Während der Entwicklung durchgeführte Tests (Chromium + Playwright): Kopplung über das Relay mit aktiven mDNS-Kandidaten, Freigabe / Ablehnung, feindliche Teilnehmende (fehlerhafte Nachrichten, Überflutung, Spoofing, Bilder im Transit), automatische Wiederverbindung, Heartbeat, Live-Kamera mit gefälschtem Gerät, Dekodierung von mit OpenCV gerenderten QR-Codes, gespeicherte/geladene Sitzung.

## Verlauf / Changelog

### 1.2.4 — 2026-10-22

fff-kit 1.1.2: PBKDF2 mit 600.000 Iterationen, Schutz vor Clickjacking.

### 1.2.3 — 2026-10-22
- Das Zwei-Finger-Zoomen ist auf dem Handy nicht mehr blockiert (user-scalable=no entfernt); genau eine H1 pro Ansicht und ein Main-Landmark; die schreibgeschützten Codefelder haben zugängliche Namen.
- Auf öffentlichem Hosting (z. B. GitHub Pages) fragt die App /fsc-health nicht mehr ab, was nur einen 404 und einen Konsolenfehler lieferte; das Relais wird nur an Adressen des lokalen Netzes (IP, localhost, .local) oder an der in den erweiterten Einstellungen gesetzten Adresse gesucht.
- Offline: echter Service Worker und Web-App-Manifest mit Symbolen (installierbar; die Seite öffnet sich ohne Internet, wichtig in einem reinen Hotspot-Netz).
- Sicherheit: script-src verwendet kein 'unsafe-inline' mehr (Inline-Skripte nur per Hash; der einzige Inline-Handler wurde in den Code verlegt). Das Feld für die Relais-Adresse in den erweiterten Einstellungen wird geprüft (nur http/https), mit übersetzter Meldung.

### 1.2.2 — 2026-10-22
- Italienisch: Der Einrichtungsschritt für das Relay nennt den Download-Ordner jetzt auf Italienisch („cartella dei download“) statt nur eines englischen Wortes.

### 1.2.1 — 2026-10-22
- Übersetzungskorrektur: Der Titel des automatischen Raums, der Bildschirm „Verbindung verloren“ und der Hilfetext der manuellen Kopplung folgen jetzt der Oberflächensprache; die Code-Kommentare im README sind lokalisiert.

## Lizenz

[MIT](LICENSE) © Alexio (Alexandru‑Ionuț Chiuță)
