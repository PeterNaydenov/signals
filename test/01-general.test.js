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


}) // describe