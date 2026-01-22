import type { Meta, StoryObj } from '@storybook/svelte';
import SessionList from './SessionList.svelte';
import type { Session } from '../SessionCard/SessionCard.svelte';

const mockSessions: Session[] = [
    {
        id: '1',
        name: 'Echo Server',
        status: 'active',
        messageCount: 42,
        createdAt: new Date(),
        serverCommand: 'npx @modelcontextprotocol/server-echo'
    },
    {
        id: '2',
        name: 'Memory Server',
        status: 'connected',
        messageCount: 12,
        createdAt: new Date(Date.now() - 3600000),
        serverCommand: 'npx @modelcontextprotocol/server-memory'
    },
    {
        id: '3',
        name: 'Failed Server',
        status: 'error',
        messageCount: 0,
        createdAt: new Date(Date.now() - 7200000),
        serverCommand: 'cat /dev/null'
    },
    {
        id: '4',
        name: 'Disconnected',
        status: 'disconnected',
        messageCount: 150,
        createdAt: new Date(Date.now() - 86400000),
        serverCommand: 'npx server-something'
    }
];

const meta = {
    title: 'Composites/Session/SessionList',
    component: SessionList,
    tags: ['autodocs'],
    argTypes: {
        loading: { control: 'boolean' },
        selectedId: { control: 'text' },
        searchQuery: { control: 'text' }
    }
} satisfies Meta<typeof SessionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        sessions: mockSessions,
        selectedId: '1'
    }
};

export const Empty: Story = {
    args: {
        sessions: [],
        searchQuery: ''
    }
};

export const NoResults: Story = {
    args: {
        sessions: mockSessions,
        searchQuery: 'something that does not exist'
    }
};

export const Loading: Story = {
    args: {
        sessions: [],
        loading: true
    }
};
