import type { Meta, StoryObj } from "@storybook/svelte";
import ScrollToLatest from "./ScrollToLatest.svelte";

const meta = {
    title: "Composites/Messages/ScrollToLatest",
    component: ScrollToLatest,
    tags: ["autodocs"],
    argTypes: {
        active: { control: "boolean" },
    },
} satisfies Meta<typeof ScrollToLatest>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { active: false },
};

export const AutoScrollActive: Story = {
    args: { active: true },
};
