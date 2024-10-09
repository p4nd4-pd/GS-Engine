import Preloader from "./service_modules/Preloader.js";
import Uploader from "./service_modules/Uploader.js";

import Report from "./service_modules/Report.js";

import cron from 'node-cron';

class Service {
    constructor(_config, _preloader, _uploader, _report) {

        this.AUTH_TOKEN = _config.AUTH_TOKEN || 'local_mode_token';
        this.SKIN_NAME = _config.SKIN_NAME || 'local_mode_skin';
        this.SKIN_ID = _config.SKIN_ID || '0';

        console.log(this);
        
        if (_preloader instanceof Preloader) {
            this._preloader = _preloader;
        } else console.warn('Only instance of Preloader allowed.');

        if (_uploader instanceof Uploader) {
            this._uploader = _uploader;
        } else console.warn('Only instance of Uploader allowed.');

        if (_report instanceof Report) {
            this._report = _report;
        } else console.warn('Only instance of Report allowed.');

        // define a datemanager for commissional and cost month ranges
    }

    initializeService(_event_manager) {
        this._event_manager = _event_manager;

        this._preloader._init(this); // create a identificate network fingerprint
        this._uploader._init(this); // create a identificate network fingerprint
    }

    async initializeModules() {
        let _range = { startDate: '2024-10-01', endDate: '2024-10-31' };
        let {casino_history} = await this._preloader.initializeReport(_range);
        this._report._init(casino_history);
    }

    start() {
        // Esegui un'operazione ogni 10 minuti
        cron.schedule('*/1 * * * *', () => {
            console.warn('Start re-calcolating report...');
            this._event_manager.emit('static_reprt_calcolate_fine')
        });

        // Esegui un'operazione ogni ora (al minuto 0)
        cron.schedule('0 * * * *', () => {
            console.warn('this.calculateEveryHour();');
        });

        // Esegui un'operazione ogni giorno a mezzanotte
        cron.schedule('0 0 * * *', () => {
            console.warn('this.calculateEveryDay();');
        });

        // Esegui un'operazione ogni lunedì alle 10:00
        cron.schedule('0 10 * * 1', () => {
            console.warn('this.calculateEveryMonday();');
        });
    }
} export default Service;