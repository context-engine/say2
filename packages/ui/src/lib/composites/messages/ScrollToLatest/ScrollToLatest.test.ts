import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "bun:test";
import ScrollToLatest from "./ScrollToLatest.svelte";

describe("ScrollToLatest", () => {
    it("renders auto-scroll label", () => {
        const { getByText } = render(ScrollToLatest);
        expect(getByText("Auto-scroll")).toBeTruthy();
    });

    it("calls onScrollToBottom when scroll button clicked", async () => {
        const onScrollToBottom = vi.fn();
        const { container } = render(ScrollToLatest, { onScrollToBottom });

        const scrollBtn = container.querySelector("[aria-label='Scroll to bottom']");
        await fireEvent.click(scrollBtn!);
        expect(onScrollToBottom).toHaveBeenCalled();
    });
});
