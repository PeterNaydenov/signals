# Signals (@peter.naydenov/signals)

![version](https://img.shields.io/github/package-json/v/peterNaydenov/signals)
![license](https://img.shields.io/github/license/peterNaydenov/signals)
![issues](https://img.shields.io/github/issues/peterNaydenov/signals)
![language](https://img.shields.io/github/languages/top/peterNaydenov/signals)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/peterNaydenov/signals)
![npm package minimized gzipped size (scoped)](https://img.shields.io/bundlejs/size/%40peter.naydenov/signals)



Implementation of signals for Javascript. Simple reactivity system.
Library cover all needed features: has states, effects and computed states. 

All `computed states` are lazy evaluated, computed evaluation is memorized for future calls. New evaluation will be executed only if dirty flag is set.

`Effects` are function that will be executed immediately after change of a watched state or computed state. If effect watches a state, will be executed imidiately after the state change. Effects that watch computed states are executed after next call when the value of that computed state is re-evaluated. 

### What else?
Signal entities are living in a entity - `signal-nest`. Signal-nest is like a storage for related signal entities. Smaller size of the nest will work faster, will be easyer to understand the relations among signal entities. Nothing stops you from creating single signal-nest for everything but multiple signal-nests are more developer friendly.

Provide a validation function for signal states. Check if value is valid and then set it.


## How it looks like

```js
import signal from '@peter.naydenov/signals';

const 
      initalValue = 0
    , signalNest = signal ()
    , simple = signalNest.state ( initalValue )
    ;

simple.get () // => 0
simple.set ( 1 ) // => true
simple.get () // => 1



const complex = signalNest.computed ( () => simple.get () + 10 );

complex.get () // => 11
signal.set ( 2 ) // => true
complex.get () // => 12

// Computed with arguments. Set default argument value in case if no arguments are provided
const complex2 = signalNest.computed ( x => simple.get () + 10 + x , 0 );

// Request with no arguments will use default value
// simple == 2, argument == 0 then computed = 2+10+0 = 12
complex2.get () // => 12
signal.set ( 3 ) // => true
// simple == 3, argument == 2 then computed = 3+10+2 = 15
complex2.get (2) // => 15



// Effect is executed immediately after signal state change
signalNest.effect ( [simple], () => {
            console.log ( 'signal state changed' )
    })

// Computed state is lazy evaluated. So effect will not be executed until it is called
signalNest.effect ( [complex], () => {
            console.log ( 'computed effect' )
    })



simple.set ( 3 )   // => true, => simple changed

// ... no execution of computed effect. Requires a call
complex.get () // -> 'computed effect'
```



## Installation

```bash
npm install @peter.naydenov/signals
```

Call from your project:

```js
import signal from '@peter.naydenov/signals';
// create a signal nest - a collection of signal states, computed states and effects
const signalNest = signal ();

// start using the signal library
const a = signalNest.state ( 0 );
signalNest.effect ( [a], () => console.log ( 'a was changed' ) );
// etc...
```



## Usage - Practical Patterns



### Validation
Creating a state has optional validation function as an argument.

```js
const a = signalNest.state ( 0, ( value ) => value > 0 );
a.set ( 1 ) // => true
a.set ( -1 ) // => false

// Set function returns boolean so you can use it in if statements
if ( a.set ( 1 ) ) {
    // if setting was successful...
}
else {
    // if setting failed ...
}
```





## Credits
'@peter.naydenov/signals' was created and supported by Peter Naydenov.



## License
'@peter.naydenov/signals' is released under the [MIT License](https://github.com/PeterNaydenov/signals/blob/master/LICENSE).



