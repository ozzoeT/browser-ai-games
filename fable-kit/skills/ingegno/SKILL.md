---
name: ingegno
description: Creatività applicata al codice e ai problemi tecnici - trovare la soluzione elegante, semplificare, uscire da un vicolo cieco, progettare un'architettura o un algoritmo. Usala quando la soluzione diretta è brutta, lunga, lenta o fragile, o quando sei bloccato.
---
# Ingegno

Nel codice la creatività raramente è aggiungere: è trovare l'angolo da cui il problema diventa
piccolo.

## Domande che spostano il problema
Prima di scrivere la soluzione diretta, passa queste (30 secondi l'una):
1. **Serve davvero?** Qual è il bisogno a monte? Si può ottenere senza questo codice (config,
   funzione già esistente, capacità della piattaforma, togliere un requisito)?
2. **Esiste già?** Nel repo, nella libreria standard, in una dipendenza già installata.
3. **È un problema noto travestito?** Grafo, automa a stati, ordinamento, cache, coda, diff,
   parsing, vincoli, intervalli. Dare il nome giusto regala la soluzione.
4. **E se cambiassi i dati invece del codice?** La rappresentazione giusta fa sparire i casi
   speciali: tabella al posto di if a cascata, stato esplicito al posto di flag, struttura
   normalizzata al posto di sincronizzazioni.
5. **E se lo girassi?** Push invece di pull, precalcolare invece di calcolare, dal risultato
   all'indietro, dichiarare invece di eseguire, rendere impossibile lo stato sbagliato invece di
   controllarlo.
6. **Qual è il caso generale più semplice?** A volte risolvere N è più facile che risolvere 3
   casi separati. A volte è il contrario: risolvi 1 caso concreto e fermati.
7. **Dove va messo?** Lo stesso fix a un livello diverso (sorgente del dato, confine del modulo,
   tipo) può costare una riga invece di venti.

## Tre bozze
Per qualunque design non banale abbozza in poche righe **tre** approcci realmente diversi
(non varianti): il più semplice possibile, il più robusto, il più strano. Confrontali su:
righe di codice, stati possibili, cosa si rompe quando cambiano i requisiti, facilità di verifica.
Di solito vince un ibrido. Scegli e spiega in una riga perché.

## Segni di una buona soluzione
- Si spiega in due frasi senza "tranne quando".
- I casi limite cadono da soli, senza rami dedicati.
- Toglie codice o concetti invece di aggiungerne.
- Gli stati illegali non sono rappresentabili.
- Chi legge capisce *perché* è corretta, non solo che passa i test.

Se la tua soluzione cresce a ogni caso limite scoperto, il modello è sbagliato: fermati e torna
alle domande 4 e 5.

## Uscire dal blocco
- Rimpicciolisci: risolvi la versione giocattolo, poi guarda cosa manca.
- Prototipo usa-e-getta di 20 righe per rispondere a *una* domanda; poi buttalo.
- Spiega il problema per iscritto a un estraneo: spesso la risposta è nella frase che non riesci
  a scrivere.
- Guarda i dati veri (stampa, misura, profila): l'intuizione su dove sta il costo è spesso
  sbagliata.
- Chiediti cosa stai dando per fisso che fisso non è (il formato, l'ordine, il momento in cui
  avviene, chi lo fa).

## Disciplina
L'eleganza serve il lettore, non l'autore. Niente trucchi che richiedono un commento per essere
capiti, niente astrazioni per un solo utilizzo, niente riscritture non richieste. La soluzione
ingegnosa deve restare il cambio più piccolo che risolve il problema vero, nello stile del
progetto.
