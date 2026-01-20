import type { Meta, StoryObj } from '@storybook/svelte';
import Icon from './Icon.svelte';
import {
    Settings,
    Check,
    Play,
    Pause,
    Copy,
    X,
    Search,
    ArrowRight
} from 'lucide-svelte';

const meta = {
    title: 'Primitives/Icon',
    component: Icon,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg', 24, 32, 48],
        },
        color: { control: 'color' },
        strokeWidth: { control: { type: 'range', min: 1, max: 3, step: 0.5 } },
    },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        icon: Settings,
    },
};

export const Small: Story = {
    args: {
        icon: Settings,
        size: 'sm', // 14px
    },
};

export const Large: Story = {
    args: {
        icon: Settings,
        size: 'lg', // 20px
    },
};

export const CustomSize: Story = {
    args: {
        icon: Settings,
        size: 48,
    },
};

export const CustomColor: Story = {
    args: {
        icon: Check,
        color: 'var(--color-success)',
        strokeWidth: 3,
    },
};

export const WithLabel: Story = {
    args: {
        icon: Search,
        label: 'Search',
    },
};
// CommonIcons story removed to avoid inline template complexity)
