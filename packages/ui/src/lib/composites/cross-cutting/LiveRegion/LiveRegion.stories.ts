import type { Meta, StoryObj } from "@storybook/svelte";
import type { Component } from "svelte";
import LiveRegion from "./LiveRegion.svelte";
import LiveRegionStory from "./LiveRegion.story-wrapper.svelte";

const meta = {
    title: "Composites/Cross-Cutting/LiveRegion",
    component: LiveRegion,
    tags: ["autodocs"],
    argTypes: {
        message: { control: "text" },
        assertive: { control: "boolean" },
    },
} satisfies Meta<typeof LiveRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive story using the wrapper
export const Interactive: Story = {
    render: () => ({
        Component: LiveRegionStory as unknown as Component,
    }),
    args: {
        message: "", // dummy args
    }
};

// Dumb component Stories (not very visual, but good for docs)
export const Polite: Story = {
    args: {
        message: "This is a polite announcement.",
        assertive: false,
    },
};

export const Assertive: Story = {
    args: {
        message: "This is an assertive announcement!",
        assertive: true,
    },
};
