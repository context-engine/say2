import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "bun:test";
import Tooltip from "./Tooltip.svelte";

describe("Tooltip", () => {
	it("renders trigger element", () => {
		const { container } = render(Tooltip, { content: "Tooltip content" });
		expect(container.querySelector(".ce-tooltip-trigger")).toBeTruthy();
	});

	it("has correct aria attributes", () => {
		render(Tooltip, { content: "Test tooltip" });
		const trigger = screen.getByRole("button");
		expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
	});
});
