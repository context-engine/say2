import type { Meta, StoryObj } from "@storybook/svelte";
import SkipLink, { type Props } from "./SkipLink.svelte";

const meta = {
	title: "Primitives/SkipLink",
	component: SkipLink,
	tags: ["autodocs"],
	argTypes: {
		href: { control: "text" },
		targetId: { control: "text" },
		label: { control: "text" },
	},
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		href: "#main-content",
		targetId: "main-content",
		label: "Skip to main content",
	},
};

export const CustomLabel: Story = {
	args: {
		href: "#content",
		targetId: "content",
		label: "Skip to content",
	},
};

export const CustomTarget: Story = {
	args: {
		href: "#app",
		targetId: "app",
		label: "Skip to app",
	},
};
