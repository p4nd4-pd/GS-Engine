import Service from './Service.js';

import Database from './service_modules/Database.js'
import Preloader from './service_modules/Preloader.js';
import Uploader from './service_modules/Uploader.js';
import Report from './service_modules/Report.js';

import Cron from 'node-cron';

/* [START] ["Define all initial parameters to execute calculation."] ============================================================ */
    let __SKIN_ID = 32;
    
    let __DB_HOST = '162.19.30.162';
    let __DB_DATABASE = 'gsapik_gs_rest';
    let __DB_USERNAME = 'gsapik_root_user';
    let __DB_PASSWORD = 'q6VrCN9}z9Rx';
        
    const _DB_CONFIG = {
        __DB_HOST: __DB_HOST,
        __DB_DATABASE: __DB_DATABASE,
        __DB_USERNAME: __DB_USERNAME,
        __DB_PASSWORD: __DB_PASSWORD
    }
/* [END] ======================================================================================================================== */

const _database = new Database(_DB_CONFIG); // create a database controller

const _preloader = new Preloader(_database); // create a preloader controller with database class
const _uploader = new Uploader(_database); // create a uploader conroller with database class

const _report = new Report();

// Avvia Report
new Service(_preloader, _uploader, _report).start();