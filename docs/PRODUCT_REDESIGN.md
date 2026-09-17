# TravelG 2.0 — redesign post Portogallo

## Visione
TravelG deve diventare un compagno di viaggio che lavora in modo discreto: prepara il viaggio con il gruppo, accompagna durante il viaggio senza richiedere continue interazioni e costruisce automaticamente una memoria finale dell'esperienza.

## Pilastri prodotto

### 1. Home compatta, leggibile in una schermata
- Ridurre dimensioni di card e pulsanti.
- Mettere in primo piano solo: Oggi, Roadbook, Mappa, Prenotazioni, Spese, AI.
- Spostare funzioni secondarie dentro sezioni dedicate.
- Mostrare sempre data odierna e contesto del giorno del viaggio.

### 2. Roadbook "Today first"
- All'apertura, se la data corrente ricade nel viaggio, selezionare automaticamente il giorno odierno.
- Consentire di spostare un'attività da un giorno all'altro senza ricrearla.
- Mantenere cronologia e ordine attività.
- Evidenziare attività già completate e attività rilevate automaticamente.

### 3. Presence engine / check automatico
- Le attività possono essere collegate a coordinate GPS.
- Quando l'utente entra nel raggio di un luogo pianificato, la visita può essere proposta o registrata come completata.
- Conservare fonte della rilevazione: GPS, foto o manuale.
- Evitare duplicati e falsi positivi con raggio configurabile e debounce temporale.

Nota tecnica: una PWA web non può garantire monitoraggio GPS continuo in background su iOS/Android quando l'app è chiusa. Per il comportamento "non apro mai il telefono e TravelG registra tutto" servirà una fase native/hybrid con geofencing e permessi di background. La PWA può già funzionare bene quando è aperta/in uso e può preparare tutta la struttura dati necessaria.

### 4. TravelG AI personale
Profilo iniziale con preferenze:
- arte
- monumenti
- storia
- cibo
- nightlife
- natura
- mare
- shopping
- famiglia
- avventura
- relax
- fotografia

Ulteriori segnali:
- ritmo di viaggio: relax / equilibrato / intenso
- evitare folla
- cucina locale
- hidden gems

L'assistente dovrà combinare:
1. preferenze utente,
2. posizione attuale,
3. orario,
4. attività già fatte,
5. Roadbook residuo,
6. meteo,
7. budget,
8. composizione del gruppo.

Output atteso: suggerimenti contestuali tipo "sei qui, sono le 18:30, ti piace cucina locale, a 8 minuti c'è...".

### 5. Organizzazione di gruppo pre-partenza
- Membri del viaggio con ruoli.
- Proposte itinerario.
- Sondaggi stile Doodle su città, date, attività e alternative.
- Votazione e trasformazione automatica dell'opzione scelta in Roadbook.
- Chat del viaggio sincronizzata in tempo reale.

### 6. Spese condivise
- Pagatore.
- Beneficiari della spesa.
- Quote uguali, percentuali o personalizzate.
- Saldo per persona/famiglia.
- Suggerimento finale dei trasferimenti minimi per chiudere i conti.

### 7. Rating di viaggio
Dopo una visita:
- voto 1–10;
- nota facoltativa;
- voto personale e media gruppo;
- classifica finale della vacanza;
- dati riutilizzabili quando il viaggio viene condiviso pubblicamente.

### 8. Memory Story automatica
Fonti:
- visite rilevate;
- attività Roadbook completate;
- fotografie selezionate come preferite;
- metadata GPS/data delle foto quando disponibili;
- rating del gruppo.

Output:
- timeline del viaggio;
- mappa dei luoghi visitati;
- gallery per città/giorno;
- top places;
- diario sintetico generato dall'AI;
- pagina condivisibile del viaggio concluso.

## Architettura proposta

### Dominio
- `travel_preferences`
- `trip_members`
- `trip_polls`
- `trip_poll_votes`
- `trip_messages`
- `place_visits`
- `place_ratings`
- `memory_items`
- `expense_shares`

### Motori applicativi
- `PresenceEngine`: geolocalizzazione e rilevazione visite.
- `RecommendationEngine`: contesto + preferenze + AI.
- `MemoryEngine`: visite + foto + rating -> storia viaggio.
- `SettlementEngine`: divisione spese e compensazioni.

## Ordine di sviluppo

### Sprint A — fondamenta UX e dati
- home compatta;
- giorno corrente automatico;
- spostamento attività tra giorni;
- preferenze viaggio nel profilo;
- struttura dati per visite e rating;
- divisione spese per partecipante.

### Sprint B — gruppo
- membri viaggio;
- sondaggi;
- chat realtime;
- rating condivisi.

### Sprint C — travel intelligence
- check GPS in foreground;
- suggerimenti AI contestuali;
- notifiche pertinenti e non invasive.

### Sprint D — memory
- import foto;
- lettura metadata quando disponibili;
- matching foto-luogo;
- preferiti;
- generazione storia finale.

### Sprint E — versione mobile nativa/hybrid
Necessaria per geofencing e rilevazione affidabile anche con app non aperta.
