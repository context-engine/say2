import type { Meta, StoryObj } from "@storybook/svelte";
import { Button } from "../Button/Button.svelte";
import ToastContainer from "./ToastContainer.svelte";
import { toasts } from "./toast.store";

const meta: Meta<typeof ToastContainer> = {
	title: "Primitives/Toast",
	component: ToastContainer,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => ({
		Component: ToastContainer,
	}),
};

export const WithActions: Story = {
	render: () => ({
		Component: ToastContainer,
		props: {},
	}),
	decorators: [
		() => ({
			template: `
				<div style="position: relative; height: 400px;">
					<story-component />
					<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; gap: 1rem;">
						<Button onclick={() => toasts.success('Copied to clipboard!')}>
							Success Toast
						</Button>
						<Button onclick={() => toasts.error('Failed to save changes')}>
							Error Toast
						</Button>
						<Button onclick={() => toasts.warning('Connection unstable')}>
							Warning Toast
						</Button>
						<Button onclick={() => toasts.info('New message received')}>
							Info Toast
						</Button>
					</div>
				</div>
			`,
		}),
	],
};

export const Multiple: Story = {
	render: () => ({
		Component: ToastContainer,
		props: {},
	}),
	decorators: [
		() => ({
			template: `
				<div style="position: relative; height: 400px;">
					<story-component />
					<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
						<Button onclick={() => {
							toasts.success('First toast');
							setTimeout(() => toasts.info('Second toast'), 100);
							setTimeout(() => toasts.warning('Third toast'), 200);
						}}>
							Show Multiple
						</Button>
					</div>
				</div>
			`,
		}),
	],
};
