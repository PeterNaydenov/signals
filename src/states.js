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
    if ( validation && !validation ( initialValue ) ) {
                throw new TypeError ( 'signals: initial value failed validation' )
            }
    const id = Symbol ( 'item' )
    l.storage[id] = { id, value: clone ( initialValue ) , validate: validation, deps: new Set(), effects: new Set() }
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
                const rec = l.storage[id];
                if ( rec.validate) {
                            if ( rec.validate && rec.validate ( newValue ) )  l.storage[id].value = clone ( newValue )
                            else                                              return false
                        }
                else l.storage[id].value = clone ( newValue )
                for ( const val of l.storage[id].deps ) {
                            l.storage[val].dirty = true
                    }
                for ( const val of l.storage[id].effects ) {
                            let { fn, defaultArgs } = l.storage[val];
                            fn ( ...defaultArgs  )
                    }
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
                if ( l.callType === l.EFFECT_CALL    )   l.storage[id].effects.add ( l.callID )
                if ( l.callType === l.COMPUTED_CALL )   l.storage[id].deps.add    ( l.callID )
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




export default stateLib
