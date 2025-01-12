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
                        , computed = h.computed ( () => simple.get () + 10 ) 
                        ;

                    h.effect ( [computed], () => {
                                        called = true
                                        result = 25
                                });
                    // Change of signal state will not change nothing if effect is attached to computed value
                    simple.set ( 12 ) 
                    expect ( called ).to.be.false
                    expect ( result ).to.be.equal ( 0 )
                    // Computed state change only on call. Lazy evaluation ->
                    computed.get ()
                    expect ( called ).to.be.true
                    expect ( result ).to.be.equal ( 25 )
     }) // it Callback on signal state change


}) // describe