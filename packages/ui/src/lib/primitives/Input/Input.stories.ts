import type { Meta, StoryObj } from '@storybook/svelte';
import Input, { type Props } from './Input.svelte';
import { Search, Mail, Lock } from 'lucide-svelte';

const meta = {
    title: 'Primitives/Input',
    component: Input,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['text', 'search', 'number', 'password'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md'],
        },
        disabled: { control: 'boolean' },
        error: { control: 'boolean' },
    },
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        placeholder: 'Enter text...',
    },
};

export const WithValue: Story = {
    args: {
        value: 'Initial value',
    },
};

export const WithIcon: Story = {
    args: {
        icon: Mail,
        placeholder: 'Email address',
    },
};

export const SearchInput: Story = {
    args: {
        type: 'search',
        icon: Search,
        placeholder: 'Search...',
    },
};

export const NumberInput: Story = {
    args: {
        type: 'number',
        placeholder: 'Enter amount',
    },
};

export const PasswordInput: Story = {
    args: {
        type: 'password',
        icon: Lock,
        placeholder: 'Password',
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
        value: 'Disabled input',
    },
};

export const Error: Story = {
    args: {
        error: true,
        value: 'Invalid input',
    },
};

export const Small: Story = {
    args: {
        size: 'sm',
        placeholder: 'Small input',
    },
};
