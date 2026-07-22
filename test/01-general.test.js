import signals from '../src/main.js'
import { expect } from 'chai'


describe ( 'Signals', () => {

    it ( 'Create a signal state', () => {
                    const h = signals ();
                    const signal = h.state ( 0 )
                    expect ( signal.get () ).to.be.equal ( 0 )
                    signal.set ( 1 )
                    expect ( signal.get () ).to.be.equal ( 1 )
        }) // it Create a simple signal



    it ( 'Create a computed signal', () => {
                    const h = signals ();
                    const 
                          simple = h.state ( 2 )
                        , computed = h.computed ( () => simple.get () + 10 )
                        ;
                    
                    expect ( computed.get () ).to.be.equal ( 12 )
                    simple.set ( 4 )
                    expect ( computed.get () ).to.be.equal ( 14 )
        }) // it Create a computed signal



    it ( 'Create a computed signal with arguments', () => {
                    const h = signals ();
                    const 
                          simple = h.state ( 2 )
                          // Provide an argument to computed. Set default value if not provided
                        , computed = h.computed ( x => simple.get () + 10 + x,  0 )
                        ;
                    // simple == 2, then computed = 2+10+0 = 12
                    expect ( computed.get () ).to.be.equal ( 12 )
                    simple.set ( 4 )
                    // simple == 4, then computed = 4+10+0 = 14
                    expect ( computed.get () ).to.be.equal ( 14 )
                    simple.set ( 5 )
                    // Call the computed value with arguments
                    // simple == 5, argument == 2 then computed = 5+10+2 = 17
                    expect ( computed.get (2) ).to.be.equal ( 17 )
        }) // it Create a computed signal with arguments



    it ( 'Create a signal state with validation', () => {
                    const h = signals ();
                    const simple = h.state ( 2 , d => d > 0 );
                    simple.set ( 12 )
                    expect ( simple.get () ).to.be.equal ( 12 )
                    simple.set ( -10 )
                    expect ( simple.get () ).to.be.equal ( 12 )
                    simple.set ( 0 )
                    expect ( simple.get () ).to.be.equal ( 12 )
        }) // it Create a signal with validation



     it ( 'Callback on signal state change', () => {
                    const h = signals ();
                    let called = false;
                    let result = 0
                    const simple = h.state ( 2 );

                    h.effect ( [simple], () => {
                                        called = true
                                        result = 25
                                });
                    
                    simple.set ( 12 )
                    expect ( called ).to.be.true
                    expect ( result ).to.be.equal ( 25 )
     }) // it Callback on signal state change



     it ( 'Callback on computed state change', () => {
                    const h = signals ();
                    let called = false;
                    let result = 0
                    const simple = h.state ( 2 )
                        , computed = h.computed ( ( x ) => { 
                                                    expect ( x ).to.be.equal ( 'comps' )
                                                    return simple.get () + 10
                                                }, 'comps' ) 
                        ;

                    h.effect ( [computed], ( x ) => {
                                        expect ( x ).to.be.equal ( 'extra' )
                                        called = true
                                        result = 25
                                }, 'extra' );
                    // Change of signal state will not change nothing if effect is attached to computed value
                    simple.set ( 12 ) 
                    expect ( called ).to.be.false
                    expect ( result ).to.be.equal ( 0 )
                    // Computed state change only on call. Lazy evaluation ->
                    computed.get ()
                    expect ( called ).to.be.true
                    expect ( result ).to.be.equal ( 25 )
     }) // it Callback on signal state change



    it ( 'Effect on state change with arguments', () => {
                    const h = signals ();
                    let 
                          one = h.state ( 2 )
                        , count = 0
                        ;
                    h.effect ( [ one ], (x) => {
                                expect ( x ).to.be.equal ( 'extra' )
                                count++
                        }, 'extra')

                    one.set ( 4 )
                    expect ( count ).to.be.equal ( 1 )
            }) // it Effect on state change



    it ( 'Effect on state change with arguments', () => {
                    const h = signals ();
                    let 
                          one = h.state ( 2 )
                        , count = 0
                        , computed = h.computed ( ( x ) => {
                                                // First execution of computed will use default argument - 'hello'
                                                if ( count == 0 )   expect ( x ).to.be.equal ( 'hello'  )
                                                // Second call of computed will use argument - 'mine'
                                                if ( count == 1 )   expect ( x ).to.be.equal ( 'mine' )
                                                // On call with no arguments - expect 'hello' as a default argument
                                                return one.get () + 10
                                            }, 'hello' )
                        ;

                    // Effect always is using the default argument. No option to change it 
                    // because of the automatated execution
                    h.effect ( [ computed ], (x) => {
                                expect ( x ).to.be.equal ( 'extra' )
                                count++
                        }, 'extra' )

                    one.set ( 4 )
                    one.get () 

                    computed.get ( 'mine' )
                    expect ( count ).to.be.equal ( 1 )
            }) // it Effect on state change



     it ( 'Relation among signal states, computed and effects', () => {
                    const sign = signals ();
                    let 
                          counter = 0
                        , counter2 = 0
                        , counter_extra = 0
                        ;
                    
                    const
                          a = sign.state ( 0 )
                        , b = sign.state ( 0 )
                        , c = sign.computed ( () => a.get () + 10 ) // computed based only on 'a' 
                        , d = sign.computed ( () => {   // computed based only on 'b'
                                                    counter_extra++
                                                    return  b.get () + a.get() + 20 
                                                }) 
                        , e = sign.computed ( () => a.get () + b.get () ) // computed based on 'a' and 'b'
                        , eff = sign.effect ( [a], () => counter++ )
                        , effBoth = sign.effect ( [a, b], () => counter2++ )
                        ;

                    expect ( c.get() ).to.be.equal ( 10 )
                    expect ( e.get () ).to.be.equal ( 0 )

                    a.set ( 12 )
                    a.set ( 10 )

                    b.set ( 30 )
                    expect ( c.get() ).to.be.equal ( 20 )
                    expect ( e.get () ).to.be.equal ( 40 )
                    
                    // Effect is executed immediately after signal state change
                    expect ( counter ).to.be.equal ( 2 ) // because 'a' changed 2 times
                    expect ( counter2 ).to.be.equal ( 3 ) // because 'a' was changed 2 times and 'b' 1 time

                    // Computed 'd' was called once during initialization
                    expect ( counter_extra ).to.be.equal ( 1 )
                    // Computed signals are evaluated on only on call. Lazy evaluation
                    d.get ()
                    expect ( counter_extra ).to.be.equal ( 2 )
     }) // it Relation among signal states, computed and effects


     it ( 'Signal state change with modify', () => {
                    const sign = signals ();
                    const myState = sign.state ( 0 );
                    // Difference between set and modify is that modify argument is a function
                    // that receives the current value and returns the new value
                    // Sometimes from DE(development experience) is easier when you have a previous value available

                    myState.modify ( value => value + 10 )
                    expect ( myState.get () ).to.be.equal ( 10 )
                    myState.modify ( value => value + 10 )
                    expect ( myState.get () ).to.be.equal ( 20 )
        }) // it Signal state change with modify




// ============================================================================
// Regression: `state(initialValue, validation)` used to store `initialValue`
// as-is without calling the validator. A state created with
// `state(-1, v => v >= 0)` would happily hold `-1`, even though the user
// clearly intended a non-negative value. The validator is now called on
// the initial value too; on failure the constructor throws a `TypeError`
// (fail fast) so the bug surfaces at the call site, not later at a
// distant `set`/`get`.
// ============================================================================

describe ( 'State initial-value validation', () => {

    it ( 'throws TypeError when initial value fails validation', () => {
                    const sign = signals ()
                    expect ( () => sign.state ( -1, v => v >= 0 ) ).to.throw ( TypeError, /initial value failed validation/ )
        })


    it ( 'does not throw when initial value passes validation', () => {
                    const sign = signals ()
                    expect ( () => sign.state ( 5, v => v >= 0 ) ).to.not.throw ()
        })


    it ( 'does not throw when no validation is provided', () => {
                    const sign = signals ()
                    // even with a "bad" value, no validation means no check
                    expect ( () => sign.state ( -1 ) ).to.not.throw ()
                    expect ( () => sign.state ( null ) ).to.not.throw ()
                    expect ( () => sign.state ( undefined ) ).to.not.throw ()
        })


    it ( 'subsequent set() still respects the validator (regression check)', () => {
                    const sign = signals ()
                    const s = sign.state ( 2, v => v > 0 )
                    s.set ( 10 )
                    expect ( s.get () ).to.be.equal ( 10 )
                    const ok = s.set ( -5 )
                    expect ( ok ).to.be.equal ( false )
                    expect ( s.get () ).to.be.equal ( 10 )   // unchanged
        })

}) // describe state initial-value validation




// ============================================================================
// Regression: dep tracking used to compare `Symbol('effect')` / `Symbol('computed')`
// by `.toString()`, which silently broke if anyone ever renamed the symbol
// description. Now the libs set a stable sentinel (`local.EFFECT_CALL` /
// `local.COMPUTED_CALL`) and `get()` compares by reference. The end-to-end
// behavior is identical for valid code, but the tracking is no longer
// fragile to refactors.
// ============================================================================

describe ( 'Dependency tracking is robust to refactors', () => {

    it ( 'effect fires when a state it depends on changes', () => {
                    const sign = signals ()
                    const s  = sign.state ( 0 )
                    let count = 0
                    sign.effect ( [s], () => count++ )
                    s.set ( 1 )
                    s.set ( 2 )
                    expect ( count ).to.be.equal ( 2 )
        })


    it ( 'computed re-evaluates after a dep change', () => {
                    const sign = signals ()
                    const a = sign.state ( 2 )
                    const b = sign.computed ( () => a.get () * 10 )
                    expect ( b.get () ).to.be.equal ( 20 )
                    a.set ( 5 )
                    expect ( b.get () ).to.be.equal ( 50 )
        })


    it ( 'effect on a computed re-runs when the computed is read after a dep change', () => {
                    const sign = signals ()
                    const a = sign.state ( 0 )
                    const b = sign.computed ( () => a.get () + 1 )
                    let calls = 0
                    sign.effect ( [b], () => { calls++ } )
                    a.set ( 10 )                 // marks b dirty; effect on b does NOT fire yet
                    b.get ()                      // explicit read outside any effect → fires the registered effect
                    expect ( calls ).to.be.equal ( 1 )
        })


    it ( 'effect only fires on the state it was declared for (not a state read inside the body)', () => {
                    // Documents the existing dep-tracking rule: relations are what
                    // gets registered at setup time. Reading another state inside the
                    // effect body does not add it as a dep. If you want to react to
                    // B too, declare it: effect([a, b], ...).
                    const sign = signals ()
                    const a = sign.state ( 0 )
                    const b = sign.state ( 0 )
                    let count = 0
                    sign.effect ( [a], () => { b.get(); count++ } )
                    b.set ( 1 )    // does not fire — b is not a declared dep
                    expect ( count ).to.be.equal ( 0 )
                    a.set ( 1 )    // does fire — a is the declared dep
                    expect ( count ).to.be.equal ( 1 )
        })

}) // describe dependency tracking is robust to refactors




// ============================================================================
// Regression: `set()` on a non-cloneable value (function, Symbol) used to throw
// a raw `DataCloneError` from `structuredClone`. Now wrapped in a `TypeError`
// with a clearer message, so the call site is obvious.
// ============================================================================

describe ( 'set() on non-cloneable values', () => {

    it ( 'throws a clear TypeError when set with a function', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    expect ( () => s.set ( () => 42 ) ).to.throw ( TypeError, /cannot be cloned/ )
        })


    it ( 'throws a clear TypeError when set with a Symbol', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    expect ( () => s.set ( Symbol ( 'x' ) ) ).to.throw ( TypeError, /cannot be cloned/ )
        })


    it ( 'accepts cloneable values without changing the message', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    s.set ( 5 )
                    expect ( s.get () ).to.be.equal ( 5 )
                    s.set ( { a: 1, b: [2, 3] } )
                    expect ( s.get () ).to.deep.equal ( { a: 1, b: [2, 3] } )
                    s.set ( null )
                    expect ( s.get () ).to.be.equal ( null )
                    s.set ( undefined )
                    expect ( s.get () ).to.be.equal ( undefined )
        })

}) // describe set on non-cloneable values




// ============================================================================
// Regression: if a relation's `get()` threw during `effect()` setup, the
// `l.callID` / `l.callType` global markers would leak and silently corrupt
// every subsequent `state.get()` in this signals instance. Same risk in
// `computed()` if the initial `fn(...args)` call threw. Both now wrap the
// setup in try/finally and reset the markers on the way out.
// ============================================================================

describe ( 'Setup-time exceptions do not leak global state', () => {

    it ( 'effect(): a relation that lacks `get` does not leave the signals instance in a broken state', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    // 'relations' is intentionally bad — a plain object, not a state.
                    // The first `signal.get()` call would have thrown, leaking the
                    // global call markers. The fix wraps the setup in try/finally.
                    expect ( () => sign.effect ( [ {} ], () => {} ) ).to.throw ()
                    // After the throw, a fresh effect on a real state must still work.
                    let count = 0
                    sign.effect ( [s], () => count++ )
                    s.set ( 1 )
                    expect ( count ).to.be.equal ( 1 )
        })


    it ( 'computed(): a throwing initial fn does not leave the signals instance in a broken state', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    // The initial `fn(...args)` call throws.
                    expect ( () => sign.computed ( () => { throw new Error ( 'boom' ) } ) ).to.throw ( /boom/ )
                    // After the throw, a fresh computed on a real state must still work.
                    const c = sign.computed ( () => s.get () * 2 )
                    s.set ( 5 )
                    expect ( c.get () ).to.be.equal ( 10 )
        })


    it ( 'after a setup-time throw, dep tracking still works for normal flows', () => {
                    // The original bug: after a mid-setup throw, `l.callID` and
                    // `l.callType` were left set to a stale Symbol + sentinel. Any
                    // subsequent `state.get()` in any context would then register
                    // its id as a dep of that effect. The fix resets both to null
                    // even when the setup throws.
                    const sign = signals ()
                    const a = sign.state ( 1 )
                    const b = sign.state ( 10 )
                    let aFired = 0, bFired = 0
                    sign.effect ( [a], () => aFired++ )   // good effect, registers on a
                    sign.effect ( [b], () => bFired++ )   // good effect, registers on b
                    // Now corrupt: a setup that throws
                    expect ( () => sign.effect ( [ {} ], () => {} ) ).to.throw ()
                    // After the throw, only the legitimate effects fire
                    a.set ( 2 )
                    b.set ( 20 )
                    expect ( aFired ).to.be.equal ( 1 )
                    expect ( bFired ).to.be.equal ( 1 )
        })

}) // describe setup-time exceptions do not leak global state



}) // describe