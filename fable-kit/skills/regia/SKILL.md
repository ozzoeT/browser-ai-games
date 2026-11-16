---
name: regia
description: Dirigere un lavoro grande o a più mani - scomporre, decidere l'ordine, delegare a subagenti, integrare e tenere la qualità. Usala per compiti con più parti, più file o più agenti, per progetti da zero, o quando rischi di perderti nei dettagli.
---
# Regia

Il regista non gira ogni scena: decide cosa conta, in che ordine, chi fa cosa, e non accetta una
scena che non funziona. Il suo lavoro è l'insieme.

## 1. La visione in tre righe
Prima di qualunque passo scrivi:
- **Cosa** deve esistere alla fine (visto da chi lo usa, non da chi lo costruisce).
- **L'unica cosa che deve riuscire benissimo** – se riesce quella, il resto può essere solo
  corretto. Tutto il tempo extra va lì.
- **Cosa resta fuori** – esplicito. Un progetto senza esclusioni non ha regia.

## 2. Lo scheletro che cammina
Costruisci per primo il percorso più sottile che attraversa tutto da capo a fondo e *funziona*,
anche brutto. Poi ispessisci. Mai rifinire un pezzo mentre un altro non esiste: l'integrazione
tardiva è dove muoiono i progetti.

## 3. Ordine delle scene
Ordina per **incertezza**, non per comodità:
1. ciò che potrebbe rivelarsi impossibile o cambiare il piano (va provato subito, in piccolo);
2. ciò da cui dipendono altre parti (interfacce, formato dei dati, stato condiviso);
3. il pezzo che deve riuscire benissimo;
4. il resto;
5. rifinitura, solo sull'insieme funzionante.

## 4. Fissa le giunture prima delle parti
Prima di dividere il lavoro definisci i contratti: forme dei dati, firme, nomi, eventi, chi possiede
quale file. Parti indipendenti con giunture chiare si possono fare in parallelo; parti con giunture
vaghe vanno fatte in sequenza da una sola testa.

## 5. Delegare (subagenti o chiamate parallele)
Delega quando il compito è separabile, verificabile e il suo dettaglio non ti serve in testa
(ricerche ampie, revisione indipendente, varianti in parallelo). **Non** delegare la comprensione
del problema, le decisioni di design, né ciò che dipende da contesto che hai solo tu.

Chi riceve parte da zero. Il brief deve contenere:
- **scopo**: a cosa serve nel quadro generale (una frase);
- **compito**: cosa fare, e cosa esplicitamente no;
- **contesto già noto**: file, percorsi, scoperte, vicoli ciechi già esclusi;
- **vincoli**: file che può/non può toccare, convenzioni, contratti da rispettare;
- **fatto quando**: criterio verificabile;
- **forma della risposta**: cosa vuoi indietro (es. "conclusione + file:riga, niente dump").

Test del brief: un bravo freelance che non ha visto la conversazione potrebbe eseguirlo senza farti
domande?

## 6. Fidati, ma guarda i giornalieri
- Il rapporto di un subagente è una testimonianza, non una prova: verifica tu i punti su cui
  costruirai (apri il file, esegui il test).
- Due agenti sullo stesso file = conflitto. Assegna proprietà chiare o usa worktree separati.
- Per le decisioni importanti chiedi un secondo parere *cieco*: un revisore che non conosce il tuo
  ragionamento trova ciò che tu non vedi più.
- Se un risultato torna mediocre, il difetto è quasi sempre nel brief: riscrivilo, non ripetere.

## 7. Tenere il filo
A ogni tappa, alza la testa e chiediti:
- sto ancora servendo la visione delle tre righe, o un sottoproblema che mi ha catturato?
- questo dettaglio lo noterà qualcuno? Se no, basta così.
- cosa ho imparato che cambia il piano? Cambialo apertamente, non per deriva.
- l'insieme funziona *adesso*? Se no, fermati e ripristinalo prima di aggiungere.

## 8. Montaggio
Alla fine guarda tutto dall'inizio come lo vedrà l'utente, senza interruzioni. Uniforma le voci
(nomi, stile, tono: parti fatte in momenti diversi tradiscono le cuciture). Taglia ciò che non
serve la visione, anche se è costato fatica. Poi `verifica-finale` e `rapporto`.
