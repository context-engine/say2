import type { Meta, StoryObj } from "@storybook/svelte";
import Toggle from "./Toggle.svelte";

const meta: Meta<typeof Toggle> = {
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
};

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

export const AllSizes: Story = {
	render: () => ({
		Component: Toggle,
		props: {},
	}),
	decorators: [
		() => ({
			template: `
				<div style="display: flex; flex-direction: column; gap: 1rem;">
					<story-component checked={false} size="sm" label="Small off" />
					<story-component checked={true} size="sm" label="Small on" />
					<story-component checked={false} size="md" label="Medium off" />
					<story-component checked={true} size="md" label="Medium on" />
				</div>
			`,
		}),
	],
};
