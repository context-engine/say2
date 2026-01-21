import type { Meta, StoryObj } from "@storybook/svelte";
import JSONInspector from "./JSONInspector.svelte";

const meta = {
    title: "Composites/Detail/JSONInspector",
    component: JSONInspector,
    tags: ["autodocs"],
    argTypes: {
        expandLevel: { control: { type: "number", min: 0, max: 10 } },
        maxDepth: { control: { type: "number", min: 1, max: 20 } },
        searchQuery: { control: "text" },
    },
} satisfies Meta<typeof JSONInspector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleObject: Story = {
    args: {
        data: {
            name: "John Doe",
            age: 30,
            active: true,
            email: null,
        },
        expandLevel: 2,
    },
};

export const DeepNesting: Story = {
    args: {
        data: {
            level1: {
                level2: {
                    level3: {
                        level4: {
                            level5: {
                                deeply: "nested",
                            },
                        },
                    },
                },
            },
        },
        expandLevel: 3,
        maxDepth: 10,
    },
};

export const LargeArray: Story = {
    args: {
        data: {
            tools: [
                { name: "list", count: 10 },
                { name: "call", count: 25 },
                { name: "read", count: 5 },
                { name: "write", count: 8 },
                { name: "delete", count: 2 },
            ],
        },
        expandLevel: 2,
    },
};

export const WithSearch: Story = {
    args: {
        data: {
            message: "Hello world",
            response: {
                status: "success",
                data: {
                    greeting: "Hello there",
                    farewell: "Goodbye world",
                },
            },
        },
        searchQuery: "world",
        expandLevel: 5,
    },
};

export const AllCollapsed: Story = {
    args: {
        data: {
            tools: [
                { name: "list" },
                { name: "call" },
            ],
            config: {
                timeout: 1000,
            },
        },
        expandLevel: 0,
    },
};

export const AllExpanded: Story = {
    args: {
        data: {
            tools: [
                { name: "list" },
                { name: "call" },
            ],
            config: {
                timeout: 1000,
            },
        },
        expandLevel: 10,
    },
};

export const MixedTypes: Story = {
    args: {
        data: {
            string: "text",
            number: 42,
            float: 3.14,
            boolean: true,
            null: null,
            array: [1, 2, 3],
            object: { nested: true },
        },
        expandLevel: 2,
    },
};
