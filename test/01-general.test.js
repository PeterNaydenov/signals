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



    it ( 'Effect on computed change with arguments', () => {
                    const h = signals ();
                    let 
                          one = h.state ( 2 )
                        , count = 0
                        , fnCalls = 0
                        , computed = h.computed ( ( x ) => {
                                                // First execution of computed will use default argument - 'hello'
                                                if ( fnCalls == 0 )   expect ( x ).to.be.equal ( 'hello'  )
                                                // Second call of computed will use argument - 'mine'
                                                if ( fnCalls == 1 )   expect ( x ).to.be.equal ( 'mine' )
                                                // Re-evaluation runs before the effect fires, so both
                                                // executions above happen while the effect counter is still 0
                                                fnCalls++
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
                    expect ( fnCalls ).to.be.equal ( 2 )
                    // Effect fired once - the recomputed value (14) differs from the previous one (12)
                    expect ( count ).to.be.equal ( 1 )
                    // Idle reads do not fire the effect anymore
                    computed.get ()
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



// ============================================================================
// Regression: `computed.get()` used to re-run `fn` on *every* call after the
// first dep change, because the dirty flag was never reset to `false` after
// a recompute. Memoization was effectively broken: one state change turned
// the computed into an uncached function forever. Now `dirty` is cleared
// right after the value is recomputed, so `fn` runs only when a dep has
// actually changed since the last read.
// ============================================================================

describe ( 'Computed memoization survives dependency changes', () => {

    it ( 'does not re-evaluate fn on repeated get() calls after a dep change', () => {
                    const sign = signals ()
                    const s = sign.state ( 2 )
                    let calls = 0
                    const c = sign.computed ( () => { calls++; return s.get () * 10 } )

                    expect ( c.get () ).to.be.equal ( 20 )   // construction + first read
                    // Note: fn ran once at construction; this read is cached.
                    const callsAfterSetup = calls
                    expect ( callsAfterSetup ).to.be.equal ( 1 )

                    s.set ( 5 )                              // marks c dirty, but does not run fn
                    expect ( calls ).to.be.equal ( 1 )

                    expect ( c.get () ).to.be.equal ( 50 )   // dirty → recompute once
                    expect ( calls ).to.be.equal ( 2 )

                    expect ( c.get () ).to.be.equal ( 50 )   // clean → cached
                    expect ( c.get () ).to.be.equal ( 50 )   // still cached
                    expect ( calls ).to.be.equal ( 2 )
        })


    it ( 'recomputes again after each new dep change (dirty flag cycles)', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    let calls = 0
                    const c = sign.computed ( () => { calls++; return s.get () + 1 } )
                    c.get ()
                    s.set ( 10 )
                    expect ( c.get () ).to.be.equal ( 11 )
                    expect ( calls ).to.be.equal ( 2 )
                    s.set ( 20 )
                    expect ( c.get () ).to.be.equal ( 21 )
                    expect ( calls ).to.be.equal ( 3 )
        })

}) // describe computed memoization



// ============================================================================
// Regression: effects on a computed used to fire on EVERY top-level read,
// changed or not — the firing loop ran unconditionally whenever `!l.callID`,
// with no dirty check and no value comparison. After a single dep change,
// idle reads kept re-running effects forever. Now:
//   1. Effects fire only when the read actually recomputed (dirty).
//   2. Even then, they fire only if the new value differs from the previous
//      one (compared with `Object.is`), as documented in the README.
// ============================================================================

describe ( 'Effects on computed fire only on real changes', () => {

    it ( 'does not fire effects on repeated idle reads', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    const c = sign.computed ( () => s.get () + 1 )
                    let fired = 0
                    sign.effect ( [c], () => fired++ )

                    s.set ( 10 )                 // marks c dirty; effect does not fire yet
                    expect ( fired ).to.be.equal ( 0 )
                    c.get ()                     // recompute: 1 -> 11, value changed → fires
                    expect ( fired ).to.be.equal ( 1 )

                    c.get ()                     // clean → cached, no recompute, no fire
                    c.get ()
                    c.get ()
                    expect ( fired ).to.be.equal ( 1 )
        })


    it ( 'does not fire effects when the recomputed value is identical (Object.is)', () => {
                    const sign = signals ()
                    const s = sign.state ( 4 )
                    const parity = sign.computed ( () => s.get () % 2 )   // 4 -> 0
                    let fired = 0
                    sign.effect ( [parity], () => fired++ )

                    s.set ( 6 )                  // state changed 4 -> 6, but 6 % 2 === 0 % 2
                    parity.get ()                // recompute produced the same value
                    expect ( fired ).to.be.equal ( 0 )
                    expect ( parity.get () ).to.be.equal ( 0 )

                    s.set ( 7 )                  // now the computed value really changes
                    parity.get ()
                    expect ( fired ).to.be.equal ( 1 )
        })


    it ( 'fires once per real change across multiple change/read cycles', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    const c = sign.computed ( () => s.get () * 2 )
                    let fired = 0
                    sign.effect ( [c], () => fired++ )

                    s.set ( 5 ); c.get (); expect ( fired ).to.be.equal ( 1 )
                    c.get ();    expect ( fired ).to.be.equal ( 1 )   // idle read
                    s.set ( 7 ); c.get (); expect ( fired ).to.be.equal ( 2 )
                    s.set ( 9 ); c.get (); expect ( fired ).to.be.equal ( 3 )
        })

}) // describe effects on computed fire only on real changes



// ============================================================================
// Regression: computed states used to be invisible to other computeds.
// Only `state.get()` registered deps under COMPUTED_CALL, so a chain like
// state -> computed -> computed never wired up, and downstream computeds
// served stale cached values forever after an upstream change. Now:
//   1. A `computed.get()` read from inside another computed's construction
//      registers as a dep of that computed.
//   2. `get()` also pulls: if any upstream computed is still marked dirty,
//      the value is recomputed even when this one isn't flagged itself.
// ============================================================================

describe ( 'Chained computeds stay fresh', () => {

    it ( 'recomputes a two-level chain after an upstream state change', () => {
                    const sign = signals ()
                    const s = sign.state ( 2 )
                    const b = sign.computed ( () => s.get () * 10 )
                    const c = sign.computed ( () => b.get () + 1 )

                    expect ( b.get () ).to.be.equal ( 20 )
                    expect ( c.get () ).to.be.equal ( 21 )

                    s.set ( 5 )                  // marks b dirty; c was never marked...
                    expect ( b.get () ).to.be.equal ( 50 )
                    expect ( c.get () ).to.be.equal ( 51 )   // ...but pulls through b

                    // Also works when c is read first, without touching b explicitly
                    s.set ( 7 )
                    expect ( c.get () ).to.be.equal ( 71 )
        })


    it ( 'keeps three-level chains fresh', () => {
                    const sign = signals ()
                    const s = sign.state ( 1 )
                    const a = sign.computed ( () => s.get () + 1 )
                    const b = sign.computed ( () => a.get () * 2 )
                    const c = sign.computed ( () => b.get () - 3 )

                    expect ( c.get () ).to.be.equal ( 1 )    // ((1+1)*2)-3
                    s.set ( 10 )
                    expect ( c.get () ).to.be.equal ( 19 )   // ((10+1)*2)-3
        })


    it ( 'stays cached when an upstream change does not alter the chain value', () => {
                    const sign = signals ()
                    const s = sign.state ( 4 )
                    let bCalls = 0, cCalls = 0
                    const b = sign.computed ( () => { bCalls++; return s.get () % 2 } )   // 4 -> 0
                    const c = sign.computed ( () => { cCalls++; return b.get () * 100 } )

                    expect ( c.get () ).to.be.equal ( 0 )
                    expect ( cCalls ).to.be.equal ( 1 )

                    s.set ( 6 )                  // changes s, but 6 % 2 === 0 % 2 === 0
                    expect ( c.get () ).to.be.equal ( 0 )
                    expect ( cCalls ).to.be.equal ( 2 )   // pulled once, but value identical → still memoized result
                    s.set ( 7 )                  // now parity flips
                    expect ( c.get () ).to.be.equal ( 100 )
                    expect ( cCalls ).to.be.equal ( 3 )
        })


    it ( 'effects attached to a downstream computed fire on real upstream changes', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    const mid = sign.computed ( () => s.get () + 1 )
                    const out = sign.computed ( () => mid.get () * 2 )
                    let fired = 0
                    sign.effect ( [out], () => fired++ )

                    s.set ( 5 )                  // 6*2=12 vs old 2 → real change
                    out.get ()
                    expect ( fired ).to.be.equal ( 1 )

                    out.get ()                   // idle read
                    expect ( fired ).to.be.equal ( 1 )
        })

}) // describe chained computeds stay fresh



// ============================================================================
// Regression: the computed cache used to be a single value slot that ignored
// arguments. After `c.get(5)` overwrote the cache, a later arg-less `c.get()`
// served the result computed for 5 instead of recomputing with the default
// args. Now each cached value remembers the argument set it was computed
// with (`cachedArgs`), and a call with a different argument set recomputes.
// ============================================================================

describe ( 'Computed memoization respects arguments', () => {

    it ( 'returns correct values when call styles are interleaved', () => {
                    const sign = signals ()
                    const s = sign.state ( 10 )
                    let calls = 0
                    const c = sign.computed ( x => { calls++; return s.get () + x }, 0 )

                    expect ( c.get ()   ).to.be.equal ( 10 )   // fn(0)
                    expect ( c.get ( 5 )).to.be.equal ( 15 )   // different args → recompute, fn(5)
                    expect ( c.get ()   ).to.be.equal ( 10 )   // back to defaults → recompute, fn(0)
                    expect ( c.get ( 5 )).to.be.equal ( 15 )   // and again
                    expect ( calls      ).to.be.equal ( 4 )
        })


    it ( 'does not recompute when the same argument set repeats while clean', () => {
                    const sign = signals ()
                    const s = sign.state ( 10 )
                    let calls = 0
                    const c = sign.computed ( x => { calls++; return s.get () + x }, 0 )

                    expect ( c.get ( 5 ) ).to.be.equal ( 15 )
                    expect ( c.get ( 5 ) ).to.be.equal ( 15 )   // same args → cached
                    expect ( c.get ( 5 ) ).to.be.equal ( 15 )   // still cached
                    expect ( calls ).to.be.equal ( 2 )          // 1 construction run + 1 recompute

                    s.set ( 20 )                                 // dep change dirties the computed...
                    expect ( c.get ( 5 ) ).to.be.equal ( 25 )    // ...recompute with requested args
                    expect ( calls ).to.be.equal ( 3 )
        })

}) // describe computed memoization respects arguments



// ============================================================================
// Regression: an effect whose body reads its own watched computed used to
// self-trigger forever — effect bodies ran with null call markers, so the
// nested read counted as "top-level" and re-fired the effect on every read.
// The change-detection fix (effects fire only after a dirty recompute with
// a changed value) defused this: the nested read finds a clean computed and
// is served from cache. These tests lock that behavior in.
// ============================================================================

describe ( 'Effect reentrancy safety', () => {

    it ( 'effect body reading its own watched computed does not re-fire itself', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    const c = sign.computed ( () => s.get () + 1 )
                    let fired = 0
                    sign.effect ( [c], () => { c.get (); fired++ } )

                    s.set ( 10 )                 // marks c dirty; no fire yet
                    expect ( fired ).to.be.equal ( 0 )
                    c.get ()                     // recompute → fires once; nested c.get() inside must NOT re-fire
                    expect ( fired ).to.be.equal ( 1 )
        })


    it ( 'multiple effects on one computed each run exactly once per real change', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    const c = sign.computed ( () => s.get () * 2 )
                    let a = 0, b = 0
                    sign.effect ( [c], () => { c.get(); a++ } )
                    sign.effect ( [c], () => b++ )

                    s.set ( 3 )
                    c.get ()
                    expect ( a ).to.be.equal ( 1 )
                    expect ( b ).to.be.equal ( 1 )
        })

}) // describe effect reentrancy safety



// ============================================================================
// Regression: validators used to receive the live value reference, so a
// mutating validator could corrupt the caller's object before the value was
// cloned. Also: one throwing effect used to abort all remaining effects of
// the same set() / computed.get(), even though the state change itself had
// already been committed. Now values are cloned BEFORE validation and every
// effect runs isolated; collected errors are re-thrown together afterwards.
// ============================================================================

describe ( 'Validation and effect-error isolation', () => {

    it ( 'a mutating validator cannot corrupt the original object passed to set()', () => {
                    const sign = signals ()
                    const s = sign.state ( { v: 0 } )
                    const input = { v: 5 }
                    s.set ( input, )
                    // validator mutates its argument — with clone-before-validate
                    // this only touches the internal candidate, never `input`
                    const guarded = sign.state ( { v: 0 }, obj => { obj.v = 999; return true } )
                    const input2 = { v: 1 }
                    expect ( guarded.set ( input2 ) ).to.be.true
                    expect ( input2.v ).to.be.equal ( 1 )            // caller's object untouched
                    expect ( guarded.get () ).to.not.equal ( input2 ) // stored copy is a different reference
                    expect ( guarded.get ().v ).to.be.equal ( 999 )   // mutation applied to the copy only
        })


    it ( 'initial-value validation also sees an isolated clone', () => {
                    const sign = signals ()
                    const initial = { v: 1 }
                    const s = sign.state ( initial, obj => { obj.v = 42; return true } )
                    expect ( initial.v ).to.be.equal ( 1 )           // untouched
                    expect ( s.get ().v ).to.be.equal ( 42 )
        })


    it ( 'one throwing effect does not stop sibling effects; errors are re-thrown after all ran', () => {
                    const sign = signals ()
                    const s = sign.state ( 0 )
                    let second = 0
                    sign.effect ( [s], () => { throw new Error ( 'boom' ) } )
                    sign.effect ( [s], () => second++ )

                    expect ( () => s.set ( 1 ) ).to.throw ( AggregateError )
                    expect ( second ).to.be.equal ( 1 )              // sibling ran despite the throw
                    expect ( s.get () ).to.be.equal ( 1 )            // change was committed
                    // ...and both effects still work on subsequent sets
                    expect ( () => s.set ( 2 ) ).to.throw ( AggregateError )
                    expect ( second ).to.be.equal ( 2 )
        })

}) // describe validation and effect-error isolation



}) // describe