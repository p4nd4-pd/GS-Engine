import Database from './Database.js'

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
    }

    async initializeReport(_range) {

        // get provider list

        // get agent list ordered by commissional profile

        // get casino & sport history grouped by paren_id (shop)

        //

        return {
            casino_history: await this._database.GET_BET_HISTORY__CRONE({
                CURRENCY: 'BRL',                     // Valuta associata al skin
                START_DATE: Math.floor(new Date(_range.startDate).getTime() / 1000),  // Converti la data in timestamp UNIX
                END_DATE: Math.floor(new Date(_range.endDate).getTime() / 1000),      // Converti la data in timestamp UNIX
                RETURN_TYPE: 'CALC_TOTAL_BET',              // Specifica il tipo di ritorno
                SECTIONS_LIST: ['casino', 'casino_live', 'crash_game', 'virtual', 'bingo'],  // Sezioni
            }),
        };
    }
} export default Preloader;