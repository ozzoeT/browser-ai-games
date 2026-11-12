# Effetti speciali

Demo animata di tutto questo: `../demos/effetti.html`.

Per bloom, grade, cielo, ombre delle nuvole, vento, particelle con rotazione/stellina, palla di fuoco e camera
dinamica vedi anche `rendering.md`.

## 1. Sistema di particelle (three.js)

Un unico `THREE.Points` con `ShaderMaterial`: per ogni particella posizione, colore, alfa e dimensione
in unità del mondo. Additivo per fuoco/scintille/magia, normale per fumo e coriandoli.

```js
const DOT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(.35,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const VS=`attribute vec3 pcol;attribute float palpha;attribute float psize;uniform float scale;
varying vec3 vC;varying float vA;
void main(){vC=pcol;vA=palpha;vec4 mv=modelViewMatrix*vec4(position,1.0);
 gl_PointSize=psize*scale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}`;
const FS=`uniform sampler2D map;varying vec3 vC;varying float vA;
void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(vC,t.a*vA);
#include <colorspace_fragment>
}`; // r149 (Fight!): togli la riga #include
```
- `scale` = `renderer.domElement.height / (2*tan(fov/2))`, da aggiornare a ogni resize/frame.
- Ogni particella: `{x,y,z,vx,vy,vz,life,s0,s1,c0,c1,a,drag,grav}`; alfa con rampa breve in entrata
  e lineare in uscita; `drag` esponenziale (`v*=exp(-drag*dt)`).
- Pool a dimensione fissa (`max`), `frustumCulled=false`, `depthWrite:false`, `renderOrder` alto.
- Implementazioni pronte nel repo: classe `Particles` in `fight/`, `FXP` in `iron-line/` e `studio-zero/`.

## 2. Ricette

### Esplosione (Iron Line `explosionFX`)
Sei strati (più la palla di fuoco `fireballFX`, vedi `rendering.md` §5), tutti a costo fisso:
1. **Lampo di luce**: una `PointLight` presa da un pool di 2–3 creato all'avvio, intensità alta
   che decade con `*=exp(-dt*9)`.
2. **Palla di fuoco** additiva: ~35 particelle, velocità 2–6, dimensione 1.2→3.4, colore `#fff3c4`→`#ff3a12`, `drag 3`, leggera spinta verso l'alto.
3. **Nucleo pieno** (fusione normale, `#ffb347`→`#b8300c`): senza, su sfondi chiari il fuoco è bianco.
4. **Fumo** normale: ~20, vita 1.8–3.2 s, cresce 1.6→5, sale lentamente.
5. **Scintille**: ~40, veloci, gravità −9.8, rimbalzano a terra.
6. **Anello d'urto** (`RingGeometry(.92,1)` additivo che scala ×7 in 0.55 s) + **cratere**
   (cerchio scuro trasparente che svanisce dopo ~6 s). Entrambi da un pool.

### Colpo: scintille + luce (Fight! `fxHit`)
Scintille additive bianche→colore del lottatore con gravità, più una `PointLight` d'impatto
davanti al punto colpito: illumina davvero i personaggi. Parate: scintille fredde, niente luce.
L'**hit-stop** c'è già in Fight! (`game.hitstop`): gli effetti continuano a vivere durante la pausa,
le scie invece restano ferme.

### Scie (Fight! `updTrail`)
Nastro di N=9 campioni rivolto alla camera: per ogni campione due vertici sfalsati
perpendicolarmente al movimento nel piano xy, larghezza e colore che sfumano verso la coda.
`MeshBasicMaterial({vertexColors, AdditiveBlending, depthWrite:false, side:DoubleSide})`:
con l'additivo il nero è trasparente, quindi niente ordinamento.
- Aggiungi un campione solo se il punto si muove più di una soglia (7 unità/frame) e solo in attacco.
- **Spezza la scia** se un campione salta lontano (>110): altrimenti compaiono segmenti dritti assurdi.
- Larghezza piccola (6–8 su personaggi alti 190), intensità ~0.55: più larghe sembrano blocchi.

### Aura della super (Fight!)
Particelle che salgono con velocità tangenziale (spirale), cerchio magico a terra (texture disegnata
su canvas, piano additivo che ruota) e una `PointLight` colorata che segue il lottatore. Barra piena:
solo qualche scintilla discreta.

### Fuoco / torce (demo)
~95 particelle/s che salgono e si restringono (`#fff1b5`→`#ff2200`), braci con turbolenza
(`vx += sin(t*6+y*3)*dt`), fumo leggero, `PointLight` con tremolio = somma di sinusoidi a
frequenze non multiple (13.1, 23.7, 41.3 Hz). Con ombre se la scena regge.

### Neon e "finto bloom" (demo)
Tubo (`TubeGeometry`) con `MeshBasicMaterial` brillante + una quarantina di sprite additivi lungo
la curva (alone) + una `PointLight` del colore dell'insegna sul muro/asfalto bagnato
(`roughness .2, metalness .7`). Tremolio casuale raro (spento in modalità delicata).

### Pass di bagliori su canvas 2D (Afterglow GP, City Rush)
Durante la costruzione della scena raccogli `glow(p,r,c,a)` (punto nel mondo, raggio in metri);
dopo aver disegnato i poligoni proietta ogni punto e disegna uno sprite radiale pre-renderizzato
per colore con `globalCompositeOperation='lighter'`. Alfa ridotta con la distanza (nebbia).
- **Niente depth buffer**: limita i bagliori al tratto di pista davanti (`md(p.s-cam.ss)<110`),
  altrimenti lampioni di altri tratti si vedono attraverso i palazzi.
- **Lens flare**: alone caldo grande sul sole + 4 "fantasmi" lungo la linea sole→centro schermo,
  alfa bassa (0.12–0.3).
- Scintille 2D come segmenti `lighter` con gravità, generate dal lato dell'auto che urta.

### Meteo (Iron Line `setWeather`)
`Points` con `PointsMaterial({map:DOT, vertexColors})`; le particelle vivono in un box che
**segue la camera** (posizione con modulo) così il costo non dipende dalla mappa.
Neve: bianca, lenta, oscillazione ampia. Foglie (autunno): colori del bioma, oscillazione veloce.
Pioggia + fulmini (demo): `LineSegments` per le gocce, schizzi a terra, fulmine con spostamento del
punto medio (6 livelli + 2 rami) disegnato come nastro largo (alone) + nastro sottile, lampo nel cielo
(sfondo e luce emisferica), 1–3 lampi per fulmine.

### Raggi di sole e pulviscolo (Studio Zero)
Due piani incrociati per raggio, texture con gradiente lungo (luminoso alla finestra) e trasversale,
additivi a opacità ~0.11, `fog:false`, `raycast=()=>{}` per non bloccare i colpi.
Pulviscolo: `Points` additivi minuscoli che ondeggiano lentamente dentro i raggi.

### Giorno/notte (demo)
`DirectionalLight` in orbita; cielo interpolato notte→alba→giorno in base all'elevazione del sole;
di notte accendi emissive di finestre/lampioni, `PointLight` del lampione, stelle e luna.

## 3. Lezioni imparate

- **Additivo su sfondi chiari satura a bianco** (neve di Iron Line, cucina di Studio Zero):
  aggiungi uno strato a fusione normale con il colore pieno.
- **Numero di luci fisso** creato all'avvio: aggiungere o togliere luci a runtime fa ricompilare
  gli shader di tutto (scatti). Usa pool con intensità 0.
- Sprite/mesh decorative vicine ai bersagli devono avere `raycast=()=>{}`, altrimenti intercettano
  i colpi (alone del punto debole in Studio Zero).
- Le funzioni dei giochi si possono avvolgere (`const orig=fn; fn=function(...){orig(...); ...}`),
  anche se dichiarate con `function`: è il modo meno invasivo per agganciare gli effetti.
- Headless con swiftshader gli fps sono bassi: le scie sembrano più "a scatti" che nel gioco vero.
