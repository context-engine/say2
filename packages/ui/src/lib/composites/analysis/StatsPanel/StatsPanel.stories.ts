import type { Meta, StoryObj } from "@storybook/svelte";
import StatsPanel from "./StatsPanel.svelte";

const meta = {
    title: "Composites/Analysis/StatsPanel",
    component: StatsPanel,
    tags: ["autodocs"],
    argTypes: {
        loading: { control: "boolean" },
    },
} satisfies Meta<typeof StatsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        stats: {
            totalMessages: 1234,
            requestCount: 456,
            responseCount: 432,
            notificationCount: 346,
            errorCount: 12,
            avgLatency: 42,
        },
        loading: false,
    },
};

export const Loading: Story = {
    args: {
        stats: {
            totalMessages: 0,
            requestCount: 0,
            responseCount: 0,
            notificationCount: 0,
            errorCount: 0,
            avgLatency: 0,
        },
        loading: true,
    },
};

export const NoMessages: Story = {
    args: {
        stats: {
            totalMessages: 0,
            requestCount: 0,
            responseCount: 0,
            notificationCount: 0,
            errorCount: 0,
            avgLatency: 0,
        },
        loading: false,
    },
};

export const HighVolume: Story = {
    args: {
        stats: {
            totalMessages: 1234567,
            requestCount: 456789,
            responseCount: 432100,
            notificationCount: 345678,
            errorCount: 1234,
            avgLatency: 127,
        },
        loading: false,
    },
};
