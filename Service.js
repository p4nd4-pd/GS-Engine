import Preloader from "./service_modules/Preloader.js";
import Uploader from "./service_modules/Uploader.js";

import Report from "./service_modules/Report.js";

import cron from 'node-cron';

class Service {
    constructor(_config, _preloader, _uploader) {

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

        // define a datemanager for commissional and cost month ranges
    }

    async initializeService(_event_manager) {
        this._event_manager = _event_manager;

        this._preloader._init(this); // create a identificate network fingerprint
        this._uploader._init(this); // create a identificate network fingerprint
    }

    async initializeModules(_modules) {
        this._module = new Report();
        this._module._init(this);
    }

    async start() {

        await this._module.onStart();

        // Esegui un'operazione ogni 10 minuti
        cron.schedule('*/1 * * * *', () => {
            //this._module.onFixedUpdate();
            this._event_manager.emit('bet', {}); // test
        });

        // Esegui un'operazione ogni ora (al minuto 0)
        cron.schedule('0 * * * *', () => {
            //this._module.onFixedUpdate();
        });

        // Esegui un'operazione ogni giorno a mezzanotte
        cron.schedule('0 0 * * *', () => {
            console.warn('this.calculateEveryDay();');
        });

        // Esegui un'operazione ogni lunedì alle 12:00
        cron.schedule('0 12 * * 1', () => {
            console.warn('this.calculateEveryMonday();');
        });


        // define run-in listeners
        this._event_manager.on('bet', (_error, _data) => {
            this._module.onUpdate(_data);
        });
    }
} export default Service;