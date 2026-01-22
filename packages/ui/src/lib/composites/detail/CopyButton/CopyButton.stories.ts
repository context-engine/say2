import type { Meta, StoryObj } from "@storybook/svelte";
import CopyButton from "./CopyButton.svelte";

const meta = {
    title: "Composites/Detail/CopyButton",
    component: CopyButton,
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: { type: "select" },
            options: ["primary", "secondary", "ghost", "danger"],
        },
        size: {
            control: { type: "select" },
            options: ["sm", "md", "lg"],
        },
    },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        value: "Hello, world!",
        label: "Copy Text",
    },
};

export const IconOnly: Story = {
    args: {
        value: "Secret Key: 12345",
        variant: "ghost",
        size: "md",
    },
};

export const Primary: Story = {
    args: {
        value: "https://example.com",
        label: "Copy Link",
        variant: "primary",
    },
};
