import type { Meta, StoryObj } from "@storybook/svelte";
import type { Component, ComponentProps } from "svelte";
import FilterPanel from "./FilterPanel.svelte";
import Wrapper from "./FilterPanel.story-wrapper.svelte";

const meta = {
    title: "Composites/Analysis/FilterPanel",
    component: FilterPanel,
    tags: ["autodocs"],
    argTypes: {
        direction: {
            control: "select",
            options: ["all", "inbound", "outbound"],
        },
        hasError: {
            control: "select",
            options: [null, true, false],
        },
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
        direction: "all",
        methods: [],
        hasError: null,
    },
};

export const WithFilters: Story = {
    render: renderWrapper,
    args: {
        direction: "inbound",
        methods: ["tools/list", "tools/call"],
        hasError: null,
    },
};

export const AllSelected: Story = {
    render: renderWrapper,
    args: {
        direction: "all",
        methods: ["tools/list", "tools/call", "resources/read", "prompts/get"],
        hasError: null,
    },
};

export const WithErrorFilter: Story = {
    render: renderWrapper,
    args: {
        direction: "all",
        methods: [],
        hasError: true,
    },
};

export const HideErrors: Story = {
    render: renderWrapper,
    args: {
        direction: "outbound",
        methods: [],
        hasError: false,
    },
};
