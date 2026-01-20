import { render, type RenderResult } from '@testing-library/svelte';
import type { Component } from 'svelte';

/**
 * Render a Svelte 5 component for testing.
 * Wraps @testing-library/svelte render with proper typing.
 */
export function renderComponent<T extends Component>(
    component: T,
    props?: Record<string, unknown>
): RenderResult<T> {
    return render(component, { props });
}

// Re-export everything from testing-library
export * from '@testing-library/svelte';
