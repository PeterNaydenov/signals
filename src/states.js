function stateLib ( l ) {


/**
 * Creates a reactive item with an initial value and optional validation function.
 * 
 * @param {any} initialValue - The initial value of the item.
 * @param {Function|boolean} [validation=false] - An optional validation function that takes a new value
 * and returns a boolean indicating if the new value is valid. Defaults to false, which means no validation.
 * 
 * @returns {Object} An object with `get`, `set` and `modify` methods:
 *  - `get`: Retrieves the current value of the item.
 *  - `set`: Attempts to update the item's value. If validation is provided and fails, returns false. Otherwise, returns true.
 *  - `modify`: Accepts a function that takes the current value of the item and returns a new value. 
 *    If validation is provided and fails, returns false. Otherwise, returns true.
 */
function state ( initialValue, validation=false ) {
    const id = Symbol ( 'item' )
    l.storage[id] = { id, value: structuredClone ( initialValue ) , validate: validation, deps: new Set(), effects: new Set() }
// TODO: Did promises have a place here?
// TODO: What about dependency injection here or in computed and effect functions?
// TODO: Can 'notes' get benefit from signals?

    function set ( newValue ) {
                const rec = l.storage[id];
                if ( rec.validate) {
                            if ( rec.validate && rec.validate ( newValue ) )  l.storage[id].value = structuredClone ( newValue )
                            else                                              return false
                        }
                else l.storage[id].value = structuredClone ( newValue )
                for ( const val of l.storage[id].deps ) {
                            l.storage[val].dirty = true
                    }
                for ( const val of l.storage[id].effects ) {
                            let { fn, defaultArgs } = l.storage[val];
                            fn ( ...defaultArgs  )
                    }
                return true                                            
            } // set func.

function get () {   
                if ( l.callID && l.callID.toString() === 'Symbol(effect)'   )   l.storage[id].effects.add ( l.callID )                          
                if ( l.callID && l.callID.toString() === 'Symbol(computed)' )   l.storage[id].deps.add ( l.callID )
                return l.storage[id].value
            } // get func.

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
return state
} // stateLib func.



export default stateLib


