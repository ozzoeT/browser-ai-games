---
name: game-visuals
description: Stile dei personaggi, effetti speciali e pipeline di luce/colore (bloom, color grading, cielo, nuvole, vento) per i giochi di browser-ai-games (three.js e canvas 2D in un singolo HTML). Usala quando si chiede di rendere un gioco più bello o accattivante, cambiare l'aspetto delle persone/personaggi, aggiungere luci, esplosioni, scintille, scie, aure, fuoco, neon, meteo, giorno/notte, bagliori o riflessi del sole, oppure di creare un nuovo gioco con una grafica curata. Prima di iniziare propone all'utente un breve questionario sullo stile desiderato.
---

# Grafica dei giochi: personaggi ed effetti

Questa skill raccoglie lo stile visivo già applicato ai giochi del repo e le ricette per estenderlo.
È pensata per crescere: ogni volta che applichi o migliori un effetto, aggiorna la sezione
**Registro** in fondo e, se hai imparato qualcosa, la reference giusta.

## Questionario di stile (prima di iniziare)

La skill **non impone uno stile**: ogni gioco sceglie il suo. Le scelte fatte su un gioco (es. Iron Line) sono
esempi nel Registro, non regole. Quando si crea un gioco nuovo o si chiede di "renderlo più bello" senza dire
cosa, **chiedi all'utente** con `AskUserQuestion`, in parole semplici, **niente termini tecnici**.

Come:
- Scegli dal banco qui sotto **le 4 domande più utili per quel gioco** (massimo 4 per volta; se serve, un secondo giro).
- Riformula domanda e opzioni sul gioco concreto ("Come cade il masso della catapulta?" invece di "tipo di impatto").
- Metti per prima, con "(Consigliato)", l'opzione che sta meglio al genere e al pubblico, ma lascia sempre le alternative.
- Salta quello che l'utente ha già detto. Tieni fuori le opzioni che col gioco non c'entrano.
- Scrivi le scelte nel Registro, così le modifiche successive allo stesso gioco restano coerenti.

### Banco di domande

| Tema | Domanda (da adattare) | Opzioni tipiche |
|---|---|---|
| Luce | "Che luce vuoi nel gioco?" | Cartone solare · Tramonto caldo · Cinematografico · Notte magica · Nuvoloso/tempesta |
| Bagliori | "Quanto devono brillare fuoco, scintille e magie?" | Poco · Morbido · Tanto, stile sala giochi |
| Colori | "Che colori preferisci?" | Pieni e vivaci (cartone) · Naturali · Caldi e antichi (pergamena) · Freddi e cupi |
| Colpi ed esplosioni | "Come devono essere i colpi forti / le esplosioni?" | Fuoco ed esplosione · Impatto di terra e polvere · Magico (stelle, coriandoli, anelli) · Leggero (scintille e un po' di fumo) · Elettrico/energia · Spruzzo d'acqua o neve |
| Grandezza effetti | "Quanto grandi?" | Piccoli e precisi · Medi · Enormi e spettacolari |
| Mondo vivo | "Cosa rende il mondo più vivo?" (multipla) | Nuvole che fanno ombra · Vento su alberi ed erba · Acqua che luccica · Meteo · Pulviscolo/lucciole |
| Azione | "Quanto deve farsi sentire l'azione?" (multipla) | Schermo che trema · Sensazione di velocità · Fermo-immagine sui colpi · Scie dietro armi e mani |
| Personaggi | "Come vuoi le persone?" | Uno degli stili di `characters.md` (cartone, sfaccettato, liscio, chibi…) · Livello di dettaglio: semplice · rifinito · molto dettagliato |
| Materiali | "Che aspetto per metallo e veicoli?" | Opachi · Lucidi come giocattoli · Realistici con riflessi del cielo |

### Da risposta a ricetta

| Risposta | Cosa fare (vedi `references/rendering.md`, `effects.md`, `characters.md`) |
|---|---|
| Cartone solare | Sole medio-alto (35–50°), colori pieni, grade neutro (sat 1.05–1.1), tone mapping a spalla morbida, vignetta leggera |
| Tramonto caldo | Sole basso (15–25°), luce arancio, orizzonte caldo, grade caldo, lens flare, ombre lunghe |
| Cinematografico | ACES o spalla più forte, contrasto, vignetta .35–.45, prospettiva aerea blu, bloom più largo |
| Notte magica | Cielo scuro con stelle, luci puntiformi e neon, bloom forte, lucciole/pulviscolo |
| Nuvoloso/tempesta | Copertura nuvole alta, ombre delle nuvole marcate, pioggia/fulmini, grade freddo |
| Bagliori poco / morbido / tanto | Bloom .3 / .55 / .9; soglia ~1.0–1.2 (più alta su sfondi chiari) |
| Colori naturali / antichi / cupi | Saturazione .95–1 / calore + leggera desaturazione / grade freddo e vignetta forte |
| Colpi: una delle famiglie | `effects.md` §2 "Impatti ed esplosioni": scegli la famiglia e la taglia (`s`) |
| Nuvole con ombra / vento | `patchMat` (`rendering.md` §3) |
| Acqua che luccica | Shader dell'acqua (`rendering.md` §7) |
| Meteo / pulviscolo | `setWeather`, pulviscolo nei raggi di sole (`effects.md`) |
| Schermo che trema / velocità | `rendering.md` §6; rispetta "effetti ridotti" |
| Fermo-immagine, scie | `effects.md` (hit-stop, scie) |
| Personaggi rifiniti / molto dettagliati | `characters.md`: rifiniture con lathe; per "molto dettagliati" il sistema a parti instanziate di Wild Fields |
| Materiali lucidi / realistici | envMap "da studio" + clearcoat / cielo → PMREM → `scene.environment` con `MeshStandardMaterial` |

## Prima di toccare un gioco

1. **Capisci il motore del gioco.** Non sono tutti uguali:
   | Gioco | Motore | Note |
   |---|---|---|
   | `pop-gallery/` | three.js **r160 da cdnjs** | Camera fissa con leggero ondeggiamento verso il mirino; colpi = raggio contro sfere (`rayHit`), niente raycast sulle mesh. Fucile a tappi in `vmScene`. |
| `fight/` | three.js **r149 incorporato** nel file | Niente `colorspace_fragment` negli shader; luci "legacy" (intensità ~1–4). Unità ≈ pixel (personaggio alto ~190). |
   | `iron-line/`, `shield-brothers/`, `studio-zero/`, `skyflip/` | three.js **r160 da cdnjs** (UMD, `three.min.js`) | Negli `ShaderMaterial` aggiungi `#include <colorspace_fragment>`. Unità = metri. Gli addons (EffectComposer, GLTFLoader…) **non** sono nel build UMD: Iron Line ha bloom e grade **fatti a mano** (`POST`): è un'implementazione di riferimento, i valori vanno scelti per ogni gioco. |
   | `city-drive/` (Afterglow GP), `city-rush/` | **motore 3D fatto a mano su canvas 2D** (poligoni proiettati, ordinati per z) | Effetti con `globalCompositeOperation='lighter'` e sprite di bagliore; niente depth buffer. |
   | `dino-frenzy/` | canvas 2D | Come sopra, in 2D puro. Particelle in `parts` con forme (`spark`, `star`, `ring`, `conf`…). |

   Skyflip ha in più un canvas 2D sovrapposto (`fx`, disegnato in `drawFx`) per effetti di schermo, e un hook di test `window.__skyflip`.
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

- `references/rendering.md` — la pipeline che rende un gioco "accattivante": bloom + color grading fatti a mano,
  cielo con sole e nuvole, `patchMat` (ombre delle nuvole, vento), ombre nitide, particelle migliori, palla di
  fuoco, camera che si sente, acqua. Ricette prese da Turbo Kart Rally, Wild Fields 1648 e Claude-of-Tanks (MIT).
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
- In headless `waitForFunction` (polling su animation frame) a volte si blocca: se un'attesa scade
  senza errori nella pagina, usa un ciclo con `waitForTimeout(500)` + `evaluate` invece.

## Registro (aggiorna qui)

| Data | Gioco | Cosa | Note |
|---|---|---|---|
| 2026-11 | Fight! | Personaggi "Eroe toon" (manichino + chibi toon), testa HR 19.5 | Ombre a 3 toni, contorno inverted hull, ginocchiere/gomitiere colore accento, occhi cartoon |
| 2026-11 | Fight! | Scie mani/piedi, scintille 3D + lampo di luce d'impatto, aura + cerchio magico nelle super | `fxHit()` chiamato da `applyHit`; punti di riferimento `handF/handB/footF/footB` nello scheletro |
| 2026-11 | Iron Line | Soldati "Cavaliere sfaccettato" (flatShading, ginocchia che si piegano, pennacchi colore squadra) | +2 mesh per soldato (stinchi): se rallenta con 420 unità, rendere rigide le gambe |
| 2026-11 | Iron Line | Massi infuocati, esplosione completa, scintille sugli scudi, neve/foglie per bioma | `explosionFX()`, `sparksFX()`, `setWeather()` |
| 2026-11 | Afterglow GP | Bagliori additivi (luci, turbo, lampioni, porte), lens flare, scintille sugli urti | Bagliori solo sul tratto di pista davanti (`md(p.s-cam.ss)<110`) per non vederli attraverso i palazzi |
| 2026-11 | City Rush | Stesso pass di bagliori + flare, scintille additive | |
| 2026-11 | Afterglow GP | Grafica allineata a City Rush: auto con carrozzeria arrotondata (`rbox`, 4 anelli da 20 punti, culling per faccia con la normale), ruote tonde, lunotto, paraurti, targa, specchietti; vetrine con montanti e insegne sui palazzi, alberi sul marciapiede, giunti e tombini, ostacoli in 3 varianti (transenna, cassone, coni) | `obox` di Afterglow ha il culling per box: per forme arrotondate serve quello per faccia, altrimenti l'ordinamento del pittore mostra il retro |
| 2026-11 | Studio Zero | Scintille morbide, traccianti luminosi, lampi, "pop" di coriandoli, raggi di sole + pulviscolo, punti deboli e colonne obiettivo luminose | |
| 2026-11 | Skyflip | Lens flare + bagliore sul sole basso (spento se coperto da un palazzo), pulviscolo luminoso per livello, stelle cadenti (tramonto/notte), anelli d'urto all'atterraggio | Occlusione del sole: raggio contro gli AABB di `solids` (`sunBlocked`) |
| 2026-11 | Dino Frenzy | Alone additivo su scintille e stelle, aura turbo/super, anello d'urto all'atterraggio, raggi di sole nella giungla, braci luminose sul vulcano | `drawGlowParts()` dopo `drawParts()` |
| 2026-11 | Dino Frenzy | Dinosauri "manichino + cartoon": gambe a due ossa con IK (`ik2`, `jointLeg`), ginocchia/caviglie/gomiti colore accento, cel shading a due toni (`TOON`, `celShade` in `blob`/`blobIn`), occhi con doppio punto luce | Bug corretto: indice `CONF[...%6]` negativo con tempo negativo bloccava il ciclo di gioco: usare `mod()` |
| 2026-11 | Shield Brothers | Nuovo gioco in prima persona sul motore di Iron Line: stessi soldati sfaccettati (4 culture × 4 ruoli, scudi tondi/ovali/a goccia/scutum come mesh separate che si alzano in guardia), scintille + lampo sui blocchi, rottura della guardia, braci/fumo delle torce, pioggia + fulmini nel bioma tempesta, bagliore del sole, pulviscolo | Braccia e armi in prima persona in una seconda scena (`vmScene`) disegnata dopo `clearDepth()`: non entrano mai nei corpi vicini. Scala le mesh delle armi (~0.6), non il gruppo: scalare il gruppo attorno alla camera non cambia nulla in prospettiva |
| 2026-11 | Shield Brothers | Grafica "liscia": soldati arrotondati (busto con `LatheGeometry`, arti a capsula, facce con occhi/sopracciglia/naso/orecchie, capelli e barbe), `MeshStandardMaterial` con attributo `metal` per vertice (elmi, lame e maglia lucidi, stoffa opaca), riflessi del cielo da `PMREMGenerator`, scudi dipinti con `CanvasTexture` per cultura e squadra, lame e asce estruse con smusso, pini a tre piani | LOD: due set di geometrie (`SEG=.45` lontano) scambiati oltre 16 m. Da 15k a 8k triangoli per soldato vicino, 2.3k lontano |
| 2026-11 | Pop Gallery | Nuovo tiro a segno in prima persona (fermo): 3 mondi (luna park, valle dei dinosauri da sfamare, galassia giocattolo), coriandoli + scintille + anelli d'urto, tappi volanti con scia, bersagli cartoon con occhioni, cuoricini (`heartFX`) quando un dinosauro mangia, uova che si schiudono | Su schermi verticali la tenda dello stand viene nascosta (copre troppo). Fumo con texture `DOT` morbida: con un disco pieno sembrava fatto di cerchi piatti |
| 2026-11 | Pop Gallery | Dinosauri "chibi toon": `MeshToonMaterial` a 3 toni chiari (175/225/255), contorno inverted hull (`addOutlines`, 0.022 m), occhioni con iride colorata + 2 punti luce + bordo scuro, guance rosa, dentini, bocca che si apre scalando un gruppo (`openM`), pigiama col berretto per il dinosauro che dorme | Con la rampa toon scura (120) i colori diventavano fangosi. Pupilla e punti luce vanno ben davanti all'iride (z ≥ 0.5·r), altrimenti si intersecano e sembrano frastagliati |

| 2026-11 | Iron Line | Pipeline nuova (pilota di `rendering.md`): bloom vero + grade fatti a mano (`POST`, spento con `?fx=low` e su telefoni piccoli), cielo shader con sole e nuvole, ombre delle nuvole su tutto (`patchMat`), vento su chiome ed erba, sole più basso (ombre lunghe), particelle con rotazione, scintille a stella che brillano, fumo gonfio, palla di fuoco a icosfera nelle esplosioni | Soglia bloom 1.0 faceva brillare la neve e i fiocchi vicini: 1.1. ACES scartato: spegneva i colori |

| 2026-11 | Iron Line | Soldati rifiniti "alla Wild Fields" (busto e arti torniti, testa con mascella/orecchie/sopracciglia/capelli, barbe, stivali col piede, AO per vertice); il Berserker diventa **Variago** (elmo conico con nasale, cotta di maglia lunga, scudo dipinto sulla schiena, barba, fasce alle gambe, ascia danese a due mani con posa `two`); esplosioni dei massi più piccole (`explosionFX(...,.6)`, raggio del danno invariato) | Variago: armatura .05→.2, velocità 4.2→3.6, portata 1.3→1.4 (più fedele a un guerriero in maglia con ascia lunga) |

| 2026-11 | Iron Line | Impatto del masso della catapulta: da esplosione di fuoco a impatto di terra (`rockImpactFX`: anello di polvere radente, nuvola, zolle e schegge, cratere color terreno, colori per bioma) | Bug vecchio corretto: opacità del cratere fino a 1.3, con l'HDR diventava viola |

### Idee non ancora fatte
- Portare `POST` + `patchMat` + cielo su Shield Brothers, Studio Zero, Skyflip e Pop Gallery (stesso three r160).
- Prospettiva aerea e rimbalzo di luce dal terreno (`rendering.md` §8).
- Skyflip: pioggia su un livello nuovo, scie luminose dietro le mani durante flip e spin.
- Dino Frenzy: aurora più viva e neve con alone sul ghiacciaio, lava che illumina il terreno.
- Iron Line: bioma "tempesta" con pioggia e fulmini e torce (già fatti in Shield Brothers: copiare `fxUpdate`/`torches`).
- Afterglow GP: gara notturna (cielo scuro + lampioni più forti), scie luminose delle luci posteriori.
