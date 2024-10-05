import Preloader from "./service_modules/Preloader.js";
import Uploader from "./service_modules/Uploader.js";

import Report from "./service_modules/Report.js";

class Service {
    constructor(_preloader, _uploader, _report) {
        if (_preloader instanceof Preloader) {
            this._preloader = _preloader;
        } else console.warn('Only instance of Preloader allowed.');

        if (_uploader instanceof Uploader) {
            this._uploader = _uploader;
        } else console.warn('Only instance of Uploader allowed.');

        if (_report instanceof Report) {
            this._report = _report;
        } else console.warn('Only instance of Report allowed.');
    }
    
    start() {
        this._report.start();
    }
} export default Service;
