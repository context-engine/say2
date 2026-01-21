import type { Meta, StoryObj } from "@storybook/svelte";
import FocusTrapWrapper from "./FocusTrap.story-wrapper.svelte";

const meta = {
    title: "Composites/Cross-Cutting/FocusTrap",
    component: FocusTrapWrapper, // Use wrapper as the component under test in story
    tags: ["autodocs"],
    argTypes: {
        active: { control: "boolean" },
        returnFocus: { control: "boolean" },
    },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
    args: {
        active: false,
        returnFocus: true,
    },
};

export const ActiveByDefault: Story = {
    args: {
        active: true,
        returnFocus: true,
    }
};
