# Signals (@peter.naydenov/signals)
*EARLY INVESTIGATION STAGE - Under heavy development.*


Implementation of signals for Javascript. Simple reactivity system.

```js
import { Signal } from '@peter.naydenov/signals';

const 
      initalValue = 0
    , signal = new Signal( initalValue )
    ;

signal.get () // => 0
signal.set ( 1 ) // => 1



const computed = new Signal.Computed( () => signal.get () + 10 )

computed.get () // => 11

signal.set ( 2 ) // => 2
computed.get () // => 12
```

## Installation

Nothing to install yet...





## Credits
'@peter.naydenov/signals' was created and supported by Peter Naydenov.



## License
'@peter.naydenov/signals' is released under the [MIT License](https://github.com/PeterNaydenov/signals/blob/master/LICENSE).



