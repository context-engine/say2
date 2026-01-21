# @say2/ui

UI component library for Say2, built with Svelte 5 and TypeScript.

## Overview

This package provides a set of primitive and composite UI components using:
- **Svelte 5** (with runes)
- **bits-ui** for headless component primitives
- **TypeScript** for type safety
- **Storybook** for component development and documentation
- **Bun** for testing

## Installation

```bash
bun install
```

## Development

### Storybook

Run Storybook for interactive component development:

```bash
bun run dev
```

This will start Storybook at [http://localhost:6006](http://localhost:6006) where you can:
- Browse all components in isolation
- View component documentation
- Interact with component controls
- Test different component states and variants

### Build Storybook

To build a static version of Storybook:

```bash
bun run build:storybook
```

## Testing

Run all tests:

```bash
bun run test
```

Run tests in watch mode:

```bash
bun run test:watch
```

## Building

Build the component library for distribution:

```bash
bun run build
```

This generates the package output in the `dist/` directory.

## Type Checking

Run Svelte type checking:

```bash
bun run check
```

## Component Structure

Components are organized into:
- **Primitives** (`src/lib/primitives/`) - Basic UI building blocks
  - Button, Badge, Input, Checkbox, Select, etc.
- **Composites** (`src/lib/composites/`) - Complex components built from primitives

Each component typically includes:
- `*.svelte` - Component implementation
- `*.stories.ts` - Storybook stories
- `*.test.ts` - Unit tests
- `index.ts` - Barrel export
