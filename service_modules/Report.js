import Preloader from "./Preloader.js";
import Uploader from "./Uploader.js";

class Report {

    constructor(_cost_subnet = {}, _commission_subnet = {}, _cost_commission_subnet = {}) {
        this.COST_SUBNET = _cost_subnet;
        this.COMMISSION_SUBNET = _commission_subnet;
        this.COST_COMMISSION_SUBNET = _cost_commission_subnet;

        this.COST_PROVIDERS = {};
    }

    _init(_data) {
        console.log(_data);
    }

    /*
        CALC methods
            CALC_SPORT_BET_REPORT
            CALC_CASINO_BET_REPORT

            CALC_SPORT_PROVIDER_BET_REPORT
            CALC_CASINO_PROVIDER_BET_REPORT

            CALC_SPORT_EVENTS_SUM
            CALC_TURNOVER_REPORT

            CALC_SPORT_GGR_REPORT
            CALC_CASINO_GGR_REPORT

            CALC_SPORT_COMMISSIONS_REPORT
            CALC_CASINO_COMMISSIONS_REPORT

            CALC_SPORT_COST_REPORT
            CALC_CASINO_COST_REPORT

            CALC_NETWORK_PROFIT_REPORT

            CALC_BONUS_WAGERING_REPORT

        PAY methods
            PAY_COMMISSONS
            PAY_TURNOVER

            PAY_SPORT_GGR
            PAY_CASINO_GGR

            PAY_COMMISSION

    */

} export default Report;