import type { Meta, StoryObj } from "@storybook/svelte";
import ContextMenu from "./ContextMenu.svelte";
import Wrapper from "./ContextMenu.story-wrapper.svelte";
import type { Component, ComponentProps } from "svelte";

const meta = {
    title: "Composites/Detail/ContextMenu",
    component: Wrapper as unknown as Component,
    tags: ["autodocs"],
} satisfies Meta<ComponentProps<typeof Wrapper>>;

export default meta;
type Story = StoryObj<ComponentProps<typeof Wrapper>>;

export const Interactive: Story = {
    render: () => ({
        Component: Wrapper as unknown as Component,
    }),
};
