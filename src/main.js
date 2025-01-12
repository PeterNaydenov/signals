function main () {
    const storage = {}
    let callID = null;

/**
 * Creates a reactive item with an initial value and optional validation function.
 * 
 * @param {any} initialValue - The initial value of the item.
 * @param {Function|boolean} [validation=false] - An optional validation function that takes a new value
 * and returns a boolean indicating if the new value is valid. Defaults to false, which means no validation.
 * 
 * @returns {Object} An object with `get` and `set` methods:
 *  - `get`: Retrieves the current value of the item.
 *  - `set`: Attempts to update the item's value. If validation is provided and fails, returns false. Otherwise, returns true.
 */
    function state ( initialValue, validation=false ) {
                const id = Symbol ( 'item' )
                storage[id] = { id, value: structuredClone ( initialValue ) , validate: validation, deps: new Set(), effects: new Set() }
// TODO: Did promises have a place here?
// TODO: What about dependency injection here or in computed and effect functions?
// TODO: Can 'notes' get benefit from signals?
                return {
                          get : () => {   
                                        if ( callID && callID.toString() === 'Symbol(effect)'   )   storage[id].effects.add ( callID )                          
                                        if ( callID && callID.toString() === 'Symbol(computed)' )   storage[id].deps.add ( callID )
                                        return storage[id].value
                                } // get func.
                        , set : ( newValue ) => {
                                    const rec = storage[id];
                                    if ( rec.validate) {
                                                if ( rec.validate && rec.validate ( newValue ) )  storage[id].value = structuredClone ( newValue )
                                                else                                              return false
                                            }
                                    else storage[id].value = structuredClone ( newValue )
                                    for ( const val of storage[id].deps ) {
                                                storage[val].dirty = true
                                        }
                                    for ( const val of storage[id].effects ) {
                                                storage[val].fn ()
                                        }
                                    return true                                            
                            } // set func.

                        // TODO: Destroy method for all elements : state, computed, effect
                    }
        } // state func.



/**
 * Creates a computed reactive item that derives its value from a given function.
 * 
 * @param {Function} fn - A function that returns a value of the computed item. 
 * @returns {Object} An object with a `get` method:
 *  - `get`: Retrieves the current value of the computed item. If the computed item is marked as dirty,
 *    it recalculates the value using the provided function.
 */
    function computed ( fn ) {
            const id = Symbol ( 'computed' );
            callID = id
            storage[id] = { id, value:fn(), fn, effects: new Set(), dirty: false }
            callID = null
            
            return { 
                    get: () => {
                                if ( callID && callID.toString() === 'Symbol(effect)'   )   storage[id].effects.add ( callID )
                                if ( !callID ) {
                                            for ( const val of storage[id].effects ) {
                                                        storage[val].fn ()
                                                }
                                    }
                                let rec = storage[id];
                                if ( rec.dirty ) rec.value = rec.fn ()
                                return rec.value 
                            }
                }
        } // computed func.

/**
 * Registers a side effect function that is executed when any of the specified 
 * signal states are updated.
 *
 * @param {Array} relations - An array of signals that this effect depends on.
 * @param {Function} fn - The side effect function to be executed when any of the signals change.
 */
    function effect ( relations, fn ) {
            const id = Symbol ( 'effect' );
            callID = id
            storage[id] = { id, fn }
            relations.forEach ( signal => signal.get() )   // Register effect in signal state
            callID = null
        } // effect func.

    return {
              state    // signal state used in computed and as trigger of effects
            , computed // defferred computation
            , effect   // immediate execution
        }
} // main func.



export default main


