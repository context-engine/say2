import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "bun:test";
import MethodBreakdown from "./MethodBreakdown.svelte";

describe("MethodBreakdown", () => {
    const defaultBreakdown = [
        { method: "tools/list", count: 150, percentage: 45 },
        { method: "tools/call", count: 100, percentage: 30 },
        { method: "resources/read", count: 50, percentage: 15 },
    ];

    it("displays methods sorted by count", () => {
        const { container } = render(MethodBreakdown, {
            breakdown: [
                { method: "low", count: 10, percentage: 10 },
                { method: "high", count: 100, percentage: 50 },
                { method: "mid", count: 50, percentage: 40 },
            ],
        });

        const labels = container.querySelectorAll(".ce-method-bar__label");
        expect(labels[0].textContent).toBe("high");
        expect(labels[1].textContent).toBe("mid");
        expect(labels[2].textContent).toBe("low");
    });

    it("displays percentage as bar width", () => {
        const { container } = render(MethodBreakdown, {
            breakdown: defaultBreakdown,
        });

        const fills = container.querySelectorAll(".ce-method-bar__fill");
        expect((fills[0] as HTMLElement).style.width).toBe("45%");
    });

    it("formats counts with commas", () => {
        const { container } = render(MethodBreakdown, {
            breakdown: [
                { method: "test", count: 1234567, percentage: 100 },
            ],
        });

        expect(container.textContent).toContain("1,234,567");
    });

    it("calls onmethodclick when method clicked", async () => {
        const onmethodclick = vi.fn();
        const { container } = render(MethodBreakdown, {
            breakdown: defaultBreakdown,
            onmethodclick,
        });

        const firstButton = container.querySelector(".ce-method-bar");
        if (firstButton) {
            await fireEvent.click(firstButton);
            expect(onmethodclick).toHaveBeenCalledWith("tools/list");
        }
    });

    it("shows skeleton placeholders when loading", () => {
        const { container } = render(MethodBreakdown, {
            breakdown: [],
            loading: true,
        });

        const skeletons = container.querySelectorAll(".ce-method-bar--skeleton");
        expect(skeletons.length).toBe(3);
    });

    it("shows empty state when no methods", () => {
        const { getByText } = render(MethodBreakdown, {
            breakdown: [],
            loading: false,
        });

        expect(getByText("No methods recorded yet")).toBeTruthy();
    });
});
