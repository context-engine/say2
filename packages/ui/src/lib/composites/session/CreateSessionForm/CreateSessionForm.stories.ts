import type { Meta, StoryObj } from "@storybook/svelte";
import CreateSessionForm from "./CreateSessionForm.svelte";

const meta = {
    title: "Composites/Session/CreateSessionForm",
    component: CreateSessionForm,
    tags: ["autodocs"],
    argTypes: {
        loading: { control: "boolean" },
        error: { control: "text" },
    },
} satisfies Meta<typeof CreateSessionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};

export const Loading: Story = {
    args: {
        loading: true,
    },
};

export const WithError: Story = {
    args: {
        error: "Failed to connect to server. Please check the command and try again.",
    },
};
