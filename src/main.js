/**
 *    Signals - A simple reactivity system.
 *   - Started on January 9th, 2025
 *  
 */
import effectLib   from './effects.js';
import stateLib    from './states.js';
import computedLib from './computed.js'




function main () {
    /**
     * A local storage for reactive items.
     * 
     * @type {Object} 
     * @property {Object} storage - A map of reactive items.
     * @property {null|Symbol} callID - A unique identifier for the current call.
     */
    const local = {
                storage : {},
                callID : null
            };

    /**
     * Creates the main API object.
     * 
     * @returns {Object} An object with `state`, `computed` and `effect` methods.
     * 
     * @property {function} state - Creates a reactive item with an initial value and optional validation.
     * @property {function} computed - Creates a computed reactive item with a function that returns its value.
     * @property {function} effect - Creates an effect reactive item with a function that is called immediately after any of its dependencies change.
     */
    const API =  {
              state    : stateLib ( local )      // signal state used in computed and as trigger of effects
            , computed : computedLib ( local )   // defferred computation
            , effect   : effectLib ( local )     // immediate execution
        }
    return API
} // main func.



export default main


