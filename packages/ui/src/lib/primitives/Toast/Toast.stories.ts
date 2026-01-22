import type { Meta, StoryObj } from "@storybook/svelte";
import ToastStoryWrapper from "./Toast.story-wrapper.svelte";

const meta = {
	title: "Primitives/Toast",
	component: ToastStoryWrapper,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta<typeof ToastStoryWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
	render: () => ({
		Component: ToastStoryWrapper,
	}),
};
