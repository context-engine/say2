import type { Meta, StoryObj } from "@storybook/svelte";
import type { Component } from "svelte";
import ThemeToggle from "./ThemeToggle.svelte";

const meta = {
    title: "Composites/Cross-Cutting/ThemeToggle",
    component: ThemeToggle,
    tags: ["autodocs"],
    argTypes: {
        theme: {
            control: { type: "select" },
            options: ["light", "dark", "system"],
        },
        onchange: { action: "changed" },
    },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
    args: {
        theme: "light",
    },
};

export const Dark: Story = {
    args: {
        theme: "dark",
    },
};

export const System: Story = {
    args: {
        theme: "system",
    },
};

import InteractiveWrapper from "./ThemeToggle.story-wrapper.svelte";
export const Interactive: Story = {
    render: () => ({
        Component: InteractiveWrapper as unknown as Component,
    }),
    args: { theme: 'light' }, // specific args needed to satisfy types
};
