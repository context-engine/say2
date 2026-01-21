import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "bun:test";
import Checkbox from "./Checkbox.svelte";

describe("Checkbox", () => {
	it("renders unchecked by default", () => {
		render(Checkbox, { checked: false });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox.getAttribute("aria-checked")).toBe("false");
		// data-state is what we use for styling now
		expect(checkbox.getAttribute("data-state")).toBe("unchecked");
	});

	it("renders checked state", () => {
		render(Checkbox, { checked: true });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox.getAttribute("aria-checked")).toBe("true");
		expect(checkbox.getAttribute("data-state")).toBe("checked");
	});

	it("shows label when provided", () => {
		render(Checkbox, { label: "Test Label" });
		expect(screen.getByText("Test Label")).toBeTruthy();
	});

	it("toggles on click", async () => {
		let checkedValue = false;
		const onChange = vi.fn((v: boolean) => {
			checkedValue = v;
		});

		render(Checkbox, { checked: false, onchange: onChange });

		const checkbox = screen.getByRole("checkbox");
		await fireEvent.click(checkbox);
		expect(onChange).toHaveBeenCalled();
		expect(checkedValue).toBe(true);
	});

	it("does not toggle when disabled", async () => {
		const onChange = vi.fn();

		render(Checkbox, { checked: false, disabled: true, onchange: onChange });

		const checkbox = screen.getByRole("checkbox");
		await fireEvent.click(checkbox);
		expect(onChange).not.toHaveBeenCalled();
	});

	it("shows indeterminate state", () => {
		render(Checkbox, { checked: false, indeterminate: true });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox.classList.contains("checkbox--indeterminate")).toBe(true);
		// bits-ui renders 'true' for indeterminate state in this version
		expect(checkbox.getAttribute("aria-checked")).toBe("true");
	});

	it("has correct role and aria attributes", () => {
		render(Checkbox, { checked: true, disabled: true });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox.getAttribute("role")).toBe("checkbox");
		expect(checkbox.hasAttribute("disabled")).toBe(true);
	});
});
