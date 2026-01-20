import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Spinner from "./Spinner.svelte";

describe("Spinner", () => {
	it("renders with default props", () => {
		render(Spinner);
		const svg = screen.getByRole("status");
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveAttribute("aria-label", "Loading");
	});

	it("renders with custom label", () => {
		render(Spinner, { label: "Saving..." });
		expect(screen.getByRole("status")).toHaveAttribute(
			"aria-label",
			"Saving...",
		);
	});

	it("applies size classes", () => {
		const { container: smContainer } = render(Spinner, { size: "sm" });
		expect(smContainer.querySelector(".spinner--sm")).toBeInTheDocument();

		const { container: mdContainer } = render(Spinner, { size: "md" });
		expect(mdContainer.querySelector(".spinner--md")).toBeInTheDocument();

		const { container: lgContainer } = render(Spinner, { size: "lg" });
		expect(lgContainer.querySelector(".spinner--lg")).toBeInTheDocument();
	});

	it("applies custom color", () => {
		render(Spinner, { color: "#ff0000" });
		const spinner = screen.getByRole("status");
		expect(spinner).toHaveStyle({ "--spinner-color": "#ff0000" });
	});

	it("has correct role", () => {
		render(Spinner);
		expect(screen.getByRole("status")).toBeInTheDocument();
	});
});
