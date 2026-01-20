import type { Meta, StoryObj } from "@storybook/svelte";
import { ArrowLeft, ArrowRight, Globe, User } from "lucide-svelte";
import Select from "./Select.svelte";

const meta: Meta<typeof Select> = {
	title: "Primitives/Select",
	component: Select,
	tags: ["autodocs"],
	argTypes: {
		value: { control: "text" },
		placeholder: { control: "text" },
		disabled: { control: "boolean" },
		size: {
			control: "select",
			options: ["sm", "md"],
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultOptions = [
	{ value: "all", label: "All Directions" },
	{ value: "inbound", label: "Inbound ←", icon: ArrowLeft },
	{ value: "outbound", label: "Outbound →", icon: ArrowRight },
];

const iconOptions = [
	{ value: "user", label: "User Profile", icon: User },
	{ value: "settings", label: "Settings", icon: Globe },
];

export const Default: Story = {
	args: {
		value: "",
		options: defaultOptions,
		placeholder: "Select direction...",
		disabled: false,
		size: "md",
	},
};

export const WithValue: Story = {
	args: {
		value: "inbound",
		options: defaultOptions,
		placeholder: "Select direction...",
		disabled: false,
		size: "md",
	},
};

export const Small: Story = {
	args: {
		value: "",
		options: defaultOptions,
		placeholder: "Select...",
		disabled: false,
		size: "sm",
	},
};

export const WithIcons: Story = {
	args: {
		value: "",
		options: iconOptions,
		placeholder: "Choose action...",
		disabled: false,
		size: "md",
	},
};

export const Disabled: Story = {
	args: {
		value: "inbound",
		options: defaultOptions,
		placeholder: "Select...",
		disabled: true,
		size: "md",
	},
};

export const WithDisabledOption: Story = {
	args: {
		value: "",
		options: [
			{ value: "all", label: "All Directions" },
			{ value: "inbound", label: "Inbound ←" },
			{ value: "outbound", label: "Outbound →" },
			{ value: "disabled", label: "Disabled Option", disabled: true },
		],
		placeholder: "Select...",
		disabled: false,
		size: "md",
	},
};

export const AllSizes: Story = {
	render: () => ({
		Component: Select,
		props: {},
	}),
	decorators: [
		() => ({
			template: `
				<div style="display: flex; flex-direction: column; gap: 1rem;">
					<story-component size="sm" value="" options={[
						{ value: 'a', label: 'Small Option A' },
						{ value: 'b', label: 'Small Option B' }
					]} placeholder="Small" />
					<story-component size="md" value="" options={[
						{ value: 'a', label: 'Medium Option A' },
						{ value: 'b', label: 'Medium Option B' }
					]} placeholder="Medium" />
				</div>
			`,
		}),
	],
};
