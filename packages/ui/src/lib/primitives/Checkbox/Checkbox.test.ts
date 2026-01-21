import { renderComponent, screen, fireEvent } from "../../../../tests/utils";
import { describe, expect, it, vi } from "bun:test";
import Checkbox from "./Checkbox.svelte";

describe("Checkbox", () => {
	it("renders unchecked by default", () => {
		renderComponent(Checkbox, { checked: false });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox.getAttribute("aria-checked")).toBe("false");
		// data-state is what we use for styling now
		expect(checkbox.getAttribute("data-state")).toBe("unchecked");
	});

	it("renders checked state", () => {
		renderComponent(Checkbox, { checked: true });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox.getAttribute("aria-checked")).toBe("true");
		expect(checkbox.getAttribute("data-state")).toBe("checked");
	});

	it("shows label when provided", () => {
		renderComponent(Checkbox, { label: "Test Label" });
		expect(screen.getByText("Test Label")).toBeTruthy();
	});

	it("toggles on click", async () => {
		let checkedValue = false;
		const onChange = vi.fn((v: boolean) => {
			checkedValue = v;
		});

		renderComponent(Checkbox, { checked: false, onchange: onChange });

		const checkbox = screen.getByRole("checkbox");
		await fireEvent.click(checkbox);
		expect(onChange).toHaveBeenCalled();
		expect(checkedValue).toBe(true);
	});

	it("does not toggle when disabled", async () => {
		const onChange = vi.fn();

		renderComponent(Checkbox, { checked: false, disabled: true, onchange: onChange });

		const checkbox = screen.getByRole("checkbox");
		await fireEvent.click(checkbox);
		expect(onChange).not.toHaveBeenCalled();
	});

	it("shows indeterminate state", () => {
		renderComponent(Checkbox, { checked: false, indeterminate: true });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox.classList.contains("checkbox--indeterminate")).toBe(true);
		// Indeterminate state should have aria-checked="mixed" per ARIA spec
		expect(checkbox.getAttribute("aria-checked")).toBe("mixed");
	});

	it("has correct role and aria attributes", () => {
		renderComponent(Checkbox, { checked: true, disabled: true });
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox.getAttribute("role")).toBe("checkbox");
		expect(checkbox.hasAttribute("disabled")).toBe(true);
	});
});
