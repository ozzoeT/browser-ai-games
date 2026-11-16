---
name: resa
description: Qualità percepita di ciò che l'utente vede e tocca - giochi, UI, animazioni, pagine, demo, strumenti interattivi. Usala quando si costruisce o migliora qualcosa di visivo o interattivo, o quando una cosa "funziona ma non convince".
---
# Resa

Fra "funziona" e "è bello da usare" c'è una distanza fatta di dettagli che nessuno chiede e tutti
sentono. Qui si lavora quella distanza.

## 0. Guardalo davvero
Non giudicare dal codice. Avvia, fai screenshot o registra, usa il prodotto come un estraneo per
un minuto. Annota in ordine: dove ti confondi, dove aspetti, dove ti annoi, dove qualcosa
"non risponde". Quell'elenco è il piano di lavoro. Ripeti il giro dopo ogni blocco di modifiche.

## 1. Una direzione, dichiarata
Scegli **un'idea guida** in una frase ("carta ritagliata e ombre morbide", "terminale anni '80
che sta per rompersi") e tre aggettivi. Ogni scelta (colori, forme, movimento, suoni, testi) si
decide chiedendo "è coerente con quella frase?". Il generico nasce dal non aver scelto.

## 2. Risposta immediata
Ogni azione dell'utente ottiene una reazione entro un fotogramma, anche se il risultato vero
arriva dopo: stato premuto, piccolo spostamento, suono, cambio di colore. Niente input che cade
nel vuoto.

## 3. Movimento con peso
- Mai interpolazioni lineari per cose che devono sembrare fisiche: accelerazione, frenata,
  leggero superamento e ritorno.
- Anticipazione prima, assestamento dopo. Schiaccia e allunga in piccolo.
- Durate brevi (100-250 ms per l'interfaccia), più lunghe solo per i momenti importanti.
- Sfalsa di qualche decina di ms gli elementi che entrano insieme.
- Indipendente dal frame rate (delta time), e rispetta `prefers-reduced-motion`.

## 4. Enfasi sui momenti che contano
Scegli i 2-3 eventi più importanti (colpo, punto, vittoria, errore, conferma) e stratifica lì:
scossa leggera della camera, particelle, lampo, micro-pausa di pochi fotogrammi, suono, numero
che sale. Tutto il resto resta sobrio: se tutto è enfatizzato, niente lo è.

## 5. Gerarchia e respiro
- Un solo punto focale per schermata; il resto è di supporto e si vede.
- Scala di spaziature e dimensioni coerente (pochi valori, riusati).
- Palette ristretta: un colore dominante, un accento usato con parsimonia, neutri con una
  leggera tinta. Contrasto leggibile verificato, tema chiaro e scuro.
- Profondità con luce coerente: una direzione, ombre morbide, niente bordi ovunque.

## 6. Gli stati dimenticati
Vuoto, caricamento, errore, primo avvio, fine partita, pausa, finestra stretta, tocco al posto del
mouse, tastiera sola. Un prodotto si giudica dal suo stato peggiore.

## 7. Ritmo (giochi ed esperienze)
- Primi 10 secondi: si capisce cosa fare senza leggere, e si ottiene una piccola soddisfazione.
- Alterna tensione e rilascio; introduci una cosa nuova alla volta, poi combinala con le precedenti.
- La difficoltà cresce, ma la sconfitta deve sembrare colpa del giocatore, non del gioco.
- Riavvio istantaneo. Ogni secondo fra "ho perso" e "riprovo" costa giocatori.

## 8. Vita
Niente di completamente fermo in una scena viva: respiro lento, oscillazioni, variazioni casuali
minime in tempi, posizioni e toni perché le ripetizioni non siano identiche.

## 9. Il dettaglio firmato
Aggiungi una cosa piccola, specifica e inattesa che dimostra cura (una reazione a un'azione
inutile, una transizione pensata, un testo con una voce). Una, ben fatta.

## 10. Taglio e prestazioni
Togli l'effetto che distrae dal punto focale. Controlla che resti fluido su una macchina modesta:
uno scatto distrugge più qualità di quanta ne aggiungano dieci effetti.

Chiudi sempre con uno screenshot o una prova reale dopo le modifiche, confrontata col "prima".
