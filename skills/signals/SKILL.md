---
name: signals
description: |
  Help developers use `@peter.naydenov/signals` (the `signal` reactivity
  library, v1.3.1): create a signal-nest with `signal()`, build reactive
  cells with `state(initialValue, validation?)`, derive values with
  `computed(fn, ...defaultArgs)`, and register side effects with
  `effect(relations, fn, ...args)`. Use when a developer asks for a
  small reactive state container, a `signal`-style API, lazy computed
  values, or "state that automatically re-runs effects when it
  changes". Do NOT use for: full state management with persistence /
  TTL / API integration (point to `@peter.naydenov/data-pool`),
  virtual DOM diffing (point to `@peter.naydenov/morph`), or fixing
  bugs in the library itself.
---

# git-signals helper

A small reactivity library: three primitives (`state`, `computed`,
`effect`) and one container (`signal-nest`). State cells fire effects
on change; computeds memoize by dependency-version and arg-tuple and
re-run lazily on read; effects run synchronously after the change that
caused them.

Source of truth:
- `src/main.js` — the `main` factory and the `state` / `computed` / `effect` method wiring; JSDoc on every public method
- `src/states.js` — `state(initialValue, validation?)` factory and the per-state `get` / `set` / `modify`
- `src/computed.js` — `computed(fn, ...args)` factory and the lazy/memoised `get`
- `src/effects.js` — `effect(relations, fn, ...args)` factory
- `test/01-general.test.js` — executable examples for every pattern below
- `README.md` — narrative overview, the "How it looks like" example, and the "What else?" notes

## Procedure

1. **Map the developer's intent to the right primitive**:
   - "I have a value that can change and other code should react" / "Reactive cell" / "Observable" → `h.state(initialValue)`
   - "Derive a value from other states" / "Computed property" / "Memoised calculation" → `h.computed(fn, ...defaultArgs)` (or `h.computed(fn, singleDefaultArg)` for parameterized)
   - "Run this function when X changes" / "Subscribe to state changes" / "Side effect" → `h.effect(relations, fn)` — `relations` is an array of states/computeds to watch
   - "Modify a state based on its current value" / "increment / decrement" → `state.modify(fn)` (more idiomatic than `set(state.get() + 1)`)
   - "Reject bad values automatically" / "validated state" → `h.state(initialValue, validator)` — pass `false` to opt out

2. **Generate code that follows the real API contract**:
   - ESM import: `import signal from '@peter.naydenov/signals'` (CJS: `require('@peter.naydenov/signals')`)
   - Default export is a **factory function**: `const h = signal()`. Each call returns a fresh, independent `signal-nest`. Multiple `signal()` calls do NOT share state.
   - **Naming trap:** the `import` is named `signal` (singular, the package name), but the instance variable is conventionally `h` or `signals` (the "nest"). Don't write `const signal = signal()` and then call `signal.state(...)` — the variable name shadows the import and reads confusingly.
   - `h.state(initialValue, validation?)` returns an object with `get()` / `set(value)` / `modify(fn)`. **No `update` or `value` property** — those are common names in other reactivity libraries and would be wrong here.
   - `h.computed(fn, ...defaultArgs)` returns an object with `get(...args)`. Calling `get(...)` with no args uses the default args from the constructor; calling with explicit args overrides them. A computed can be parameterized.
   - `h.effect(relations, fn, ...args)` takes an **array** of states/computeds, then a callback, then optional default args. Multiple inputs to the callback use `...args`. The effect does NOT return a disposer — it lives for the lifetime of the signal-nest.
   - All three primitives accept extra args (`...args`) that are forwarded to their callbacks. Use this for context the callback needs but you don't want to close over.

3. **Apply the reactivity rules — the part most AIs get wrong**:
   - **Dep tracking is automatic via `get()`**, not by listing dependencies at construction. A state / computed is added to a caller's dep set **only if you call `.get()` on it inside the callback**. If your `computed(fn)` reads no state, it never re-runs. If your `effect(fn)` doesn't read any of the `relations` you passed, it never fires.
   - The `effect(relations, ...)` first arg is a **predeclared list** of which state changes should trigger the effect. The actual `get()` calls inside the callback add the deeper deps (e.g. a computed that reads a state). Use `relations` for "fire me on these changes"; the callback's `get()` calls are what makes the effect re-run with fresh values.
   - **Effects on a state fire synchronously on `state.set()`** — the effect callback runs before `set` returns to the caller. Order of effects: registration order, not set-order.
   - **Effects on a computed fire lazily on next `.get()`** that sees a new value. The effect does NOT fire if the computed is dirty but never re-read. A computed that returns the same value (per `Object.is`) does not fire its effects at all.
   - **`state.set(value)` is "fire-dependents-blind"** — it fires the effects even if the new value is `Object.is`-equal to the old. There is no built-in deep-equality check. If you want "set only if changed", call `get()` first and compare yourself.
   - **Effects are isolated from each other.** If effect A throws, effect B still runs. Errors are collected and re-thrown together as a single `AggregateError`. The state change itself is committed regardless.

4. **Surface only the relevant gotcha proactively** — pick at most one from the list below that applies to the current example, and only if the user is unlikely to know it:
   - **Dep tracking is via `get()`, not the `relations` array.** Forgetting to call `state.get()` inside a `computed` means the computed has no deps and never re-runs. A common bug.
   - **Validation runs on the initial value too.** `h.state(-1, v => v >= 0)` throws at construction with `TypeError('signals: initial value failed validation')`. Pass `false` to disable validation entirely.
   - **Values are deep-cloned via `structuredClone`.** Functions and Symbols are not cloneable — they throw a clear `TypeError('signals: state value cannot be cloned (...)')`. Don't store functions in state.
   - **`set` returns a boolean**, not throws. `false` means validation rejected the new value. The library's `TypeError` only fires for bad input shapes, not for value rejection.
   - **Effects are isolated; errors are aggregated.** One throwing effect doesn't break the others. The library throws a single `AggregateError` after every effect had its chance. Catch this if you want to suppress the error; otherwise let it bubble.
   - **Computed is lazy.** `h.computed(fn)` does NOT call `fn` at construction. The first call to `.get()` does. Don't rely on side effects in `fn` — use `effect` for that.
   - **Effect's `relations` is a hint, not a hard constraint.** Pass the state(s) that should trigger the effect; the `get()` calls inside the callback are the actual deps for re-runs. You can pass more or fewer than what the callback reads — the effect fires when any of the `relations` change, but re-runs the callback regardless of which one.

5. **If the request is for state management with persistence, TTL, API integration, or async data fetching**, this is the wrong layer. Point the user at `@peter.naydenov/data-pool` (which uses `signals` internally and adds store / cache / API layers).

6. **If the request is for declarative UI binding** (auto-rerender a DOM tree on state change), this library is a low-level primitive. Pair it with `@peter.naydenov/morph` (template engine) — call `morph(target, render(state))` inside an `effect` to get auto-rerendering.

7. **If the request is for async state updates** (state that needs to be set after a `fetch` or `await`), `set` is fine inside `await` blocks — the effect fires synchronously after the `set` call. There's no need for a separate async path. Just `await fetch(...); state.set(result)`.

## Output contract

- One focused code snippet, ESM by default (CJS if asked)
- One line of context explaining which primitives are used and why
- A pointer to the relevant source/test section if the developer wants to dig deeper
- Surface at most one relevant gotcha proactively, only if it applies to the example
- Never include a code example that puts a function or Symbol in `state(...)` (it will throw at construction; the user would have to read the error to understand why)
- Never include a code example that uses `state.subscribe(...)` or `state.on(...)` (the API is `effect(relations, fn)`, not a subscription method on the state)

## Failure handling

- The developer's use case genuinely ambiguous (e.g., "I want a reactive value") → start with the basic `state` + `get`/`set` pattern; introduce `computed` for derivations and `effect` for side effects
- Developer reports a bug or unexpected behavior in the library itself → do NOT try to fix from this skill; route to the project source or maintainer
- Developer wants a feature `signals` doesn't have (computed dependency on async data, persistence, undo/redo) → say so plainly, don't invent an API; point at `@peter.naydenov/data-pool` for the higher-level concerns

## Examples

**"A counter with a side effect"**

```js
import signal from '@peter.naydenov/signals'

const h = signal()
const count = h.state(0)
h.effect([count], () => console.log('count is', count.get()))

count.set(1)   // logs: "count is 1"
count.set(2)   // logs: "count is 2"
```

`effect(relations, fn)` fires synchronously when any state in `relations` changes. The `count.get()` inside the effect registers the dep for re-runs. See `Effect` in `src/effects.js`.

**"A computed total that auto-updates from line items"**

```js
import signal from '@peter.naydenov/signals'

const h = signal()
const price = h.state(10)
const qty   = h.state(3)
const total = h.computed(() => price.get() * qty.get())

console.log(total.get())   // 30
qty.set(5)
console.log(total.get())   // 50  (lazy — recomputed on read)
```

`computed` is lazy: it does not run `fn` at construction, only on the first `.get()`. Subsequent `.get()` calls re-use the cached value if the dependency versions haven't changed. The dep tracking is automatic — every `state.get()` inside `fn` registers the state as a dep. See `computed` in `src/computed.js`.

**"Validated state — only positive numbers"**

```js
import signal from '@peter.naydenov/signals'

const h = signal()
const age = h.state(0, v => Number.isFinite(v) && v >= 0)

age.set(30)        // true   — set succeeds
age.set(-1)        // false  — validation rejected, value unchanged
age.set('old')     // false  — validation rejected
age.get()          // 30    — still the old value
```

The validator is called on the initial value (throws `TypeError` if it fails at construction) and on every `set` (returns `false` instead of throwing on rejection). Pass `false` as the second arg to disable validation. See `state` in `src/states.js`.

**"Modify instead of read-then-set"**

```js
import signal from '@peter.naydenov/signals'

const h = signal()
const clicks = h.state(0)
clicks.modify(n => n + 1)
clicks.modify(n => n + 1)
clicks.get()  // 2
```

`modify(fn)` is the idiomatic increment — `fn` receives the current value, returns the new one, validation still applies. Use this instead of `clicks.set(clicks.get() + 1)` to avoid the read-then-write race. See `state.modify` in `src/states.js`.
