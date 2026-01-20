import type { Meta, StoryObj } from "@storybook/svelte";
import { Info } from "lucide-svelte";
import { Button } from "../Button/Button.svelte";
import Tooltip from "./Tooltip.svelte";

const meta: Meta<typeof Tooltip> = {
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
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		content: "This is a tooltip",
		side: "top",
		delay: 300,
	},
};

export const WithButton: Story = {
	render: () => ({
		Component: Tooltip,
		props: { content: "Click to save" },
	}),
	decorators: [
		() => ({
			template: `
				<story-component>
					<Button>Save</Button>
				</story-component>
			`,
		}),
	],
};

export const WithIcon: Story = {
	render: () => ({
		Component: Tooltip,
		props: { content: "More information" },
	}),
	decorators: [
		() => ({
			template: `
				<story-component>
					<Button iconOnly icon={Info} aria-label="Info" />
				</story-component>
			`,
		}),
	],
};

export const Bottom: Story = {
	args: {
		content: "Tooltip on bottom",
		side: "bottom",
		delay: 300,
	},
	render: (args) => ({
		Component: Tooltip,
		props: args,
	}),
	decorators: [
		() => ({
			template: `
				<story-component>
					<Button>Hover me</Button>
				</story-component>
			`,
		}),
	],
};

export const Right: Story = {
	args: {
		content: "Tooltip on the right",
		side: "right",
		delay: 300,
	},
	render: (args) => ({
		Component: Tooltip,
		props: args,
	}),
	decorators: [
		() => ({
			template: `
				<story-component>
					<Button>Hover me</Button>
				</story-component>
			`,
		}),
	],
};

export const Left: Story = {
	args: {
		content: "Tooltip on the left",
		side: "left",
		delay: 300,
	},
	render: (args) => ({
		Component: Tooltip,
		props: args,
	}),
	decorators: [
		() => ({
			template: `
				<story-component>
					<Button>Hover me</Button>
				</story-component>
			`,
		}),
	],
};

export const LongContent: Story = {
	args: {
		content: "This is a longer tooltip content that might wrap or be truncated",
		side: "top",
		delay: 300,
	},
	render: (args) => ({
		Component: Tooltip,
		props: args,
	}),
	decorators: [
		() => ({
			template: `
				<story-component>
					<Button>Hover for details</Button>
				</story-component>
			`,
		}),
	],
};

export const AllPositions: Story = {
	render: () => ({
		Component: Tooltip,
		props: {},
	}),
	decorators: [
		() => ({
			template: `
				<div style="display: flex; gap: 2rem; align-items: center; padding: 2rem;">
					<story-component content="Top" side="top">
						<Button size="sm">Top</Button>
					</story-component>
					<story-component content="Bottom" side="bottom">
						<Button size="sm">Bottom</Button>
					</story-component>
					<story-component content="Left" side="left">
						<Button size="sm">Left</Button>
					</story-component>
					<story-component content="Right" side="right">
						<Button size="sm">Right</Button>
					</story-component>
				</div>
			`,
		}),
	],
};
