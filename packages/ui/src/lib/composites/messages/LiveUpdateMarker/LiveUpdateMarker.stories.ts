import type { Meta, StoryObj } from "@storybook/svelte";
import LiveUpdateMarker from "./LiveUpdateMarker.svelte";

const meta = {
    title: "Composites/Messages/LiveUpdateMarker",
    component: LiveUpdateMarker,
    tags: ["autodocs"],
    argTypes: {
        count: { control: "number" },
    },
} satisfies Meta<typeof LiveUpdateMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { count: 5 },
};

export const ManyMessages: Story = {
    args: { count: 42 },
};

export const Hidden: Story = {
    args: { count: 0 },
};
