---
name: game-visuals
description: Stile dei personaggi ed effetti speciali per i giochi di browser-ai-games (three.js e canvas 2D in un singolo HTML). Usala quando si chiede di rendere un gioco più bello o accattivante, cambiare l'aspetto delle persone/personaggi, aggiungere luci, esplosioni, scintille, scie, aure, fuoco, neon, meteo, giorno/notte, bagliori o riflessi del sole, oppure di creare un nuovo gioco con una grafica curata.
---

# Grafica dei giochi: personaggi ed effetti

Questa skill raccoglie lo stile visivo già applicato ai giochi del repo e le ricette per estenderlo.
È pensata per crescere: ogni volta che applichi o migliori un effetto, aggiorna la sezione
**Registro** in fondo e, se hai imparato qualcosa, la reference giusta.

## Prima di toccare un gioco

1. **Capisci il motore del gioco.** Non sono tutti uguali:
   | Gioco | Motore | Note |
   |---|---|---|
   | `fight/` | three.js **r149 incorporato** nel file | Niente `colorspace_fragment` negli shader; luci "legacy" (intensità ~1–4). Unità ≈ pixel (personaggio alto ~190). |
   | `iron-line/`, `studio-zero/`, `skyflip/` | three.js **r160 da cdnjs** (UMD, `three.min.js`) | Negli `ShaderMaterial` aggiungi `#include <colorspace_fragment>`. Unità = metri. Gli addons (EffectComposer, GLTFLoader…) **non** sono nel build UMD. |
   | `city-drive/` (Afterglow GP), `city-rush/` | **motore 3D fatto a mano su canvas 2D** (poligoni proiettati, ordinati per z) | Effetti con `globalCompositeOperation='lighter'` e sprite di bagliore; niente depth buffer. |
   | `dino-frenzy/` | canvas 2D | Come sopra, in 2D puro. |
2. **Leggi il ciclo principale** (`frame`/`loop`/`render`) e cerca come il gioco "avvolge" le funzioni
   (diversi giochi fanno `const originalX = x; x = function(){...}`): è il punto più pulito dove agganciarsi.
3. **Non toccare il gameplay**: hitbox, statistiche, fisica restano uguali. Se un cambio estetico
   tocca le dimensioni (es. teste più grandi), dillo all'utente.
4. Ogni gioco è **un singolo HTML senza build**: niente file esterni, texture disegnate su canvas
   (`CanvasTexture`), asset eventuali in base64.

## Principi di stile

- **Pubblico: bambini e famiglie.** Colori vivaci ma palette corta (4–5 colori per personaggio),
  occhi grandi con punto luce, niente sangue.
- **Sicurezza lampi:** al massimo 3 lampi al secondo, niente grandi lampi rossi a tutto schermo.
  Se il gioco ha "Reduced motion" / "effetti ridotti", attenua lampi e scosse.
- **Costo costante:** pool di particelle a dimensione fissa, numero di luci fisso creato all'avvio
  (aggiungere luci dopo fa ricompilare tutti gli shader), meteo che segue la camera.
  Su mobile dimezza le particelle.
- **Additivo su sfondi chiari diventa bianco.** Su neve, cucina o cielo chiaro aggiungi un nucleo
  con fusione *normale* (colore pieno) sotto gli strati additivi.

## Reference

- `references/characters.md` — stili per le persone (8 base + ibridi con lo scheletro del manichino),
  proporzioni, codice di `limb()`, toon + contorno, faccia cartoon, lezioni imparate.
- `references/effects.md` — sistema di particelle, esplosione, scintille + lampo di luce, scie,
  aura, fuoco, neon/finto bloom, pass di bagliori 2D e lens flare, meteo, raggi di sole, hit-stop.
- `demos/personaggi.html` e `demos/effetti.html` — pagine dimostrative con tutti gli stili e gli
  effetti animati: aprile nel browser per scegliere con l'utente, e copia il codice da lì.
- `scripts/shoot.js` — screenshot headless di un gioco per verificare il risultato.

## Verifica (sempre, prima del commit)

Apri il gioco con Playwright e guarda almeno uno screenshot del momento in cui l'effetto si vede.
Vedi `scripts/shoot.js`. Trucchi utili:

- WebGL headless: lancia Chromium con `--use-gl=swiftshader --enable-unsafe-swiftshader`.
- Se cdnjs non è raggiungibile, scarica three con `npm pack three@0.160.0` e servi
  `package/build/three.min.js` con `page.route('**/three.min.js', ...)`.
- Lo stato dei giochi spesso è chiuso in una funzione: per i test crea una **copia** del file
  che espone ciò che serve (`window.__g = game;`), mai nel file vero. Iron Line espone già `window.__iron`.
- Con swiftshader gli fps sono bassi: aspetta con `waitForFunction` su una condizione (es. una luce
  di esplosione accesa) invece di tempi fissi.
- Lo screenshot coi tasti simulati può mancare l'attimo: per mosse/eventi rari chiamali dal codice
  nella copia di test.

## Registro (aggiorna qui)

| Data | Gioco | Cosa | Note |
|---|---|---|---|
| 2026-11 | Fight! | Personaggi "Eroe toon" (manichino + chibi toon), testa HR 19.5 | Ombre a 3 toni, contorno inverted hull, ginocchiere/gomitiere colore accento, occhi cartoon |
| 2026-11 | Fight! | Scie mani/piedi, scintille 3D + lampo di luce d'impatto, aura + cerchio magico nelle super | `fxHit()` chiamato da `applyHit`; punti di riferimento `handF/handB/footF/footB` nello scheletro |
| 2026-11 | Iron Line | Soldati "Cavaliere sfaccettato" (flatShading, ginocchia che si piegano, pennacchi colore squadra) | +2 mesh per soldato (stinchi): se rallenta con 420 unità, rendere rigide le gambe |
| 2026-11 | Iron Line | Massi infuocati, esplosione completa, scintille sugli scudi, neve/foglie per bioma | `explosionFX()`, `sparksFX()`, `setWeather()` |
| 2026-11 | Afterglow GP | Bagliori additivi (luci, turbo, lampioni, porte), lens flare, scintille sugli urti | Bagliori solo sul tratto di pista davanti (`md(p.s-cam.ss)<110`) per non vederli attraverso i palazzi |
| 2026-11 | City Rush | Stesso pass di bagliori + flare, scintille additive | |
| 2026-11 | Studio Zero | Scintille morbide, traccianti luminosi, lampi, "pop" di coriandoli, raggi di sole + pulviscolo, punti deboli e colonne obiettivo luminose | |

### Idee non ancora fatte
- Skyflip: tramonto/notte sui tetti, pioggia, scia di velocità.
- Dino Frenzy: bagliori `lighter` e onde d'urto all'atterraggio.
- Iron Line: bioma "tempesta" con pioggia e fulmini (ricetta in `effects.md`), torce negli accampamenti.
- Afterglow GP: gara notturna (cielo scuro + lampioni più forti), scie luminose delle luci posteriori.
- Bloom vero con `EffectComposer` (richiede moduli ES / importmap invece di `three.min.js`).
