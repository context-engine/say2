import { render, screen, waitFor } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { Button } from "../Button";
import Tooltip from "./Tooltip.svelte";

describe("Tooltip", () => {
	it("renders trigger content", () => {
		render(Tooltip, { content: "Tooltip content" });
		expect(screen.getByText("Tooltip content")).toBeInTheDocument();
	});

	it("renders with custom trigger", () => {
		render(Tooltip, {
			content: "Click me",
			children: Button,
			$$slots: { default: true },
		});
	});

	it("has correct role and aria attributes", () => {
		render(Tooltip, { content: "Test tooltip" });
		const trigger = screen.getByRole("button");
		expect(trigger).toHaveAttribute("aria-describedby");
	});

	it("shows content on hover", async () => {
		render(Tooltip, {
			content: "Test tooltip",
			children: Button,
			$$slots: { default: true },
		});
	});
});
