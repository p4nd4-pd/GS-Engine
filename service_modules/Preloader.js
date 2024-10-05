import Database from './Database.js'

class Preloader {
    constructor(_database) {
        if (_database instanceof Database) {
            this._database = _database;
        } else console.warn('Only instance of Database allowed into Preloader.');
    }
} export default Preloader;