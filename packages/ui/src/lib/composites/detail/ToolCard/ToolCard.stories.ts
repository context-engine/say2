import type { Meta, StoryObj } from "@storybook/svelte";
import ToolCard from "./ToolCard.svelte";

const meta = {
    title: "Composites/Detail/ToolCard",
    component: ToolCard,
    tags: ["autodocs"],
    argTypes: {
        onclick: { action: "clicked" },
    },
} satisfies Meta<typeof ToolCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        tool: {
            name: "get_weather",
            description: "Get the current weather for a specified location",
        },
    },
};

export const WithAnnotations: Story = {
    args: {
        tool: {
            name: "delete_file",
            description: "Delete a file from the filesystem. This action cannot be undone.",
            annotations: {
                destructiveHint: true,
                readOnlyHint: false,
                openWorldHint: false,
            },
        },
    },
};

export const FullAnnotations: Story = {
    args: {
        tool: {
            name: "complex_operation",
            description: "A tool with multiple hints and a very long description that should be truncated by the card layout to prevent layout shifts or overflows in narrow containers.",
            annotations: {
                destructiveHint: true,
                readOnlyHint: true,
                openWorldHint: true,
            },
        },
    },
};

export const NoDescription: Story = {
    args: {
        tool: {
            name: "ping_service",
        },
    },
};
