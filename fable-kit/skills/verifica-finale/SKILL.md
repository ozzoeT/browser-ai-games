---
name: verifica-finale
description: Checklist da eseguire prima di dichiarare concluso un lavoro (codice, fix, documento, analisi). Usala sempre prima di scrivere "fatto", "risolto", "funziona".
---
# Verifica finale

Passa i cancelli in ordine. Uno non superato = non hai finito, oppure lo dichiari apertamente.

**1. Richiesta** – Rileggi il messaggio originale dell'utente parola per parola. Ogni cosa chiesta
è stata fatta? Elenco puntato di richieste → spunta una per una. Hai fatto cose non chieste?
Toglile o motivale.

**2. Esecuzione** – Il risultato è stato *eseguito*, non solo scritto?
- codice: test + build + lint/typecheck del progetto;
- UI: avviata e guardata (screenshot), percorso felice e un percorso d'errore;
- script/query: lanciati su dati reali o realistici;
- numeri e calcoli: ricalcolati con un metodo indipendente;
- fatti e citazioni: riaperti alla fonte.

**3. Bordi** – Prova o ragiona su: vuoto, uno, moltissimi, duplicati, valori nulli, unicode,
input ostile, doppio click/doppia esecuzione, rete assente, stato precedente sporco.

**4. Diff da estraneo** – `git diff` completo, letto come revisore diffidente:
codice morto, debug rimasto, file toccati per sbaglio, segreti, commenti che descrivono il vecchio
comportamento, nomi incoerenti, modifiche di formattazione fuori tema.

**5. Vicini** – Chi usa ciò che hai cambiato funziona ancora? Documentazione, tipi, esempi,
migrazioni, configurazioni da aggiornare?

**6. Domanda del domani** – "Se fra una settimana questo si rivela sbagliato, quale sarà il motivo
più probabile?" Vai a controllare proprio quello, adesso.

**7. Etichette** – Per ogni affermazione del rapporto: verificato / dedotto / supposto.
Tutto ciò che non è "verificato" va scritto come tale.

Output: niente checklist incollata all'utente. Solo l'esito, le prove essenziali (comando + risultato)
e i punti non verificati.
