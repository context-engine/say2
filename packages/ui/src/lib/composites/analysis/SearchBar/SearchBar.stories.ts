import type { Meta, StoryObj } from "@storybook/svelte";
import type { Component, ComponentProps } from "svelte";
import SearchBar from "./SearchBar.svelte";
import Wrapper from "./SearchBar.story-wrapper.svelte";

const meta = {
    title: "Composites/Analysis/SearchBar",
    component: SearchBar,
    tags: ["autodocs"],
    argTypes: {
        initialQuery: { control: "text" },
    },
} satisfies Meta<ComponentProps<typeof Wrapper>>;

export default meta;
type Story = StoryObj<ComponentProps<typeof Wrapper>>;

const renderWrapper = (args: ComponentProps<typeof Wrapper>) => ({
    Component: Wrapper as unknown as Component,
    props: args,
});

export const Empty: Story = {
    render: renderWrapper,
    args: {
        initialQuery: "",
    },
};

export const WithQuery: Story = {
    render: renderWrapper,
    args: {
        initialQuery: "search term",
    },
};
