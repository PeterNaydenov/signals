/**
 * CommonJS type declarations for `@peter.naydenov/signals`.
 * `require('@peter.naydenov/signals')` returns the factory itself, so the
 * module is typed as `export =`. All types are re-exported from `main.d.ts`.
 */
import type signalFunction from './main.js' with { 'resolution-mode': 'import' }



declare const signal: typeof signalFunction

declare namespace signal {
    type Readable<T = unknown> = import('./main.js', { with: { 'resolution-mode': 'import' } }).Readable<T>
    type Validator<T> = import('./main.js', { with: { 'resolution-mode': 'import' } }).Validator<T>
    type State<T> = import('./main.js', { with: { 'resolution-mode': 'import' } }).State<T>
    type Computed<R, A extends unknown[] = []> = import('./main.js', { with: { 'resolution-mode': 'import' } }).Computed<R, A>
    type SignalNest = import('./main.js', { with: { 'resolution-mode': 'import' } }).SignalNest
}



export = signal
