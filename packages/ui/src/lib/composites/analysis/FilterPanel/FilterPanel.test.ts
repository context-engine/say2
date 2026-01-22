import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "bun:test";
import Wrapper from "./FilterPanel.story-wrapper.svelte";

describe("FilterPanel", () => {
    it("renders with default state", () => {
        const { getByText } = render(Wrapper);

        expect(getByText("Filters")).toBeTruthy();
        expect(getByText("Direction")).toBeTruthy();
        expect(getByText("Methods")).toBeTruthy();
        expect(getByText("Error Status")).toBeTruthy();
    });

    it("displays available methods as checkboxes", () => {
        const { container } = render(Wrapper, {
            availableMethods: ["tools/list", "tools/call"],
        });

        expect(container.textContent).toContain("tools/list");
        expect(container.textContent).toContain("tools/call");
    });

    it("shows reset button when filters are active", async () => {
        const { container } = render(Wrapper, {
            direction: "inbound",
        });

        // Reset button should show count
        expect(container.textContent).toContain("Reset");
    });

    it("renders error filter options", () => {
        const { container } = render(Wrapper);

        expect(container.textContent).toContain("All messages");
        expect(container.textContent).toContain("Errors only");
        expect(container.textContent).toContain("Hide errors");
    });

    it("shows current filter state", () => {
        const { container } = render(Wrapper, {
            direction: "outbound",
            methods: ["tools/list"],
        });

        const stateDisplay = container.querySelector("pre");
        expect(stateDisplay?.textContent).toContain('"direction": "outbound"');
        expect(stateDisplay?.textContent).toContain('"tools/list"');
    });
});
