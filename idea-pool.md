# Idea Pool

A living document for known limitations, improvement ideas and future
discussions about `@peter.naydenov/signals`. Nothing here is committed —
items move to the Changelog only when actually shipped.

Last reviewed: 2026-08-26 (after the 1.3.1 bug-fix round + design session
on freeze / destroy / cross-nest)


## Still imperfect

| # | Issue | Severity | Behavior / Notes |
|---|---|---|---|
| 1 | No destroy/unsubscribe | Medium | Sets of deps/effects grow monotonically — long-lived signal nests leak. Documented TODO since 1.0 (`src/states.js`) |
| 2 | Stale dep lists | Low | If a computed's `fn` switches branches (e.g. `flag ? a.get() : b.get()`), the abandoned branch stays registered in `dependsOn` → spurious recomputes on irrelevant changes. Values stay correct; only wasted work |
| 3 | Cycles undetected | Medium | A cycle between computed states doesn't hang or crash — it silently returns meaningless values. A clear error would be better |
| 4 | `Object.is` change detection | Low | Object-valued computeds produce a new reference per recompute → effects fire even when the value is deep-equal to the previous one. Deep-equality would need to be an opt-in feature |
| 5 | No batching | Low | Setting several states in a row runs a shared effect once per `set()`. There is no transaction / microbatch mechanism |
| 6 | Synchronous only | By design | No async effects, no scheduling/queueing. Effects run immediately and synchronously inside `set()` / `get()` |
| 7 | Cross-nest reactivity silently broken | Medium | Using a signal from one nest inside another nest's computed/effect works at construction but never updates afterwards — dep tracking uses per-nest call markers, so nothing registers. No error, no warning, just dead reactivity |

### Safe-usage rules

1. Keep dependency graphs acyclic.
2. Create one signal nest per feature/domain — smaller nests mean faster
   staleness checks and less leak impact.
3. Don't mutate state values in place — always go through `set()` / `modify()`.
4. Don't rely on effect execution order; be ready to catch `AggregateError`
   around `set()` / `get()` when effects can throw.
5. Never mix signals from different nests in one graph — see #7.


## Design decisions (agreed, not yet implemented)

### Freeze / Unfreeze (replaces the old "per-node destroy" idea)

Words must keep their meaning: removing a node from a reactive graph was
never a safe "destroy" — other items may depend on it. What we actually
wanted there is *freeze*: an item that stops reacting but keeps its last
value. Real destruction is only legitimate at nest level.

**API:**
- `state.freeze() / unfreeze() / isFrozen()`
- `computed.freeze() / unfreeze() / isFrozen()`
- `nest.destroy()`

**Semantics:**
- **Frozen state:** `set()` / `modify()` become no-ops and return `false`
  (same contract as validation rejection). `get()` serves the last value.
  No version bump → downstream chains go quiet automatically; effects on
  them never fire.
- **Frozen computed:** `get()` returns the last value computed before the
  freeze (`isStale()` returns `false` while frozen). Unfreeze needs no
  bookkeeping — upstream versions kept moving during the freeze, so the
  next read after unfreeze detects version mismatches and recomputes
  naturally.
- **Frozen parameterized computed:** serving the pinned value for foreign
  arguments would be misleading. Agreed approach: arg-less `get()` (or the
  same args as before the freeze) returns the pinned value; any *other*
  argument set throws `signals: computed is frozen`.
- **Double freeze / freeze on frozen** = silent no-op.
- Implementation cost is low: a `frozen` flag checked in `state.set()` and
  in `isStale()` — both are existing code paths.

### Nest-level destroy

A nest built for one feature/process can die as a unit — real destroy,
real memory reclaim.

**Semantics:**
- `nest.destroy()` wipes the whole storage of that nest.
- Every method called on any reference from a destroyed nest throws
  `signals: this signal nest was destroyed` — no cryptic `undefined`
  crashes.
- Double destroy = silent no-op.

### Rejected ideas (for the record)

- **`state.destroy()` / `computed.destroy()` / `effect.destroy()`** —
  rejected: per-node removal can break dependent items; "freeze" covers the
  runtime use case honestly, nest.destroy covers the memory lifecycle.
- **Cascade destroy** (destroying a state takes its downstream with it) —
  rejected as too magical.


## Candidate next steps (implementation order)

1. **Freeze / Unfreeze** — states + computeds, semantics above.
2. **Nest-level destroy** — dead-nest errors everywhere.
3. **Cross-nest guard (#7)** — during `effect()` / `computed()` setup,
   verify each relation actually registered us in its sets; if not, throw
   `signals: relation belongs to a different signal nest`. Turns the silent
   trap into a loud mistake. Keeps single-nest-per-graph as the model.
4. **Dep-list pruning** — refresh what a computed depends on and drop
   abandoned branches from `dependsOn` / `deps`. Fixes #2.
5. **Cycle detection** — guard that throws or warns on re-entrant
   evaluation. Addresses #3.

Open question kept for later discussion: whether effects should also get
pause/resume (symmetry with freeze) once freeze ships.


## Shipped (for context)

Bugs fixed in 1.3.1 — see [Changelog.md](./Changelog.md) for details:
memoization loss after first change, effect firing on unchanged reads,
stale chained computeds, argument-blind caching, self-triggering effects,
validator corruption of caller objects, throwing effects skipping siblings.
