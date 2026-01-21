import type { Meta, StoryObj } from "@storybook/svelte";
import Spinner, { type Props } from "./Spinner.svelte";

const meta = {
	title: "Primitives/Spinner",
	component: Spinner,
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
		},
		color: { control: "color" },
		label: { control: "text" },
	},
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		size: "md",
		label: "Loading",
	},
};

export const Small: Story = {
	args: {
		size: "sm",
		label: "Loading",
	},
};

export const Large: Story = {
	args: {
		size: "lg",
		label: "Loading",
	},
};

export const CustomColor: Story = {
	args: {
		size: "md",
		color: "#3b82f6",
		label: "Loading",
	},
};
