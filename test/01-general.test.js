import signals from '../src/main.js'
import { expect } from 'chai'


describe ( 'Signals', () => {

    it ( 'Create a simple signal', () => {
                    const h = signals ();
                    const signal = h.item ( 0 )
                    expect ( signal.get () ).to.be.equal ( 0 )
                    signal.set ( 1 )
                    expect ( signal.get () ).to.be.equal ( 1 )
        }) // it Create a simple signal

    it ( 'Create a computed signal', () => {
                    const h = signals ();
                    const 
                          simple = h.item ( 2 )
                        , computed = h.computed ( () => simple.get () + 10 )
                        ;

                    expect ( computed.get () ).to.be.equal ( 12 )
                    simple.set ( 4 )
                    expect ( computed.get () ).to.be.equal ( 14 )
        }) // it Create a computed signal

    it ( 'Create a signal with validation', () => {
                    const h = signals ();
                    const simple = h.item ( 2 , (d) => d > 0 );
                    simple.set ( 12 )
                    expect ( simple.get () ).to.be.equal ( 12 )
                    simple.set ( -10 )
                    expect ( simple.get () ).to.be.equal ( 12 )
                    simple.set ( 0 )
                    expect ( simple.get () ).to.be.equal ( 12 )
        }) // it Create a signal with validation


}) // describe