# Pipeline di luce e colore ("perché sembra bello")

Ricette prese da tre giochi open source (tutti MIT) e adattate ai nostri vincoli (un solo HTML,
three r160 UMD da cdnjs, niente addon):
**Turbo Kart Rally** (bridge-mind/turbo-kart-rally), **Wild Fields 1648** (0xInsiderhq/wild-fields-1648),
**Claude-of-Tanks** (Kevin-Liu-01/Claude-of-Tanks). Se copi codice quasi alla lettera, cita la fonte in un commento.

La lezione principale: l'effetto "wow" viene soprattutto dalla **pipeline** (HDR → bloom → grade, cielo
che illumina e si riflette, ombre nitide), più che dal numero di particelle.

Implementazione di riferimento completa: **`iron-line/index.html`**, blocco
`/* Look: shared uniforms, cloud noise, material patch ... post-processing */` (`U`, `patchMat`, `POST`)
più `sky`, `FXP`, `fireballFX`. Copia da lì.

## 1. Post-processing fatto a mano (bloom vero + grade) — `POST`

Il build UMD r160 non ha `EffectComposer`. Alternative scartate: moduli ES con importmap (come Turbo Kart, ma
cambia tutto il file) e `examples/js` (esistono solo fino a ~r147, come fa Wild Fields con r128).
Quindi bastano ~60 righe con `WebGLRenderTarget`:

1. Scena in un target **HalfFloat con MSAA** (`samples:4`): i colori possono superare 1.0 (sole, fuoco, scintille).
2. **Bright pass** a metà risoluzione: tiene solo l'eccesso sopra la soglia `th` con un "ginocchio" morbido.
   `th=1.1`: con 1.0 neve, bandiere bianche e fiocchi si mettono a brillare.
3. **4 livelli di blur** (½, ¼, ⅛, 1/16): downsample → blur orizzontale → blur verticale (5 campioni
   con il trucco del campionamento lineare: offset 1.385 e 3.231, pesi .227/.316/.070).
4. **Composito** su schermo:
   - *sharpen* leggero (c + (c − media dei 4 vicini)·0.22): ridà nitidezza dopo MSAA e bloom (Wild Fields);
   - bloom sommato (pesi .9/.75/.6/.5 per livello, intensità .55);
   - esposizione, calore (`×(1.025,1,.965)`), saturazione 1.08;
   - **spalla morbida** invece di ACES: identica sotto 0.78, sopra comprime dolcemente. ACES scurisce e
     desatura i mezzitoni: i nostri colori "da cartone" diventerebbero spenti;
   - vignettatura leggera;
   - `#include <colorspace_fragment>` alla fine (converte in sRGB).
- I materiali normali disegnati nel target restano lineari (three applica sRGB solo sullo schermo): nessun cambio.
- Gli shader custom (particelle, cielo) devono includere `colorspace_fragment` come sempre: funziona in entrambi i casi.
- Per far brillare qualcosa basta che superi 1.0: uniform `boost` nelle particelle additive (fuoco 1.5,
  scintille 2.4), nucleo della palla di fuoco ×1.7, disco del sole ×5.
- **Interruttore qualità:** `POST=null` con `?fx=low`, senza WebGL2, o su touch con lato corto < 560 px.
  Il frame fa `if(POST)POST.render();else renderer.render(scene,camera);`. `POST.resize()` nel resize.

## 2. Cielo shader (Turbo Kart, Wild Fields)

Sfera `BackSide`, `fog:false`, `depthWrite:false`. Nel fragment:
- gradiente orizzonte→zenit `mix(hor, top, pow(y,.6))`;
- sole a tre strati: disco `smoothstep(.9993,.9996,s)*5`, alone `pow(s,48)*.35`, bagliore largo `pow(s,6)*.1`
  (`s = dot(dir, sunDir)`, **stessa direzione della DirectionalLight**);
- nuvole: proietta la direzione su un piano (`d.xz/(d.y+.18)`), campiona la stessa texture di rumore delle
  ombre a terra, `smoothstep` con la copertura del bioma, sfuma vicino all'orizzonte, bordo illuminato verso il sole.

**Cielo → riflessi** (Turbo Kart, Shield Brothers): disegna la stessa cupola in una scena a parte e passala a
`PMREMGenerator.fromScene` → `scene.environment`. Serve solo con `MeshStandard/Physical`, non con Lambert.
**Look "giocattolo lucido"** (kart): envMap equirettangolare dipinta su canvas (gradiente cielo/terra + 4 ellissi
bianche come luci da studio) + `MeshPhysicalMaterial({clearcoat:1, clearcoatRoughness:.08})`.

## 3. `patchMat`: iniettare effetti in tutti i materiali (Wild Fields)

`onBeforeCompile` su Lambert/Standard, con uniform condivise (`U.time`, `U.cloud`):
- **vertex**: dopo `#include <project_vertex>` calcola `vWP` (posizione nel mondo, con `instanceMatrix` se
  `USE_INSTANCING`);
- **ombre delle nuvole**: prima di `#include <aomap_fragment>`
  `reflectedLight.directDiffuse *= 1. - smoothstep(a,b, texture2D(uCloud, vWP.xz*.0055 + t*vel).r)*.42;`
  Scurisce solo la luce diretta, non quella ambiente: sembra un'ombra vera.
- **vento** (vegetazione instanziata): dopo `#include <begin_vertex>`
  `transformed.x += (sin(t*1.3+ip.x*.37+ip.z*.29)+.35*sin(t*3.1+ip.x*1.7)) * k * hh*hh;`
  con `hh = altezza sopra la base`, `ip` = posizione dell'istanza (fase diversa per albero).
  k: chiome alte 5 m → .006 (base 1.6); ciuffi d'erba alti .45 → .35.
- `customProgramCacheKey` diverso per combinazione di opzioni, altrimenti three riusa il programma sbagliato.
- Texture di rumore: value noise periodico a 4 ottave in una `DataTexture` 128², `RepeatWrapping`.
- Limite: l'ombra proiettata dagli alberi non ondeggia (il materiale di profondità non è patchato): non si nota.

## 4. Ombre nitide

Sole e `sun.target` **seguono il punto guardato** dalla camera, con il frustum ortografico stretto attorno
(Wild Fields: `span = dist*0.95`). Un sole più basso (~40°) dà ombre lunghe e più profondità
(Iron Line: da (40,70,25) a (50,52,30)). Con frustum grande servono mappe grandi: meglio stringere.

## 5. Particelle e fuoco (Turbo Kart)

- **Rotazione** per particella (attributo `prot`, ruota `gl_PointCoord` nel fragment) + `spin` lento per il fumo.
- **Stellina a 4 punte** calcolata nel fragment, senza texture:
  `vec2 q=abs(p*2.);float st=max(0.,1.-q.x*7.)*max(0.,1.-q.y)+max(0.,1.-q.y*7.)*max(0.,1.-q.x);a=max(a*.75,st);`
- **Fumo gonfio**: texture con 6 gradienti radiali sovrapposti (non un disco singolo).
- **Detriti instanziati**: `InstancedMesh` di cubetti (erba, terra, coriandoli) con rimbalzo a terra.
- **Emettitori ad accumulatore**: `acc += dt*rate; while(acc>=1){acc--; emit();}`, flusso costante a qualsiasi fps.
  Per le scie di oggetti in movimento emetti in base alla **distanza percorsa** (Claude-of-Tanks), così non ci sono buchi.
- **Palla di fuoco** (`fireballFX`): icosfera (dettaglio 4) deformata da rumore 3D nel vertex, colore dal "calore"
  `1 - vita*1.45 + rumore*.5 - fresnel*.75` (centro bianco-giallo HDR, bordo rosso che sfuma). Pool di 5,
  scala `.25→1.1` con ease-out, sale piano. Una mesh sola sembra volumetrica.

## 6. Camera che "si sente" (Turbo Kart)

- **FOV dinamico**: base 70 → +9 con la velocità, +6 col turbo, interpolato (`k=1-exp(-3.5*dt)`).
- **Rollio** leggero in curva.
- **Linee di velocità**: 70 quad additivi in spazio camera (`depthTest:false`) che scorrono verso lo spettatore,
  visibili solo col turbo, alfa che sale in fretta e scende piano.
- **Scossa** con intensità `(1 - d/range)^1.5` dalla distanza dell'esplosione, quadrata prima di applicarla,
  decadimento esponenziale. Rispettare "effetti ridotti".

## 7. Acqua stilizzata (Turbo Kart, Wild Fields)

Normale da somma di 4 onde direzionali + rumore; `fresnel = pow(1-dot(n,V),4)` → mix verso il colore del cielo;
riflesso del sole `pow(dot(n,H),260)*3`; scintillii `step(.985, noise(p*1.7+t))`; colore basso/profondo da una
texture di profondità; schiuma a bande animate vicino a riva `sin(depth*70 - t*2.2)`; alfa più bassa dove è basso.

## 8. Idee "povere" da Claude-of-Tanks (non ancora provate)

- **Prospettiva aerea**: in lontananza desatura e sposta verso blu-grigio (nel composito, se c'è la profondità,
  o nel `fog_fragment` patchato) invece della nebbia piatta: i piani lontani restano distinti.
- **Rimbalzo dal terreno**: le facce rivolte in basso ricevono il colore del suolo illuminato. Versione povera:
  `HemisphereLight.groundColor` = colore del terreno schiarito, aggiornato per bioma.
- **Lens flare oscurato gradualmente**: campiona più punti attorno al sole (o fai più raggi contro gli AABB)
  e ammorbidisci la visibilità in ~70 ms invece di accendere/spegnere.
- **Raggi di sole in screen-space**: blur radiale verso il sole di una maschera "cielo visibile".
- **Decalcomanie d'impatto** da un atlante su canvas (buco, bordo fuso, graffi radiali), orientate lungo il colpo.

## Lezioni imparate

- Prima di cambiare la pipeline fai uno screenshot "prima" con le stesse inquadrature, per confrontare.
- Su sfondi chiari (neve) controlla che il bloom non trasformi tutto in nebbia: alza la soglia.
- La spalla morbida tiene i colori dei giochi per bambini; ACES li spegne.
