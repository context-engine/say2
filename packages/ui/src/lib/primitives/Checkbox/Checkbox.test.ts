import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Checkbox from "./Checkbox.svelte";

describe("Checkbox", () => {
	it("renders unchecked by default", () => {
		render(Checkbox, { checked: false });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).not.toBeChecked();
		expect(checkbox).toHaveAttribute("aria-checked", "false");
	});

	it("renders checked state", () => {
		render(Checkbox, { checked: true });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeChecked();
		expect(checkbox).toHaveAttribute("aria-checked", "true");
	});

	it("shows label when provided", () => {
		render(Checkbox, { label: "Test Label" });
		expect(screen.getByText("Test Label")).toBeInTheDocument();
	});

	it("toggles on click", async () => {
		let checkedValue = false;
		const onChange = (v: boolean) => {
			checkedValue = v;
		};

		render(Checkbox, { checked: false, onchange: onChange });

		const checkbox = screen.getByRole("checkbox");
		await fireEvent.click(checkbox);
		expect(checkedValue).toBe(true);
	});

	it("does not toggle when disabled", async () => {
		const checkedValue = true;
		const onChange = () => {
			throw new Error("Should not call onchange when disabled");
		};

		render(Checkbox, { checked: false, disabled: true, onchange: onChange });

		const checkbox = screen.getByRole("checkbox");
		await fireEvent.click(checkbox);
		expect(checkbox).not.toBeChecked();
	});

	it("toggles on space key", async () => {
		let checkedValue = false;
		const onChange = (v: boolean) => {
			checkedValue = v;
		};

		render(Checkbox, { checked: false, onchange: onChange });

		const checkbox = screen.getByRole("checkbox");
		await fireEvent.keyDown(checkbox, { key: " " });
		expect(checkedValue).toBe(true);
	});

	it("shows indeterminate state", () => {
		render(Checkbox, { checked: false, indeterminate: true });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toHaveAttribute("aria-checked", "mixed");
	});

	it("has correct role and aria attributes", () => {
		render(Checkbox, { checked: true, disabled: true });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toHaveAttribute("role", "checkbox");
		expect(checkbox).toHaveAttribute("aria-checked", "true");
		expect(checkbox).toHaveAttribute("aria-disabled", "true");
	});
});
