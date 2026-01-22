import { type RenderResult, render } from "@testing-library/svelte";
import type { Component, ComponentProps } from "svelte";

/**
 * Render a Svelte 5 component for testing.
 * Wraps @testing-library/svelte render with proper typing.
 */
export function renderComponent<T extends Component<any>>(
    component: T,
    props?: ComponentProps<T>,
): RenderResult<T> {
    return render(component as any, { props } as any);
}

// Re-export everything from testing-library
export * from "@testing-library/svelte";
