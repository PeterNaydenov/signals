/**
 * Type-level tests for `types/main.d.ts`. Checked by `npm run test:types`,
 * never executed. The import goes through the package's own `exports`
 * map, so this also verifies that consumers resolve the declarations.
 */
import signal, { type State, type Computed } from '@peter.naydenov/signals'



const h = signal ()

// state
const count = h.state ( 0 )
const n: number = count.get ()
const ok: boolean = count.set ( 1 )
count.modify ( v => v + 1 )
// @ts-expect-error — wrong value type
count.set ( 'one' )
// @ts-expect-error — modify must return the state type
count.modify ( v => String ( v ) )

const typed: State<{ name: string }> = h.state ( { name: 'Ann' } )
h.state ( 0, v => v >= 0 )
h.state ( 0, false )
// @ts-expect-error — `true` is not a validator
h.state ( 0, true )

// computed without arguments
const double = h.computed ( () => count.get () * 2 )
const d: number = double.get ()
// @ts-expect-error — no arguments expected
double.get ( 1 )

// computed with default arguments
const plus = h.computed ( ( x: number ) => count.get () + x, 0 )
const p1: number = plus.get ()
const p2: number = plus.get ( 5 )
// @ts-expect-error — wrong argument type
plus.get ( 'five' )
const asType: Computed<number, [number]> = plus

// effect
h.effect ( [ count, double, plus ], () => console.log ( count.get () ) )
h.effect ( [ count ], ( label: string ) => console.log ( label ), 'tick' )
// @ts-expect-error — default args must match fn parameters
h.effect ( [ count ], ( label: string ) => console.log ( label ), 42 )
// @ts-expect-error — relations must be readable
h.effect ( [ 1 ], () => {} )

// unknown members are errors
// @ts-expect-error
h.subscribe ()

export { n, ok, typed, d, p1, p2, asType }
