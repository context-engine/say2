---
name: detect-test-antipatterns
description: Detect fake safety patterns in tests that provide false confidence. Use when reviewing test quality, after automated checks pass, or when tests seem suspicious.
allowed-tools: Read Grep Glob
---

# Detect Test Anti-Patterns

Find patterns that create false confidence - tests that appear to verify behavior but don't.

## Instructions

### 1. Hidden Assertions (CRITICAL)

Search for assertions inside callbacks:
```bash
grep -rn "expect(" packages/*/src/*.test.ts | grep -E "\([^)]+\) =>"
```

**Anti-pattern:**
```typescript
// ❌ BAD - expect may never run if callback doesn't execute
pipeline.use(async (ctx) => {
  expect(ctx.value).toBe("something");
});
await pipeline.run(ctx);
```

**Fix:**
```typescript
// ✅ GOOD - capture and assert after
let capturedValue: string;
let executed = false;
pipeline.use(async (ctx) => {
  executed = true;
  capturedValue = ctx.value;
});
await pipeline.run(ctx);
expect(executed).toBe(true);
expect(capturedValue).toBe("something");
```

### 2. Weak toBeDefined() Assertions

Search for:
```bash
grep -rn "toBeDefined()" packages/*/src/*.test.ts
```

**Anti-pattern:**
```typescript
// ❌ BAD - passes even if value is wrong
expect(event.id).toBeDefined();
```

**Fix:**
```typescript
// ✅ GOOD - verify actual value
expect(event.id).toMatch(/^[0-9a-f-]{36}$/i);
```

### 3. Tautological Comparisons

Search for:
```bash
grep -rn "toBeGreaterThanOrEqual" packages/*/src/*.test.ts
```

**Anti-pattern:**
```typescript
// ❌ BAD - always passes if unchanged
expect(updated.getTime()).toBeGreaterThanOrEqual(original.getTime());
```

**Fix:**
```typescript
// ✅ GOOD - strict with delay
await new Promise(r => setTimeout(r, 5));
expect(updated.getTime()).toBeGreaterThan(original.getTime());
```

### 4. Length-Only Checks

Search for:
```bash
grep -rn "\.length).toBe" packages/*/src/*.test.ts
```

**Anti-pattern:**
```typescript
// ❌ BAD - could be wrong items
expect(sessions.length).toBe(3);
```

**Fix:**
```typescript
// ✅ GOOD - verify content too
expect(sessions.length).toBe(3);
expect(sessions.map(s => s.id)).toContain(expected1.id);
```

### 5. Existence-Only Tests

**Anti-pattern:**
```typescript
// ❌ BAD - doesn't test behavior
it("exports SessionManager", () => {
  expect(SessionManager).toBeDefined();
});
```

**Fix:**
```typescript
// ✅ GOOD - verify functionality
it("exports working SessionManager", () => {
  const manager = new SessionManager();
  const session = manager.create({ name: "test", transport: "stdio" });
  expect(session.state).toBe("CREATED");
});
```

## Output

For each anti-pattern found, document:
1. File and line number
2. The problematic code
3. Suggested fix
