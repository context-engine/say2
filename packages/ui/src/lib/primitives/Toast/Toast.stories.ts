import type { Meta, StoryObj } from "@storybook/svelte";
import ToastContainer, { type Props as ToastContainerProps } from "./ToastContainer.svelte";

const meta = {
	title: "Primitives/Toast",
	component: ToastContainer,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta<ToastContainerProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => ({
		Component: ToastContainer,
	}),
};
