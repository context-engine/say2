import { renderComponent, screen } from "../../../../tests/utils";
import { describe, expect, it } from "bun:test";
import Icon from "./Icon.svelte";
import { Settings, Check, Search } from "lucide-svelte";

describe("Icon", () => {
    it("renders icon", () => {
        const { container } = renderComponent(Icon, { icon: Settings });
        const iconWrapper = container.querySelector(".icon");
        expect(iconWrapper).toBeTruthy();
        expect(iconWrapper?.getAttribute("aria-hidden")).toBe("true");
        // Check SVG is rendered
        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();
    });

    it("applies sm size", () => {
        const { container } = renderComponent(Icon, { icon: Settings, size: "sm" });
        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute("width")).toBe("14");
        expect(svg?.getAttribute("height")).toBe("14");
    });

    it("applies md size (default)", () => {
        const { container } = renderComponent(Icon, { icon: Settings });
        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute("width")).toBe("16");
        expect(svg?.getAttribute("height")).toBe("16");
    });

    it("applies lg size", () => {
        const { container } = renderComponent(Icon, { icon: Settings, size: "lg" });
        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute("width")).toBe("20");
        expect(svg?.getAttribute("height")).toBe("20");
    });

    it("applies custom numeric size", () => {
        const { container } = renderComponent(Icon, { icon: Settings, size: 32 });
        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute("width")).toBe("32");
        expect(svg?.getAttribute("height")).toBe("32");
    });

    it("applies custom color", () => {
        const { container } = renderComponent(Icon, { icon: Check, color: "red" });
        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute("stroke")).toBe("red");
    });

    it("applies label for accessibility", () => {
        renderComponent(Icon, { icon: Search, label: "Search" });
        // When label is provided, aria-hidden should be false
        const iconWrapper = screen.getByRole("img");
        expect(iconWrapper).toBeTruthy();
        expect(iconWrapper.getAttribute("aria-hidden")).toBe("false");
        // Screen reader text should exist
        const srOnly = screen.getByText("Search");
        expect(srOnly).toBeTruthy();
    });

    it("renders without label (decorative)", () => {
        const { container } = renderComponent(Icon, { icon: Settings });
        const iconWrapper = container.querySelector(".icon");
        expect(iconWrapper).toBeTruthy();
        expect(iconWrapper?.getAttribute("aria-hidden")).toBe("true");
        expect(iconWrapper?.getAttribute("role")).toBeNull();
    });
});
