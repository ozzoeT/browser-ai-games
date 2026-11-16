---
name: regia-video
description: Regia video a 360° - ideazione, sceneggiatura, hook, shot list, inquadrature, ottiche, movimenti di camera, luci, colore, ritmo e montaggio, audio, sottotitoli, guida dello sguardo, formati social verticali (TikTok, Reels, Shorts) e formati lunghi (YouTube, documentario, corso, spot). Usala quando si chiede di ideare, scrivere, pianificare, girare, montare, valutare o migliorare un video, o di generarlo via codice o con modelli video.
---
# Regia video

Un video è una sequenza di decisioni su **dove guarda lo spettatore e cosa prova, secondo per
secondo**. Ogni scelta tecnica (ottica, luce, taglio, colore, suono) si giudica solo su questo.

## Come lavorare
1. **Brief in cinque righe** (se mancano, deducile e dichiarale; chiedi solo ciò che non si deduce):
   - *Pubblico*: chi, e cosa sa già.
   - *Una sola idea*: cosa deve ricordare domani chi ha visto il video.
   - *Emozione*: cosa deve provare (curiosità, sollievo, voglia, stupore, fiducia…).
   - *Azione*: cosa deve fare dopo (niente / seguire / cliccare / comprare / condividere).
   - *Contesto di visione*: piattaforma, verticale o orizzontale, audio probabile o no, durata.
2. **Scegli la forma** con `references/formati-piattaforme.md` e lo stile con `references/stili.md`.
3. **Scrivi prima il finale, poi l'hook, poi il mezzo.** L'hook promette esattamente ciò che il
   finale mantiene. Struttura e ritmo: `references/struttura-ritmo-montaggio.md`.
4. **Progetta lo sguardo**: per ogni inquadratura, un solo punto d'attenzione, e sai dov'è
   (`references/occhio-attenzione.md`).
5. **Traduci in immagini**: inquadrature, ottiche, movimenti (`references/camera-inquadratura.md`),
   luce e colore (`references/luce-colore.md`), suono (`references/audio-testi.md`).
6. **Organizza la realizzazione**: preparazione, giorno di ripresa, direzione delle persone,
   copertina e pubblicazione (`references/produzione-set.md`).
7. **Consegna i documenti** adatti alla richiesta (modelli sotto).
8. **Rivedi** con la checklist finale. Se esiste un file video, guardalo davvero: estrai
   fotogrammi con ffmpeg (uno al secondo nei primi 5 s, poi uno ogni taglio) e controllali.

## I sette principi (valgono per ogni formato)
1. **Un'idea per video, un'idea per inquadratura.** Se serve "e inoltre", è un altro video.
2. **Mostra, poi di'.** L'immagine porta l'informazione, la voce porta il senso. Mai le due
   che dicono la stessa cosa nello stesso modo.
3. **Ogni taglio ha un motivo**: nuova informazione, nuova emozione o nuovo ritmo. Altrimenti resta.
4. **Lo sguardo non deve cercare.** Dopo ogni taglio l'occhio è già dove serve.
5. **Contrasto = attenzione.** Di luce, colore, scala, velocità, volume, silenzio. Senza
   variazione non c'è enfasi.
6. **L'audio è metà del video.** Si perdona un'immagine mediocre, non un audio cattivo.
7. **Taglia ciò che ami se non serve l'idea.** La durata giusta è la più corta che mantiene la
   promessa.

## Quale scheda aprire
| Domanda | Scheda |
|---|---|
| Che formato, durata, margini? Regole della piattaforma? | `formati-piattaforme.md` |
| Dove guarda lo spettatore? Dove metto volto e testo? | `occhio-attenzione.md` |
| Che campo, ottica, angolo, movimento? | `camera-inquadratura.md` |
| Come illumino? Che colori? Come correggo? | `luce-colore.md` |
| Che struttura, che aggancio, quando taglio? | `struttura-ritmo-montaggio.md` |
| Voce, musica, sottotitoli, scritte? | `audio-testi.md` |
| Che stile scelgo? | `stili.md` |
| Come preparo, giro, dirigo, pubblico? | `produzione-set.md` |
Apri solo le schede che servono al compito.

## Modelli di consegna

**Scaletta a battute** (sempre, anche per 15 secondi)
```
# | tempo     | cosa si vede            | cosa si sente          | testo a schermo | scopo
1 | 0:00-0:02 | ...                     | ...                    | ...             | hook
```

**Shot list** (per le riprese)
```
# | scena | campo (CL/CM/MF/PP/PPP/dett.) | ottica eq. | angolo/altezza | movimento |
  soggetto e azione | luce | audio | durata utile | note di raccordo
```

**Schema luci**: pianta dall'alto in testo o SVG con camera, soggetto, chiave, riempimento,
controluce, sfondo, distanze e intensità relative.

**Nota di montaggio (EDL ragionata)**: per ogni taglio → punto di taglio, tipo (netto, J, L,
sull'azione, raccordo di forma), motivo, dove sta l'occhio prima e dopo.

**Prompt per modelli video / codice (Remotion, ffmpeg, motion graphics)**: specifica sempre
soggetto, azione, campo e ottica, angolo, movimento di camera, luce (direzione, qualità,
temperatura), tavolozza, ora/ambiente, stile di riferimento descritto a parole (non titoli o
autori da copiare), durata, formato, fps.

## Checklist finale
- [ ] Senza audio si capisce? Solo audio si capisce?
- [ ] Il primo fotogramma è già interessante (niente nero, niente logo, niente "ciao a tutti")?
- [ ] Entro 2-3 s è chiaro di cosa si parla e perché restare?
- [ ] In ogni inquadratura c'è un solo punto focale e cade in zona sicura?
- [ ] Tra tagli veloci il punto focale resta vicino alla stessa posizione?
- [ ] C'è una variazione (campo, angolo, grafica, suono, ritmo) prima che l'attenzione cali?
- [ ] Pelle naturale, bianco bilanciato, orizzonte dritto, niente sfarfallio?
- [ ] Voce chiara e sopra la musica, niente picchi, livelli coerenti tra le clip?
- [ ] Sottotitoli leggibili su schermo piccolo, sincronizzati, fuori dall'interfaccia?
- [ ] Il finale mantiene la promessa dell'hook, e l'invito all'azione è uno solo?
- [ ] Niente lampeggi oltre 3 al secondo; contrasto testi sufficiente.
- [ ] Diritti: musica, font, immagini, persone riconoscibili, marchi.
- [ ] Visto sul telefono vero, a luminosità media, prima di pubblicare.

## Onestà sui numeri
Limiti di durata, zone sicure e "soglie dell'algoritmo" cambiano spesso e le fonti si
contraddicono. I valori nelle reference sono punti di partenza: prima di consegnare specifiche
vincolanti, ricontrolla le pagine ufficiali o l'anteprima dell'app, e dichiara ciò che non hai
verificato. Le statistiche sulla ritenzione da blog di venditori sono indicative, non leggi.
