---
name: run-quality-checks
description: Run automated test quality checks including tests, coverage, assertion density, and linting. Use when you need to verify test quality metrics or when tests might have issues.
allowed-tools: Bash Read
---

# Run Quality Checks

Run the automated quality checks to assess test health.

## Instructions

### 1. Quick Quality Check

```bash
bun run quality
```

This runs:
- All tests
- Assertion density check (≥ 1.0 per test)
- Lint checks

### 2. Full Quality Check (with mutation testing)

```bash
bun run quality:full
```

This adds mutation testing which is slower but more thorough.

### 3. Individual Checks

| Check | Command |
|-------|---------|
| Tests only | `bun test` |
| Coverage | `bun test --coverage` |
| Assertion density | `bun run test:density` |
| Lint | `bun run lint` |
| Mutation testing | `bun run test:mutate` |
| Property tests | `bun run test:property` |

## On Failure

1. Read the output to identify which check failed
2. Fix the issue in the test or source files
3. Re-run until all checks pass

## Expected Output

```
✅ All quality checks passed
```

With metrics:
- Mutation score: ≥ 80%
- Assertion density: ≥ 1.0 per test
- Line coverage: ≥ 80%
