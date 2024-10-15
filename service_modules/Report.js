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

        console.time('onStart');

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
        if (this.COST_SUBNET) {
            let user_providers_cost = await this._preloader.GET_USER_PROVIDERS__CRONE({ USER_LIST_ID: Object.keys(this.COST_SUBNET), RETURN_TYPE: 'GROUP_BY_USER_ID' });
            Object.entries(user_providers_cost).forEach(([userId, providers]) => {
                if (this.COST_SUBNET[userId]) {
                    this.COST_SUBNET[userId]['PROVIDERS'] = providers;
                }
            });
        }
        

        // Extract commissions
        if (this.COMMISSION_SUBNET) {
            let user_commission = await this._preloader.GET_USER_COMMISSION__CRONE({ USER_LIST_ID: Object.keys(this.COMMISSION_SUBNET), RETURN_TYPE: 'GROUP_BY_USER_ID' });
            Object.entries(user_commission).forEach(([userId, commission]) => {
                if (this.COMMISSION_SUBNET[userId]) {
                    this.COMMISSION_SUBNET[userId]['COMMISSION'] = commission;
                }
            });


            // Extract shop IDs & turnover
            const shopsIDs_commission = Object.keys(this.COMMISSION_SUBNET).filter(id => {
                return this.COMMISSION_SUBNET[id].role_type === 'shop';
            });
            if (shopsIDs_commission) {
                let shops_turnover_commission = await this._preloader.GET_USER_TURNOVER__CRONE({ USER_LIST_ID: shopsIDs_commission, RETURN_TYPE: 'GROUP_BY_USER_ID' });
                Object.entries(shops_turnover_commission).forEach(([userId, turnover]) => {
                    if (this.COMMISSION_SUBNET[userId]) {
                        this.COMMISSION_SUBNET[userId]['TURNOVER'] = turnover;
                    }
                });
            }
        }
        

        // Extract cost & commissions
        if (this.COST_COMMISSION_SUBNET) {
            // Extract master IDs & costs
            const masterIDs_cost_commission = Object.keys(this.COST_COMMISSION_SUBNET).filter(id => {
                return this.COST_COMMISSION_SUBNET[id].role_type === 'master';
            });
            if (masterIDs_cost_commission) {
                let master_providers_cost_commission = await this._preloader.GET_USER_PROVIDERS__CRONE({ USER_LIST_ID: masterIDs_cost_commission, RETURN_TYPE: 'GROUP_BY_USER_ID' });
                Object.entries(master_providers_cost_commission).forEach(([userId, providers]) => {
                    if (this.COST_COMMISSION_SUBNET[userId]) {
                        this.COST_COMMISSION_SUBNET[userId]['PROVIDERS'] = providers;
                    }
                });
            }
           


            // Extract non-master IDs & commissions
            const nonMasterIDs_cost_commission = Object.keys(this.COST_COMMISSION_SUBNET).filter(id => {
                return this.COST_COMMISSION_SUBNET[id].role_type !== 'master';
            });
            if (nonMasterIDs_cost_commission) {
                let agents_cost_commission = await this._preloader.GET_USER_COMMISSION__CRONE({ USER_LIST_ID: nonMasterIDs_cost_commission, RETURN_TYPE: 'GROUP_BY_USER_ID' });
                Object.entries(agents_cost_commission).forEach(([userId, commission]) => {
                    if (this.COST_COMMISSION_SUBNET[userId]) {
                        this.COST_COMMISSION_SUBNET[userId]['COMMISSION'] = commission;
                    }
                });
            }
            

            // Extract shop IDs & turnover
            const shopsIDs_cost_commission = Object.keys(this.COST_COMMISSION_SUBNET).filter(id => {
                return this.COST_COMMISSION_SUBNET[id].role_type === 'shop';
            });
            if (shopsIDs_cost_commission) {
                let shops_turnover_cost_commission = await this._preloader.GET_USER_TURNOVER__CRONE({ USER_LIST_ID: shopsIDs_cost_commission, RETURN_TYPE: 'GROUP_BY_USER_ID' });
                Object.entries(shops_turnover_cost_commission).forEach(([userId, turnover]) => {
                    if (this.COST_COMMISSION_SUBNET[userId]) {
                        this.COST_COMMISSION_SUBNET[userId]['TURNOVER'] = turnover;
                    }
                });
            }
        }


        console.log([this.COST_SUBNET, this.COMMISSION_SUBNET, this.COST_COMMISSION_SUBNET]);
        
        // ------------------------------
        console.log('onStart registered!');
        console.timeEnd('onStart');

        this.onFixedUpdate();
    }

    // Pre-calc & Re-calc
    async onFixedUpdate(_req) {

        /*
            parent_id: {
                currency: {
                    tot_bet,
                    tot_win,
                    tot_bet_bonus,
                    tot_win_bonus
                }
            }
            
            provider_id: {
                currency: {
                    tot_bet,
                    tot_win,
                    tot_bet_bonus,
                    tot_win_bonus
                }
            }
        */
        
        console.time('onFixedUpdate');
        
        // crea range delle date, range per commission e per costo. unire da min a max.
        let _range = { start_date: '2024-08-01', end_data: '2024-08-31' };

        // casino
        let casino_history = await this._preloader.GET_BET_HISTORY__CRONE({
            START_DATE: Math.floor(new Date(_range.start_date).getTime() / 1000),  // Converti la data in timestamp UNIX
            END_DATE: Math.floor(new Date(_range.end_data).getTime() / 1000),      // Converti la data in timestamp UNIX
            RETURN_TYPE: 'CALC_TOTAL_BET_BY_PARENT',              // Specifica il tipo di ritorno
        }); console.log(casino_history);

        let provider_history = await this._preloader.GET_BET_HISTORY__CRONE({
            START_DATE: Math.floor(new Date(_range.start_date).getTime() / 1000),  // Converti la data in timestamp UNIX
            END_DATE: Math.floor(new Date(_range.end_data).getTime() / 1000),      // Converti la data in timestamp UNIX
            RETURN_TYPE: 'CALC_TOTAL_BET_BY_PROVIDER',              // Specifica il tipo di ritorno
        }); console.log(provider_history);

        
        if (casino_history) {

            casino_history.map(shop => console.log(shop));

            const casino_history_ids = Object.keys(casino_history);
            const commission_subnet_ids = Object.keys(this.COMMISSION_SUBNET);

            const registered_casino_history = casino_history_ids.filter(id => commission_subnet_ids.includes(id));
        }
        
        

        //sport




        console.log('onFixedUpdate registered!', _range);
        console.timeEnd('onFixedUpdate');
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


/*
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            console.log('===============================================================');
            console.log('Utilizzo della memoria:');
            console.log(`RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);  // Resident Set Size
            console.log(`Heap Totale: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Heap Usato: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Memoria esterna: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);

            const cpuUsage = process.cpuUsage();
            console.log('Utilizzo della CPU:');
            console.log(`User CPU time: ${cpuUsage.user / 1000} ms`);
            console.log(`System CPU time: ${cpuUsage.system / 1000} ms`);
            console.log('===============================================================');
        }, 5000);  // Ripete ogni 5 secondi
*/