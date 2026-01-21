import type { Meta, StoryObj } from '@storybook/svelte';
import VirtualListWrapper from './VirtualList.story-wrapper.svelte';

interface Item {
    id: string;
    title: string;
    description: string;
    height: number;
}

const generateItems = (count: number): Item[] =>
    Array.from({ length: count }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i + 1}`,
        description: `This is the description for item ${i + 1}. It might be longer.`,
        height: 40 + Math.floor(Math.random() * 60)
    }));

const meta = {
    title: 'Composites/Cross-Cutting/VirtualList',
    component: VirtualListWrapper,
    tags: ['autodocs'],
} satisfies Meta<typeof VirtualListWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FixedHeight: Story = {
    args: {
        items: generateItems(1000),
        itemHeight: 60,
    }
};

export const VariableHeight: Story = {
    args: {
        items: generateItems(1000),
        itemHeight: ((item: Item) => item.height) as any,
    }
};

export const TenThousandItems: Story = {
    args: {
        items: generateItems(10000),
        itemHeight: 50,
    }
};

export const Empty: Story = {
    args: {
        items: [],
        itemHeight: 50,
    }
};
