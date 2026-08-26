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
 * Recursively checks whether a computed record is stale — i.e. its cached
 * value may no longer reflect its dependencies. A computed is stale when:
 *  - it is flagged dirty itself, or
 *  - an upstream dep's `version` differs from the version this computed last
 *    saw (`rec.seen`), or
 *  - an upstream computed dep is itself stale (transitive check — this is
 *    what keeps chains like state -> computed -> computed fresh even when
 *    the middle of the chain has not been read yet).
 *
 * @private
 * @param {Object} rec - A computed record from storage.
 * @returns {boolean} `true` if the record needs a recompute.
 */
function isStale ( rec ) {
            if ( rec.dirty )   return true
            for ( const d of rec.dependsOn ) {
                        const dep = l.storage[d]
                        if ( dep.version !== rec.seen.get(d) )   return true   // upstream already recomputed with a change
                        if ( dep.dependsOn && isStale ( dep ) )  return true   // upstream is a computed that is itself stale
                    }
            return false
        } // isStale func.

/**
 * Shallow comparison of two argument arrays: same length, `Object.is` for
 * every element. Used to detect when a `get()` call uses a different
 * argument set than the one the cached value was computed with.
 *
 * @private
 * @param {Array} a - First argument array.
 * @param {Array} b - Second argument array.
 * @returns {boolean} `true` if both arrays hold identical arguments.
 */
function sameArgs ( a, b ) {
            if ( a.length !== b.length )   return false
            for ( let i = 0; i < a.length; i++ ) {
                        if ( !Object.is ( a[i], b[i] ) )   return false
                    }
            return true
        } // sameArgs func.

/**
 * Creates a computed reactive item that derives its value from `fn`. The
 * value is lazy: `fn` runs once at construction (with the constructor's
 * `args`), and again on each `.get()` only after the staleness check
 * (`isStale`) detects that an upstream state/computed actually changed,
 * or when the call's arguments differ from those of the cached evaluation.
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
                        // The record must exist in storage BEFORE `fn(...args)` runs:
                        // the fn body reads upstream deps, which register this computed's
                        // `id` into their dep sets and (on pull) may look up
                        // `l.storage[id]` while unwinding staleness checks.
                        //
                        // Record fields:
                        //   deps      — downstream computeds built on top of this one
                        //   dependsOn — upstream states/computeds read during evaluation
                        //   seen      — Map of dep id → version captured at last evaluation
                        //   version   — bumped on every recompute that changes the value
                        //   cachedArgs — the argument array the current `value` was computed with
                        l.storage[id] = { id, value: undefined, fn, effects: new Set(), deps: new Set(), dependsOn: new Set(), seen: new Map(), version: 0, dirty: false, defaultArgs: args, cachedArgs: args }
                        l.storage[id].value = fn(...args)
                        // Capture the versions of everything read during construction.
                        for ( const d of l.storage[id].dependsOn ) {
                                    l.storage[id].seen.set ( d, l.storage[d].version )
                            }
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
                     * Returns the computed value, recomputing only when the
                     * staleness check (`isStale`) says an upstream dependency
                     * chain actually changed, or when this call's arguments
                     * differ from those the cached value was computed with.
                     * Side effects:
                     *  - If called from inside an `effect()` setup, this computed
                     *    is registered as a dep of that effect.
                     *  - If called from inside a `computed()` construction, this
                     *    computed is registered as a dep of that computed
                     *    (enables chained-computed invalidation).
                     *  - After a recompute where the value actually changed
                     *    (`Object.is`), this computed's `version` is bumped and
                     *    effects registered on it fire on top-level reads only.
                     *    Idle reads — a `get()` with nothing changed — never fire
                     *    effects and never re-run `fn`.
                     * @param {...any} args - Override the default args for this
                     *   call. If omitted, the constructor's `...args` is used.
                     * @returns {any} The (possibly just-recomputed) value.
                     */
                    get: ( ...args ) => {
                                if ( l.callType === l.EFFECT_CALL )     l.storage[id].effects.add ( l.callID )
                                if ( l.callType === l.COMPUTED_CALL ) {
                                            // Downstream registration: this computed becomes an
                                            // invalidation target of the node being read...
                                            l.storage[id].deps.add ( l.callID )
                                            // ...and upstream bookkeeping: the computing computed
                                            // records what it depends on for staleness checks.
                                            const caller = l.storage[l.callID]
                                            if ( caller && caller.dependsOn )   caller.dependsOn.add ( id )
                                    }
                                let rec = l.storage[id];
                                if ( args.length === 0 )   args = rec.defaultArgs
                                const needsRecompute = isStale ( rec ) || !sameArgs ( args, rec.cachedArgs )
                                if ( needsRecompute ) {
                                            const oldValue = rec.value
                                            rec.value = rec.fn (...args)
                                            rec.dirty = false
                                            rec.cachedArgs = args
                                            // Refresh the seen-versions AFTER fn runs so any
                                            // upstream recomputes triggered inside fn are captured.
                                            for ( const d of rec.dependsOn ) {
                                                        rec.seen.set ( d, l.storage[d].version )
                                                }
                                            if ( !Object.is ( oldValue, rec.value ) ) {
                                                        rec.version++
                                                        // Effects fire only on a top-level read (no effect/
                                                        // computed setup in progress). Each effect is
                                                        // isolated: one throwing effect must not prevent
                                                        // the others from running; errors are re-thrown
                                                        // together afterwards.
                                                        if ( !l.callID ) {
                                                                    const errors = []
                                                                    for ( const val of rec.effects ) {
                                                                                let { fn, defaultArgs } = l.storage[val]
                                                                                try { fn ( ...defaultArgs ) }
                                                                                catch ( e ) { errors.push ( e ) }
                                                                            }
                                                                    if ( errors.length > 0 )   throw new AggregateError ( errors, 'signals: one or more effects threw during computed.get()' )
                                                                }
                                                    }
                                    }
                                return rec.value
                            }
                }
} // computed func.
} // computedLib func.




export default computedLib
