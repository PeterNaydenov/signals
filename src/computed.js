function computedLib ( l ) {
/**
* Creates a computed reactive item that derives its value from a given function.
* 
* @param {Function} fn - A function that returns a value of the computed item. 
* @returns {Object} An object with a `get` method:
*  - `get`: Retrieves the current value of the computed item. If the computed item is marked as dirty,
*    it recalculates the value using the provided function.
*/
return function computed ( fn, ...args ) {
           const id = Symbol ( 'computed' );
           l.callID = id
           l.storage[id] = { id, value:fn(...args), fn, effects: new Set(), dirty: false, defaultArgs: args }
           l.callID = null
           
           return { 
                   get: ( ...args ) => {
                               if ( l.callID && l.callID.toString() === 'Symbol(effect)'   )   l.storage[id].effects.add ( l.callID )
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
}} // computed func.



export default computedLib


