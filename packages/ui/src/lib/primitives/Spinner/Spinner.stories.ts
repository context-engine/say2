import type { Meta, StoryObj } from "@storybook/svelte";
import Spinner from "./Spinner.svelte";

const meta: Meta<typeof Spinner> = {
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
};

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

export const AllSizes: Story = {
	render: () => ({
		Component: Spinner,
		props: {},
	}),
	decorators: [
		() => ({
			template: `
				<div style="display: flex; gap: 2rem; align-items: center;">
					<story-component size="sm" />
					<story-component size="md" />
					<story-component size="lg" />
				</div>
			`,
		}),
	],
};
