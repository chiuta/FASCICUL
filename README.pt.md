# FASCICUL

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · **Português** · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versão:** 2.1.0 · **Última atualização:** 2026-10-27

**Estado:** experimental · **Offline:** completo

Idiomas da interface: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

**Telemóveis ↔ videoprojetor.** Um único ficheiro HTML (`fascicul.html`) que liga os telemóveis dos participantes ao dispositivo ligado ao videoprojetor e lhes dá um quadro partilhado: desenho, notas, imagens, laser, câmara em direto. Sem conta, sem rastreamento, sem servidores de terceiros, sem dependências. Parte da série «sem fronteiras» / trade‑free.

O conteúdo do quadro circula **diretamente entre os dispositivos** (WebRTC), não através de qualquer servidor.

## Início rápido

1. Todos os dispositivos na mesma rede (Wi‑Fi ou ponto de acesso de um telemóvel).
2. No dispositivo do projetor, abra `fascicul.html` e escolha **Ecrã**. Aparece um código QR.
3. Nos telemóveis, leia o código com a aplicação **Câmara**: a página abre e o telemóvel junta-se sozinho. O ecrã pede aprovação para cada telemóvel novo (pode ser desativado).

Para o passo 3, os telemóveis precisam da aplicação. Três variantes:

| Variante | Como | Observações |
|---|---|---|
| **Relé no telemóvel‑ponto de acesso** (recomendado) | `node fascicul-releu.js` no Termux, ver abaixo | O relé serve também a aplicação; nada a instalar nos outros telemóveis |
| **Endereço web** | abra <https://chiuta.github.io/FASCICUL/> ou coloque `fascicul.html` em qualquer alojamento estático (YunoHost…) | HTTPS ⇒ a câmara de fotografias, a leitura de QR e a câmara em direto funcionam em todo o lado |
| **Ficheiro enviado** | envie `fascicul.html` para os telemóveis | Usa-se o «emparelhamento manual» (dois códigos QR por telemóvel) |

## Relé no telemóvel‑ponto de acesso (Android + Termux)

O telemóvel que faz de ponto de acesso executa um pequeno relé de sinalização compatível com `ntfy` (Node, sem dependências). O relé transmite apenas as mensagens curtas de ligação; **não vê o conteúdo do quadro**.

```sh
pkg install nodejs
termux-setup-storage
# ative o hotspot (com palavra-passe WPA2) e depois:
cd ~/storage/downloads          # aici stau fascicul-releu.js și fascicul.html
termux-wake-lock
node fascicul-releu.js
```

O relé mostra o endereço (normalmente `http://192.168.43.1:8080`) e volta a mostrá-lo se mudar. No dispositivo do projetor, abra o endereço, escolha **Ecrã** e mostre o código QR aos telemóveis. Variáveis: `PORT`, `HOST`, `ALLOW_ORIGIN` (origens adicionais, separadas por vírgulas).

Em `http://` (relé local), os navegadores bloqueiam a câmara: a leitura de QR *a partir da aplicação* e a câmara em direto não funcionam aí; o quadro, as notas, as fotografias da galeria e o laser funcionam, e a leitura com a aplicação Câmara do telemóvel funciona de qualquer forma. Quem precisar da câmara em direto abre `fascicul.html` localmente no telemóvel (contexto seguro) e indica o endereço do relé em *Definições avançadas*.

## O que o quadro pode fazer

- lápis (4 espessuras, 6 cores), notas, imagens (JPEG/PNG, redimensionadas), borracha, laser, mover / redimensionar, zoom com dois dedos;
- câmara em direto de um telemóvel no ecrã (com alternância frontal/traseira);
- modo **Apresentação** (sem botões; o canto superior esquerdo ou Esc voltam a mostrá-los), ecrã inteiro, fundo preto ou branco;
- bloqueio de edição (os telemóveis ficam apenas com o laser);
- exportação **PNG**; gravação / carregamento da **sessão** (`.json`, com imagens);
- Ctrl+Z, Delete, Esc no teclado do ecrã.

## Segurança e limites (ler)

- A **sala de ligação** tem um código secreto aleatório (no QR). Quem não o recebeu não pode enviar pedidos de adesão. O ponto de acesso tem de ter palavra‑passe.
- Cada telemóvel novo tem de ser **aprovado** pelo ecrã (opcional: «Aceitar todos»).
- As mensagens dos participantes são validadas e limitadas (objetos, imagens, ritmo); um telemóvel que inunde o canal é desligado. Podem apagar ou mover qualquer elemento do quadro: é um quadro colaborativo, sem direitos por autor.
- A política de conteúdo (CSP) proíbe scripts externos e `eval`; a aplicação não carrega nada da Internet.
- Em `http://`, o tráfego da rede local não é cifrado pelo transporte (o conteúdo do quadro circula cifrado via WebRTC, os códigos de ligação não). Não use um relé em redes públicas inseguras.
- iPhone: pode ser telemóvel participante e ecrã, mas não pode executar o relé (Node). O `BarcodeDetector` (leitura na aplicação) não existe no Safari/Firefox — use a aplicação Câmara.
- Uma rede Wi‑Fi com «isolamento de clientes» (redes de convidados) bloqueia a ligação direta: use o ponto de acesso de um telemóvel.
- Sem servidor STUN/TURN: funciona na mesma rede local. Um STUN próprio pode ser indicado em *Definições avançadas*.

## Desenvolvimento

```
src/app.html          fonte da aplicação (com o marcador /*__RELAY_SRC__*/)
fascicul-releu.js     o relé (fonte única; incorporado na aplicação)
build.js              node build.js  →  fascicul.html (ficheiro único) + index.html (cópia idêntica, para o GitHub Pages)
```

Testes realizados durante o desenvolvimento (Chromium + Playwright): emparelhamento através do relé com candidatos mDNS ativos, aprovação / rejeição, participantes hostis (mensagens malformadas, inundação, falsificação de identidade, imagens em trânsito), religação automática, heartbeat, câmara em direto com dispositivo falso, descodificação de códigos QR renderizados com OpenCV, sessão gravada/carregada.

## Histórico / Changelog

### 1.2.8 — 2026-10-23

- Fix: the relay no longer corrupts UTF-8 characters (e.g. diacritics in a phone's name) split across TCP chunks.

### 1.2.7 — 2026-10-23
- As caixas nativas alert/confirm/prompt foram substituídas por diálogos FFF.dialog acessíveis e traduzidos (fff-kit 1.2.0).

### 1.2.5 — 2026-10-22

fff-kit 1.1.4: áreas de toque e texto mínimo. Áreas de toque/texto corrigidos na aplicação.

### 1.2.4 — 2026-10-22

fff-kit 1.1.2: PBKDF2 com 600.000 iterações, proteção anti-clickjacking.

### 1.2.3 — 2026-10-22
- O zoom com dois dedos já não está bloqueado no telemóvel (removido user-scalable=no); exatamente um H1 por ecrã e um ponto de referência main; as caixas de código só de leitura têm nome acessível.
- Em alojamento público (p. ex. GitHub Pages) a aplicação já não sonda /fsc-health, que só devolvia um 404 e um erro na consola; o relé só é procurado em endereços da rede local (IP, localhost, .local) ou no endereço configurado em Definições avançadas.
- Sem ligação: service worker real e manifesto de aplicação web com ícones (instalável; a página abre sem Internet, importante numa rede só de hotspot).
- Segurança: script-src já não usa 'unsafe-inline' (scripts inline apenas por hash; o único manipulador inline foi movido para o código). O campo do endereço do relé em Definições avançadas é validado (apenas http/https), com mensagem traduzida.

### 1.2.2 — 2026-10-22
- italiano: o passo de configuração do relé nomeia agora a pasta de transferências em italiano («cartella dei download») em vez de uma palavra inglesa isolada.

### 1.2.1 — 2026-10-22
- Correção de tradução: o título da sala automática, o ecrã «Ligação perdida» e o texto de ajuda do emparelhamento manual seguem agora o idioma da interface; os comentários de código do README estão localizados.

## Licença

[MIT](LICENSE) © Alexio (Alexandru‑Ionuț Chiuță)
