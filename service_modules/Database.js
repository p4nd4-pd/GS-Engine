import knex from 'knex';
import mysql from 'mysql2';

class Database {

    constructor(_DB_CONFIG) {

        const dbConfig = {
            client: 'mysql',
            connection: {
                host: _DB_CONFIG.__DB_HOST,
                user: _DB_CONFIG.__DB_USERNAME,
                password: _DB_CONFIG.__DB_PASSWORD,
                database: _DB_CONFIG.__DB_DATABASE
            }
        };

        this.db = knex(dbConfig);
        const start = Date.now();

        this.db.raw('SELECT 1+1 as result').then(() => {
            const end = Date.now();
            const pingTime = end - start;
            const hostName = this.db.client.config.connection.host;
            console.warn(`Connection to [${hostName}] executed with sucess. [Ping:${pingTime}ms]`);
        }).catch(error => {
            throw new Error(error.message);
        });
    }

    async GET_SKIN_DATA(DATA) {
        // Costruzione della query
        let query = this.db('skins');

        if (DATA.SKIN_ID) {
            query = query.where('id', DATA.SKIN_ID);
        }

        if (DATA.SKIN_NAME) {
            query = query.where('name', DATA.SKIN_NAME);
        }

        query = query.select('id', 'name', 'stato', 'skin_code');

        try {
            // Esecuzione della query
            const results = await query;

            // Convertire i risultati in un array JavaScript
            const data_response = results.map(row => ({
                id: row.id,
                name: row.name,
                stato: row.stato,
                skin_code: row.skin_code
            }));

            return data_response;
        } catch (error) {
            console.error('Error retrieving skin data:', error);
            throw error;
        }
    }

    async GET_USERS_CRONE(DATA, SELECT = null) {
    
        let query = this.db('users');

        if (DATA.USER_ID) {
            query = query.where('id', DATA.USER_ID);
        }
    
        if (DATA.PARENT_ID) {
            query = query.where('parent_id', DATA.PARENT_ID);
        }
    
        if (typeof DATA.ACTIVE_STATUS !== 'undefined') {
            query = query.where('stato', !!DATA.ACTIVE_STATUS);
        }
    
        if (DATA.ROLE_TYPE) {
            query = query.where('role_type', DATA.ROLE_TYPE);
        }
    
        if (DATA.ROLE_TYPE_IN) {
            query = query.whereIn('role_type', DATA.ROLE_TYPE_IN);
        }
    
        if (DATA.ROLE_TYPE_NOT_IN) {
            query = query.whereNotIn('role_type', DATA.ROLE_TYPE_NOT_IN);
        }
    
        if (DATA.PROFILE_TYPE) {
            query = query.where('profile_type', DATA.PROFILE_TYPE);
        }
    
        if (DATA.PROFILE_TYPE_NOT) {
            query = query.where('profile_type', '!=', DATA.PROFILE_TYPE_NOT);
        }

        if (DATA.RETURN_TYPE === 'GET_AGENTS_BY_PROFILE_TYPE') {
            // Seleziona i campi richiesti degli agenti
            let agentsQuery = this.db('users')
                .whereNotIn('role_type', ['players', 'fast_player'])
                .whereNotNull('profile_type')
                .where('profile_type', '!=', '');

            // Se SELECT è definito, usalo, altrimenti seleziona i campi di default
            if (SELECT && SELECT.length > 0) {
                agentsQuery = agentsQuery.select(...SELECT);
            } else {
                agentsQuery = agentsQuery.select('id', 'parent_id', 'username', 'role_type', 'last_activity', 'profile_type');
            }

            // Esegui la query per ottenere gli agenti
            const agentsResult = await agentsQuery;

            // Raggruppa gli agenti per profile_type
            const groupedAgents = agentsResult.reduce((acc, agent) => {
                const { profile_type } = agent;
                if (!acc[profile_type]) {
                    acc[profile_type] = [];
                }
                acc[profile_type].push(agent);
                return acc;
            }, {});

            // Ritorna l'oggetto raggruppato
            return groupedAgents;
        }
    
        if (DATA.RETURN_TYPE === 'GET_LIST_BY_LIMIT') {
            let __TOTAL_ROWS = 0;
    
            if (DATA.LIMIT && DATA.OFFSET) {
                __TOTAL_ROWS = await query.clone().count('* as total').first();
                query = query.limit(DATA.LIMIT).offset(DATA.OFFSET);
            }
    
            if (SELECT && SELECT.length > 0) {
                query = query.select(...SELECT);
            } else {
                query = query.select('id', 'parent_id', 'username', 'role_type', 'last_activity', 'profile_type');
            }
    
            const result = await query;
    
            return {
                __RETURN_DATA: result,
                __TOTAL_ROWS: __TOTAL_ROWS.total
            };
        }
    
        if (DATA.RETURN_TYPE === 'GET_ID_LIST') {
            const result = await query.select('id');
            const ID_LIST = result.map(row => row.id);
            return ID_LIST;
        }
    
        if (SELECT && SELECT.length > 0) {
            query = query.select(...SELECT);
        } else {
            query = query.select('id', 'parent_id', 'username', 'role_type', 'last_activity', 'profile_type');
        }
    
        const es_results = await query;
    
        return es_results;
    }

    async GET_BET_HISTORY__CRONE(DATA) {
        try {
            // Inizia a costruire la query di base
            let query = this.db('BET_HISTORY').join('users', 'users.id', 'BET_HISTORY.userid');

            if (DATA.USER_ID && DATA.USER_ID !== 'null') {
                query = query.where('BET_HISTORY.userid', DATA.USER_ID);
            }

            if (DATA.USER_LIST_ID && DATA.USER_LIST_ID !== 'null') {
                query = query.whereIn('BET_HISTORY.userid', DATA.USER_LIST_ID);
            }

            if (DATA.PROVIDER_ID && DATA.PROVIDER_ID !== 'null') {
                query = query.join('games', function () {
                    this.on('games.external_id', '=', 'BET_HISTORY.game_id')
                        .andOn('games.provider_id', '=', this.db.raw('?', [DATA.PROVIDER_ID]));
                });
            }

            if (DATA.CURRENCY && DATA.CURRENCY !== 'null') {
                query = query.where('BET_HISTORY.currency_code', DATA.CURRENCY);
            }

            if (DATA.TIPE_OF_TRANSACTION && DATA.TIPE_OF_TRANSACTION !== 'null') {
                query = query.where('BET_HISTORY.transaction_type', DATA.TIPE_OF_TRANSACTION);
            }

            if (DATA.SECTIONS && DATA.SECTIONS !== 'null') {
                query = query.where('BET_HISTORY.sections', DATA.SECTIONS);
            }

            if (DATA.ROUND_ID && DATA.ROUND_ID !== 'null') {
                query = query.where('BET_HISTORY.round_id', DATA.ROUND_ID);
            }

            if (DATA.IS_BONUS && DATA.IS_BONUS !== 'null') {
                query = query.where('BET_HISTORY.is_bonus', DATA.IS_BONUS);
            }

            if (DATA.SECTIONS_LIST && DATA.SECTIONS_LIST !== 'null') {
                query = query.whereIn('BET_HISTORY.sections', DATA.SECTIONS_LIST);
            }

            if (DATA.START_DATE && DATA.START_DATE !== 'null') {
                query = query.where('BET_HISTORY.created_at', '>=', new Date(DATA.START_DATE * 1000)); // assuming timestamp in seconds
            }

            if (DATA.END_DATE && DATA.END_DATE !== 'null') {
                query = query.where('BET_HISTORY.created_at', '<=', new Date(DATA.END_DATE * 1000)); // assuming timestamp in seconds
            }

            // Se RETURN_TYPE è CALC_TOTAL_BET, calcola i totali
            if (DATA.RETURN_TYPE === 'CALC_TOTAL_BET') {
                const result = await query
                    .select(
                        this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet'),
                        this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "WIN" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_win'),
                        this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet_bonus'),
                        this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "WIN" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_win_bonus')
                    )
                    .first();
                    
                return {
                    total_bet: result.total_bet || 0,
                    total_win: result.total_win || 0,
                    total_bet_bonus: result.total_bet_bonus || 0,
                    total_win_bonus: result.total_win_bonus || 0
                };
            }

            // Se RETURN_TYPE è CALC_TOTAL_BET_BY_SECTION, calcola i totali per sezione
            if (DATA.RETURN_TYPE === 'CALC_TOTAL_BET_BY_SECTION') {
                const sections = ['casino', 'casino_live', 'crash_game', 'virtual', 'bingo', 'poker'];
                const totals = {};

                for (const section of sections) {
                    const sectionQuery = query.clone().where('BET_HISTORY.sections', section);
                    const result = await sectionQuery
                        .select(
                            this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet'),
                            this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "WIN" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_win'),
                            this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet_bonus'),
                            this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "WIN" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_win_bonus')
                        )
                        .first();

                    totals[section] = {
                        TOTAL_BET: result.total_bet || 0,
                        TOTAL_WIN: result.total_win || 0,
                        TOTAL_BET_BONUS: result.total_bet_bonus || 0,
                        TOTAL_WIN_BONUS: result.total_win_bonus || 0
                    };
                }

                return totals;
            }

            // Se RETURN_TYPE è GET_TOTAL_BET_BY_SECTION
            if (DATA.RETURN_TYPE === 'GET_TOTAL_BET_BY_SECTION') {
                const results = await query
                    .select(
                        'BET_HISTORY.userid',
                        'BET_HISTORY.sections',
                        this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet'),
                        this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "WIN" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_win'),
                        this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet_bonus'),
                        this.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "WIN" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_win_bonus')
                    )
                    .groupBy('BET_HISTORY.userid', 'BET_HISTORY.sections');

                const totals = {};
                for (const result of results) {
                    const userid = result.userid;
                    const section = result.sections;

                    if (!totals[userid]) {
                        totals[userid] = {};
                    }

                    totals[userid][section] = {
                        TOTAL_BET: result.total_bet || 0,
                        TOTAL_WIN: result.total_win || 0,
                        TOTAL_BET_BONUS: result.total_bet_bonus || 0,
                        TOTAL_WIN_BONUS: result.total_win_bonus || 0
                    };
                }

                return totals;
            }

            // Se nessun RETURN_TYPE è specificato, ritorna la cronologia completa
            const result = await query.select('BET_HISTORY.*');
            return result;
        } catch (error) {
            console.error('Errore durante l\'esecuzione della query:', error);
            throw error;
        }
    }

    async GET_BET_TICKETS__CRONE(DATA, SELECT = null) {
        try {
            // Inizia la costruzione della query
            let query = this.db('playlogiq_tickets').join('users', 'users.id', 'playlogiq_tickets.user_id');

            // Filtro per USER_ID
            if (DATA.USER_ID && DATA.USER_ID !== 'null') {
                query = query.where('playlogiq_tickets.user_id', DATA.USER_ID);
            }

            // Filtro per USER_LIST_ID
            if (DATA.USER_LIST_ID && DATA.USER_LIST_ID !== 'null') {
                query = query.whereIn('playlogiq_tickets.user_id', DATA.USER_LIST_ID);
            }

            // Filtro per CURRENCY
            if (DATA.CURRENCY && DATA.CURRENCY !== 'null') {
                query = query.where('playlogiq_tickets.ticketcurrency', DATA.CURRENCY);
            }

            // Filtro per STATUS_OF_TICKET
            if (DATA.STATUS_OF_TICKET && DATA.STATUS_OF_TICKET !== 'null') {
                query = query.where('playlogiq_tickets.ticketstatus', DATA.STATUS_OF_TICKET);
            }

            // Filtro per NO_STATUS_OF_TICKET (negazione dello status)
            if (DATA.NO_STATUS_OF_TICKET && DATA.NO_STATUS_OF_TICKET !== 'null') {
                query = query.whereNot('playlogiq_tickets.ticketstatus', DATA.NO_STATUS_OF_TICKET);
            }

            // Filtro per TYPE_OF_TICKET
            if (DATA.TYPE_OF_TICKET && DATA.TYPE_OF_TICKET !== 'null') {
                query = query.where('playlogiq_tickets.tickettype', DATA.TYPE_OF_TICKET);
            }

            // Filtri per date
            if (DATA.START_DATE && DATA.START_DATE !== 'null') {
                query = query.where('playlogiq_tickets.addedTime', '>=', DATA.START_DATE);
            }

            if (DATA.END_DATE && DATA.END_DATE !== 'null') {
                query = query.where('playlogiq_tickets.addedTime', '<', DATA.END_DATE);
            }

            if (DATA.START_DATE_UPDATE && DATA.START_DATE_UPDATE !== 'null') {
                query = query.where('playlogiq_tickets.updateTime', '>=', DATA.START_DATE_UPDATE);
            }

            if (DATA.END_DATE_UPDATE && DATA.END_DATE_UPDATE !== 'null') {
                query = query.where('playlogiq_tickets.updateTime', '<', DATA.END_DATE_UPDATE);
            }

            // Se RETURN_TYPE è 'CALC_TOTAL_BET'
            if (DATA.RETURN_TYPE === 'CALC_TOTAL_BET') {
                const result = await query
                    .select(
                        this.db.raw('SUM(CASE WHEN playlogiq_tickets.ticketstatus != "N" AND playlogiq_tickets.bonus_amount = 0 AND playlogiq_tickets.ticketbonus = 0 THEN playlogiq_tickets.ticketbet ELSE 0 END) AS total_bet'),
                        this.db.raw('SUM(CASE WHEN playlogiq_tickets.ticketstatus IN ("W", "V") AND playlogiq_tickets.ticketbonus = 0 THEN playlogiq_tickets.win ELSE 0 END) AS total_win'),
                        this.db.raw('SUM(CASE WHEN playlogiq_tickets.ticketbonus = 1 AND playlogiq_tickets.ticketstatus != "N" THEN playlogiq_tickets.ticketbet ELSE 0 END) AS total_bet_bonus'),
                        this.db.raw('SUM(CASE WHEN playlogiq_tickets.ticketbonus = 1 AND playlogiq_tickets.ticketstatus IN ("W", "V") THEN playlogiq_tickets.ticketwin ELSE 0 END) AS total_win_bonus')
                    )
                    .first();

                return {
                    total_bet: result.total_bet || 0,
                    total_win: result.total_win || 0,
                    total_bet_bonus: result.total_bet_bonus || 0,
                    total_win_bonus: result.total_win_bonus || 0
                };
            }

            // Se RETURN_TYPE è 'GET_TOTAL_BET_BY_SECTION'
            if (DATA.RETURN_TYPE === 'GET_TOTAL_BET_BY_SECTION') {
                const results = await query
                    .select(
                        'playlogiq_tickets.user_id',
                        this.db.raw('SUM(CASE WHEN playlogiq_tickets.ticketstatus != "N" AND playlogiq_tickets.bonus_amount = 0 AND playlogiq_tickets.ticketbonus = 0 THEN playlogiq_tickets.ticketbet ELSE 0 END) AS total_bet'),
                        this.db.raw('SUM(CASE WHEN playlogiq_tickets.ticketstatus IN ("W", "V") AND playlogiq_tickets.ticketbonus = 0 THEN playlogiq_tickets.win ELSE 0 END) AS total_win'),
                        this.db.raw('SUM(CASE WHEN playlogiq_tickets.ticketbonus = 1 AND playlogiq_tickets.ticketstatus != "N" THEN playlogiq_tickets.ticketbet ELSE 0 END) AS total_bet_bonus'),
                        this.db.raw('SUM(CASE WHEN playlogiq_tickets.ticketbonus = 1 AND playlogiq_tickets.ticketstatus IN ("W", "V") THEN playlogiq_tickets.ticketwin ELSE 0 END) AS total_win_bonus')
                    )
                    .groupBy('playlogiq_tickets.user_id');

                if (!results || results.length === 0) {
                    return null;
                }

                const totals = {};
                for (const result of results) {
                    const userid = result.user_id;
                    const section = 'sport';

                    if (!totals[userid]) {
                        totals[userid] = {};
                    }

                    totals[userid][section] = {
                        TOTAL_BET: result.total_bet || 0,
                        TOTAL_WIN: result.total_win || 0,
                        TOTAL_BET_BONUS: result.total_bet_bonus || 0,
                        TOTAL_WIN_BONUS: result.total_win_bonus || 0
                    };
                }

                return totals;
            }

            // Seleziona tutti i ticket se nessun RETURN_TYPE è specificato
            if (SELECT) {
                query = query.select(SELECT);
            } else {
                query = query.select('playlogiq_tickets.*');
            }

            const es_results = await query;
            return es_results.length > 0 ? es_results : null;
        } catch (error) {
            console.error("Errore nella query GET_BET_TICKETS__CRONE:", error);
            throw error;
        }
    }
    
} export default Database;

class MySqlDatabase {
    constructor(_DB_CONFIG) {
        this.dbConfig = {
            client: 'mysql2',
            connection: {
                host: _DB_CONFIG.__DB_HOST,
                user: _DB_CONFIG.__DB_USERNAME,
                password: _DB_CONFIG.__DB_PASSWORD,
                database: _DB_CONFIG.__DB_DATABASE
            }
        };
        this.db = mysql.createConnection(this.dbConfig.connection);
    }

    getUsers(_user_id) {
        this.db.query(`SELECT * FROM users WHERE id = ${_user_id}`, (er, data) => {console.log(data);});
    }
}

export { MySqlDatabase, Database };