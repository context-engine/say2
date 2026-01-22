import type { Meta, StoryObj } from "@storybook/svelte";
import Tooltip, { type Props } from "./Tooltip.svelte";
import TooltipStoryWrapper from "./Tooltip.story-wrapper.svelte";

const meta = {
	title: "Primitives/Tooltip",
	component: Tooltip,
	tags: ["autodocs"],
	argTypes: {
		content: { control: "text" },
		side: {
			control: "select",
			options: ["top", "right", "bottom", "left"],
		},
		delay: { control: "number" },
	},
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
	render: () => ({
		Component: TooltipStoryWrapper,
	}),
};
