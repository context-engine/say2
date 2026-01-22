import type { Meta, StoryObj } from "@storybook/svelte";
import SearchHighlight from "./SearchHighlight.svelte";

const meta = {
    title: "Composites/Analysis/SearchHighlight",
    component: SearchHighlight,
    tags: ["autodocs"],
    argTypes: {
        text: { control: "text" },
        query: { control: "text" },
        caseSensitive: { control: "boolean" },
    },
} satisfies Meta<typeof SearchHighlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoMatch: Story = {
    args: {
        text: "The quick brown fox jumps over the lazy dog",
        query: "cat",
        caseSensitive: false,
    },
};

export const SingleMatch: Story = {
    args: {
        text: "The quick brown fox jumps over the lazy dog",
        query: "fox",
        caseSensitive: false,
    },
};

export const MultipleMatches: Story = {
    args: {
        text: "The fox is quick. The fox is brown. The fox jumps high.",
        query: "fox",
        caseSensitive: false,
    },
};

export const CaseSensitive: Story = {
    args: {
        text: "The FOX is quick. The fox is brown. The Fox jumps high.",
        query: "fox",
        caseSensitive: true,
    },
};

export const CaseInsensitive: Story = {
    args: {
        text: "The FOX is quick. The fox is brown. The Fox jumps high.",
        query: "fox",
        caseSensitive: false,
    },
};

export const SpecialCharacters: Story = {
    args: {
        text: "Search for (test) and [test] and test+1 patterns",
        query: "(test)",
        caseSensitive: false,
    },
};

export const EmptyQuery: Story = {
    args: {
        text: "This text will not be highlighted because query is empty",
        query: "",
        caseSensitive: false,
    },
};
