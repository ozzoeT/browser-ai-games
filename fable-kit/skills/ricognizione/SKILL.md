---
name: ricognizione
description: Mappa il terreno prima di un compito non banale (nuova feature, modifica su codice sconosciuto, richiesta ambigua). Usala quando stai per toccare più di un file o codice che non hai ancora letto.
---
# Ricognizione

Obiettivo: 5 minuti di lettura che evitano un'ora di lavoro nella direzione sbagliata.

1. **Obiettivo** – scrivi una frase: "alla fine deve essere vero che…". Poi una seconda:
   "lo saprò perché…" (il test, il comando, lo screenshot che lo dimostra).
2. **Sonda in parallelo** (un solo giro di tool, tutti insieme):
   - dove vive la cosa: grep del simbolo/termine con 2-3 varianti di nome;
   - chi la usa: chiamanti e importatori;
   - come si verifica qui: test esistenti, script in package.json/Makefile/CI;
   - come si fa qui: un esempio analogo già presente nel repo da imitare;
   - storia recente: `git log -5 -- <file>` sui file chiave.
3. **Ipotesi** – elenca ciò che stai dando per scontato. Per ciascuna: verificata / da verificare
   ora (costa poco) / dichiarata.
4. **Raggio d'azione** – cosa si rompe se sbagli? Chi dipende da ciò che cambi? Esiste qualcosa di
   irreversibile nel percorso?
5. **Piano minimo** – 3-6 passi, ognuno con la sua verifica. Il primo passo deve essere quello che
   riduce più incertezza, non quello più facile.
6. **Stop alla ricognizione** quando sapresti prevedere cosa troveresti aprendo un altro file.
   Leggere oltre è procrastinare.

Non produrre un documento: il piano resta nel ragionamento, salvo richiesta esplicita.
Se emergono due interpretazioni della richiesta con esiti diversi e nessun indizio per scegliere,
quella è l'unica domanda da fare all'utente.
