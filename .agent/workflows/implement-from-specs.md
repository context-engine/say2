---
description: Implement code from architecture specifications. Use when implementing a phase on a dedicated branch, independent from tests.
---

# Implement from Specs Workflow

Implement code from architecture specifications. Run on a separate branch from tests to ensure independence.

## Prerequisites

1. **Phase Architecture** - Complete with diagrams and implementation plan
2. **Dedicated Branch** - Implementation happens on its own branch

---

# Part A: Setup

## A0. Bare Clone Requirement (Human Prerequisite)

**IMPORTANT**: Work must happen in a bare clone with worktrees to enable parallel development of implementation and tests.

> **This is a one-time setup done by the human before starting the workflow.**

If you don't have a bare clone yet, create one:

```bash
# Clone as bare repo (one-time setup)
git clone --bare <repo-url> ~/repos/say2-impl.git

# Create worktree for main development
cd ~/repos/say2-impl.git
git worktree add ~/repos/say2-main main
```

Once the bare clone exists, the AI can create worktrees from it.

## A1. Create Implementation Worktree

From the bare clone, create a worktree for implementation:

```bash
cd ~/repos/say2-impl.git

# Create implementation worktree
git worktree add ~/repos/impl-phase-name -b impl/phase-name

# Open in editor
cd ~/repos/impl-phase-name
```

This enables:
- Running multiple editors simultaneously (one for impl, one for tests)
- True isolation between implementation and test branches
- No accidental cross-contamination

Branch naming examples:
- `impl/phase-0-foundation`
- `impl/builtin-client-core`
- `impl/message-store-refactor`

## A2. Read Architecture Spec

Review the phase architecture document:

- **ER Diagram** - Data models to implement
- **Class Diagram** - Classes, methods, relationships
- **Data Flow Diagram** - How data moves between components
- **Sequence Diagram** - Expected interaction flows
- **Upstream Integrations** - External dependencies to use
- **Downstream Integrations** - What will consume this phase
- **Implementation Plan** - Ordered list of components

## A3. Identify Dependencies

Check the "Dependencies to Add" section in the spec:

// turbo
```bash
bun add <dependencies-from-spec>
```

---

# Part B: Module Structure

## B1. Create Directories

Create directories per the Implementation Plan:

```bash
mkdir -p src/component-a
mkdir -p src/component-b
```

## B2. Create Module Index Files

Each module needs an index.ts for exports:

```typescript
// src/component-a/index.ts
export * from "./implementation";
```

## B3. Update Package Exports

Update the main package index to export new modules:

```typescript
// src/index.ts
export * from "./component-a";
export * from "./component-b";
```

---

# Part C: Implement Components

## C1. Follow Dependency Order

Implement components in the order specified in the Implementation Plan.

Earlier components should not depend on later ones.

## C2. Match Architecture Diagrams

- **Classes** should match the Class Diagram
- **Data models** should match the ER Diagram
- **Interactions** should follow the Sequence Diagram

## C3. No Tests on This Branch

Do NOT write tests on this branch. Tests are developed independently on a separate branch.

---

# Part D: Verify

## D1. TypeScript Check

// turbo
```bash
bunx tsc --noEmit
```

Fix any TypeScript errors.

## D2. Lint Check

// turbo
```bash
bun run lint
```

Fix any lint errors.

## D3. Build Check (if applicable)

// turbo
```bash
bun run build
```

Ensure the package builds successfully.

---

# Part E: Commit

## E1. Review Changes

```bash
git status
git diff
```

## E2. Commit Implementation

```bash
git add .
git commit -m "phase-N: implement <component-names>"
```

## E3. Do NOT Merge Yet

The implementation branch stays separate until:
1. Tests are complete on `tests/phase-name` branch
2. Both branches merge to main
3. Tests run against implementation

---

# Checklist

Before completing implementation:

- [ ] On dedicated branch (`impl/phase-name`)
- [ ] Dependencies added from spec
- [ ] All components from Implementation Plan created
- [ ] Classes match Class Diagram
- [ ] Data models match ER Diagram
- [ ] TypeScript passes (`bunx tsc --noEmit`)
- [ ] Lint passes
- [ ] No tests on this branch
- [ ] Changes committed

---

# Merge Strategy

After both branches are complete:

```bash
# Merge implementation first
git checkout main
git merge impl/phase-name

# Then merge tests
git merge tests/phase-name

# Run tests to validate
bun test
```

If tests fail, the implementation needs adjustment - but adjustments are made with full visibility of both code and tests.

---

*Workflow created: 2026-01-10*
*Pairs with: write-tests-from-specs.md (on separate branch)*
