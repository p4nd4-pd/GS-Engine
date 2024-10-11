import Preloader from "./Preloader.js";
import Uploader from "./Uploader.js";

class Report {

    constructor() {
        //{_cost_subnet: {}, _commission_subnet: {}, _cost_commission_subnet: {}}.
        this.COST_SUBNET = {};
        this.COMMISSION_SUBNET = {};
        this.COST_COMMISSION_SUBNET = {};

        this.COST_PROVIDERS = {};
    }

    _init(data) {
        if (data._preloader instanceof Preloader) {
            this._preloader = data._preloader;
        } else console.warn('Only instance of Preloader allowed.');

        if (data._uploader instanceof Uploader) {
            this._uploader = data._uploader;
        } else console.warn('Only instance of Uploader allowed.');
    }

    async onStart() {
        // estract skin provider list with %
        this.COST_PROVIDERS = await this._preloader.GET_SKIN_PROVIDERS_LIST__CRONE();

        // estact users with commissional % and providers %
        let users = await this._preloader.GET_USERS_CRONE({RETURN_TYPE: 'GET_AGENTS_BY_PROFILE_TYPE'});

        /*
            console.log('cost_master_cost_subnet : ', cost_master_cost_subnet);
            console.log('cost_master_commission_subnet : ', cost_master_commission_subnet);
            console.log('commission_master_commission_subnet : ', commission_master_commission_subnet);
        */
        this.COST_SUBNET = users.cost_master_cost_subnet;
        this.COST_COMMISSION_SUBNET = users.cost_master_commission_subnet;
        this.COMMISSION_SUBNET = users.commission_master_commission_subnet;
        



        // ------------------------------
        console.log('onStart registered!');
    }

    // Pre-calc & Re-calc
    onFixedUpdate(_range) {

        // get casino & sport transactions : group by shop : by range

        // 

        console.log('onFixedUpdate registered!', _range);
    }
    
    // Run-time-calc
    onUpdate(_range) {
        console.log('onUpdate registered!', _range);
    }
    

    /** ================================================================= 
     * 
     *  =================================================================
    */
    _prepair() { }
    
    _update() { }

} export default Report;



/*
    _cost_subnet =>
        total bet by section (casino / sport),
        total bet by provider + total percentage by provider (user & skin)

    _commission_subnet =>
        total bet by section (casino / sport),
        total bet by provider + total percentage by provider (only skin),

        if sport: sun events and calc turnover,
        ggr & commission percentage (for all subnet)

    _cost_commission_subnet =>
        total bet by section (casino / sport),
        total bet by provider + total percentage by provider (user & skin),

        if sport: sun events and calc turnover,
        ggr & commission percentage
*/

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