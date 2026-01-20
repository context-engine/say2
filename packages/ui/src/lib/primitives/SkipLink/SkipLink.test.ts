import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import SkipLink from "./SkipLink.svelte";

describe("SkipLink", () => {
	it("renders with default props", () => {
		render(SkipLink);
		const link = screen.getByRole("link");
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "#main-content");
		expect(link).toHaveTextContent("Skip to main content");
	});

	it("renders with custom props", () => {
		render(SkipLink, {
			href: "#app",
			targetId: "app",
			label: "Skip to app",
		});
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "#app");
		expect(link).toHaveTextContent("Skip to app");
	});

	it("has correct href", () => {
		render(SkipLink, { href: "#content" });
		expect(screen.getByRole("link")).toHaveAttribute("href", "#content");
	});

	it("has text content", () => {
		render(SkipLink, { label: "Skip navigation" });
		expect(screen.getByText("Skip navigation")).toBeInTheDocument();
	});
});
