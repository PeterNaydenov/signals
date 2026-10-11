'use strict';

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
    l.callID = id;
    l.callType = l.EFFECT_CALL;    // Stable sentinel; see main.js — dep tracking checks this by reference
    l.storage[id] = { id, fn, defaultArgs: args };
    try {
        relations.forEach ( signal => signal.get() );   // Register effect in signal state
    } finally {
        // Reset the global call markers even if a relation's `get()` throws,
        // otherwise a mid-setup exception would leak them and silently corrupt
        // every subsequent `state.get()` in this signals instance.
        l.callID = null;
        l.callType = null;
    }
} // effect func.
} // effectLib func.

/**
 * Factory that produces the `state(initialValue, validation?)` API for a
 * given shared `local` (the same `local` is passed to `effect` and
 * `computed` so all three primitives share a single dep-tracking context).
 *
 * @private
 * @param {Object} l - The shared local object from `main()`. Holds the
 *   storage map and the global call markers (`callID` / `callType`).
 * @returns {Function} The `state` constructor (see JSDoc below).
 */
function stateLib ( l ) {


/**
 * Creates a reactive item with an initial value and optional validation function.
 *
 * The `validation` function is called on the `initialValue` too — if it
 * returns `false`, the constructor throws a `TypeError` (fail fast), since a
 * state that violates its own contract is almost certainly a bug. Pass `false`
 * (the default) or omit the argument to skip validation entirely.
 *
 * @param {any} initialValue - The initial value of the item.
 * @param {Function|false} [validation=false] - An optional validation function that takes a new value
 * and returns a boolean indicating if the new value is valid. Defaults to false, which means no validation.
 *
 * @returns {Object} An object with `get`, `set` and `modify` methods:
 *  - `get`: Retrieves the current value of the item.
 *  - `set`: Attempts to update the item's value. If validation is provided and fails, returns false. Otherwise, returns true.
 *  - `modify`: Accepts a function that takes the current value of the item and returns a new value.
 *    If validation is provided and fails, returns false. Otherwise, returns true.
 */
function state ( initialValue, validation=false ) {
    // Clone first so a mutating validator can never corrupt the caller's
    // original object; the validated candidate is exactly what gets stored.
    const initialCandidate = clone ( initialValue );
    if ( validation && !validation ( initialCandidate ) ) {
                throw new TypeError ( 'signals: initial value failed validation' )
            }
    const id = Symbol ( 'item' );
    // `version` is bumped on every successful set() — computeds compare it
    // against the version they last saw to detect upstream changes.
    l.storage[id] = { id, value: initialCandidate, validate: validation, deps: new Set(), effects: new Set(), version: 0 };
// TODO: Did promises have a place here?
// TODO: What about dependency injection here or in computed and effect functions?
// TODO: Can 'notes' get benefit from signals?

    /**
     * Attempts to update the state's value. The new value is deep-cloned
     * via `structuredClone` (with a clear `TypeError` if it can't be cloned).
     * If a `validation` function is configured and it returns `false`, the
     * state is left unchanged and `set` returns `false`. On success, every
     * computed that depends on this state is marked dirty, every effect
     * that depends on this state is fired synchronously, and `set` returns
     * `true`. The check is `oldValue !== newValue`-blind: setting the same
     * value still fires dependents — by design, no deep-equality is run.
     *
     * @param {any} newValue - The new value. Must be cloneable (primitives,
     *   plain objects, arrays, etc.). Functions and Symbols are rejected.
     * @returns {boolean} `true` if the value was set, `false` if validation
     *   rejected the new value.
     */
    function set ( newValue ) {
                // Clone BEFORE validation: a validator that mutates its argument
                // must never corrupt the caller's original object, and the stored
                // value is guaranteed to be the isolated clone.
                const candidate = clone ( newValue );
                const rec = l.storage[id];
                if ( rec.validate && !rec.validate ( candidate ) )   return false
                l.storage[id].value = candidate;
                l.storage[id].version++;                  // computeds detect the change via version mismatch
                for ( const val of l.storage[id].deps ) {
                            l.storage[val].dirty = true;
                    }
                // Effects run isolated: one throwing effect must not prevent the
                // remaining effects from running (the state change itself has
                // already been committed). All collected errors are re-thrown
                // together after every effect had its chance.
                const errors = [];
                for ( const val of l.storage[id].effects ) {
                            let { fn, defaultArgs } = l.storage[val];
                            try { fn ( ...defaultArgs  ); }
                            catch ( e ) { errors.push ( e ); }
                    }
                if ( errors.length > 0 )   throw new AggregateError ( errors, 'signals: one or more effects threw during state.set()' )
                return true
            } // set func.

    /**
     * Returns the current value of the state. As a side effect, if called
     * from inside a `computed()` evaluation or an `effect()` setup, the
     * call registers this state as a dep of the caller — that's how
     * reactivity is wired.
     *
     * @returns {any} The current value.
     */
    function get () {
                if ( l.callType === l.EFFECT_CALL    )   l.storage[id].effects.add ( l.callID );
                if ( l.callType === l.COMPUTED_CALL )   l.storage[id].deps.add    ( l.callID );
                return l.storage[id].value
            } // get func.

    /**
     * Atomically updates the state's value by passing the current value to
     * `fn` and using the return value as the new value. The state is left
     * unchanged if the resulting value fails validation.
     *
     * @param {(currentValue: any) => any} fn - Transformer function.
     * @returns {boolean} `true` if the value was set, `false` if validation
     *   rejected the new value. If `fn` itself throws, the throw propagates
     *   and the state is left unchanged.
     */
    function modify ( fn ) {
                const oldValue = l.storage[id].value;
                return set ( fn ( oldValue ) )
            } // modify func.

    return {
              get
            , set
            , modify
            // TODO: Destroy method for all elements : state, computed, effect
        }
} // state func.

// Clone a value for storage. Most signal values are plain data (numbers,
// strings, arrays, plain objects) and `structuredClone` handles those. For
// values that can't be cloned (functions, Symbols, etc.) we throw a
// `TypeError` with a clear message instead of the raw `DataCloneError` so
// the call site is obvious.
/**
 * Deep-clone a state value, throwing a `TypeError` if cloning fails.
 * @private
 * @param {any} value - The value to clone.
 * @returns {any} A deep copy of `value`.
 * @throws {TypeError} If `structuredClone` cannot clone `value` (e.g. it is a
 *   function, a Symbol, or holds a non-cloneable child).
 */
function clone ( value ) {
    try { return structuredClone ( value ) }
    catch ( e ) {
        throw new TypeError ( `signals: state value cannot be cloned (${e && e.message ? e.message : e})` )
    }
}

return state
} // stateLib func.

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
                        const dep = l.storage[d];
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
 * value is memoized: `fn` runs once at construction (with the constructor's
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
           l.callID = id;
           l.callType = l.COMPUTED_CALL;    // Stable sentinel; see main.js — dep tracking checks this by reference
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
                        l.storage[id] = { id, value: undefined, fn, effects: new Set(), deps: new Set(), dependsOn: new Set(), seen: new Map(), version: 0, dirty: false, defaultArgs: args, cachedArgs: args };
                        l.storage[id].value = fn(...args);
                        // Capture the versions of everything read during construction.
                        for ( const d of l.storage[id].dependsOn ) {
                                    l.storage[id].seen.set ( d, l.storage[d].version );
                            }
            } finally {
                       // Reset the global call markers even if `fn(...args)` throws,
                       // otherwise a mid-construction exception would leak them and
                       // silently corrupt every subsequent `state.get()` in this
                       // signals instance.
                       l.callID = null;
                       l.callType = null;
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
                                if ( l.callType === l.EFFECT_CALL )     l.storage[id].effects.add ( l.callID );
                                if ( l.callType === l.COMPUTED_CALL ) {
                                            // Downstream registration: this computed becomes an
                                            // invalidation target of the node being read...
                                            l.storage[id].deps.add ( l.callID );
                                            // ...and upstream bookkeeping: the computing computed
                                            // records what it depends on for staleness checks.
                                            const caller = l.storage[l.callID];
                                            if ( caller && caller.dependsOn )   caller.dependsOn.add ( id );
                                    }
                                let rec = l.storage[id];
                                if ( args.length === 0 )   args = rec.defaultArgs;
                                const needsRecompute = isStale ( rec ) || !sameArgs ( args, rec.cachedArgs );
                                if ( needsRecompute ) {
                                            const oldValue = rec.value;
                                            // Clear the global call markers while `fn` runs: when this
                                            // read happens inside an effect setup or a computed
                                            // construction, the reads inside `fn` must not register
                                            // that outer caller directly on our upstream states.
                                            // Staleness is already propagated via `dependsOn`.
                                            const callID   = l.callID;
                                            const callType = l.callType;
                                            l.callID   = null;
                                            l.callType = null;
                                            try {
                                                        rec.value = rec.fn (...args);
                                                } finally {
                                                        l.callID   = callID;
                                                        l.callType = callType;
                                                }
                                            rec.dirty = false;
                                            rec.cachedArgs = args;
                                            // Refresh the seen-versions AFTER fn runs so any
                                            // upstream recomputes triggered inside fn are captured.
                                            for ( const d of rec.dependsOn ) {
                                                        rec.seen.set ( d, l.storage[d].version );
                                                }
                                            if ( !Object.is ( oldValue, rec.value ) ) {
                                                        rec.version++;
                                                        // Effects fire only on a top-level read (no effect/
                                                        // computed setup in progress). Each effect is
                                                        // isolated: one throwing effect must not prevent
                                                        // the others from running; errors are re-thrown
                                                        // together afterwards.
                                                        if ( !l.callID ) {
                                                                    const errors = [];
                                                                    for ( const val of rec.effects ) {
                                                                                let { fn, defaultArgs } = l.storage[val];
                                                                                try { fn ( ...defaultArgs ); }
                                                                                catch ( e ) { errors.push ( e ); }
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

/**
 *    Signals - A simple reactivity system.
 *   - Started on January 9th, 2025
 *  
 */




/**
 * Creates a new, independent signals instance. Each call returns a fresh
 * instance with its own `state` / `computed` / `effect` API and its own
 * internal `storage`; instances do not share state.
 *
 * @returns {Object} A signals API with the three primitives:
 *  - `state(initialValue, validation?)` — create a reactive cell.
 *  - `computed(fn, ...args)` — create a derived, memoized reactive value.
 *  - `effect(relations, fn, ...args)` — register a side effect on the
 *    given relations.
 * @example
 *   import signal from '@peter.naydenov/signals'
 *   const h = signal ()
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
        };
    return API
} // main func.

module.exports = main;
