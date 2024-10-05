import Preloader from "./Preloader.js";
import Uploader from "./Uploader.js";

class Report {

    constructor() {}

    _init() {}

    start() {
        setInterval(() => {console.log('Report running...')}, 5000);
    }
} export default Report;