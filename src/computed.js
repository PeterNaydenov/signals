/**
 * Factory that produces the `computed(fn, ...args)` API for a given shared
 * `local`.
 *
 * @private
 * @param {Object} l - The shared local object from `main()`. Holds the
 *   storage map and the global call markers.
 * @returns {Function} The `computed` constructor (see JSDoc below).
 */
function computedLib ( l ) {
/**
 * Creates a computed reactive item that derives its value from `fn`. The
 * value is lazy: `fn` runs once at construction (with the constructor's
 * `args`), and again on each `.get()` only after a dep has been marked
 * dirty.
 *
 * If `fn` throws at construction time, the throw propagates and no
 * computed is registered (the global call markers are still reset; see
 * `states.js` for the matching fix on the `state` side).
 *
 * @param {Function} fn - A function that returns the computed value. Will
 *   be re-invoked when any dep is marked dirty.
 * @param {...any} args - Default arguments. Used when `.get()` is called
 *   with no arguments; otherwise `.get()`'s arguments are forwarded to
 *   `fn`. This makes the computed both memoized-by-deps (no args) and
 *   parameterized (with args).
 * @returns {Object} A computed object with a single `get` method.
 * @example
 *   const a = h.state ( 2 )
 *   const double = h.computed ( x => a.get () * 2, 0 )
 *   double.get ()       // -> 4   (default args = [0], fn(0) returns 4)
 *   double.get ( 10 )   // -> 20  (override args, fn(10) returns 20)
 */
return function computed ( fn, ...args ) {
           const id = Symbol ( 'computed' );
           l.callID = id
           l.callType = l.COMPUTED_CALL    // Stable sentinel; see main.js — dep tracking checks this by reference
           try {
                       l.storage[id] = { id, value:fn(...args), fn, effects: new Set(), dirty: false, defaultArgs: args }
           } finally {
                       // Reset the global call markers even if `fn(...args)` throws,
                       // otherwise a mid-construction exception would leak them and
                       // silently corrupt every subsequent `state.get()` in this
                       // signals instance.
                       l.callID = null
                       l.callType = null
           }

           return {
                   /**
                    * Returns the computed value, recomputing if any dep is
                    * dirty. Side effects:
                    *  - If called from inside an `effect()` setup, this computed
                    *    is registered as a dep of that effect.
                    *  - If called from a non-effect context (callType is null),
                    *    every effect registered on this computed is fired
                    *    synchronously — this is the lazy-evaluation contract.
                    * @param {...any} args - Override the default args for this
                    *   call. If omitted, the constructor's `...args` is used.
                    * @returns {any} The (possibly just-recomputed) value.
                    */
                   get: ( ...args ) => {
                               if ( l.callType === l.EFFECT_CALL )   l.storage[id].effects.add ( l.callID )
                               if ( !l.callID ) {
                                           for ( const val of l.storage[id].effects ) {
                                                       let { fn, defaultArgs } = l.storage[val]
                                                       fn ( ...defaultArgs )
                                               }
                                   }
                               let rec = l.storage[id];
                               if ( args.length === 0 )   args = rec.defaultArgs
                               if ( rec.dirty ) rec.value = rec.fn (...args)
                               return rec.value
                           }
               }
} // computed func.
} // computedLib func.




export default computedLib
