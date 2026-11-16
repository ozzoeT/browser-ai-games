---
name: causa-radice
description: Metodo di debugging per bug, test falliti, comportamenti inspiegabili, regressioni, flaky. Usala appena un errore non è ovvio alla prima lettura o dopo un tentativo di fix fallito.
---
# Causa radice

Regola zero: non modificare nulla finché non sai spiegare il fallimento.

1. **Riproduci** con il comando più corto possibile. Senza riproduzione non c'è fix, solo speranza.
   Se è intermittente, misura la frequenza (es. 20 esecuzioni) per poter dimostrare dopo il
   miglioramento.
2. **Leggi l'errore intero**, non la prima riga: stack completo, il *primo* errore in ordine di
   tempo, i warning che lo precedono.
3. **Raccogli fatti prima di teorie**: cosa è cambiato di recente (`git log`, `git diff`), funziona
   in un altro ambiente/input/versione? Qual è il caso più piccolo che fallisce e quello più simile
   che passa?
4. **Tre ipotesi, non una.** Scrivine almeno tre diverse (dati, stato/ordine, ambiente, versione,
   concorrenza, cache, assunzione sbagliata tua). Per ciascuna: cosa prevedrebbe di diverso dalle
   altre?
5. **Esperimento discriminante**: scegli il test che elimina più ipotesi in un colpo. Dichiara
   prima il risultato atteso. Bisezione (git bisect, commentare metà, dimezzare l'input) quando
   le teorie finiscono.
6. **Strumenta, non indovinare**: log mirati, stampa dei valori reali, debugger. Guarda i dati veri,
   non quelli che pensi ci siano.
7. **Spiega tutto**: la causa è trovata solo se spiega *ogni* sintomo osservato, compreso perché
   prima funzionava. Un sintomo non spiegato = causa incompleta o secondo bug.
8. **Correggi alla radice**, nel punto dove l'invariante viene violato, non dove esplode.
   Poi cerca la stessa classe di bug altrove (grep del pattern).
9. **Dimostra**: riesegui la riproduzione originale, poi la suite intorno. Aggiungi un test che
   fallisce senza il fix.
10. **Pulisci** log e strumentazione temporanea.

Campanelli d'allarme: stai aggiungendo try/catch, retry, sleep, `|| default`, o un `if` per quel
caso specifico → stai nascondendo il sintomo. Stai cambiando due cose insieme → non saprai quale ha
funzionato. Al terzo tentativo fallito → torna al punto 3 con occhi nuovi.
