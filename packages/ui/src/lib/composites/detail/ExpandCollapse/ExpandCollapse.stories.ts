import type { Meta, StoryObj } from "@storybook/svelte";
import type { Component, ComponentProps } from "svelte";
import ExpandCollapse from "./ExpandCollapse.svelte";
import Wrapper from "./ExpandCollapse.story-wrapper.svelte";

const meta = {
    title: "Composites/Detail/ExpandCollapse",
    component: ExpandCollapse,
    tags: ["autodocs"],
    argTypes: {
        label: { control: "text" },
        startExpanded: { control: "boolean" },
    },
} satisfies Meta<ComponentProps<typeof Wrapper>>;

export default meta;
type Story = StoryObj<ComponentProps<typeof Wrapper>>;

const renderWrapper = (args: ComponentProps<typeof Wrapper>) => ({
    Component: Wrapper as unknown as Component,
    props: args,
});

export const Default: Story = {
    render: renderWrapper,
    args: {
        label: "Toggle Me",
        startExpanded: false,
    },
};

export const Expanded: Story = {
    render: renderWrapper,
    args: {
        label: "Initially Expanded",
        startExpanded: true,
    },
};
