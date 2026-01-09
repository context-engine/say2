---
name: write-test-from-scenario
description: Convert a specification scenario into a well-structured test case. Use when implementing a specific test scenario from requirements.
allowed-tools: Read Edit Write
---

# Write Test from Scenario

Convert a specification scenario into a well-structured test case.

## Instructions

### 1. Understand the Scenario

Read the scenario description from the spec. Identify:
- **What** behavior is being tested
- **What** the preconditions are
- **What** the expected outcome is
- **What** edge cases exist

### 2. Determine Test Location

Find or create the appropriate test file:
- Unit tests: `packages/{package}/src/{component}.test.ts`
- Integration tests: `packages/{package}/src/e2e.test.ts`

### 3. Write the Test

Use the Arrange-Act-Assert pattern:

```typescript
test("descriptive name of what it verifies", () => {
  // Arrange - set up preconditions
  const input = createInput();

  // Act - perform the action
  const result = component.action(input);

  // Assert - verify the outcome
  expect(result.property).toBe(expectedValue);
});
```

### 4. Add Edge Cases

For each scenario, consider:
- Empty inputs
- Null/undefined values
- Boundary values (0, -1, max)
- Invalid inputs

```typescript
test("handles empty input gracefully", () => {
  const result = component.action([]);
  expect(result).toEqual([]);
});

test("returns undefined for missing item", () => {
  const result = component.get("non-existent");
  expect(result).toBeUndefined();
});
```

### 5. Add Error Cases

```typescript
test("throws on invalid input", () => {
  expect(() => {
    component.action(invalidInput);
  }).toThrow("Expected error message");
});
```

## Best Practices

### Naming
- Use present tense: "creates", "returns", "throws"
- Be specific: "creates session with unique ID" not "works"

### Assertions
- Use specific matchers: `toBe`, `toEqual`, `toMatch`
- Avoid weak assertions: `toBeDefined`, `toBeTruthy`
- Assert actual values, not just existence

### Structure
- One concept per test
- Independent tests (no shared state)
- Use `beforeEach` for common setup

## Example

**Scenario from spec:**
> Sessions must be created with unique IDs

**Test implementation:**
```typescript
describe("SessionManager", () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  test("creates session with unique ID", () => {
    const config = { name: "test", transport: "stdio" };

    const session1 = manager.create(config);
    const session2 = manager.create(config);

    expect(session1.id).not.toBe(session2.id);
    expect(session1.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  test("creates session in CREATED state", () => {
    const session = manager.create({ name: "test", transport: "stdio" });
    expect(session.state).toBe("CREATED");
  });
});
```
