function effectLib ( l ) {
/**
 * Registers a side effect function that is executed when any of the specified 
 * signal states are updated.
 *
 * @param {Array} relations - An array of signals that this effect depends on.
 * @param {Function} fn - The side effect function to be executed when any of the signals change.
 */
return function effect ( relations, fn ) {
    const id = Symbol ( 'effect' );
    l.callID = id
    l.storage[id] = { id, fn }
    relations.forEach ( signal => signal.get() )   // Register effect in signal state
    l.callID = null
} // effect func.
} // effectLib func.



export default effectLib


