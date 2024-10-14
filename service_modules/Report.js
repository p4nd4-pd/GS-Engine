import Preloader from "./Preloader.js";
import Uploader from "./Uploader.js";

class Report {

    constructor() {}

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
        this.PROVIDERS = await this._preloader.GET_SKIN_PROVIDERS_LIST__CRONE();
        this.PROVIDERS = this.PROVIDERS.reduce((acc, provider) => {
            acc[provider.provider_id] = JSON.parse(JSON.stringify(provider));
            return acc;
        }, {});
        
        
        // estact users with commissional % and providers %
        let users = await this._preloader.GET_AGENTS_BY_PROFILE_TYPE_WITH_PARENTS();

        this.COST_SUBNET = users.cost_master_cost_subnet;
        this.COST_COMMISSION_SUBNET = users.cost_master_commission_subnet;
        this.COMMISSION_SUBNET = users.commission_master_commission_subnet;

        console.log(users);
        

        // Extract costs
        let user_providers = await this._preloader.GET_USER_PROVIDERS__CRONE({ USER_LIST_ID: Object.keys(this.COST_SUBNET), RETURN_TYPE: 'GROUP_BY_USER_ID' });
        Object.entries(user_providers).forEach(([userId, providers]) => {
            if (this.COST_SUBNET[userId]) {
                this.COST_SUBNET[userId]['PROVIDERS'] = providers;
            }
        });


        // Extract commissions
        let user_commission = await this._preloader.GET_USER_COMMISSION__CRONE({ USER_LIST_ID: Object.keys(this.COMMISSION_SUBNET), RETURN_TYPE: 'GROUP_BY_USER_ID' });
        Object.entries(user_commission).forEach(([userId, commission]) => {
            if (this.COMMISSION_SUBNET[userId]) {
                this.COMMISSION_SUBNET[userId]['COMMISSION'] = commission;
            }
        });


        // Extract master IDs & costs
        const masterIDs = Object.keys(this.COST_COMMISSION_SUBNET).filter(id => {
            return this.COST_COMMISSION_SUBNET[id].role_type === 'master';
        });
        let master_providers = await this._preloader.GET_USER_PROVIDERS__CRONE({ USER_LIST_ID: masterIDs, RETURN_TYPE: 'GROUP_BY_USER_ID' });
        Object.entries(master_providers).forEach(([userId, providers]) => {
            if (this.COST_COMMISSION_SUBNET[userId]) {
                this.COST_COMMISSION_SUBNET[userId]['PROVIDERS'] = providers;
            }
        });


        // Extract non-master IDs & commissions
        const nonMasterIDs = Object.keys(this.COST_COMMISSION_SUBNET).filter(id => {
            return this.COST_COMMISSION_SUBNET[id].role_type !== 'master';
        });
        let agents_commission = await this._preloader.GET_USER_COMMISSION__CRONE({ USER_LIST_ID: nonMasterIDs, RETURN_TYPE: 'GROUP_BY_USER_ID' });
        Object.entries(agents_commission).forEach(([userId, commission]) => {
            if (this.COST_COMMISSION_SUBNET[userId]) {
                this.COST_COMMISSION_SUBNET[userId]['COMMISSION'] = commission;
            }
        });




        // ------------------------------
        console.log('onStart registered!');
    }

    // Pre-calc & Re-calc
    onFixedUpdate(_range) {

        console.log('COST_SUBNET: ', this.COST_SUBNET, 'COMMISSION_SUBNET: ',this.COMMISSION_SUBNET, 'COST_COMMISSION_SUBNET: ',this.COST_COMMISSION_SUBNET);

        // get casino & sport transactions : group by shop : by range


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