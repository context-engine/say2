import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "bun:test";
import Toggle from "./Toggle.svelte";

describe("Toggle", () => {
	it("renders correctly", () => {
		render(Toggle, { checked: false });
		const button = screen.getByRole("switch");
		expect(button).toBeTruthy();
		expect(button.getAttribute("aria-checked")).toBe("false");
	});

	it("renders checked state", () => {
		render(Toggle, { checked: true });
		const button = screen.getByRole("switch");
		expect(button.getAttribute("aria-checked")).toBe("true");
	});

	it("applies size classes", () => {
		const { container: smContainer } = render(Toggle, { size: "sm" });
		expect(smContainer.querySelector(".toggle--sm")).toBeTruthy();

		const { container: mdContainer } = render(Toggle, { size: "md" });
		expect(mdContainer.querySelector(".toggle--md")).toBeTruthy();
	});

	it("shows label when provided", () => {
		render(Toggle, { label: "Test Label" });
		expect(screen.getByText("Test Label")).toBeTruthy();
	});

	it("toggles on click", async () => {
		let checkedValue = false;
		const onChange = (v: boolean) => {
			checkedValue = v;
		};

		render(Toggle, { checked: false, onchange: onChange });

		const button = screen.getByRole("switch");
		await fireEvent.click(button);
		expect(checkedValue).toBe(true);
	});

	it("does not toggle when disabled", async () => {
		const onChange = () => {
			throw new Error("Should not call onchange when disabled");
		};

		render(Toggle, { checked: false, disabled: true, onchange: onChange });

		const button = screen.getByRole("switch");
		await fireEvent.click(button);
		expect(button.getAttribute("aria-checked")).toBe("false");
	});

	it("toggles on space key", async () => {
		let checkedValue = false;
		const onChange = (v: boolean) => {
			checkedValue = v;
		};

		render(Toggle, { checked: false, onchange: onChange });

		const button = screen.getByRole("switch");
		await fireEvent.keyDown(button, { key: " " });
		expect(checkedValue).toBe(true);
	});

	it("toggles on enter key", async () => {
		let checkedValue = false;
		const onChange = (v: boolean) => {
			checkedValue = v;
		};

		render(Toggle, { checked: false, onchange: onChange });

		const button = screen.getByRole("switch");
		await fireEvent.keyDown(button, { key: "Enter" });
		expect(checkedValue).toBe(true);
	});

	it("has correct role and aria attributes", () => {
		render(Toggle, { checked: true, disabled: true });
		const button = screen.getByRole("switch");
		expect(button.getAttribute("role")).toBe("switch");
		expect(button.getAttribute("aria-checked")).toBe("true");
		expect(button.getAttribute("aria-disabled")).toBe("true");
	});
});
