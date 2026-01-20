import { fireEvent, render, screen } from "@testing-library/svelte";
import { ArrowLeft, ArrowRight } from "lucide-svelte";
import { describe, expect, it } from "vitest";
import Select from "./Select.svelte";

describe("Select", () => {
	const options = [
		{ value: "all", label: "All Directions" },
		{ value: "inbound", label: "Inbound ←", icon: ArrowLeft },
		{ value: "outbound", label: "Outbound →", icon: ArrowRight },
	];

	it("renders with placeholder when no value", () => {
		render(Select, { value: "", options, placeholder: "Select direction..." });
		expect(screen.getByText("Select direction...")).toBeInTheDocument();
	});

	it("renders selected value", () => {
		render(Select, { value: "inbound", options });
		expect(screen.getByText("Inbound ←")).toBeInTheDocument();
	});

	it("opens dropdown on click", async () => {
		render(Select, { value: "", options });

		const trigger = screen.getByRole("combobox");
		await fireEvent.click(trigger);

		expect(screen.getByText("All Directions")).toBeInTheDocument();
		expect(screen.getByText("Inbound ←")).toBeInTheDocument();
		expect(screen.getByText("Outbound →")).toBeInTheDocument();
	});

	it("selects option on click", async () => {
		let selectedValue = "";
		const onChange = (v: string) => {
			selectedValue = v;
		};

		render(Select, { checked: false, options, onchange: onChange });

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
		expect(
			smContainer.querySelector(".select-trigger--sm"),
		).toBeInTheDocument();

		const { container: mdContainer } = render(Select, {
			size: "md",
			value: "",
			options,
		});
		expect(
			mdContainer.querySelector(".select-trigger--md"),
		).toBeInTheDocument();
	});

	it("disables entire select when disabled prop is true", () => {
		render(Select, { value: "", options, disabled: true });
		const trigger = screen.getByRole("combobox");
		expect(trigger).toHaveAttribute("aria-disabled", "true");
	});

	it("displays icon for selected option", () => {
		render(Select, { value: "inbound", options });
		const trigger = screen.getByRole("combobox");
		expect(trigger.querySelector(".svelte-Icon")).toBeInTheDocument();
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
