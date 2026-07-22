/**
 * Factory that produces the `effect(relations, fn, ...args)` API for a
 * given shared `local`.
 *
 * @private
 * @param {Object} l - The shared local object from `main()`. Holds the
 *   storage map and the global call markers.
 * @returns {Function} The `effect` constructor (see JSDoc below).
 */
function effectLib ( l ) {
/**
 * Registers a side effect that fires synchronously every time any of the
 * specified signal states (or computeds) is `set`. The effect body is NOT
 * called during setup — only on subsequent `set` calls on the relations.
 *
 * @param {Array} relations - Signals this effect depends on. Each one
 *   must expose a `.get()` method (states, computeds, anything that
 *   follows the signals convention). Anything read inside `fn` that is not
 *   in `relations` will NOT trigger the effect.
 * @param {Function} fn - The side effect body. Called with `...args` as
 *   arguments, where `args` is the rest passed to `effect`.
 * @param {...any} args - Default arguments passed to every `fn` invocation.
 *   Cannot be changed at fire time.
 * @returns {void}
 * @example
 *   const count = h.state ( 0 )
 *   h.effect ( [count], ( label ) => console.log ( `${label}: ${count.get ()}` ), 'tick' )
 *   count.set ( 1 )   // -> "tick: 1"
 */
return function effect ( relations, fn, ...args ) {
    const id = Symbol ( 'effect' );
    l.callID = id
    l.callType = l.EFFECT_CALL    // Stable sentinel; see main.js — dep tracking checks this by reference
    l.storage[id] = { id, fn, defaultArgs: args }
    try {
        relations.forEach ( signal => signal.get() )   // Register effect in signal state
    } finally {
        // Reset the global call markers even if a relation's `get()` throws,
        // otherwise a mid-setup exception would leak them and silently corrupt
        // every subsequent `state.get()` in this signals instance.
        l.callID = null
        l.callType = null
    }
} // effect func.
} // effectLib func.




export default effectLib
