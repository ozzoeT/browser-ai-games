# Personaggi ("persone")

Demo animata di tutto questo: `../demos/personaggi.html`.

## Concetto chiave: scheletro × pelle

- **Scheletro** = gerarchia di `Group` che fanno da perni: anca → ginocchio, spalla → gomito, collo → testa.
  Le animazioni ruotano solo i perni.
- **Pelle** = mesh attaccate ai perni: materiali, proporzioni, faccia, contorno.

Le due cose sono indipendenti: lo stesso scheletro può avere qualsiasi stile. Fight! e Iron Line
hanno già uno scheletro; cambiare stile = cambiare solo le mesh.

Convenzione nelle demo: il personaggio guarda +z; ruotare un perno di gamba di `+x` porta il piede
indietro, quindi il ginocchio si piega con `rotation.x > 0`.

## Gli 8 stili base

| Stile | Teste | Tecnica | Adatto a |
|---|---|---|---|
| Blocchi | ~5,5 | `BoxGeometry` + sfera | folle, prototipi (Iron Line prima) |
| Chibi toon | ~2 | `MeshToonMaterial` + gradientMap, contorno inverted hull, occhi grandi | bambini, mascotte |
| Low-poly sfaccettato | ~6 | `flatShading`, cilindri a 5–6 lati, icosaedri | strategia, avventura |
| Voxel | ~3,5 | cubi, faccia = `CanvasTexture` 8×8 con `NearestFilter` | sandbox, personaggi personalizzabili |
| Fagiolo party | 1 | `CapsuleGeometry` + `MeshPhysicalMaterial` clearcoat, squash & stretch ×3 | party game, pedoni |
| Manichino | ~7 | due segmenti per arto, giunture a sfera | combattimento, ragdoll |
| Ritaglio di carta | ~3 | `ShapeGeometry` + bordo bianco dietro, animazione nel piano (`rotation.z`) | storie, menu |
| Pixel sprite 2D | ~3 | canvas 24×34 ridisegnato per frame, contorno 1 px calcolato | giochi 2D |

## Ibridi (scheletro del manichino + pelle di un altro stile)

| Ibrido | Mix | Teste | Dove |
|---|---|---|---|
| Eroe toon | manichino + chibi toon | ~4 | **Fight!** (applicato) |
| Chubby snodato | manichino + chibi, pancia tonda | ~2,5 | Studio Zero (idea) |
| Fagiolo snodato | manichino + fagiolo, arti "a tubo di gomma" | 1 | party/pedoni (idea) |
| Cavaliere sfaccettato | manichino + low-poly | ~6,5 | **Iron Line** (applicato) |
| Guerriero liscio PBR | manichino + forme lisce + metallo per vertice | ~6,5 | **Shield Brothers** (applicato) |

## Ricette di codice

### Arto a due segmenti (r160, unità metri)
```js
function limb(parent,x,y,L1,L2,r1,r2,o){ // o:{geo,mU,mL,mJ,ol,end}
  const g=o.geo||((r,l)=>new THREE.CapsuleGeometry(r,Math.max(.01,l-r),6,14));
  const a=new THREE.Group();a.position.set(x,y,0);parent.add(a);              // spalla / anca
  if(o.mJ)a.add(new THREE.Mesh(new THREE.SphereGeometry(r1*1.2,14,10),o.mJ)); // giuntura visibile
  const u=new THREE.Mesh(g(r1,L1),o.mU);u.position.y=-L1/2;a.add(u);
  const j=new THREE.Group();j.position.y=-L1;a.add(j);                          // gomito / ginocchio
  const l=new THREE.Mesh(g(r2,L2),o.mL||o.mU);l.position.y=-L2/2;j.add(l);
  if(o.end)o.end(j,L2);                                                         // mano / scarpa
  return [a,j];
}
// per il low-poly: geo:(r,l)=>new THREE.CylinderGeometry(r,r*.8,l,6) + material flatShading:true
```

### Toon a tre toni
```js
const GM=new THREE.DataTexture(new Uint8Array([90,90,90,255,170,170,170,255,255,255,255,255]),3,1);
GM.minFilter=GM.magFilter=THREE.NearestFilter;GM.needsUpdate=true;
const tmat=c=>new THREE.MeshToonMaterial({color:c,gradientMap:GM});
```

### Contorno "inverted hull" (copia scalata con `BackSide`)
Usa uno spessore costante per asse calcolato dal bounding box, così arti sottili e geometrie traslate
(es. segmenti con l'origine in alto) non diventano enormi:
```js
const INK=new THREE.MeshBasicMaterial({color:0x1a1424,side:THREE.BackSide});
function addOutlines(root,T){ // T = spessore nelle unità del gioco (Fight!: 1.7, metri: ~0.025)
  const list=[];root.traverse(o=>{if(o.isMesh&&!o.userData.noLine)list.push(o)});
  for(const m of list){const g=m.geometry;g.computeBoundingBox();const bb=g.boundingBox,s=m.scale;
    const k=a=>1+T/(Math.max(Math.abs(bb.min[a]),Math.abs(bb.max[a]),.5)*Math.abs(s[a]));
    const h=new THREE.Mesh(g,INK);h.scale.set(k('x'),k('y'),k('z'));h.userData.noLine=true;m.add(h);}
}
```
Escludi con `userData.noLine=true` occhi, bocca e geometrie aperte (cilindri `openEnded`).
I contorni non devono proiettare ombre: `castShadow` solo se `o.material!==INK`.

### Occhi cartoon visibili di profilo (Fight!)
Ogni occhio è un `Group` al centro della testa ruotato di `atan2(cos a, ±sin a)` (a≈0.7 rad dal
davanti verso la camera); dentro: pupilla nera (sfera scalata 3.8×6×2.4), punto luce bianco,
sopracciglio inclinato. Così con la camera laterale si vede l'occhio vicino.

### Rifiniture "alla Wild Fields" su low poly a facce piatte (Iron Line `human()`)
Da Wild Fields 1648 (MIT): stessa silhouette e stesse ossa, ma ogni pezzo è più "scolpito".
- **Busto e arti torniti** con `LatheGeometry` da un profilo `[[raggio, y], ...]` dal basso all'alto (vita stretta,
  petto, spalle arrotondate; bicipite con deltoide, avambraccio che si assottiglia), 7–8 segmenti, schiacciato in z.
  Con `flatShading` resta lo stile sfaccettato.
- **Testa**: cranio (sfera leggermente allungata) + mascella (sfera schiacciata più in basso e in avanti) + naso a cono +
  orecchie + occhi sferici scuri + sopracciglia (box inclinati) + **calotta di capelli** (mezza sfera inclinata
  indietro di 0.5 rad: copre nuca e cima, lascia libera la fronte). Barba opzionale: mezza sfera sotto la mascella +
  cono verso il basso + baffi. Per elmi chiusi passa `face:false` (il naso buca l'elmo) e `hairCap:false`.
- **Stivali**: gambale tornito con risvolto + piede da sfera allungata in avanti (`scale .85,.55,1.6`). Fasce
  mollettiere: anelli sottili inclinati.
- **Ombreggiatura finta** in `mergeParts(parts, shade)`: luminosità per vertice in base all'altezza
  (busto .8 in basso → 1 alle spalle, gambe più scure in basso) e una variazione ±3.5% per faccia (hash del triangolo).
- Costo: da ~1k a ~2.2k triangoli per soldato (2.9k il variago). Con 420 unità ~1M triangoli: ok su PC;
  se rallenta su telefono, abbassa i segmenti delle sfere della testa.
- Arma a due mani: lama da `Shape` estrusa (il filo verso −y locale del braccio, la direzione del colpo), braccia
  ruotate in z verso l'interno (±0.42) a riposo e `rl = rr` nell'animazione così entrambe le mani restano sull'asta.

### Livello "molto dettagliato": il sistema a parti di Wild Fields 1648 (MIT, `src/r_units.js`)
Come fa un RTS ad avere centinaia di soldati dettagliati e animati bene. Cinque idee che lavorano insieme:
1. **Ogni pezzo è modellato a mano in metri, una volta sola**, con profili `LatheGeometry` molto curati (busto con
   13 punti di profilo, coscia, gambale, avambraccio con polsino) e piccoli dettagli veri: bottoni sferici in fila,
   fusciacca a righe, colletto, bandoliera con le cariche, corazza con la costola centrale, ali da ussaro con
   32 piume, cappelli diversi (paglia, kalpak col pennacchio, feltro con la piuma, morione, elmo con le lamelle).
2. **I dettagli sono "dipinti" sui vertici** con una funzione `paint(geo, (x,y,z) => [r,g,b,tint])`: orbite degli
   occhi più scure, bordo degli stivali, costure del cappotto, la tunica che diventa gilet dietro un certo angolo,
   rumore leggero per vertice (`noiseK`) che fa sembrare stoffa e paglia. Niente texture.
3. **Una sola mesh instanziata per tipo di pezzo** (testa, coscia, busto, cappello…): tutti i soldati sullo
   schermo con lo stesso pezzo = **un draw call**. Ogni frame si scrive la matrice di ogni pezzo di ogni soldato.
   Il dettaglio costa triangoli, non draw call.
4. **Maschera `tint` per vertice**: nel pezzo, le zone con `tint=1` prendono il colore dell'istanza (colore della
   squadra, pelle, mantello del cavallo), quelle con `tint=0` tengono il colore dipinto (bottoni d'ottone, cintura
   nera). Così un solo busto instanziato fa tutte le squadre. Iniezione: in `color_vertex`
   `vColor.xyz *= mix(vec3(1.), instanceColor.xyz, tint);`.
5. **Scheletro procedurale con IK a due ossa**: niente animazioni registrate. Per ogni posa si decidono bacino,
   busto (inclinazione, torsione), punti dei piedi e delle mani; `ik2` calcola ginocchia e gomiti. Le armi a due
   mani si mettono con `place(p, direzione, su)` e le mani vanno *sull'arma* (`aL`, `aR` presi lungo l'asta).
   Colpi e lavori sono interpolazioni tra due "prese" (`chopHold`: carica → colpo → ritorno). Il passo (`gaitLegs`)
   e l'inattività (peso che si sposta) sono formule. Morendo, i cappelli cadono nell'erba e l'arma resta accanto.
In più: teste ingrandite del 10% (`HS=1.1`) perché si leggano dalla camera RTS, ombra a macchia sotto i piedi,
metallo con `MeshStandardMaterial` lucido (metalness .85) separato dalla stoffa opaca, varianti di pelle e di
pantaloni per tipo, `PART_CAP` per dimensionare ogni pool.
Costo: tanti triangoli ma pochissimi draw call; aggiornare le matrici di 900 soldati × ~12 pezzi è lavoro JS.
Quando usarlo: giochi con molte unità uguali (strategia, battaglie). Per pochi personaggi grandi basta un rig a gruppi.

## Variante 2D (canvas): manichino + cartoon (Dino Frenzy)

Stessa idea senza three.js:
- **Gamba a due ossa con IK** ogni frame: dato anca e piede (dal ciclo di camminata esistente)
  si calcola il ginocchio con la legge del coseno (`ik2(hx,hy,fx,fy,L1,L2,bend)`); `bend=-1` piega
  in avanti (verso +x). Coscia spessa (`th*.82`), stinco sottile (`th*.6`), giuntura colorata.
- **Cel shading**: dentro la sagoma (clip) un'ellisse scura semi-trasparente sulla parte bassa e
  un riflesso chiaro in alto. Attivo solo mentre si disegna il personaggio (contatore `TOON`
  incrementato da un wrapper attorno alle funzioni di disegno), solo su forme con contorno e
  colore pieno (`fill[0]==='#'`).
- Lunghezze delle ossa proporzionali all'altezza dell'anca (`-hy*0.6`, `-hy*0.55`) così funzionano
  per specie diverse.

## Lezioni imparate

- **Metallo per vertice in un'unica mesh unita** (Shield Brothers): attributo `metal` scritto da
  `mergeParts()` in base al colore della parte, letto in `onBeforeCompile` al posto di
  `metalnessmap_fragment`/`roughnessmap_fragment`. Senza una `scene.environment` (PMREM) il metallo è nero:
  anche il renderer delle icone ne ha bisogno. Riflettendo l'erba le lame diventano verdi: nell'ambiente
  mescola il terreno con un grigio.
- **LOD semplice**: costruisci le geometrie due volte con un moltiplicatore globale dei segmenti
  e cambia `mesh.geometry` in base alla distanza; nessuna ricompilazione degli shader.

- **Ingrandendo la testa**, gli accessori posizionati con numeri fissi finiscono dentro
  (la barba di Bruno è sparita). Esprimi le posizioni in funzione del raggio (`HR*.4`, `HR*.6`).
- Testa più grande = più alta della hurtbox: in Fight! HR 22 era troppo, 19.5 va bene (originale 17).
- **Iron Line ha fino a 420 unità**: ogni pezzo in più per soldato è una draw call in più per unità.
  Le geometrie sono unite con `mergeParts()` e colori per vertice: mantieni questo schema.
- `MeshLambertMaterial({vertexColors:true, flatShading:true})` dà il look low-poly a tutto
  (anche cavalli e catapulte) senza cambiare le geometrie.
- Pennacchio/tabarda nel **colore della squadra** rende leggibili gli eserciti da lontano.
