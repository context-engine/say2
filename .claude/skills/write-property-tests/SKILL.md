---
name: write-property-tests
description: Create property-based tests using fast-check to verify invariants hold for all inputs. Use when testing pure functions or code with clear mathematical properties.
allowed-tools: Read Edit Write
---

# Write Property Tests

Create property-based tests that verify invariants hold for any valid input.

## Instructions

### 1. Identify Candidates

Property-based testing works best for:
- Pure functions (no side effects)
- Code with mathematical properties
- Parsers and serializers
- Data transformations

### 2. Identify Properties to Test

Common property types:

| Property Type | Example |
|---------------|---------|
| **Uniqueness** | Generated IDs are always unique |
| **Preservation** | Input data is preserved through transformation |
| **Round-trip** | encode(decode(x)) === x |
| **Idempotence** | f(f(x)) === f(x) |
| **Commutativity** | f(a, b) === f(b, a) |
| **Invariants** | Output always satisfies some condition |

### 3. Write the Property Test

```typescript
import { describe, test, expect } from "bun:test";
import fc from "fast-check";

describe("Property-Based Tests", () => {
  test("property description", () => {
    fc.assert(
      fc.property(
        fc.arbitraryForInput(),  // Generator
        (input) => {
          // Property that must hold for ALL inputs
          return someCondition(input);
        }
      ),
      { numRuns: 100 }  // Number of random inputs
    );
  });
});
```

### 4. Common Arbitraries (Generators)

| Type | Arbitrary |
|------|-----------|
| String | `fc.string()` |
| Integer | `fc.integer()` |
| UUID | `fc.uuid()` |
| Array | `fc.array(fc.integer())` |
| Object | `fc.record({ key: fc.string() })` |
| JSON | `fc.jsonValue()` |
| Constant | `fc.constant("value")` |
| One of | `fc.constantFrom("a", "b", "c")` |
| Optional | `fc.option(fc.string())` |

### 5. Example Property Tests

**Uniqueness:**
```typescript
test("IDs are always unique", () => {
  fc.assert(
    fc.property(fc.string({ minLength: 1 }), (name) => {
      const obj1 = create(name);
      const obj2 = create(name);
      return obj1.id !== obj2.id;
    })
  );
});
```

**Preservation:**
```typescript
test("sessionId is always preserved", () => {
  fc.assert(
    fc.property(fc.uuid(), (sessionId) => {
      const event = createEvent(sessionId, payload);
      return event.sessionId === sessionId;
    })
  );
});
```

**Round-trip:**
```typescript
test("JSON round-trip preserves data", () => {
  fc.assert(
    fc.property(fc.jsonValue(), (value) => {
      const serialized = JSON.stringify(value);
      const deserialized = JSON.parse(serialized);
      return deepEqual(value, deserialized);
    })
  );
});
```

**Invariants:**
```typescript
test("size is always non-negative", () => {
  fc.assert(
    fc.property(fc.jsonValue(), (payload) => {
      const event = createEvent("session", payload);
      return (event.size ?? 0) >= 0;
    })
  );
});
```

## When to Use

✅ **Good for:**
- ID generation (uniqueness)
- Data transformation (preservation)
- Serialization (round-trip)
- Mathematical operations (commutativity, associativity)

❌ **Not ideal for:**
- UI testing
- Integration tests with external services
- Tests requiring specific example outputs

## Tips

1. **Start with 100 runs**, increase for critical code
2. **Use shrinking** - fast-check finds minimal failing case
3. **Combine with example-based tests** - use both approaches
4. **Type your generators** - ensures valid input domain
