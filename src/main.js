import computedLib from './computed.js'
import effectLib   from './effects.js';
import stateLib    from './states.js';



/**
 * Creates the main API object for reactive items.
 * 
 * The API object contains three methods: `state`, `computed` and `effect`. 
 * 
 * `state` creates a reactive item with an initial value and optional validation.
 * `computed` creates a computed reactive item with a function that returns its value.
 * `effect` creates an effect reactive item with a function that is called immediately after any of its dependencies change.
 * 
 * The local storage is an object with two properties: `storage` and `callID`. 
 * `storage` is a map of reactive items.
 * `callID` is a unique identifier for the current call.
 */
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
              state : stateLib ( local )       // signal state used in computed and as trigger of effects
            , computed : computedLib ( local ) // defferred computation
            , effect : effectLib ( local )     // immediate execution
        }
    return API
} // main func.



export default main


