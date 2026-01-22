import type { Meta, StoryObj } from '@storybook/svelte';
import TrafficList from './TrafficList.svelte';
import type { Message } from './TrafficList.svelte';

import TrafficListWrapper from './TrafficList.story-wrapper.svelte';

const meta = {
    title: 'Composites/Messages/TrafficList',
    component: TrafficList,
    tags: ['autodocs'],
    argTypes: {
        selectedId: { control: 'text' },
        loading: { control: 'boolean' },
        autoScroll: { control: 'boolean' },
        atBottom: { control: 'boolean' },
    },
    render: (args) => ({
        Component: TrafficListWrapper,
        props: args
    }),
    parameters: {
        layout: 'fullscreen',
    }
} satisfies Meta<typeof TrafficList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Generate sample messages
const generateMessages = (count: number): Message[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `msg-${i}`,
        direction: i % 2 === 0 ? 'inbound' : 'outbound',
        type: i % 3 === 0 ? 'notification' : (i % 2 === 0 ? 'request' : 'response'),
        method: `method.test.${i}`,
        preview: `Message preview content ${i}`,
        timestamp: new Date(Date.now() - (count - i) * 60000),
        hasResponse: i % 4 === 0
    }));
};

export const Default: Story = {
    args: {
        messages: generateMessages(20),
        autoScroll: true,
        atBottom: true
    }
};

export const Empty: Story = {
    args: {
        messages: []
    }
};

export const Loading: Story = {
    args: {
        messages: [],
        loading: true
    }
};

export const ManyMessages: Story = {
    args: {
        messages: generateMessages(1000), // 1000 items to test virtualization
        autoScroll: true,
        atBottom: true
    }
};

export const WithSelection: Story = {
    args: {
        messages: generateMessages(20),
        selectedId: 'msg-10'
    }
};
