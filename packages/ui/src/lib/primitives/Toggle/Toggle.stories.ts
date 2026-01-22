import type { Meta, StoryObj } from "@storybook/svelte";
import Toggle, { type Props } from "./Toggle.svelte";

const meta = {
	title: "Primitives/Toggle",
	component: Toggle,
	tags: ["autodocs"],
	argTypes: {
		checked: { control: "boolean" },
		disabled: { control: "boolean" },
		size: {
			control: "select",
			options: ["sm", "md"],
		},
		label: { control: "text" },
	},
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		checked: false,
		disabled: false,
		size: "md",
	},
};

export const Checked: Story = {
	args: {
		checked: true,
		disabled: false,
		size: "md",
	},
};

export const WithLabel: Story = {
	args: {
		checked: false,
		disabled: false,
		size: "md",
		label: "Enable feature",
	},
};

export const Small: Story = {
	args: {
		checked: false,
		disabled: false,
		size: "sm",
		label: "Small toggle",
	},
};

export const SmallChecked: Story = {
	args: {
		checked: true,
		disabled: false,
		size: "sm",
		label: "Small toggle (on)",
	},
};

export const DisabledOff: Story = {
	args: {
		checked: false,
		disabled: true,
		size: "md",
		label: "Disabled off",
	},
};

export const DisabledOn: Story = {
	args: {
		checked: true,
		disabled: true,
		size: "md",
		label: "Disabled on",
	},
};
