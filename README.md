# Signals (@peter.naydenov/signals)
*EARLY INVESTIGATION STAGE - Under heavy development.*
*NOT PUBLISHED YET.*

Implementation of signals for Javascript. Simple reactivity system.

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



const complex = signalNest.computed ( () => simplel.get () + 10 );

complex.get () // => 11
signal.set ( 2 ) // => true
complex.get () // => 12
```



## Installation

Nothing to install yet...
Work in progress.




## Credits
'@peter.naydenov/signals' was created and supported by Peter Naydenov.



## License
'@peter.naydenov/signals' is released under the [MIT License](https://github.com/PeterNaydenov/signals/blob/master/LICENSE).



