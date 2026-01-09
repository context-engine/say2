---
name: map-spec-to-tests
description: Map specification scenarios to test cases and identify coverage gaps. Use when verifying test completeness against requirements or during test quality reviews.
allowed-tools: Read Grep Glob
---

# Map Spec to Tests

Create a traceability matrix linking spec scenarios to test implementations.

## Instructions

### 1. Locate the Spec Document

Find the relevant spec file:
```
say2/3-how/multi-protocols/say2/specs/v1/02-architecture/shared/03-phased-implementation/
```

### 2. Extract Test Scenarios

Look for sections with scenario lists:
- Checkboxes: `- [ ]` or `- [x]`
- Numbered lists describing expected behavior
- Tables with acceptance criteria

### 3. For Each Scenario

Search for corresponding tests:
```bash
grep -rn "scenario keyword" packages/*/src/*.test.ts
```

### 4. Create Traceability Matrix

Document in this format:

```markdown
| Spec Scenario | Test Location | Status | Notes |
|---------------|---------------|--------|-------|
| Sessions have unique IDs | manager.test.ts:L25 | ✅ | |
| Messages preserve order | message-store.test.ts:L74 | ✅ | |
| Middleware chain order | pipeline.test.ts:L30 | ✅ | |
| Error state transition | manager.test.ts:L89 | ⚠️ | Only happy path |
| Query by time range | - | ❌ | Not implemented |
```

### Status Legend

- ✅ **Fully covered** - Test exists and verifies all aspects
- ⚠️ **Partially covered** - Test exists but missing edge cases
- ❌ **Not covered** - No test found

### 5. For Missing or Partial Coverage

Document:
1. What specific behavior is not tested
2. Which edge cases are missing
3. Recommended test to add

### 6. Update Spec Document

After analysis, update the spec with verification status:

```markdown
## Test Scenarios

- [x] Sessions are created with unique IDs *(manager.test.ts)*
- [x] Messages can be stored and retrieved *(message-store.test.ts)*
- [ ] Query filtering by time range *(NOT TESTED)*
```

## Example Output

```markdown
## Traceability Report for Phase 0

**Coverage Summary:** 12/14 scenarios (86%)

### Fully Covered (10)
- Session lifecycle management
- Message storage and retrieval
- Middleware execution order

### Partially Covered (2)
- Error handling: missing timeout scenarios

### Not Covered (2)
- Concurrent session handling
```
