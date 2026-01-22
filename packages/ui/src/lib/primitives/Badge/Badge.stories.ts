import type { Meta, StoryObj } from '@storybook/svelte';
import BadgeStory from './Badge.story-wrapper.svelte';

const meta = {
    title: 'Primitives/Badge',
    component: BadgeStory,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'success', 'warning', 'error', 'info'],
            description: 'Color variant',
        },
        size: {
            control: 'select',
            options: ['sm', 'md'],
            description: 'Badge size',
        },
        count: {
            control: 'number',
            description: 'Numeric count (displays 99+ for values > 99)',
        },
        dot: {
            control: 'boolean',
            description: 'Dot-only mode (no text)',
        },
        text: {
            control: 'text',
            description: 'Badge text content',
        },
    },
} satisfies Meta<typeof BadgeStory>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
    args: {
        text: 'Badge',
    },
};

export const Success: Story = {
    args: {
        variant: 'success',
        text: 'Connected',
    },
};

export const Warning: Story = {
    args: {
        variant: 'warning',
        text: 'Pending',
    },
};

export const Error: Story = {
    args: {
        variant: 'error',
        text: 'Failed',
    },
};

export const Info: Story = {
    args: {
        variant: 'info',
        text: 'Information',
    },
};

// Count badges
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

// Dot badges
export const DotSuccess: Story = {
    args: {
        variant: 'success',
        dot: true,
    },
};

export const DotWarning: Story = {
    args: {
        variant: 'warning',
        dot: true,
    },
};

export const DotError: Story = {
    args: {
        variant: 'error',
        dot: true,
    },
};

// Size variations
export const Small: Story = {
    args: {
        size: 'sm',
        text: 'Small',
    },
};

export const SmallWithCount: Story = {
    args: {
        size: 'sm',
        variant: 'info',
        count: 12,
    },
};
