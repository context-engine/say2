---
name: analyze-mutation-survivors
description: Analyze surviving mutations from Stryker mutation testing and write targeted tests to kill them. Use when mutation score is below threshold or when Stryker reports survivors.
allowed-tools: Bash Read Edit Write Grep
---

# Analyze Mutation Survivors

Analyze surviving mutants and write targeted tests to kill them.

## Instructions

### 1. Run Mutation Testing

```bash
bun run test:mutate
```

### 2. Open the Report

The HTML report is at: `reports/mutation/index.html`

Or read the console output which shows each survivor.

### 3. For Each Survivor, Analyze

Each surviving mutant shows:
- **File and line number** - where the mutation was made
- **Original code** - what the code looked like
- **Mutated code** - what Stryker changed it to

Ask: "Why didn't the existing tests catch this change?"

### 4. Common Mutations and Fixes

| Mutation | Why It Survived | Fix |
|----------|-----------------|-----|
| `>=` → `>` | No boundary test | Add test with exact boundary value |
| `&&` → `\|\|` | Only tested when both true | Add test where only one is true |
| `if (x)` → `if (true)` | No test where x is falsy | Add test with falsy value |
| Block removed | Side effect not verified | Assert the block's effect |
| Return changed | Only checked `toBeDefined()` | Assert exact return value |

### 5. Write Targeted Test

Create a test specifically designed to fail if the mutation is applied.

Example:
```typescript
// Mutation: timestamp >= startTime → timestamp > startTime
// Fix: Test with exact boundary
test("includes message at exact startTime", () => {
  const exactTime = new Date();
  store.store(createMessage({ timestamp: exactTime }));
  const results = store.query({ startTime: exactTime });
  expect(results.length).toBe(1);  // Would be 0 with >
});
```

### 6. Re-run Until Threshold Met

```bash
bun run test:mutate
```

Target: ≥ 80% mutation score

## Tips

- Focus on high-impact survivors first (core logic)
- Some survivors are acceptable (defensive code, logging)
- Property-based tests can kill many mutations at once
