import type { Meta, StoryObj } from "@storybook/svelte";
import Welcome from "./Welcome.svelte";

const meta: Meta<typeof Welcome> = {
	title: "Welcome",
	component: Welcome,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof Welcome>;

export const Introduction: Story = {};
