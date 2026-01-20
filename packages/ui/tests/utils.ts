import { type RenderResult, render } from "@testing-library/svelte";
import type { ComponentType } from "svelte";

/**
 * Render a Svelte 5 component for testing.
 * Wraps @testing-library/svelte render with proper typing.
 */
export function renderComponent<T extends Record<string, any>>(
    component: ComponentType<T>,
    props?: T,
): RenderResult<ComponentType<T>> {
    return render(component, { props });
}

// Re-export everything from testing-library
export * from "@testing-library/svelte";
