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
    function item ( initialValue, validation=false ) {
                const id = Symbol ( 'item' )
                storage[id] = { id, value: initialValue, validate: validation, deps: new Set() }

                return {
                          get : () => {                             
                                        if ( callID && callID !== id )   storage[id].deps.add ( callID )
                                        return storage[id].value
                                } // get func.
                        , set : ( newValue ) => {
                                    const rec = storage[id];
                                    if ( rec.validate) {
                                                if ( rec.validate && rec.validate ( newValue ) )  storage[id].value = newValue
                                                else                                              return false
                                            }
                                    else storage[id].value = newValue
                                    for ( const val of storage[id].deps ) {
                                                storage[val].dirty = true
                                        }
                                    return true                                            
                            } // set func.
                    }
        } // item func.



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
            storage[id] = { id, value:fn(), fn, dirty: false }
            callID = null
            
            return { 
                    get: () => {
                                let rec = storage[id];
                                if ( rec.dirty ) rec.value = rec.fn ()
                                return rec.value 
                            }
                }
        } // computed func.

    return {
              item
            , computed
        }
} // main func.



export default main


