console.log('GS-Engine');
/**
 * - Preparazione dell'HTTP endpoint;
 * - Preparazione dell'endpoint WS;
 * 
 * - Stabilimento della connessione con il ServiceManager e recupero dei dati sensibili per l'inizializzazione dell'engine;
 * - Stabilimento della connessione con il database;
 * 
 * - Recupero della lista dei provider;
 * - Recupero della lista degli agenti, ordinati per tipo di commissione ed eventuali dati (GGR %, commissione %, provider %);
 * 
 * - Recupero della lista dei giocatori (interessati al algoritmo):
 *     L'architettura dell'engine prevede che il calcolo della reportistica in tempo reale venga effettuato
 *     esclusivamente per i giocatori connessi durante un arco di tempo definito (preferibilmente continuo),
 *     dall'inizio dell'algoritmo fino alla sua terminazione. 
 * 
 *     Per ridurre il carico sul database e sfruttare al massimo le risorse della macchina, l'algoritmo evita 
 *     una connessione continua al database, utilizzando invece i dati precedentemente scaricati durante
 *     l'inizializzazione e la preparazione dell'engine (come i costi dei provider, la lista degli agenti, le
 *     percentuali di GGR, commissioni, ecc.).
 * 
 *     Per evitare errori di disallineamento dei dati, l'engine prevede la gestione degli aggiornamenti tramite 
 *     un endpoint e delega al ServiceManager la piena responsabilità della sincronizzazione dei dati sensibili
 *     necessari per il calcolo.
 * 
 *     Durante questa fase, l'engine invia una richiesta al controller remoto (ServiceManager) per ottenere 
 *     la lista dei giocatori online e i dati necessari per il corretto funzionamento del calcolo (come skin_id, 
 *     user_id e parent_id, ovvero l'agente con il ruolo di 'shop').
 * 
 *     La lista recuperata viene memorizzata per un periodo di tempo definito (preferibilmente fino alla chiusura 
 *     della connessione) e utilizzata per eventuali calcoli successivi (report e analisi).
 * 
 * - Preparazione e suddivisione dei processi:
 *      Inizializzazione dei controller Pre-loader e Up-loader per l'aggiornamento e il recupero dei dati dal database;
 *      L'engine inizializza la timeline dei processi statici, come:
 *          * Calcolo della reportistica stabile, con aggiornamento dei dati nel database - alla fine di ogni ora;
 *          * Esecuzione dei pagamenti turnover - ogni lunedì della settimana;
 *          * Esecuzione dei pagamenti GGR e commissioni - ogni primo lunedì del mese;
 * 
 * - Pre-calcolo della reportistica:
 *      In questa fase, l'engine inizializza il recupero dei dati (che possono essere particolarmente gravosi per il database)
 *      riguardanti i totali delle scommesse di casinò e sport (poker opzionale), su un range di date strutturate in base
 *      ai profili commissioniali della sottorete coinvolta nei cambiamenti della reportistica
 *      (commissionale -> primo lunedì e ultima domenica del mese; costi -> dal 1° al 31/30 del mese) e successivamente
 *      esegue il calcolo della revenue. I dati ottenuti vengono caricati nel database e poi utilizzati per i futuri
 *      aggiornamenti Run-Time.
 *         
 * - Avvio del processo dedicato all'aggiornamento Run-Time della revenue.
*/

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware per il parsing del body delle richieste JSON
app.use(express.json());

// Endpoint base
app.get('/', (req, res) => {
    res.send('Benvenuto nel microservizio di esempio!');
});

app.post('/', (req, res) => {
    res.send('Benvenuto nel microservizio di esempio!');
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});