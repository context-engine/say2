import { render, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, jest, beforeAll } from "bun:test";
import Wrapper from "./ContextMenu.story-wrapper.svelte";

// Mock Web Animations API
beforeAll(() => {
    if (typeof Element !== "undefined" && !Element.prototype.animate) {
        Element.prototype.animate = () =>
            ({
                finished: Promise.resolve(),
                cancel: () => { },
                onfinish: null,
                play: () => { },
                pause: () => { },
                reverse: () => { },
            }) as any;
    }
});

describe("ContextMenu", () => {
    it("renders trigger and opens menu on right-click", async () => {
        const { getByText, queryByText } = render(Wrapper);

        // Trigger is visible
        expect(getByText("Right-click anywhere in this area")).toBeTruthy();

        // Menu content should not be in document initially
        expect(queryByText("Copy Value")).toBeNull();

        const area = getByText("Right-click anywhere in this area").closest(
            ".demo-area",
        );
        if (!area) throw new Error("Demo area not found");

        // Simulate right-click
        await fireEvent.contextMenu(area);

        // Wait for the portal to render the content
        await waitFor(() => {
            expect(getByText("Copy Value")).toBeTruthy();
        });

        expect(getByText("Copy Path")).toBeTruthy();
        expect(getByText("Delete Node")).toBeTruthy();
    });
});
