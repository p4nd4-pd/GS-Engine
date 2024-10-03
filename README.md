# Casino Reporting Microservice

## Descrizione

Questo microservizio è progettato per calcolare e gestire la reportistica in tempo reale per un casinò online. Il sistema si occupa di raccogliere dati finanziari, metriche di gioco e informazioni sugli utenti per generare report accurati e aggiornati. I dati includono informazioni su giocatori, agenti, commissioni, provider e altri parametri critici per il funzionamento di un casinò online.

### Funzionalità principali:

- Gestione di reportistica in tempo reale per giocatori connessi.
- Ottimizzazione delle risorse grazie a un'architettura che minimizza il carico sul database.
- Sincronizzazione dei dati sensibili tramite un controller remoto (ServiceManager).
- Suddivisione dei processi per la gestione dei pagamenti e delle commissioni.
- Aggiornamenti in tempo reale delle metriche di revenue.

## Architettura

Il microservizio segue un'architettura modulare suddivisa in vari componenti:

1. **HTTP Endpoint**

   - Espone un'interfaccia HTTP per interagire con il microservizio e richiedere dati di reportistica.

2. **WebSocket Endpoint (WS)**

   - Permette una connessione in tempo reale per aggiornare dinamicamente i dati senza necessità di richieste continue.

3. **ServiceManager**

   - Stabilisce una connessione con un controller remoto per il recupero e la gestione dei dati sensibili (es. credenziali, configurazioni, dati degli utenti).

4. **Database**
   - Connessione al database per il recupero di informazioni sui provider, agenti e giocatori. L'algoritmo minimizza il carico sul database scaricando i dati necessari durante l'inizializzazione e utilizzando tali dati per le elaborazioni future.

## Task principali

### Preparazione degli Endpoint

- **HTTP Endpoint**: per la comunicazione con il microservizio.
- **WebSocket Endpoint**: per aggiornamenti in tempo reale.

### Connessioni

- **Connessione con il ServiceManager**: per il recupero di dati sensibili necessari per l'inizializzazione dell'engine.
- **Connessione con il database**: per ottenere e memorizzare dati rilevanti, come giocatori, provider, agenti e percentuali di commissioni.

### Recupero dei Dati

- **Lista dei provider**: per ottenere le informazioni sui fornitori di servizi di gioco.
- **Lista degli agenti**: include dati come percentuali di GGR (Gross Gaming Revenue), commissioni, percentuali di provider.
- **Lista dei giocatori**: recupera i giocatori interessati all'algoritmo, limitando il calcolo ai giocatori connessi durante un determinato arco di tempo.

### Gestione dei Processi

- **Pre-loader e Up-loader**: controller per l'aggiornamento e il recupero dei dati dal database.
- **Processi a lungo termine**:
  - **Reportistica oraria**: calcolo e aggiornamento della reportistica alla fine di ogni ora.
  - **Pagamenti turnover**: eseguiti ogni lunedì.
  - **Pagamenti GGR e commissioni**: eseguiti il primo lunedì di ogni mese.

### Pre-calcolo della Reportistica

- Recupero dei dati gravosi (scommesse casinò, sport, poker) per eseguire il calcolo della revenue in anticipo. Questi dati vengono strutturati in base ai profili commissioniali e successivamente utilizzati per aggiornamenti futuri.

### Aggiornamento Run-Time

- Un processo continuo per aggiornare la revenue in tempo reale, monitorando costantemente vincite, scommesse e commissioni.

## Tecnologie utilizzate

- **Node.js**: Ambiente di runtime per eseguire il codice JavaScript.
- **Express**: Framework per gestire gli endpoint HTTP.
- **WebSocket**: Protocollo per la comunicazione in tempo reale.
- **PostgreSQL/MySQL**: Database relazionale per memorizzare e gestire i dati.
- **ServiceManager**: Controller remoto per la sincronizzazione dei dati sensibili.

## Avvio del Progetto

### Prerequisiti

- Node.js (versione >= 14.x)
- Database SQL (PostgreSQL o MySQL)

### Installazione

1. Clona il repository:

   ```bash
   git clone <repository-url>
   cd nome-progetto
   ```

2. Installa le dipendenze:

   ```bash
   npm install
   ```

3. Configura il file `.env` con le credenziali del database e del ServiceManager.

### Avvio del Microservizio

- Per avviare il microservizio in modalità di sviluppo:

  ```bash
  npm run dev
  ```

- Per avviare il microservizio in modalità di produzione:
  ```bash
  npm start
  ```

## Utilizzo

1. **Recupero dei report tramite HTTP**: Effettua richieste GET/POST all'endpoint HTTP esposto.
2. **Connessione tramite WebSocket**: Utilizza l'endpoint WS per ricevere aggiornamenti in tempo reale.
3. **Gestione dei pagamenti e delle commissioni**: I processi vengono eseguiti automaticamente su base settimanale e mensile.

## Contributi

I contributi sono benvenuti. Per contribuire, apri una pull request o crea una nuova issue per segnalare bug o suggerimenti.

## Licenza

Questo progetto è distribuito sotto licenza MIT. Consulta il file `LICENSE` per maggiori informazioni.
