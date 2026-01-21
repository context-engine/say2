import type { Meta, StoryObj } from "@storybook/svelte";
import Checkbox from "./Checkbox.svelte";

const meta: Meta<typeof Checkbox> = {
	title: "Primitives/Checkbox",
	component: Checkbox,
	tags: ["autodocs"],
	argTypes: {
		checked: { control: "boolean" },
		disabled: { control: "boolean" },
		indeterminate: { control: "boolean" },
		label: { control: "text" },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		checked: false,
		disabled: false,
		indeterminate: false,
	},
};

export const Checked: Story = {
	args: {
		checked: true,
		disabled: false,
		indeterminate: false,
	},
};

export const WithLabel: Story = {
	args: {
		checked: false,
		disabled: false,
		indeterminate: false,
		label: "Errors only",
	},
};

export const Indeterminate: Story = {
	args: {
		checked: false,
		disabled: false,
		indeterminate: true,
		label: "Select all (partial)",
	},
};

export const Disabled: Story = {
	args: {
		checked: true,
		disabled: true,
		indeterminate: false,
		label: "Disabled checked",
	},
};

export const DisabledUnchecked: Story = {
	args: {
		checked: false,
		disabled: true,
		indeterminate: false,
		label: "Disabled unchecked",
	},
};


