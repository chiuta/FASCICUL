# FASCICUL

[English](README.md) · [Română](README.ro.md) · **Français** · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version :** 1.2.4 · **Dernière mise à jour :** 2026-10-22

Langues de l'interface : **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

**Téléphones ↔ vidéoprojecteur.** Un seul fichier HTML (`fascicul.html`) qui relie les téléphones des participants à l'appareil branché au vidéoprojecteur et leur offre un tableau partagé : dessin, notes, images, laser, caméra en direct. Sans compte, sans pistage, sans serveurs tiers, sans dépendances. Fait partie de la série « sans frontières » / trade‑free.

Le contenu du tableau circule **directement entre les appareils** (WebRTC), sans passer par aucun serveur.

## Démarrage rapide

1. Tous les appareils sur le même réseau (Wi‑Fi ou point d'accès d'un téléphone).
2. Sur l'appareil du projecteur, ouvrez `fascicul.html` et choisissez **Écran**. Un code QR s'affiche.
3. Sur les téléphones, scannez le code avec l'application **Appareil photo** : la page s'ouvre et le téléphone rejoint la séance tout seul. L'écran demande une validation pour chaque nouveau téléphone (désactivable).

Pour l'étape 3, les téléphones ont besoin de l'application. Trois possibilités :

| Option | Comment | Remarques |
|---|---|---|
| **Relais sur le téléphone‑point d'accès** (recommandé) | `node fascicul-releu.js` dans Termux, voir ci-dessous | Le relais sert aussi l'application ; rien à installer sur les autres téléphones |
| **Adresse web** | ouvrez <https://chiuta.github.io/FASCICUL/> ou placez `fascicul.html` sur n'importe quel hébergement statique (YunoHost…) | HTTPS ⇒ l'appareil photo, le scan de QR et la caméra en direct fonctionnent partout |
| **Fichier envoyé** | envoyez `fascicul.html` aux téléphones | On utilise l'« appairage manuel » (deux codes QR par téléphone) |

## Relais sur le téléphone‑point d'accès (Android + Termux)

Le téléphone qui fait office de point d'accès exécute un petit relais de signalisation compatible avec `ntfy` (Node, sans dépendances). Le relais ne transmet que les courts messages de connexion ; **il ne voit pas le contenu du tableau**.

```sh
pkg install nodejs
termux-setup-storage
# activez le point d’accès (avec mot de passe WPA2), puis :
cd ~/storage/downloads          # aici stau fascicul-releu.js și fascicul.html
termux-wake-lock
node fascicul-releu.js
```

Le relais affiche l'adresse (en général `http://192.168.43.1:8080`) et la réaffiche si elle change. Sur l'appareil du projecteur, ouvrez l'adresse, choisissez **Écran** et montrez le code QR aux téléphones. Variables : `PORT`, `HOST`, `ALLOW_ORIGIN` (origines supplémentaires, séparées par des virgules).

Sur `http://` (relais local), les navigateurs bloquent l'appareil photo : le scan de QR *depuis l'application* et la caméra en direct n'y fonctionnent pas ; le tableau, les notes, les photos de la galerie et le laser fonctionnent, et le scan avec l'application Appareil photo du téléphone fonctionne de toute façon. Qui a besoin de la caméra en direct ouvre `fascicul.html` en local sur le téléphone (contexte sécurisé) et saisit l'adresse du relais dans *Paramètres avancés*.

## Ce que peut faire le tableau

- crayon (4 épaisseurs, 6 couleurs), notes, images (JPEG/PNG, redimensionnées), gomme, laser, déplacement / redimensionnement, zoom à deux doigts ;
- caméra en direct d'un téléphone sur l'écran (avec bascule avant/arrière) ;
- mode **Présentation** (sans boutons ; le coin supérieur gauche ou Échap les fait réapparaître), plein écran, fond noir ou blanc ;
- verrouillage de l'édition (les téléphones ne gardent que le laser) ;
- export **PNG** ; enregistrement / chargement d'une **session** (`.json`, avec les images) ;
- Ctrl+Z, Suppr, Échap sur le clavier de l'écran.

## Sécurité et limites (à lire)

- La **salle de connexion** a un code secret aléatoire (dans le QR). Qui ne l'a pas reçu ne peut pas envoyer de demandes d'adhésion. Le point d'accès doit être protégé par un mot de passe.
- Chaque nouveau téléphone doit être **approuvé** par l'écran (en option : « Accepter tout le monde »).
- Les messages des participants sont validés et limités (objets, images, débit) ; un téléphone qui inonde le canal est déconnecté. Les participants peuvent supprimer ou déplacer n'importe quel élément du tableau : c'est un tableau collaboratif, sans droits par auteur.
- La politique de sécurité du contenu (CSP) interdit les scripts externes et `eval` ; l'application ne charge rien depuis Internet.
- Sur `http://`, le trafic du réseau local n'est pas chiffré par le transport (le contenu du tableau circule chiffré via WebRTC, les codes de connexion non). N'utilisez pas de relais sur des réseaux publics non sûrs.
- iPhone : il peut être téléphone participant et écran, mais ne peut pas exécuter le relais (Node). `BarcodeDetector` (scan dans l'application) est absent de Safari/Firefox — utilisez l'application Appareil photo.
- Un Wi‑Fi avec « isolation des clients » (réseaux invités) bloque la connexion directe : utilisez le point d'accès d'un téléphone.
- Pas de serveur STUN/TURN : cela fonctionne sur le même réseau local. Un STUN personnel peut être indiqué dans *Paramètres avancés*.

## Développement

```
src/app.html          source de l’application (avec le marqueur /*__RELAY_SRC__*/)
fascicul-releu.js     le relais (source unique ; intégré dans l’application)
build.js              node build.js  →  fascicul.html (fichier unique) + index.html (copie identique, pour GitHub Pages)
```

Tests réalisés pendant le développement (Chromium + Playwright) : appairage via le relais avec candidats mDNS actifs, approbation / refus, participants hostiles (messages malformés, inondation, usurpation, images en transit), reconnexion automatique, heartbeat, caméra en direct avec un faux périphérique, décodage de codes QR rendus avec OpenCV, session enregistrée/chargée.

## Historique / Changelog

### 1.2.4 — 2026-10-22

fff-kit 1.1.2 : PBKDF2 600 000 itérations, protection anti-clickjacking.

### 1.2.3 — 2026-10-22
- Le zoom à deux doigts n'est plus bloqué sur téléphone (user-scalable=no supprimé) ; exactement un H1 par écran et un repère main ; les zones de code en lecture seule ont un nom accessible.
- Sur un hébergement public (p. ex. GitHub Pages), l'application ne sonde plus /fsc-health, qui ne renvoyait qu'une erreur 404 dans la console ; le relais n'est cherché qu'aux adresses du réseau local (IP, localhost, .local) ou à l'adresse configurée dans les Réglages avancés.
- Hors ligne : vrai service worker et manifeste d'application web avec icônes (installable ; la page s'ouvre sans Internet, ce qui compte sur un réseau limité à un point d'accès).
- Sécurité : script-src n'utilise plus 'unsafe-inline' (scripts en ligne uniquement par empreinte ; le seul gestionnaire en ligne a été déplacé dans le code). Le champ d'adresse du relais dans les Réglages avancés est validé (http/https uniquement), avec un message traduit.

### 1.2.2 — 2026-10-22
- italien : l'étape d'installation du relais nomme désormais le dossier de téléchargements en italien (« cartella dei download ») au lieu d'un simple mot anglais.

### 1.2.1 — 2026-10-22
- Correction de traduction : le titre de la salle automatique, l’écran « Connexion perdue » et l’exemple du champ d’appairage manuel suivent désormais la langue de l’interface ; les commentaires de code du README sont localisés.

## Licence

[MIT](LICENSE) © Alexio (Alexandru‑Ionuț Chiuță)
