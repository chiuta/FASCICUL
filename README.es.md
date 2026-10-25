# FASCICUL

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · **Español** · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versión:** 1.2.9 · **Última actualización:** 2026-10-26

Idiomas de la interfaz: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

**Teléfonos ↔ videoproyector.** Un único archivo HTML (`fascicul.html`) que conecta los teléfonos de los participantes con el dispositivo conectado al videoproyector y les da una pizarra compartida: dibujo, notas, imágenes, láser, cámara en directo. Sin cuenta, sin rastreo, sin servidores de terceros, sin dependencias. Parte de la serie «sin fronteras» / trade‑free.

El contenido de la pizarra circula **directamente entre los dispositivos** (WebRTC), no a través de ningún servidor.

## Inicio rápido

1. Todos los dispositivos en la misma red (Wi‑Fi o punto de acceso de un teléfono).
2. En el dispositivo del proyector abre `fascicul.html` y elige **Pantalla**. Aparece un código QR.
3. En los teléfonos escanea el código con la aplicación **Cámara**: se abre la página y el teléfono se une solo. La pantalla pide aprobación para cada teléfono nuevo (se puede desactivar).

Para el paso 3 los teléfonos necesitan la aplicación. Tres variantes:

| Variante | Cómo | Observaciones |
|---|---|---|
| **Relé en el teléfono‑punto de acceso** (recomendado) | `node fascicul-releu.js` en Termux, véase más abajo | El relé también sirve la aplicación; nada que instalar en los demás teléfonos |
| **Dirección web** | abre <https://chiuta.github.io/FASCICUL/> o coloca `fascicul.html` en cualquier alojamiento estático (YunoHost…) | HTTPS ⇒ la cámara de fotos, el escaneo de QR y la cámara en directo funcionan en todas partes |
| **Archivo enviado** | envía `fascicul.html` a los teléfonos | Se usa el «emparejamiento manual» (dos códigos QR por teléfono) |

## Relé en el teléfono‑punto de acceso (Android + Termux)

El teléfono que hace de punto de acceso ejecuta un pequeño relé de señalización compatible con `ntfy` (Node, sin dependencias). El relé solo transmite los mensajes cortos de conexión; **no ve el contenido de la pizarra**.

```sh
pkg install nodejs
termux-setup-storage
# activa el punto de acceso (con contraseña WPA2) y luego:
cd ~/storage/downloads          # aici stau fascicul-releu.js și fascicul.html
termux-wake-lock
node fascicul-releu.js
```

El relé muestra la dirección (normalmente `http://192.168.43.1:8080`) y la vuelve a mostrar si cambia. En el dispositivo del proyector abre la dirección, elige **Pantalla** y enseña el código QR a los teléfonos. Variables: `PORT`, `HOST`, `ALLOW_ORIGIN` (orígenes adicionales, separados por comas).

Con `http://` (relé local) los navegadores bloquean la cámara: el escaneo de QR *desde la aplicación* y la cámara en directo no funcionan allí; la pizarra, las notas, las fotos de la galería y el láser sí funcionan, y el escaneo con la aplicación Cámara del teléfono funciona de todos modos. Quien necesite la cámara en directo abre `fascicul.html` en local en el teléfono (contexto seguro) y pone la dirección del relé en *Ajustes avanzados*.

## Qué puede hacer la pizarra

- lápiz (4 grosores, 6 colores), notas, imágenes (JPEG/PNG, redimensionadas), borrador, láser, mover / redimensionar, zoom con dos dedos;
- cámara en directo de un teléfono en la pantalla (con cambio frontal/trasera);
- modo **Presentación** (sin botones; la esquina superior izquierda o Esc los devuelven), pantalla completa, fondo negro o blanco;
- bloqueo de edición (los teléfonos se quedan solo con el láser);
- exportación **PNG**; guardado / carga de **sesión** (`.json`, con imágenes);
- Ctrl+Z, Supr, Esc en el teclado de la pantalla.

## Seguridad y límites (léase)

- La **sala de conexión** tiene un código secreto aleatorio (en el QR). Quien no lo haya recibido no puede enviar solicitudes de unión. El punto de acceso debe tener contraseña.
- Cada teléfono nuevo debe ser **aprobado** por la pantalla (opcional: «Aceptar a todos»).
- Los mensajes de los participantes se validan y se limitan (objetos, imágenes, ritmo); un teléfono que inunda el canal se desconecta. Pueden borrar o mover cualquier elemento de la pizarra: es una pizarra colaborativa, sin derechos por autor.
- La política de contenido (CSP) prohíbe los scripts externos y `eval`; la aplicación no carga nada de Internet.
- Con `http://` el tráfico de la red local no va cifrado por el transporte (el contenido de la pizarra viaja cifrado por WebRTC, los códigos de conexión no). No uses un relé en redes públicas no seguras.
- iPhone: puede ser teléfono participante y pantalla, pero no puede ejecutar el relé (Node). `BarcodeDetector` (escaneo en la aplicación) no existe en Safari/Firefox — usa la aplicación Cámara.
- El Wi‑Fi con «aislamiento de clientes» (redes de invitados) bloquea la conexión directa: usa el punto de acceso de un teléfono.
- Sin servidor STUN/TURN: funciona en la misma red local. Un STUN propio se puede poner en *Ajustes avanzados*.

## Desarrollo

```
src/app.html          fuente de la aplicación (con el marcador /*__RELAY_SRC__*/)
fascicul-releu.js     el relé (fuente única; se incrusta en la aplicación)
build.js              node build.js  →  fascicul.html (archivo único) + index.html (copia idéntica, para GitHub Pages)
```

Pruebas realizadas durante el desarrollo (Chromium + Playwright): emparejamiento mediante relé con candidatos mDNS activos, aprobación / rechazo, participantes hostiles (mensajes malformados, inundación, suplantación, imágenes en tránsito), reconexión automática, heartbeat, cámara en directo con dispositivo falso, decodificación de códigos QR renderizados con OpenCV, sesión guardada/cargada.

## Historial / Changelog

### 1.2.8 — 2026-10-23

- Fix: the relay no longer corrupts UTF-8 characters (e.g. diacritics in a phone's name) split across TCP chunks.

### 1.2.7 — 2026-10-23
- Los cuadros nativos alert/confirm/prompt se sustituyen por diálogos FFF.dialog accesibles y traducidos (fff-kit 1.2.0).

### 1.2.5 — 2026-10-22

fff-kit 1.1.4: áreas táctiles y texto mínimo. Áreas táctiles/texto corregidos en la aplicación.

### 1.2.4 — 2026-10-22

fff-kit 1.1.2: PBKDF2 con 600.000 iteraciones, protección anti-clickjacking.

### 1.2.3 — 2026-10-22
- El zoom con dos dedos ya no está bloqueado en el teléfono (eliminado user-scalable=no); exactamente un H1 por pantalla y un punto de referencia main; las cajas de código de solo lectura tienen nombre accesible.
- En alojamiento público (p. ej. GitHub Pages) la aplicación ya no sondea /fsc-health, que solo devolvía un 404 y un error en la consola; el relé se busca solo en direcciones de la red local (IP, localhost, .local) o en la dirección configurada en Ajustes avanzados.
- Sin conexión: service worker real y manifiesto de aplicación web con iconos (instalable; la página se abre sin Internet, importante en una red solo de punto de acceso).
- Seguridad: script-src ya no usa 'unsafe-inline' (scripts en línea solo por hash; el único controlador en línea se movió al código). El campo de dirección del relé en Ajustes avanzados se valida (solo http/https), con mensaje traducido.

### 1.2.2 — 2026-10-22
- italiano: el paso de configuración del relé nombra ahora la carpeta de descargas en italiano («cartella dei download») en lugar de una palabra inglesa suelta.

### 1.2.1 — 2026-10-22
- Corrección de traducción: el título de la sala automática, la pantalla «Conexión perdida» y el texto de ayuda del emparejamiento manual siguen ahora el idioma de la interfaz; los comentarios de código del README están localizados.

## Licencia

[MIT](LICENSE) © Alexio (Alexandru‑Ionuț Chiuță)
