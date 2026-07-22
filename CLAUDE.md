# CLAUDE.md — Declic Financier Development Guidelines

Development principles for **Declic Financier**: a financial portfolio management application. These guardrails ensure code quality, safety, and consistency as the codebase grows.

---

## 1. Think Before Coding

**Never write financial logic without tracing the flow end-to-end.**

### Apply to:
- **Transaction calculations**: Before touching decimal logic, sketch the full path: user input → validation → database write → portfolio rebalance → UI display. Verify rounding consistency at each step.
- **Portfolio state mutations**: Draw the state tree before changing reducers. Know what cascades.
- **API schema changes**: Walk through: backend contract → type generation → UI consumption → persistence. One missing field breaks downstream.

### Example:
❌ *Bad*: Add a `feePercentage` field to transaction. Assume it's handled everywhere.  
✅ *Good*: Add field → update transaction schema → verify calculation uses it → check portfolio analytics read it → test persistence → update UI display → write test covering the full chain.

---

## 2. Simplicity First

**Feature works without the complexity first. Add only what advances the next shipped milestone.**

### Apply to:
- **State management**: Use local component state. Reach for Redux only when 3+ components share the same data.
- **API handlers**: Write handlers that work. Optimize or abstract later — avoid premature generalization.
- **UI components**: Build single-use components. Extract only after a second usage proves the pattern.
- **Calculations**: Use straightforward formulas. Premature optimization of financial math buries bugs.

### Example:
❌ *Bad*: Build a generic "transaction factory" with plugins, middleware, and a strategy pattern before the first transaction type exists.  
✅ *Good*: Implement stock transactions. When crypto/bonds arrive, refactor to extract commonality.

---

## 3. Surgical Changes

**Every commit moves one thing. Don't scatter changes across 12 files for one feature.**

### Apply to:
- **State mutations**: Portfolio rebalancing logic stays in ONE reducer or hook. Don't touch UI, calculations, or API handlers in the same commit.
- **Schema changes**: Migrate database schema → regenerate types → update ONE consumer at a time across separate commits.
- **Styling**: Color changes, layout fixes, responsive updates — each gets its own PR. Don't mix with logic changes.
- **Refactors**: Move code, rename variables, restructure files in isolation. Ship the refactor, THEN use the cleaner structure for the next feature.

### Example:
❌ *Bad*:  
```
commit: "Add portfolio rebalancing"
- Modify database schema
- Update reducer logic  
- Change UI components
- Fix styling
- Add analytics tracking
```

✅ *Good*:  
```
commit 1: "Update portfolio_allocations schema"
commit 2: "Add rebalance reducer logic"
commit 3: "Connect rebalance UI to reducer"
commit 4: "Update portfolio display for rebalanced state"
commit 5: "Add analytics event for rebalance"
```

---

## 4. Goal-Driven Execution

**Every commit serves the next shipped feature. No speculative work, no "this might be useful someday."**

### Blocked:
- Extracting a "utility library" for a pattern that exists in one place.
- Refactoring "for maintainability" without a concrete next feature blocked by the current structure.
- Adding "flexibility" to a system that doesn't yet need it.
- Pre-optimization (database indexes, caching layers) without profiling data.

### Allowed:
- Paying down technical debt that blocks the next feature.
- Refactoring a module because the next feature requires a cleaner interface.
- Adding a database index because analytics queries are slow and we're shipping reporting today.
- Extracting a component because THREE features now use it.

### Example:
❌ *Bad*: "While we're here, let's parameterize the fee calculation in case future products have different fee structures."  
✅ *Good*: Ship fee calculation for current product. When the second product is green-lit and blocked by hardcoding, then parameterize.

---

## Financial App Specific Rules

Beyond Karpathy principles, Declic Financier enforces these hard constraints:

### Currency & Decimals
- **Never approximate**: Use fixed-point arithmetic (Decimal or `BigInt` with proper scaling). No `parseFloat` for money.
- **Always validate**: Incoming decimals verified at the API boundary. Test with 0.01, 0.001, edge amounts.
- **Round consistently**: Specify rounding direction (banker's rounding for portfolios, round-up for user-facing totals) and apply globally.

### State & Persistence
- **Single source of truth**: Portfolio allocation lives in the database, derives in Redux, displays in UI. Never let them diverge.
- **Mutations atomic**: If rebalancing updates 5 positions, all 5 succeed or roll back together. No partial updates.
- **Immutable reads**: Before displaying data, verify it matches what the database holds. Don't trust stale Redux.

### Testing
- **Edge case priority**: Test with 1 share, 0.0001 decimals, zero-cost positions, negative allocations (error case), portfolio > $1M.
- **Integration over unit**: A unit test for fee calculation is nice. An integration test verifying fees persist and display correctly is essential.
- **No financial logic without coverage**: 100% of transaction calculations, portfolio math, and fee logic has test cases.

---

## Maintenance & Review

When reviewing PRs or planning work:
1. **Does this trace end-to-end?** (Principle 1)
2. **Could this be simpler?** (Principle 2)
3. **Is this change surgically focused?** (Principle 3)
4. **Does this unblock the next shipped feature?** (Principle 4)

If any answer is "no," send it back. Declic Financier's safety and simplicity depend on holding these guardrails.

---

**Last updated:** 2026-07-22  
**Applies to:** All PRs, commits, code reviews  
**Exceptions:** None without explicit discussion
