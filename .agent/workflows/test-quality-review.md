---
description: How to review and improve test quality for implementation phases
---

# Test Quality Review Workflow

This workflow ensures tests are robust, catch real bugs, and don't give false confidence.

## Prerequisites

- Bun test runner configured with coverage (`bunfig.toml`)
- All tests passing (`bun test`)

---

## Phase 1: Setup & Configuration (5 min)

### 1.1 Verify Coverage Configuration

```bash
# Check bunfig.toml exists and has coverage enabled
cat bunfig.toml | grep -A5 "\[test\]"
```

Expected:
```toml
[test]
coverage = true
coverageReporter = ["text", "lcov"]
coverageThreshold = { lines = 0.80, functions = 0.80, statements = 0.80 }
```

### 1.2 Add Missing Configuration

If bunfig.toml doesn't exist, create it:

```toml
[test]
coverage = true
coverageReporter = ["text", "lcov"]
coverageDir = "./coverage"
coverageThreshold = { lines = 0.80, functions = 0.80, statements = 0.80 }
coverageSkipTestFiles = true
timeout = 10000
```

---

## Phase 2: Run Tests & Collect Metrics (5 min)

### 2.1 Run Tests with Coverage

```bash
bun test --coverage
```

### 2.2 Record Metrics

Document these metrics:
- [ ] Total tests
- [ ] Pass/fail count
- [ ] Assertion count (look for "expect() calls")
- [ ] Line coverage %
- [ ] Function coverage %
- [ ] Uncovered lines list
- [ ] Execution time

---

## Phase 3: Fake Safety Audit (15-20 min)

This is the CRITICAL phase. Scan for anti-patterns that create false confidence.

### 3.1 🔴 Hidden Assertions (CRITICAL)

**Search for assertions inside callbacks/middlewares:**

```bash
# Look for expect() inside passed functions
grep -rn "expect(" packages/*/src/*.test.ts | grep -E "\([^)]+\) =>"
```

**Anti-pattern:**
```typescript
// ❌ BAD - expect may never execute if middleware chain breaks
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
expect(middlewareExecuted).toBe(true);  // Verify execution
expect(capturedValue).toBe("something"); // Assert captured value
```

### 3.2 🟠 Weak toBeDefined() Assertions

**Search for:**
```bash
grep -rn "toBeDefined()" packages/*/src/*.test.ts
```

**Anti-pattern:**
```typescript
// ❌ BAD - passes even if id is empty string or wrong value
expect(event.id).toBeDefined();
expect(event.sessionId).toBeDefined();
```

**Fix:**
```typescript
// ✅ GOOD - verify actual values
expect(event.id).toMatch(/^[0-9a-f-]{36}$/i);  // UUID format
expect(event.sessionId).toBe(inputSessionId);   // Exact match
```

### 3.3 🟠 Tautological Comparisons

**Search for:**
```bash
grep -rn "toBeGreaterThanOrEqual\|toBeLessThanOrEqual" packages/*/src/*.test.ts
```

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

### 3.4 🟠 Existence-Only Tests

**Search for tests that just check things exist:**
```bash
grep -rn "toBeInstanceOf\|toBeDefined" packages/*/src/*.test.ts | head -20
```

**Anti-pattern:**
```typescript
// ❌ BAD - doesn't verify behavior
it("exports SessionManager", () => {
  expect(SessionManager).toBeDefined();
  expect(new SessionManager()).toBeInstanceOf(SessionManager);
});
```

**Fix:**
```typescript
// ✅ GOOD - verify actual functionality
it("exports working SessionManager", () => {
  const manager = new SessionManager();
  const session = manager.create({ name: "test", transport: "stdio" });
  expect(session.state).toBe("CREATED");
  expect(manager.get(session.id)).toBe(session);
});
```

### 3.5 🟡 Length-Only Checks

**Search for:**
```bash
grep -rn "\.length\).toBe" packages/*/src/*.test.ts
```

**Anti-pattern:**
```typescript
// ❌ BAD - could be 3 wrong items
expect(sessions.length).toBe(3);
```

**Fix:**
```typescript
// ✅ GOOD - verify content
expect(sessions.length).toBe(3);
const ids = sessions.map(s => s.id);
expect(ids).toContain(expected1.id);
expect(ids).toContain(expected2.id);
```

### 3.6 🟡 Missing Negative Tests

For each positive test, verify there's a corresponding negative test:
- [ ] Invalid input rejection
- [ ] Not-found scenarios
- [ ] Error propagation
- [ ] Empty/null handling

---

## Phase 4: Coverage Gap Analysis (10 min)

### 4.1 Identify Uncovered Lines

From coverage output, list all uncovered lines:
```
File                          | Uncovered Line #s
------------------------------|------------------
store/message-store.ts        | 43-47, 73-74
```

### 4.2 Create Tests for Gaps

For each uncovered line/function:
1. Identify what behavior it covers
2. Write a test that exercises it
3. Verify it's now covered

---

## Phase 5: Scenario Traceability (5 min)

### 5.1 Map Spec Scenarios to Tests

Create a mapping table:

| Spec Scenario | Test File | Test Name | Status |
|---------------|-----------|-----------|--------|
| Messages can be stored | message-store.test.ts | stores message event | ✅ |
| ... | ... | ... | ... |

### 5.2 Identify Missing Scenarios

Any spec scenario without a corresponding test = gap

---

## Phase 6: Generate Report (5 min)

// turbo
### 6.1 Create Report File

Create `test-quality-report.md` with:
- Executive summary
- Metrics table
- Coverage matrix
- Issues found
- Fixes applied
- Recommendations

### 6.2 Update Spec File

Update the spec with:
- [x] Mark covered scenarios
- [~] Mark partial scenarios
- Add coverage metrics to header

---

## Phase 7: (Optional) Advanced Checks

### 7.1 Mutation Testing

```bash
# Install Stryker
npm install --save-dev @stryker-mutator/core @stryker-mutator/typescript-checker

# Run mutation testing
npx stryker run
```

Mutation score target: > 80%

### 7.2 Test Linting

Add to biome.json or eslint:
```json
{
  "rules": {
    "noFocusedTests": "error",
    "noSkippedTests": "warn"
  }
}
```

### 7.3 Assertion Density Check

```bash
# Calculate assertions per test
TESTS=$(grep -r "test\|it(" packages/*/src/*.test.ts | wc -l)
EXPECTS=$(grep -r "expect(" packages/*/src/*.test.ts | wc -l)
echo "Assertion density: $((EXPECTS / TESTS)) per test"
```

Target: 1.5-3 assertions per test

---

## Quick Reference: Anti-Pattern Checklist

Before approving any PR with tests, verify:

- [ ] **No hidden assertions** in callbacks/middlewares
- [ ] **No weak toBeDefined()** - values are verified
- [ ] **No tautological >= comparisons** - strict > with delays
- [ ] **No existence-only tests** - behavior is verified
- [ ] **No length-only checks** - content is verified
- [ ] **Negative cases exist** for each positive case
- [ ] **All spec scenarios covered**
- [ ] **No uncovered lines** without justification

---

## Commands Summary

```bash
# Run tests with coverage
bun test --coverage

# Find hidden assertions
grep -rn "expect(" *.test.ts | grep -E "\([^)]+\) =>"

# Find weak assertions
grep -rn "toBeDefined()" *.test.ts

# Find tautological comparisons
grep -rn "toBeGreaterThanOrEqual" *.test.ts

# Find length-only checks
grep -rn "\.length\).toBe" *.test.ts

# Calculate assertion density
echo "Density: $(grep -r "expect(" *.test.ts | wc -l) / $(grep -r "test\|it(" *.test.ts | wc -l)"
```

---

*Workflow created: 2026-01-09*
*Based on Phase 0 Foundation test quality review*
