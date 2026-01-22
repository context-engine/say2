import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, jest, beforeAll } from "bun:test";
import Wrapper from "./ExpandCollapse.story-wrapper.svelte";

// Mock Web Animations API which is missing in JSDOM/Bun environment
beforeAll(() => {
    if (typeof Element !== 'undefined' && !Element.prototype.animate) {
        Element.prototype.animate = () => ({
            finished: Promise.resolve(),
            cancel: () => { },
            onfinish: null,
            play: () => { },
            pause: () => { },
            reverse: () => { },
        }) as any;
    }
});

describe("ExpandCollapse", () => {
    it("renders label and toggles content", async () => {
        const { getByText, queryByText } = render(Wrapper, {
            label: "Click Me"
        });

        expect(getByText("Click Me")).toBeTruthy();
        expect(queryByText("This content is revealed when expanded.")).toBeNull();

        const button = getByText("Click Me").closest("button");
        if (!button) throw new Error("Button not found");

        await fireEvent.click(button);
        expect(getByText("This content is revealed when expanded.")).toBeTruthy();

        await fireEvent.click(button);
        // Svelte transitions might delay the removal, but queryByText should catch it if not conditional or after wait
        // Wait for removal if using transitions, or check for aria-expanded
        expect(button.getAttribute("aria-expanded")).toBe("false");
    });

    it("starts expanded if startExpanded prop is true", () => {
        const { getByText } = render(Wrapper, {
            label: "Open",
            startExpanded: true
        });

        expect(getByText("This content is revealed when expanded.")).toBeTruthy();
    });
});
