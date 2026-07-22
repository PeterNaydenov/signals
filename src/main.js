/**
 *    Signals - A simple reactivity system.
 *   - Started on January 9th, 2025
 *  
 */
import effectLib   from './effects.js';
import stateLib    from './states.js';
import computedLib from './computed.js'




/**
 * Creates a new, independent signals instance. Each call returns a fresh
 * instance with its own `state` / `computed` / `effect` API and its own
 * internal `storage`; instances do not share state.
 *
 * @returns {Object} A signals API with the three primitives:
 *  - `state(initialValue, validation?)` — create a reactive cell.
 *  - `computed(fn, ...args)` — create a derived, lazy reactive value.
 *  - `effect(relations, fn, ...args)` — register a side effect on the
 *    given relations.
 * @example
 *   const signals = require ( '@peter.naydenov/signals' )
 *   const h = signals ()
 *   const count = h.state ( 0 )
 *   h.effect ( [count], () => console.log ( 'count changed' ) )
 *   count.set ( 1 )     // -> "count changed"
 */
function main () {
    /**
     * A local storage for reactive items.
     *
     * `callID` and `callType` together identify what kind of call is in
     * progress (if any). `callID` is the symbol id of the effect/computed
     * being evaluated; `callType` is a stable sentinel (one of
     * `EFFECT_CALL` / `COMPUTED_CALL`) so dep tracking does not depend on
     * the description of a `Symbol` (which would break if anyone ever
     * renamed the `Symbol('effect')` / `Symbol('computed')` literals).
     *
     * @type {Object}
     * @property {Object}  storage - A map of reactive items.
     * @property {null|Symbol} callID - A unique identifier for the current call.
     * @property {null|Symbol} callType - Stable sentinel identifying the call kind.
     * @property {Symbol} EFFECT_CALL - Sentinel set while an effect is being registered.
     * @property {Symbol} COMPUTED_CALL - Sentinel set while a computed is being registered.
     */
    const local = {
                storage      : {}
            ,   callID       : null
            ,   callType     : null
            ,   EFFECT_CALL    : Symbol ( 'signals-effect-call' )
            ,   COMPUTED_CALL : Symbol ( 'signals-computed-call' )
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


