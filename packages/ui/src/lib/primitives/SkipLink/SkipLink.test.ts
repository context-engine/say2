import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "bun:test";
import SkipLink from "./SkipLink.svelte";

describe("SkipLink", () => {
	it("renders with default props", () => {
		render(SkipLink);
		const link = screen.getByRole("link");
		expect(link).toBeTruthy();
		expect(link.getAttribute("href")).toBe("#main-content");
		expect(link.textContent).toBe("Skip to main content");
	});

	it("renders with custom props", () => {
		render(SkipLink, {
			href: "#app",
			targetId: "app",
			label: "Skip to app",
		});
		const link = screen.getByRole("link");
		expect(link.getAttribute("href")).toBe("#app");
		expect(link.textContent).toBe("Skip to app");
	});

	it("has correct href", () => {
		render(SkipLink, { href: "#content" });
		expect(screen.getByRole("link").getAttribute("href")).toBe("#content");
	});

	it("has text content", () => {
		render(SkipLink, { label: "Skip navigation" });
		expect(screen.getByText("Skip navigation")).toBeTruthy();
	});
});
