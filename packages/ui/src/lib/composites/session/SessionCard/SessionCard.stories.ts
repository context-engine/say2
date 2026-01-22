import type { Meta, StoryObj } from "@storybook/svelte";
import SessionCard from "./SessionCard.svelte";

const meta = {
    title: "Composites/Session/SessionCard",
    component: SessionCard,
    tags: ["autodocs"],
    argTypes: {
        selected: { control: "boolean" },
    },
} satisfies Meta<typeof SessionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseSession = {
    id: "session-1",
    name: "MCP Tools Session",
    status: "active" as const,
    messageCount: 24,
    createdAt: new Date(),
    serverCommand: "tools/call",
};

export const Active: Story = {
    args: {
        session: baseSession,
    },
};

export const Selected: Story = {
    args: {
        session: baseSession,
        selected: true,
    },
};

export const Pending: Story = {
    args: {
        session: { ...baseSession, status: "pending" as const },
    },
};

export const Error: Story = {
    args: {
        session: { ...baseSession, status: "error" as const },
    },
};

export const Disconnected: Story = {
    args: {
        session: { ...baseSession, status: "disconnected" as const },
    },
};
