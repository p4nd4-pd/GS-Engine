import Database from './Database.js'

class Uploader {
    constructor(_database) {
        if (_database instanceof Database) {
            this._database = _database;
        } else console.warn('Only instance of Database allowed into Uploader.');
    }

    _init(data) {
        this.SKIN_ID = data.SKIN_ID;
        this.SKIN_NAME = data.SKIN_NAME;
        this.AUTH_TOKEN = data.AUTH_TOKEN;

        this._event_manager = data._event_manager;
    }

} export default Uploader;