import type { Meta, StoryObj } from "@storybook/svelte";
import DetailPanel from "./DetailPanel.svelte";
import type { Message } from "./DetailPanel.svelte";

const meta = {
    title: "Composites/Detail/DetailPanel",
    component: DetailPanel,
    tags: ["autodocs"],
    argTypes: {
        loading: { control: "boolean" },
    },
} satisfies Meta<typeof DetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleMessage: Message = {
    id: "msg-12345",
    direction: "inbound",
    type: "request",
    method: "tools/call",
    preview: "Calling function getData...",
    timestamp: new Date(),
    hasResponse: true,
    content: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
            name: "getData",
            arguments: {
                query: "SELECT * FROM users",
                limit: 100,
            },
        },
    },
};

export const WithMessage: Story = {
    args: {
        message: sampleMessage,
        loading: false,
    },
};

export const Empty: Story = {
    args: {
        message: null,
        loading: false,
    },
};

export const Loading: Story = {
    args: {
        message: null,
        loading: true,
    },
};

export const Request: Story = {
    args: {
        message: {
            ...sampleMessage,
            type: "request",
            direction: "outbound",
        },
        loading: false,
    },
};

export const Response: Story = {
    args: {
        message: {
            ...sampleMessage,
            id: "msg-67890",
            type: "response",
            direction: "inbound",
            method: "tools/call",
            content: {
                jsonrpc: "2.0",
                id: 1,
                result: {
                    data: [
                        { id: 1, name: "Alice" },
                        { id: 2, name: "Bob" },
                    ],
                    total: 2,
                },
            },
        },
        loading: false,
    },
};

export const Notification: Story = {
    args: {
        message: {
            ...sampleMessage,
            id: "msg-notif-001",
            type: "notification",
            method: "notifications/progress",
            content: {
                jsonrpc: "2.0",
                method: "notifications/progress",
                params: {
                    progressToken: "token-123",
                    progress: 75,
                    total: 100,
                },
            },
        },
        loading: false,
    },
};
