---
description: Review and improve test quality for implementation phases. Use when you need to assess test robustness, find fake safety patterns, or improve mutation scores.
---

# Test Quality Review Workflow

This workflow ensures tests are robust, catch real bugs, and don't give false confidence.
It combines automated quality gates with agentic reasoning for comprehensive coverage.

## Quick Start

```bash
# Run all automated quality checks
bun run quality

# Run full quality gate (includes mutation testing - slower)
bun run quality:full
```

---

## Prerequisites

Ensure you have the following tools available:

| Tool | Command | Purpose |
|------|---------|---------|
| Tests | `bun test` | Run test suite |
| Coverage | `bun test --coverage` | Line/function coverage |
| Density | `bun run test:density` | Assertion density check |
| Lint | `bun run lint` | Code quality rules |
| Mutation | `bun run test:mutate` | Mutation testing |
| Property | `bun run test:property` | Property-based tests |
| Quality | `bun run quality` | All checks combined |

## Skills

This workflow uses the following skills (paths relative to `say2/implementation`):

| Skill | Path | Purpose | Used In |
|-------|------|---------|---------|
| `run-quality-checks` | `.claude/skills/run-quality-checks/SKILL.md` | Run automated test quality checks | Part A |
| `analyze-mutation-survivors` | `.claude/skills/analyze-mutation-survivors/SKILL.md` | Analyze and kill surviving mutations | Part A |
| `detect-test-antipatterns` | `.claude/skills/detect-test-antipatterns/SKILL.md` | Find fake safety patterns in tests | Part B |
| `map-spec-to-tests` | `.claude/skills/map-spec-to-tests/SKILL.md` | Create spec-to-test traceability matrix | Part B |

To use a skill, read the SKILL.md file at the path above for detailed instructions.

---

# Part A: Automated Quality Gates

**Purpose:** Run tools, interpret results, fix failures, achieve passing metrics

## A1. Quick Quality Check

// turbo
```bash
bun run quality
```

**What it checks:**
- All tests passing
- Assertion density ≥ 1.0 per test
- No lint errors

**On failure:**
1. Read the output to identify failing check
2. Fix the issue
3. Re-run until green

## A2. Mutation Testing

// turbo
```bash
bun run test:mutate
```

**Target:** ≥ 80% mutation score (break threshold)

**On surviving mutants:**
1. Open the HTML report: `reports/mutation/index.html`
2. For each survivor, analyze:
   - What code was mutated?
   - Why didn't existing tests catch it?
3. Write a targeted test to kill the mutant
4. Re-run until threshold met

**Common survivors and fixes:**

| Mutation | Fix |
|----------|-----|
| `>=` → `>` | Add boundary test with exact value |
| `&&` → `\|\|` | Add test where only one condition is true |
| Block removed | Add test that verifies the block's effect |
| Return value changed | Assert the exact return value |

## A3. Coverage Analysis

// turbo
```bash
bun test --coverage
```

**Target:** ≥ 80% line coverage, ≥ 80% function coverage

**For uncovered lines:**
1. Identify what behavior the line covers
2. Write a test that exercises it
3. Re-run to verify coverage

**Acceptable exceptions:**
- Error handlers for impossible states
- Debug/logging code
- Platform-specific branches

## A4. Property-Based Testing

// turbo
```bash
bun run test:property
```

**When to add property tests:**

| Code Type | Property Examples |
|-----------|------------------|
| ID generators | Always unique |
| Serializers | Round-trip (encode→decode = original) |
| Sorters | Output is sorted, length preserved |
| State machines | Valid transitions only |

**How to identify properties:**
1. Ask: "What must ALWAYS be true for ANY valid input?"
2. Write property test using fast-check
3. Run with 100+ random inputs

---

# Part B: Agentic Review

**Purpose:** Human/AI reasoning to verify tests are meaningful, not just metric-passing

## B1. Anti-Pattern Detection

Scan for these patterns that create false confidence:

### 🔴 Hidden Assertions (CRITICAL)

**Search for:**
```bash
grep -rn "expect(" packages/*/src/*.test.ts | grep -E "\([^)]+\) =>"
```

**Anti-pattern:**
```typescript
// ❌ BAD - expect may never execute if callback never runs
pipeline.use(async (ctx) => {
  expect(ctx.value).toBe("something");  // Hidden!
});
await pipeline.run(ctx);
```

**Fix:**
```typescript
// ✅ GOOD - capture and assert after execution
let capturedValue: string;
let middlewareExecuted = false;
pipeline.use(async (ctx) => {
  middlewareExecuted = true;
  capturedValue = ctx.value;
});
await pipeline.run(ctx);
expect(middlewareExecuted).toBe(true);
expect(capturedValue).toBe("something");
```

### 🟠 Weak toBeDefined() Assertions

**Anti-pattern:**
```typescript
// ❌ BAD - passes even if value is wrong
expect(event.id).toBeDefined();
```

**Fix:**
```typescript
// ✅ GOOD - verify actual value
expect(event.id).toMatch(/^[0-9a-f-]{36}$/i);  // UUID format
```

### 🟠 Tautological Comparisons

**Anti-pattern:**
```typescript
// ❌ BAD - >= always passes even if value unchanged
expect(updated.getTime()).toBeGreaterThanOrEqual(original.getTime());
```

**Fix:**
```typescript
// ✅ GOOD - strict comparison with actual delay
await new Promise(r => setTimeout(r, 5));
expect(updated.getTime()).toBeGreaterThan(original.getTime());
```

### 🟡 Length-Only Checks

**Anti-pattern:**
```typescript
// ❌ BAD - could be 3 wrong items
expect(sessions.length).toBe(3);
```

**Fix:**
```typescript
// ✅ GOOD - verify content
expect(sessions.length).toBe(3);
expect(sessions.map(s => s.id)).toContain(expected1.id);
```

## B2. Spec-to-Test Traceability

For each scenario in the spec document:

1. Find the corresponding test(s)
2. Verify the test actually covers the scenario
3. Mark status in traceability matrix

**Create matrix:**
```markdown
| Spec Scenario | Test Location | Status | Notes |
|---------------|---------------|--------|-------|
| Sessions have unique IDs | manager.test.ts:L25 | ✅ | |
| Messages preserve order | message-store.test.ts:L74 | ✅ | |
| Middleware chain stops on no next() | pipeline.test.ts:L45 | ✅ | |
```

**Status legend:**
- ✅ Fully covered
- ⚠️ Partially covered (document what's missing)
- ❌ Not covered (add test)

## B3. Behavioral Completeness

For each public function/method, verify tests exist for:

- [ ] Happy path (normal usage)
- [ ] Error cases (invalid input)
- [ ] Boundary cases (empty, max, min)
- [ ] Null/undefined handling
- [ ] Concurrent access (if applicable)

**Think:** "What could go wrong?"
- Invalid input types
- Missing required fields
- Empty collections
- Race conditions
- State corruption

## B4. Intent Verification

For each test, verify:

1. **Name matches assertion**
   - Test name: "creates session with unique ID"
   - Does it actually verify uniqueness? (not just that ID exists)

2. **No coincidental passing**
   - Could this test pass by accident?
   - Is it testing the right thing?

3. **Failure would catch the bug**
   - If the code was broken, would this test fail?

---

# Part C: Continuous Improvement

**Run at the end of every review to improve the process itself.**

## C1. Report Current Metrics

Document current state:

```markdown
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Tests | ___ | - | |
| Assertions | ___ | - | |
| Mutation Score | ___% | ≥80% | |
| Line Coverage | ___% | ≥80% | |
| Assertion Density | ___ | ≥1.0 | |
| Property Tests | ___ | - | |
```

## C2. Assess: What's Working?

Discuss:
- What did automated checks catch that manual review would have missed?
- What did agentic review uncover that automation missed?
- Were there false positives (wasted effort)?
- Did any tests feel like they were "gaming" the metrics?

## C3. Discuss: Future Considerations

Review this list and discuss relevance to current project state:

| Practice | What It Does | When Valuable |
|----------|--------------|---------------|
| **Contract Testing** | Ensures API changes don't break consumers | When multiple services/clients consume your API |
| **Fuzz Testing** | Throws random malformed input to find crashes | When parsing external input (JSON, messages) |
| **Chaos Engineering** | Injects failures to test resilience | Before production, for distributed systems |
| **Visual Regression** | Detects pixel-level UI changes | When building UI components |
| **Load/Perf Testing** | Verifies performance under load | Before handling real traffic |
| **Formal Verification** | Mathematically proves correctness | For security-critical or financial code |
| **Snapshot Testing** | Detects unintended output changes | For stable output formats |

**Discussion prompts:**
1. Has the codebase grown to warrant any of these?
2. Are there new risk areas that need additional testing?
3. What's the cost/benefit of adding one now?
4. Any production issues that suggest we need more?

## C4. Decide: What to Add Next?

Document decision:

- [ ] Keep current practices (no changes needed)
- [ ] Add: _________________ because _________________
- [ ] Remove/simplify: _________________ because _________________
- [ ] Investigate: _________________ (research before deciding)

---

# Commands Summary

```bash
# Quick quality check (fast)
bun run quality

# Full quality gate including mutation testing (slow)
bun run quality:full

# Individual checks
bun test                    # Run tests
bun test --coverage         # With coverage
bun run test:density        # Assertion density
bun run test:mutate         # Mutation testing
bun run test:property       # Property-based tests
bun run lint                # Lint check

# Find anti-patterns
grep -rn "expect(" packages/*/src/*.test.ts | grep -E "\([^)]+\) =>"
grep -rn "toBeDefined()" packages/*/src/*.test.ts
grep -rn "toBeGreaterThanOrEqual" packages/*/src/*.test.ts
```

---

# Workflow Execution Checklist

## When to Run Full Workflow

| Situation | Part A | Part B | Part C |
|-----------|--------|--------|--------|
| Every PR | ✅ Auto (CI) | Optional | ❌ |
| New module/feature | ✅ | ✅ | ✅ |
| Quarterly audit | ✅ | ✅ | ✅ |
| Bug fix | ✅ Auto (CI) | Recommended | ❌ |
| Post-incident review | ✅ | ✅ | ✅ |

## Checklist

### Part A: Automated
- [ ] `bun run quality` passes
- [ ] `bun run test:mutate` ≥ 80%
- [ ] Coverage ≥ 80%
- [ ] No surviving critical mutants

### Part B: Agentic
- [ ] No hidden assertions found
- [ ] No weak toBeDefined() patterns
- [ ] All spec scenarios mapped to tests
- [ ] Negative/edge cases exist
- [ ] Test names match assertions

### Part C: Improvement
- [ ] Metrics documented
- [ ] Future considerations discussed
- [ ] Decision recorded

---

*Workflow updated: 2026-01-09*
*Incorporates: Mutation testing, Property-based testing, CI integration, Continuous improvement*