import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "bun:test";
import LiveUpdateMarker from "./LiveUpdateMarker.svelte";

describe("LiveUpdateMarker", () => {
    it("renders when count > 0", () => {
        const { getByText } = render(LiveUpdateMarker, { count: 5 });
        expect(getByText("5 new")).toBeTruthy();
    });

    it("does not render when count is 0", () => {
        const { container } = render(LiveUpdateMarker, { count: 0 });
        const marker = container.querySelector(".ce-live-update-marker");
        expect(marker).toBeNull();
    });

    it("calls onClick when clicked", async () => {
        const onClick = vi.fn();
        const { container } = render(LiveUpdateMarker, { count: 3, onClick });

        const btn = container.querySelector(".ce-button--primary");
        await fireEvent.click(btn!);
        expect(onClick).toHaveBeenCalled();
    });
});
