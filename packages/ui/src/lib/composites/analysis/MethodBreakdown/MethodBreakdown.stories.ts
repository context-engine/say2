import type { Meta, StoryObj } from "@storybook/svelte";
import MethodBreakdown from "./MethodBreakdown.svelte";

const meta = {
    title: "Composites/Analysis/MethodBreakdown",
    component: MethodBreakdown,
    tags: ["autodocs"],
    argTypes: {
        loading: { control: "boolean" },
    },
} satisfies Meta<typeof MethodBreakdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        breakdown: [
            { method: "tools/list", count: 150, percentage: 45 },
            { method: "tools/call", count: 100, percentage: 30 },
            { method: "resources/read", count: 50, percentage: 15 },
            { method: "prompts/get", count: 33, percentage: 10 },
        ],
        loading: false,
    },
};

export const SingleMethod: Story = {
    args: {
        breakdown: [{ method: "tools/list", count: 100, percentage: 100 }],
        loading: false,
    },
};

export const ManyMethods: Story = {
    args: {
        breakdown: [
            { method: "tools/list", count: 500, percentage: 35 },
            { method: "tools/call", count: 400, percentage: 28 },
            { method: "resources/read", count: 200, percentage: 14 },
            { method: "resources/list", count: 150, percentage: 10 },
            { method: "prompts/get", count: 100, percentage: 7 },
            { method: "prompts/list", count: 50, percentage: 3.5 },
            { method: "sampling/create", count: 35, percentage: 2.5 },
        ],
        loading: false,
    },
};

export const Loading: Story = {
    args: {
        breakdown: [],
        loading: true,
    },
};

export const Empty: Story = {
    args: {
        breakdown: [],
        loading: false,
    },
};
