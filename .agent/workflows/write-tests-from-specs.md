---
description: Write tests from architecture and scenario specifications. Use when implementing tests for a new feature, module, or phase based on spec documents.
---

# Write Tests from Specs Workflow

This workflow guides the creation of high-quality tests from specification documents.

## Inputs Required

1. **Architecture Spec** - Describes the system design, components, and their interactions
2. **Test Scenario Spec** - Lists the specific scenarios and acceptance criteria to verify

## Skills

This workflow uses the following skills (paths relative to `say2/implementation`):

| Skill | Path | Purpose |
|-------|------|---------|
| `write-test-from-scenario` | `.claude/skills/write-test-from-scenario/SKILL.md` | Convert a scenario to a test |
| `write-property-tests` | `.claude/skills/write-property-tests/SKILL.md` | Create property-based tests |

---

# Part A: Understand the Spec

## A1. Read Architecture Spec

Read the architecture document to understand:
- What components exist
- What each component does
- How components interact
- What the public API looks like
- **Upstream dependencies** (external libraries)
- **Downstream consumers** (what uses this component)

## A2. Read Test Scenario Spec

Read the scenario document to understand:
- What behaviors must be verified
- What edge cases exist
- What error conditions to handle
- What acceptance criteria define "done"

## A3. Identify Test Layers

For each component, determine which test types are needed:

| Layer | When to Use | Example |
|-------|-------------|---------|
| **Unit** | Single component in isolation | `SessionManager.create()` |
| **Integration** | Multiple components together | `Pipeline → Store` |
| **E2E** | Full flow across all components | `Session → Middleware → Storage → Query` |

---

# Part B: Write Unit Tests

## B1. Setup Test File

For each component, create or update the test file:

```typescript
import { beforeEach, describe, expect, test } from "bun:test";
import { ComponentName } from "./component";

describe("ComponentName", () => {
  let component: ComponentName;

  beforeEach(() => {
    component = new ComponentName();
  });

  // Tests go here
});
```

**Important:** Do NOT include phase references (e.g., "Phase 0") in code comments or test names. Phases are planning artifacts, not code artifacts.

## B2. Write Happy Path Tests First

For each scenario in the spec:

1. **Name the test clearly** - describe what behavior it verifies
2. **Arrange** - set up the preconditions
3. **Act** - perform the action
4. **Assert** - verify the expected outcome

```typescript
test("creates session with unique ID", () => {
  // Arrange
  const config = { name: "test", transport: "stdio" };

  // Act
  const session1 = manager.create(config);
  const session2 = manager.create(config);

  // Assert
  expect(session1.id).not.toBe(session2.id);
  expect(session1.id).toMatch(/^[0-9a-f-]{36}$/i);
});
```

## B3. Write Edge Case Tests

For each scenario, identify and test:
- Empty inputs
- Null/undefined values
- Boundary values
- Invalid inputs

```typescript
test("returns undefined for unknown session ID", () => {
  const result = manager.get("non-existent-id");
  expect(result).toBeUndefined();
});

test("rejects empty name", () => {
  expect(() => {
    manager.create({ name: "", transport: "stdio" });
  }).toThrow();
});
```

## B4. Write Error Case Tests

For each error condition in the spec:

```typescript
test("throws on invalid transport type", () => {
  expect(() => {
    manager.create({ name: "test", transport: "invalid" });
  }).toThrow("Invalid transport");
});
```

## B5. Handle Array Access

When accessing array elements, use non-null assertion to satisfy TypeScript:

```typescript
// ✅ Good - explicit non-null assertion
expect(messages[0]!.method).toBe("first");

// ❌ Bad - TypeScript error TS2532
expect(messages[0].method).toBe("first");
```

---

# Part C: Write E2E Integration Tests

## C1. Create E2E Test File

Create a separate file for end-to-end tests that verify full flows:

```typescript
// e2e.test.ts
describe("Core E2E", () => {
  // Fresh instances for isolation
  let sessionManager: SessionManager;
  let messageStore: MessageStore;
  let pipeline: MiddlewarePipeline;

  beforeEach(() => {
    sessionManager = new SessionManager();
    messageStore = new MessageStore();
    pipeline = new MiddlewarePipeline();
  });
});
```

## C2. Test Full Message Flow

Cover the complete lifecycle:

```typescript
test("session creation → message processing → storage → query → close", async () => {
  // 1. Create session
  const session = sessionManager.create(config);
  
  // 2. Transition state
  sessionManager.updateState(session.id, SessionState.ACTIVE);
  
  // 3. Setup middleware
  pipeline.use(storageMiddleware);
  
  // 4. Process messages
  await pipeline.process(event, session);
  
  // 5. Query stored messages
  const messages = messageStore.getBySession(session.id);
  expect(messages.length).toBe(1);
  
  // 6. Close session
  sessionManager.close(session.id);
});
```

## C3. Test Component Isolation

Verify multiple instances don't interfere:

```typescript
test("handles multiple concurrent sessions independently", async () => {
  const session1 = sessionManager.create({ name: "server-1" });
  const session2 = sessionManager.create({ name: "server-2" });
  
  // ... process messages for both
  
  const session1Messages = messageStore.getBySession(session1.id);
  const session2Messages = messageStore.getBySession(session2.id);
  
  expect(session1Messages.length).toBe(1);
  expect(session2Messages.length).toBe(1);
});
```

## C4. Test Error Propagation

Verify errors propagate correctly across components:

```typescript
test("middleware errors propagate and don't affect store", async () => {
  pipeline.use(async (ctx, next) => {
    messageStore.store(ctx.event); // Store before error
    await next();
  });
  
  pipeline.use(async () => {
    throw new Error("Processing failed");
  });
  
  await expect(pipeline.process(event, session)).rejects.toThrow("Processing failed");
  
  // But message was stored before error
  expect(messageStore.getBySession(session.id).length).toBe(1);
});
```

---

# Part D: Verify Tests

## D1. Run Tests

// turbo
```bash
bun test
```

All tests should pass.

## D2. Run TypeScript Check

// turbo
```bash
bunx tsc --noEmit
```

Ensure no TypeScript errors.

## D3. Check Coverage

// turbo
```bash
bun test --coverage
```

Verify the new code is covered.

## D4. Run Quality Checks

// turbo
```bash
bun run quality
```

Ensure tests meet quality standards:
- Assertion density ≥ 1.0
- No lint errors

## D5. Run Mutation Testing (Optional)

// turbo
```bash
bun run test:mutate
```

Verify tests catch mutations (target ≥ 80%).

---

# Part E: Document Coverage

## E1. Update Spec with Test References

Mark each scenario in the spec as covered:

```markdown
## Test Scenarios

- [x] Sessions are created with unique IDs *(manager.test.ts:L25)*
- [x] Session state transitions correctly *(manager.test.ts:L45)*
- [ ] Concurrent sessions are isolated *(NOT YET IMPLEMENTED)*
```

## E2. Create Traceability Record

Document the mapping:

```markdown
| Spec Section | Test File | Line | Status |
|--------------|-----------|------|--------|
| 2.1 Session Creation | manager.test.ts | 25-40 | ✅ |
| 2.2 State Transitions | manager.test.ts | 45-80 | ✅ |
| 2.3 Capabilities | manager.test.ts | 85-110 | ⚠️ Partial |
```

---

# Best Practices

## Test Naming

Use descriptive names that state the expected behavior:
- ✅ `creates session with unique ID`
- ✅ `returns undefined for unknown session`
- ❌ `test1`
- ❌ `should work`

## No Phase References in Code

Phases are implementation planning artifacts. Do not include them in:
- Code comments (e.g., `// Phase 0: Foundation`)
- Test names (e.g., `describe("Phase 0 E2E")`)
- File names

Good:
```typescript
/**
 * Core Types
 * Data models for Say2 core functionality.
 */
```

Bad:
```typescript
/**
 * Phase 0: Foundation - Core Types
 * Data models for Say2 core functionality.
 */
```

## Assertion Strength

Use strong assertions:
- ✅ `expect(id).toMatch(/^[0-9a-f-]{36}$/i)`
- ✅ `expect(session.state).toBe("CREATED")`
- ❌ `expect(session).toBeDefined()`
- ❌ `expect(result).toBeTruthy()`

## Avoid Hidden Assertions

Never put assertions inside callbacks without verification:
```typescript
// ❌ BAD
middleware.use((ctx) => {
  expect(ctx.value).toBe("x");  // May never run!
});

// ✅ GOOD
let capturedValue: string;
middleware.use((ctx) => {
  capturedValue = ctx.value;
});
await middleware.run(ctx);
expect(capturedValue).toBe("x");
```

## Test Independence

Each test should be independent:
- Use `beforeEach` for setup
- Don't rely on test execution order
- Clean up after tests if needed

---

# Checklist

Before completing:

- [ ] All spec scenarios have corresponding tests
- [ ] Happy path covered for each feature
- [ ] Edge cases tested (empty, null, boundary)
- [ ] Error cases tested
- [ ] **E2E integration tests written**
- [ ] Tests pass (`bun test`)
- [ ] **TypeScript passes** (`bunx tsc --noEmit`)
- [ ] Coverage meets threshold (`bun test --coverage`)
- [ ] Quality checks pass (`bun run quality`)
- [ ] **No phase references in code**
- [ ] Spec updated with test references

---

*Workflow created: 2026-01-09*
*Updated: 2026-01-09 - Added E2E tests, TypeScript checks, no-phase-references rule*
*Complements: test-quality-review.md*
