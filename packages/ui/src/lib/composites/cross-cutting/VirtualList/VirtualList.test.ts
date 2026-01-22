import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "bun:test";
import VirtualList from "./VirtualList.svelte";
import VirtualListTestWrapper from "./VirtualList.test-wrapper.svelte";

// Mock ResizeObserver for TanStack Virtual
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe("VirtualList", () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i, text: `Item ${i}` }));
    const itemHeight = 50;

    it("renders only a subset of items initially", async () => {
        const { container } = render(VirtualListTestWrapper, {
            props: {
                items,
                itemHeight
            }
        });

        const renderedItems = container.querySelectorAll("[data-index]");
        // With 0 height container, it should only render the overscan (default 3)
        // but at least less than 100.
        expect(renderedItems.length).toBeLessThan(items.length);
    });

    it("renders empty state when items is empty", () => {
        render(VirtualList, {
            props: {
                items: [],
                itemHeight,
                children: () => ({} as any)
            }
        });
        expect(screen.getByText("No items to display")).toBeTruthy();
    });

    // Testing scroll methods would require bind:this which is hard in
    // testing-library-svelte without a wrapper component.
    // We'll trust TanStack Virtual for the core logic and focus on our integration.
});
