import { fireEvent, render, screen } from "@testing-library/svelte";
import { ArrowLeft, ArrowRight } from "lucide-svelte";
import { describe, expect, it } from "bun:test";
import Select from "./Select.svelte";

describe("Select", () => {
	const options = [
		{ value: "all", label: "All Directions" },
		{ value: "inbound", label: "Inbound ←", icon: ArrowLeft },
		{ value: "outbound", label: "Outbound →", icon: ArrowRight },
	];

	it("renders with placeholder when no value", () => {
		render(Select, { value: "", options, placeholder: "Select direction..." });
		expect(screen.getByText("Select direction...")).toBeTruthy();
	});

	it("renders selected value", () => {
		render(Select, { value: "inbound", options });
		expect(screen.getByText("Inbound ←")).toBeTruthy();
	});

	it("opens dropdown on click", async () => {
		render(Select, { value: "", options });

		const trigger = screen.getByRole("combobox");
		await fireEvent.click(trigger);

		expect(screen.getByText("All Directions")).toBeTruthy();
		expect(screen.getByText("Inbound ←")).toBeTruthy();
		expect(screen.getByText("Outbound →")).toBeTruthy();
	});

	it("selects option on click", async () => {
		let selectedValue = "";
		const onChange = (v: string) => {
			selectedValue = v;
		};

		render(Select, { options, onchange: onChange });

		const trigger = screen.getByRole("combobox");
		await fireEvent.click(trigger);

		const option = screen.getByText("Outbound →");
		await fireEvent.click(option);

		expect(selectedValue).toBe("outbound");
	});

	it("applies size classes", () => {
		const { container: smContainer } = render(Select, {
			size: "sm",
			value: "",
			options,
		});
		expect(smContainer.querySelector(".ce-select-trigger--sm")).toBeTruthy();

		const { container: mdContainer } = render(Select, {
			size: "md",
			value: "",
			options,
		});
		expect(mdContainer.querySelector(".ce-select-trigger--md")).toBeTruthy();
	});

	it("disables entire select when disabled prop is true", () => {
		render(Select, { value: "", options, disabled: true });
		const trigger = screen.getByRole("combobox");
		expect(trigger.getAttribute("aria-disabled")).toBe("true");
	});

	it("displays icon for selected option", () => {
		const { container } = render(Select, { value: "inbound", options });
		const icon = container.querySelector("svg");
		expect(icon).toBeTruthy();
	});

	it("calls onchange when selection changes", async () => {
		let changedValue = "";
		const onChange = (v: string) => {
			changedValue = v;
		};

		render(Select, { value: "", options, onchange: onChange });

		const trigger = screen.getByRole("combobox");
		await fireEvent.click(trigger);

		const option = screen.getByText("Outbound →");
		await fireEvent.click(option);

		expect(changedValue).toBe("outbound");
	});
});
