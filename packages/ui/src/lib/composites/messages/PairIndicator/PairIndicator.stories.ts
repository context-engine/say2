import type { Meta, StoryObj } from "@storybook/svelte";
import PairIndicator from "./PairIndicator.svelte";

const meta = {
    title: "Composites/Messages/PairIndicator",
    component: PairIndicator,
    tags: ["autodocs"],
    argTypes: {
        paired: { control: "boolean" },
        pending: { control: "boolean" },
    },
} satisfies Meta<typeof PairIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paired: Story = {
    args: { paired: true },
};

export const Unpaired: Story = {
    args: { paired: false },
};

export const Pending: Story = {
    args: { pending: true },
};
