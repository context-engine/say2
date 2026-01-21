import type { Meta, StoryObj } from '@storybook/svelte';
import StatusDot, { type Props } from './StatusDot.svelte';

const meta = {
    title: 'Primitives/StatusDot',
    component: StatusDot,
    tags: ['autodocs'],
    argTypes: {
        status: {
            control: 'select',
            options: ['success', 'warning', 'error', 'info', 'neutral'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md'],
        },
        pulse: { control: 'boolean' },
    },
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
    args: {
        status: 'neutral',
    },
};

export const Success: Story = {
    args: {
        status: 'success',
    },
};

export const Warning: Story = {
    args: {
        status: 'warning',
    },
};

export const Error: Story = {
    args: {
        status: 'error',
    },
};

export const Info: Story = {
    args: {
        status: 'info',
    },
};

export const Pulsing: Story = {
    args: {
        status: 'success',
        pulse: true,
    },
};

export const Small: Story = {
    args: {
        status: 'success',
        size: 'sm',
    },
};
