import type { Meta, StoryObj } from '@storybook/svelte';
import ButtonStory from './Button.story-wrapper.svelte';
import { Save, Trash2, ArrowRight } from 'lucide-svelte';

const meta = {
    title: 'Primitives/Button',
    component: ButtonStory,
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
        text: { control: 'text' },
    },
} satisfies Meta<typeof ButtonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        variant: 'primary',
        text: 'Primary Action',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        text: 'Secondary Action',
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        text: 'Ghost Action',
    },
};

export const Danger: Story = {
    args: {
        variant: 'danger',
        text: 'Delete Item',
        icon: Trash2,
    },
};

export const Loading: Story = {
    args: {
        variant: 'primary',
        loading: true,
        text: 'Saving...',
    },
};

export const Disabled: Story = {
    args: {
        variant: 'primary',
        disabled: true,
        text: 'Disabled',
    },
};

export const WithIcon: Story = {
    args: {
        variant: 'primary',
        text: 'Save Changes',
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
