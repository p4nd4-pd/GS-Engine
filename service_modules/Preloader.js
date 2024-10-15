import Database from './Database.js';

class Preloader {
    constructor(_database, _mysql = {}) {
        if (_database instanceof Database) {
            this._database = _database;
        } else console.warn('Only instance of Database allowed into Preloader.');
    }

    _init(data) {
        this.SKIN_ID = data.SKIN_ID;
        this.SKIN_NAME = data.SKIN_NAME;
        this.AUTH_TOKEN = data.AUTH_TOKEN;

        this._event_manager = data._event_manager;
    }

    async initializeReport(_range) {

        // get provider list by skin

        // get agent list ordered by commissional profile

        // get casino & sport history grouped by parent_id (shop)

        //

        return {
            casino_history: await this._database.GET_BET_HISTORY__CRONE({
                CURRENCY: 'BRL',                     // Valuta associata al skin
                START_DATE: Math.floor(new Date(_range.startDate).getTime() / 1000),  // Converti la data in timestamp UNIX
                END_DATE: Math.floor(new Date(_range.endDate).getTime() / 1000),      // Converti la data in timestamp UNIX
                RETURN_TYPE: 'CALC_TOTAL_BET',              // Specifica il tipo di ritorno
                SECTIONS_LIST: ['casino', 'casino_live', 'crash_game', 'virtual', 'bingo'],  // Sezioni
            }),

            agents_list: await this._database.GET_USERS_CRONE({RETURN_TYPE: 'GET_AGENTS_BY_PROFILE_TYPE'})
        };
    }

    async GET_SKIN_PROVIDERS_LIST__CRONE() {
        try {
            // Inizia la costruzione della query
            let query = this._database.db('skins_providers')
                .join('providers', 'providers.id', 'skins_providers.provider_id')
                .select('providers.name as provider_name', 'skins_providers.*'); // Seleziona i campi necessari

            query = query.where('skins_providers.skin_id', this.SKIN_ID);

            // Filtro per 'view'
            query = query.where('skins_providers.view', '1');

            // Esegui la query
            const result = await query;

            // Controlla se ci sono risultati
            if (result && result.length > 0) {
                return result;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error retrieving skin providers list:', error);
            throw error;
        }
    }

    async GET_USERS_CRONE(DATA, SELECT = null) {
    
        let query = this._database.db('users');

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
            let agentsQuery = this._database.db('users')
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






    async GET_AGENTS_BY_PROFILE_TYPE_WITH_PARENTS() {
        // Step 1: Query agents excluding 'players' and 'fast_player'
        const agents = await this._database.db('users')
            .whereNotIn('role_type', ['players', 'fast_player'])
            .whereNotNull('profile_type')
            .where('profile_type', '!=', '')
            .select('id', 'parent_id', 'username', 'role_type', 'profile_type');

        // Step 2: Get parent hierarchy for each agent
        const agentsWithParents = await Promise.all(agents.map(async agent => {
            const parentHierarchy = await this.getParentPath(agent.parent_id);
            return {
                id_agent: agent.id,
                username: agent.username,
                role_type: agent.role_type,
                profile_type: agent.profile_type,
                parent_path: parentHierarchy
            };
        }));

        // Step 3: Group agents by profile_type
        const groupedAgents = agentsWithParents.reduce((acc, agent) => {
            const { profile_type, id_agent } = agent;
            if (!acc[profile_type]) {
                acc[profile_type] = {};//[]
            }
            //acc[profile_type].push(agent);
            acc[profile_type][id_agent] = {
                username: agent.username,
                role_type: agent.role_type,
                parent_path: agent.parent_path
            };
            return acc;
        }, {});

        // Step 4: Return the grouped object
        return groupedAgents;
    }

    // Helper function to recursively get parent path
    async getParentPath(parent_id) {
        const parentPath = {};

        let currentParentId = parent_id;

        while (currentParentId) {
            const parent = await this._database.db('users')
                .where('id', currentParentId)
                .select('id', 'role_type', 'parent_id')
                .first();

            if (parent) {
                parentPath[parent.role_type] = parent.id;
                currentParentId = parent.parent_id; // Move to the next parent in the hierarchy
            } else {
                currentParentId = null; // Stop if no parent is found
            }
        }

        return parentPath;
    }



    async GET_USER_PROVIDERS__CRONE(DATA, SELECT = null) {
        let query = this._database.db('users_providers');

        if (DATA.USER_ID) {
            query = query.where('user_id', DATA.USER_ID);
        }

        if (DATA.USER_LIST_ID) {
            query = query.whereIn('user_id', DATA.USER_LIST_ID);
        }
    
        if (DATA.PROVIDER_ID) {
            query = query.where('provider_id', DATA.PROVIDER_ID);
        }

        if (DATA.RETURN_TYPE && DATA.RETURN_TYPE === 'GROUP_BY_USER_ID') {
            if (SELECT && SELECT.length > 0) {
                query = query.select(...SELECT);
            } else {
                query = query.select('user_id', 'provider_id', 'percentage', 'hide');
            }

            const result = await query;

            const groupedresult = result.reduce((acc, provider) => {
                const { user_id, provider_id } = provider;
                if (!acc[user_id]) {
                    acc[user_id] = {};
                }
                acc[user_id][provider_id] = {
                    percentage: provider.percentage,
                    hide: provider.hide
                }
                return acc;
            }, {});

            return groupedresult;
        }

        if (SELECT && SELECT.length > 0) {
            query = query.select(...SELECT);
        } else {
            query = query.select('*');
        }
    
        const es_results = await query;
    
        return es_results;
    }

    async GET_USER_COMMISSION__CRONE(DATA, SELECT = null) {
        let query = this._database.db('COMMISIONAL_PROFILES');

        if (DATA.USER_ID) {
            query = query.where('user_id', DATA.USER_ID);
        }

        if (DATA.USER_LIST_ID) {
            query = query.whereIn('user_id', DATA.USER_LIST_ID);
        }

        if (DATA.RETURN_TYPE && DATA.RETURN_TYPE === 'GROUP_BY_USER_ID') {
            if (SELECT && SELECT.length > 0) {
                query = query.select(...SELECT);
            } else {
                query = query.select(
                    'user_id',
                    'casino_perc_first_range', 'casino_perc_second_range', 'casino_perc_third_range',
                    'sport_perc_first_range', 'sport_perc_second_range', 'sport_perc_third_range',
                    'global_perc_first_range', 'global_perc_second_range', 'global_perc_third_range'
                );
            }

            const result = await query;

            const groupedresult = result.reduce((acc, commission) => {
                const { user_id } = commission;
                if (!acc[user_id]) {
                    acc[user_id] = {};
                }
                acc[user_id] = commission;
                return acc;
            }, {});

            return groupedresult;
        }

        if (SELECT && SELECT.length > 0) {
            query = query.select(...SELECT);
        } else {
            query = query.select('*');
        }
    
        const es_results = await query;
    
        return es_results;
    }

    async GET_USER_TURNOVER__CRONE(DATA, SELECT = null) {
        let query = this._database.db('sport_profiles');

        if (DATA.USER_ID) {
            query = query.where('user_id', DATA.USER_ID);
        }

        if (DATA.USER_LIST_ID) {
            query = query.whereIn('user_id', DATA.USER_LIST_ID);
        }

        if (DATA.RETURN_TYPE && DATA.RETURN_TYPE === 'GROUP_BY_USER_ID') {
            if (SELECT && SELECT.length > 0) {
                query = query.select(...SELECT);
            } else {
                query = query.select(
                    'user_id', 'profile_type',
                    'misto_1', 'misto_2', 'misto_34',
                    'misto_57', 'misto_810', 'misto_1113',
                    'misto_1416', 'misto_1720', 'misto_2125', 'misto_2630'
                );
            }

            const result = await query;

            const groupedresult = result.reduce((acc, turnover) => {
                const { user_id } = turnover;
                if (!acc[user_id]) {
                    acc[user_id] = {};
                }
                acc[user_id] = turnover;
                return acc;
            }, {});

            return groupedresult;
        }

        if (SELECT && SELECT.length > 0) {
            query = query.select(...SELECT);
        } else {
            query = query.select('*');
        }
    
        const es_results = await query;
    
        return es_results;
    }




    async GET_BET_HISTORY__CRONE(DATA) {
        try {
            // Inizia a costruire la query di base
            let query = this._database.db('BET_HISTORY').join('users', 'users.id', 'BET_HISTORY.userid');

            if (DATA.USER_ID && DATA.USER_ID !== 'null') {
                query = query.where('BET_HISTORY.userid', DATA.USER_ID);
            }

            if (DATA.USER_LIST_ID && DATA.USER_LIST_ID !== 'null') {
                query = query.whereIn('BET_HISTORY.userid', DATA.USER_LIST_ID);
            }

            if (DATA.PROVIDER_ID && DATA.PROVIDER_ID !== 'null') {
                query = query.join('games', function () {
                    this.on('games.external_id', '=', 'BET_HISTORY.game_id')
                        .andOn('games.provider_id', '=', this._database.db.raw('?', [DATA.PROVIDER_ID]));
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
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type IN("WIN", "REFUND") AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_win'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet_bonus'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type IN("WIN", "REFUND") AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_win_bonus')
                    )
                    .first();
                    
                return {
                    total_bet: result.total_bet || 0,
                    total_win: result.total_win || 0,
                    total_bet_bonus: result.total_bet_bonus || 0,
                    total_win_bonus: result.total_win_bonus || 0
                };
            }

            if (DATA.RETURN_TYPE === 'CALC_TOTAL_BET_BY_PARENT') {
                const results = await query
                    .select(
                        'users.parent_id as parent', 
                        'BET_HISTORY.currency_code as cur',
                        this._database.db.raw('DATE_FORMAT(BET_HISTORY.created_at, "%y-%m-%d") as date'), // Formatta la data come YY-MM-DD
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type IN("WIN", "REFUND") AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_win'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet_bonus'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type IN("WIN", "REFUND") AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_win_bonus')                        
                    )
                    .groupBy('parent', 'date', 'cur')  // Raggruppa anche per giorno
                    .orderBy('date', 'desc');  // Ordina i risultati per data, più recente prima

                const totals = [];
                for (const result of results) {
                    const parent = result.parent;
                    const cur = result.cur;
                    const date = result.date;  // La data formattata

                    if (!totals[parent]) {
                        totals[parent] = [];
                    }

                    if (!totals[parent][date]) {
                        totals[parent][date] = [];
                    }

                    totals[parent][date][cur] = {  // Inserisci i dati raggruppati per giorno
                        TOTAL_BET: result.total_bet || 0,
                        TOTAL_WIN: result.total_win || 0,
                        TOTAL_BET_BONUS: result.total_bet_bonus || 0,
                        TOTAL_WIN_BONUS: result.total_win_bonus || 0
                    };
                }

                return totals;
            }

            if (DATA.RETURN_TYPE === 'CALC_TOTAL_BET_BY_PROVIDER') {

                query = query.join('games', 'games.external_id', 'BET_HISTORY.game_id');

                const results = await query
                    .select(
                        'games.provider_id as provider', 'BET_HISTORY.currency_code as cur',
                        this._database.db.raw('DATE_FORMAT(BET_HISTORY.created_at, "%y-%m-%d") as date'), // Formatta la data come YY-MM-DD
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type IN("WIN", "REFUND") AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_win'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet_bonus'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type IN("WIN", "REFUND") AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_win_bonus')
                    ).groupBy('provider', 'date', 'cur').orderBy('date', 'desc');  // Ordina i risultati per data, più recente prima
                    
                const totals = {};
                for (const result of results) {
                    const provider = result.provider;
                    const date = result.date;
                    const cur = result.cur;

                    if (!totals[provider]) {
                        totals[provider] = {};
                    }

                    if (!totals[provider][date]) {
                        totals[provider][date] = {};
                    }

                    totals[provider][date][cur] = {
                        TOTAL_BET: result.total_bet || 0,
                        TOTAL_WIN: result.total_win || 0,
                        TOTAL_BET_BONUS: result.total_bet_bonus || 0,
                        TOTAL_WIN_BONUS: result.total_win_bonus || 0
                    };
                }

                return totals;
            }

            // Se RETURN_TYPE è CALC_TOTAL_BET_BY_SECTION, calcola i totali per sezione
            if (DATA.RETURN_TYPE === 'CALC_TOTAL_BET_BY_SECTION') {
                const sections = ['casino', 'casino_live', 'crash_game', 'virtual', 'bingo', 'poker'];
                const totals = {};

                for (const section of sections) {
                    const sectionQuery = query.clone().where('BET_HISTORY.sections', section);
                    const result = await sectionQuery
                        .select(
                            this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet'),
                            this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type IN("WIN", "REFUND") AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_win'),
                            this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet_bonus'),
                            this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type IN("WIN", "REFUND") AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_win_bonus')
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
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type IN("WIN", "REFUND") AND BET_HISTORY.is_bonus = 0 THEN BET_HISTORY.amount ELSE 0 END) AS total_win'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type = "BET" AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_bet_bonus'),
                        this._database.db.raw('SUM(CASE WHEN BET_HISTORY.transaction_type IN("WIN", "REFUND") AND BET_HISTORY.is_bonus = 1 THEN BET_HISTORY.amount ELSE 0 END) AS total_win_bonus')
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
            console.error('[GET_BET_HISTORY__CRONE] Errore durante l\'esecuzione della query:', error);
            throw error;
        }
    }

} export default Preloader;