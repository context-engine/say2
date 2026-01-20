import type { Meta, StoryObj } from '@storybook/svelte';
import Button from './Button.svelte';
import { Save, Trash2, ArrowRight } from 'lucide-svelte';

const meta = {
    title: 'Primitives/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'ghost', 'danger'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        disabled: { control: 'boolean' },
        loading: { control: 'boolean' },
        iconOnly: { control: 'boolean' },
    },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Primary Action' as any,
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'Secondary Action' as any,
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        children: 'Ghost Action' as any,
    },
};

export const Danger: Story = {
    args: {
        variant: 'danger',
        children: 'Delete Item' as any,
        icon: Trash2,
    },
};

export const Loading: Story = {
    args: {
        variant: 'primary',
        loading: true,
        children: 'Saving...' as any,
    },
};

export const Disabled: Story = {
    args: {
        variant: 'primary',
        disabled: true,
        children: 'Disabled' as any,
    },
};

export const WithIcon: Story = {
    args: {
        variant: 'primary',
        children: 'Save Changes' as any,
        icon: Save,
    },
};

export const IconOnly: Story = {
    args: {
        variant: 'secondary',
        icon: ArrowRight,
        iconOnly: true,
        'aria-label': 'Next page',
    },
};
