import type { Meta, StoryObj } from '@storybook/svelte';
import MessageRow from './MessageRow.svelte';
import SelectionWrapper from './MessageRow.story-wrapper.svelte';

const meta = {
    title: 'Composites/Messages/MessageRow',
    component: MessageRow,
    tags: ['autodocs'],
    argTypes: {
        direction: {
            control: 'select',
            options: ['inbound', 'outbound']
        },
        type: {
            control: 'select',
            options: ['request', 'response', 'notification']
        },
        selected: { control: 'boolean' },
        hasResponse: { control: 'boolean' },
        timestamp: { control: 'date' }
    }
} satisfies Meta<typeof MessageRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// ... existing stories ...
export const InboundRequest: Story = {
    args: {
        id: '1',
        direction: 'inbound',
        type: 'request',
        method: 'mcp.prompts.list',
        preview: '{ "filter": "technical" }',
        timestamp: new Date(),
        hasResponse: false,
        selected: false
    }
};

export const OutboundResponse: Story = {
    args: {
        id: '2',
        direction: 'outbound',
        type: 'response',
        method: 'mcp.prompts.list',
        preview: '{ "prompts": [ ... ] }',
        timestamp: new Date(Date.now() + 1000),
        hasResponse: true,
        selected: false
    }
};

export const Notification: Story = {
    args: {
        id: '3',
        direction: 'inbound',
        type: 'notification',
        method: 'notifications/initialized',
        preview: 'Server is ready',
        timestamp: new Date(Date.now() + 5000),
        hasResponse: false,
        selected: false
    }
};

export const Selected: Story = {
    args: {
        ...InboundRequest.args,
        id: '4',
        selected: true
    }
};

export const LongPreview: Story = {
    args: {
        id: '5',
        direction: 'inbound',
        type: 'request',
        method: 'mcp.resources.read',
        preview: 'This is a very long preview message that should be truncated because it exceeds the available width of the component container in a real scenario.',
        timestamp: new Date(),
        hasResponse: false,
        selected: false
    }
};

export const SelectionDemo: Story = {
    args: {} as any,
    render: () => ({
        Component: SelectionWrapper
    })
};
