# Release History



## 1.3.0 (2025-07-22)
- [x] Fix: dependency tracking compared `Symbol('effect')` / `Symbol('computed')` by `.toString()`, which silently broke if anyone ever renamed the symbol description in `effects.js` / `computed.js`. The libs now set a stable sentinel (`local.EFFECT_CALL` / `local.COMPUTED_CALL`, defined once in `main.js`) and `get()` compares by reference. End-to-end behavior is unchanged for valid code; the dep tracking is no longer fragile to refactors;
- [x] Fix: `set()` on a non-cloneable value (function, Symbol, etc.) used to throw a raw `DataCloneError` from `structuredClone` with no useful context. The clone is now wrapped in a `clone()` helper that re-throws a `TypeError` with a clear `'signals: state value cannot be cloned (...)'` message so the call site is obvious;
- [x] Fix: an exception during `effect()` setup (e.g. a relation that lacks `get`) or during the initial `computed()` call would leave `l.callID` and `l.callType` set to a stale `Symbol` + sentinel. Every subsequent `state.get()` in that signals instance would then silently register the dead id as a dep, corrupting dep tracking for the rest of the session. Both setup paths are now wrapped in `try / finally` that always resets the global markers;
- [x] Types: corrected the JSDoc type for `state(initialValue, validation)` from `Function|boolean` to `Function|false` — a `true` value was never supported (it would behave as a no-op validator, which is not a useful contract);
- [x] Fix: `state(initialValue, validation)` used to store `initialValue` as-is without calling the validator — a state created with `state(-1, v => v >= 0)` would happily hold `-1`, even though the user clearly intended a non-negative value. The validator is now called on the initial value too; on failure the constructor throws a `TypeError` (fail fast) so the bug surfaces at the call site, not later at a distant `set`/`get`. This is a behavior change — existing code that relied on the silent bypass will now throw;
- [x] Cleanup: removed the now-unused `[ ] Bug: dependency tracking ...` and `[ ] Stale: the four TODO comments ...` items from this section — both addressed in this release;
- [ ] Stale: the four `TODO:` comments in `src/states.js` are known limitations (a `Destroy` method, async state, dependency injection, notes integration). Not addressed in this PATCH — would each be a feature, not a fix;



## 1.2.1 (2025-07-03)
- [x] Fix: Effect based on state has no expected arguments;



## 1.2.0 (2025-07-03)
- [x] Effect with dependency argument;
- [ ] Bug: Effect based on state has no expected arguments;



## 1.1.0 (2025-07-02)
- [x] Computed with arguments;



## 1.0.2 (2025-01-13)
- [x] Refactoring: Multiple files;



## 1.0.0 (2025-01-12)
- [x] Initial release
