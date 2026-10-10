/**
 * Type declarations for `@peter.naydenov/signals`.
 */



/**
 * Anything an effect can watch: a state or a computed.
 */
export interface Readable<T = unknown> {
    get ( ...args: any[] ): T
}



/**
 * Optional validator for a state. Receives an isolated clone of the
 * candidate value and returns `true` to accept it. Also runs on the
 * initial value.
 */
export type Validator<T> = ( value: T ) => boolean



/**
 * A reactive cell. Values are deep-cloned with `structuredClone`, so they
 * must be cloneable (no functions, Symbols, DOM nodes, etc.).
 */
export interface State<T> extends Readable<T> {
    /** Returns the current value. */
    get (): T
    /**
     * Sets a new value and fires dependent effects synchronously.
     * Returns `false` if validation rejected the value.
     * Throws `AggregateError` if one or more effects threw.
     */
    set ( value: T ): boolean
    /**
     * Sets the value returned by `fn`, which receives the current value.
     * Returns `false` if validation rejected the new value.
     */
    modify ( fn: ( current: T ) => T ): boolean
}



/**
 * A derived, memoised value. `fn` runs once at construction and again on
 * `get()` only when an upstream dependency changed or the arguments differ
 * from those of the cached evaluation.
 */
export interface Computed<R, A extends unknown[] = []> extends Readable<R> {
    /** Returns the value computed with the default arguments. */
    get (): R
    /** Returns the value computed with these arguments. */
    get ( ...args: A ): R
}



/**
 * A signal-nest: an independent container for states, computeds and effects.
 */
export interface SignalNest {
    /**
     * Creates a reactive cell. Throws `TypeError` if `initialValue` fails
     * validation or cannot be cloned.
     */
    state<T> ( initialValue: T, validation?: Validator<T> | false ): State<T>

    /**
     * Creates a computed value. `args` are the default arguments passed to
     * `fn` when `get()` is called without arguments.
     */
    computed<R, A extends unknown[] = []> ( fn: ( ...args: A ) => R, ...args: A ): Computed<R, A>

    /**
     * Registers an effect that fires whenever any of `relations` changes.
     * Only `relations` are watched — reads inside `fn` are not tracked.
     * `args` are passed to `fn` on every call.
     */
    effect<A extends unknown[] = []> ( relations: ReadonlyArray<Readable>, fn: ( ...args: A ) => unknown, ...args: A ): void
}



/**
 * Creates a new, independent signal-nest.
 */
declare function signal (): SignalNest



export default signal
