import type { Meta, StoryObj } from '@storybook/svelte';
import Badge from './Badge.svelte';

const meta = {
    title: 'Primitives/Badge',
    component: Badge,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'success', 'warning', 'error', 'info'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md'],
        },
        count: { control: 'number' },
        dot: { control: 'boolean' },
    },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Badge' as any,
    },
};

export const Success: Story = {
    args: {
        variant: 'success',
        children: 'Success' as any,
    },
};

export const Warning: Story = {
    args: {
        variant: 'warning',
        children: 'Warning' as any,
    },
};

export const Error: Story = {
    args: {
        variant: 'error',
        children: 'Error' as any,
    },
};

export const Info: Story = {
    args: {
        variant: 'info',
        children: 'Info' as any,
    },
};

export const WithCount: Story = {
    args: {
        variant: 'error',
        count: 5,
    },
};

export const HighCount: Story = {
    args: {
        variant: 'error',
        count: 150,
    },
};

export const Dot: Story = {
    args: {
        variant: 'success',
        dot: true,
        size: 'sm',
    },
};

export const Small: Story = {
    args: {
        size: 'sm',
        children: 'Small' as any,
    },
};
