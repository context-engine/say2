import type { Meta, StoryObj } from "@storybook/svelte";
import ConnectionStatus from "./ConnectionStatus.svelte";

const meta = {
    title: "Composites/Session/ConnectionStatus",
    component: ConnectionStatus,
    tags: ["autodocs"],
    argTypes: {
        state: {
            control: "select",
            options: ["disconnected", "connecting", "connected", "reconnecting", "error"],
        },
        compact: { control: "boolean" },
    },
} satisfies Meta<typeof ConnectionStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
    args: {
        state: "connected",
    },
};

export const Connecting: Story = {
    args: {
        state: "connecting",
    },
};

export const Reconnecting: Story = {
    args: {
        state: "reconnecting",
    },
};

export const Disconnected: Story = {
    args: {
        state: "disconnected",
    },
};

export const Error: Story = {
    args: {
        state: "error",
    },
};

export const Compact: Story = {
    args: {
        state: "connected",
        compact: true,
    },
};
