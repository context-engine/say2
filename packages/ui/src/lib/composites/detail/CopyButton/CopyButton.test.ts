import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, jest, beforeAll, afterAll } from "bun:test";
import CopyButton from "./CopyButton.svelte";

describe("CopyButton", () => {
    let originalClipboard: any;

    beforeAll(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: jest.fn().mockResolvedValue(undefined)
            },
            configurable: true,
            writable: true
        });

        // Mock Web Animations API missing in JSDOM/Bun
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

    afterAll(() => {
        // No simple way to restore if it was truly read-only, 
        // but since we made it configurable/writable it's fine for tests.
    });

    it("renders label and copies text on click", async () => {
        const { getByText, getByRole } = render(CopyButton, {
            value: "Test Value",
            label: "Copy Me"
        });

        expect(getByText("Copy Me")).toBeTruthy();

        const button = getByRole("button");
        await fireEvent.click(button);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Test Value");
        expect(getByText("Copied!")).toBeTruthy();
    });

    it("handles icon-only variant", async () => {
        const { getByRole, queryByText } = render(CopyButton, {
            value: "Icon Only"
        });

        const button = getByRole("button");
        expect(queryByText("Copied!")).toBeNull();

        await fireEvent.click(button);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Icon Only");
        expect(queryByText("Copied!")).toBeTruthy();
    });
});
