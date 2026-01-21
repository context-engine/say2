import type { Meta, StoryObj } from "@storybook/svelte";
import type { Component, ComponentProps } from "svelte";
import EmptyState from "./EmptyState.svelte";
import EmptyStateWrapper from "./EmptyState.story-wrapper.svelte";

const meta = {
    title: "Composites/Cross-Cutting/EmptyState",
    component: EmptyState,
    tags: ["autodocs"],
    argTypes: {
        title: { control: "text" },
        description: { control: "text" },
        // Wrapper args
        showAction: { control: "boolean" },
        actionText: { control: "text" },
        iconName: {
            control: { type: "select" },
            options: ["search", "folder", "wifi", "none"]
        },
    },
} satisfies Meta<ComponentProps<typeof EmptyStateWrapper>>;

export default meta;
type Story = StoryObj<ComponentProps<typeof EmptyStateWrapper>>;

// Use wrapper for all stories to support the snippets logic
const renderWrapper = (args: ComponentProps<typeof EmptyStateWrapper>) => ({
    Component: EmptyStateWrapper as unknown as Component,
    props: args,
});

export const Default: Story = {
    render: renderWrapper,
    args: {
        title: "No Items",
        description: "There is nothing to display here yet.",
        iconName: "folder",
        showAction: false,
    },
};

export const WithAction: Story = {
    render: renderWrapper,
    args: {
        title: "No Connection",
        description: "You are not connected to any server.",
        iconName: "wifi",
        showAction: true,
        actionText: "Connect Now",
    },
};

export const TextOnly: Story = {
    render: renderWrapper,
    args: {
        title: "Simple Empty State",
        description: "Just a message without an icon.",
        iconName: undefined, // "none" in select or undefined
        showAction: false,
    },
};
