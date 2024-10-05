import knex from 'knex';

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

        console.log(`[+] Connection to [${_DB_CONFIG.__DB_HOST}]...`);

        this.db = knex(dbConfig);
        const start = Date.now();

        this.db.raw('SELECT 1+1 as result').then(() => {
            const end = Date.now();
            const pingTime = end - start;
            const hostName = this.db.client.config.connection.host;
            console.log(`[+] Connection to [${hostName}] executed with sucess. [Ping:${pingTime}ms]`);
        }).catch(error => {
            throw new Error("[+] An error occurred while connecting to the database. => " + error.message);
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

    async GET_USERS_CRONE(skin_id, DATA, SELECT = null) {
    
        let query = this.db('users');
    
        if (skin_id !== 'all') {
            query = query.where('skin_id', skin_id);
        }
    
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
    
} export default Database;