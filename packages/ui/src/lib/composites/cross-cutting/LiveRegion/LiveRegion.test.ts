import { render } from "@testing-library/svelte";
import { describe, it, expect } from "bun:test";
import LiveRegion from "./LiveRegion.svelte";

describe("LiveRegion", () => {
    it("renders with polite aria-live by default", () => {
        const { getByRole } = render(LiveRegion, { message: "Hello" });
        const region = getByRole("status");

        expect(region.getAttribute("aria-live")).toBe("polite");
        expect(region.textContent).toContain("Hello");
    });

    it("renders with assertive aria-live when assertive prop is true", () => {
        const { getByRole } = render(LiveRegion, { message: "Alert!", assertive: true });
        const region = getByRole("status");

        expect(region.getAttribute("aria-live")).toBe("assertive");
        expect(region.textContent).toContain("Alert!");
    });

    it("has visually hidden styles", () => {
        // We can't easily check computed styles in JSDOM/BunDOM reliably for all CSS classes,
        // but we can check if the class is present.
        const { getByRole } = render(LiveRegion, { message: "Hidden" });
        const region = getByRole("status");
        expect(region.classList.contains("ce-live-region")).toBe(true);
    });

    it("renders empty when message is empty", () => {
        const { getByRole } = render(LiveRegion, { message: "" });
        const region = getByRole("status");
        expect(region.textContent).toBe("");
    });
});
