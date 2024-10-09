import Service from './Service.js';

import Database from './service_modules/Database.js'
import Preloader from './service_modules/Preloader.js';
import Uploader from './service_modules/Uploader.js';
import UsersManager from './service_modules/UsersManager.js'
import Report from './service_modules/Report.js';

//import minimist from 'minimist';
import axios from 'axios';
import EventEmitter from 'events';


/* [START] ["Define all initial parameters to execute calculation."] ============================================================ */
    const SERVICE_MANAGER_URL = 'http://localhost:5000';
    const _token = process.argv[2] || 'debug_token';
/* [END] ======================================================================================================================== */

/* ======================================================================================================================== */
    const { _service_config, _db_config } = await downloadConfig(_token);
    async function downloadConfig(_token) {
        try {
            // Effettua una richiesta GET all'endpoint specificato
            const response = await axios.get(SERVICE_MANAGER_URL + '/config', {
                headers: {
                    'Authorization': _token  // Passa il token nell'header Authorization
                }
            });
            return response.data;
        } catch (error) {

            console.warn('Connection failed. Switching to local configuration. Error Detail: ', error.message);

            const _DB_CONFIG = {
                __DB_HOST: '162.19.30.162',
                __DB_DATABASE: 'gsapik_gs_rest',
                __DB_USERNAME: 'gsapik_root_user',
                __DB_PASSWORD: 'q6VrCN9}z9Rx'
            }
            return {_service_config : {AUTH_TOKEN: 'local_mode_token'}, _db_config: _DB_CONFIG};
        }
    }
/* ======================================================================================================================== */


const _database = new Database(_db_config); // create a database controller
const _preloader = new Preloader(_database); // create a preloader controller with database class
const _uploader = new Uploader(_database); // create a uploader conroller with database class

const _users_manager = new UsersManager();

const _report = new Report(); // define module

/* ---------------------------------------------------------------------- */
    const _event_manager = new EventEmitter();
    _event_manager.on('static_reprt_calcolate_fine', () => {
        console.warn('Calcolating executed!');
    });
/* ---------------------------------------------------------------------- */


const _service = new Service(_service_config, _preloader, _uploader, _report);


await _service.initializeService(_event_manager);
await _service.initializeModules();

// Avvia Report
_service.start();