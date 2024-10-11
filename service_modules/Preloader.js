import Database from './Database.js';
import knex from 'knex';

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



    async GET_AGENT_ABOVE(user_id) {
        try {
            // Connessione al database (assumendo che `this.db` sia l'istanza di Knex.js)
            const db = this._database.db;

            // Definisci la query SQL per la CTE ricorsiva
            const sql = `
                WITH RECURSIVE UserHierarchy AS (
                    SELECT u.id, u.role_type, u.parent_id, 1 AS level
                    FROM users u
                    WHERE u.id = ?

                    UNION ALL

                    SELECT u.id, u.role_type, u.parent_id, uh.level + 1
                    FROM users u
                    JOIN UserHierarchy uh ON u.id = uh.parent_id
                )
                SELECT id, role_type, parent_id, level
                FROM UserHierarchy;
            `;

            // Esegui la query con Knex
            const results = await db.raw(sql, [user_id]);

            // Restituisci i risultati (rows)
            return results.rows || [];
        } catch (error) {
            console.error('Error fetching agent hierarchy:', error);
            throw error;
        }
    }

    async GET_AGENT_HIERARCHY() {
        try {
            // Connessione al database (assumendo che `this.db` sia l'istanza di Knex.js)
            const db = this._database.db;

            // Definisci la query SQL per la CTE ricorsiva
            const sql = `
            `;

            // Esegui la query con Knex
            const results = await db.raw(sql);

            // Restituisci i risultati (rows)
            return results[0] || [];
        } catch (error) {
            console.error('Error fetching agent hierarchy:', error);
            throw error;
        }
    }


} export default Preloader;