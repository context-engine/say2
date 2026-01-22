import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "bun:test";
import Spinner from "./Spinner.svelte";

describe("Spinner", () => {
	it("renders with default props", () => {
		render(Spinner);
		const svg = screen.getByRole("status");
		expect(svg).toBeTruthy();
		expect(svg.getAttribute("aria-label")).toBe("Loading");
	});

	it("renders with custom label", () => {
		render(Spinner, { label: "Saving..." });
		expect(screen.getByRole("status").getAttribute("aria-label")).toBe("Saving...");
	});

	it("applies size classes", () => {
		const { container: smContainer } = render(Spinner, { size: "sm" });
		expect(smContainer.querySelector(".spinner--sm")).toBeTruthy();

		const { container: mdContainer } = render(Spinner, { size: "md" });
		expect(mdContainer.querySelector(".spinner--md")).toBeTruthy();

		const { container: lgContainer } = render(Spinner, { size: "lg" });
		expect(lgContainer.querySelector(".spinner--lg")).toBeTruthy();
	});

	it("applies custom color", () => {
		const { container } = render(Spinner, { color: "#ff0000" });
		const spinner = container.querySelector(".spinner");
		expect(spinner?.getAttribute("style")).toContain("--spinner-color: #ff0000");
	});

	it("has correct role", () => {
		render(Spinner);
		expect(screen.getByRole("status")).toBeTruthy();
	});
});
