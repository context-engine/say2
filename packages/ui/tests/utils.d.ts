import { type RenderResult } from "@testing-library/svelte";
import type { Component, ComponentProps } from "svelte";
/**
 * Render a Svelte 5 component for testing.
 * Wraps @testing-library/svelte render with proper typing.
 */
export declare function renderComponent<T extends Component<any>>(component: T, props?: ComponentProps<T>): RenderResult<T>;
export * from "@testing-library/svelte";
