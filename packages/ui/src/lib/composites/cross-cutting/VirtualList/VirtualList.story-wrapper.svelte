<script lang="ts">
    import VirtualList from "./VirtualList.svelte";
    import Button from "../../../primitives/Button/Button.svelte";
    import Badge from "../../../primitives/Badge/Badge.svelte";

    interface Item {
        id: string;
        title: string;
        description: string;
        height?: number;
    }

    interface Props {
        items: Item[];
        itemHeight: number | ((item: Item, index: number) => number);
    }

    let { items, itemHeight }: Props = $props();
    let virtualList: any = $state();
    let scrollIndex = $state(0);

    function handleScrollTo() {
        virtualList?.scrollToIndex(scrollIndex, { align: "center" });
    }
</script>

<div class="ce-virtual-list-demo">
    <div class="ce-virtual-list-demo__controls">
        <div class="ce-virtual-list-demo__scroll-input">
            <input
                type="number"
                bind:value={scrollIndex}
                min="0"
                max={items.length - 1}
                class="ce-virtual-list-demo__input"
            />
            <Button onclick={handleScrollTo} size="sm">Scroll to Index</Button>
        </div>
        <div class="ce-virtual-list-demo__stats">
            <Badge variant="info">{items.length} total items</Badge>
        </div>
    </div>

    <div class="ce-virtual-list-demo__container">
        <VirtualList bind:this={virtualList} {items} {itemHeight}>
            {#snippet children(item, index)}
                <div
                    class="ce-virtual-list-demo__item"
                    style:height="{typeof itemHeight === 'number'
                        ? itemHeight
                        : itemHeight(item, index)}px"
                >
                    <div class="ce-virtual-list-demo__item-header">
                        <strong>{item.title}</strong>
                        <Badge variant="default">#{index}</Badge>
                    </div>
                    <p class="ce-virtual-list-demo__item-body">
                        {item.description}
                    </p>
                </div>
            {/snippet}

            {#snippet empty()}
                <div class="ce-virtual-list-demo__empty">No items found.</div>
            {/snippet}
        </VirtualList>
    </div>
</div>

<style>
    .ce-virtual-list-demo {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        height: 500px;
        padding: var(--space-4);
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
    }

    .ce-virtual-list-demo__controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: var(--space-2);
        border-bottom: 1px solid var(--color-border);
    }

    .ce-virtual-list-demo__scroll-input {
        display: flex;
        gap: var(--space-2);
        align-items: center;
    }

    .ce-virtual-list-demo__input {
        width: 80px;
        height: 32px;
        padding: 0 var(--space-2);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
    }

    .ce-virtual-list-demo__container {
        flex: 1;
        min-height: 0;
        height: 400px;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
    }

    .ce-virtual-list-demo__item {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 var(--space-4);
        border-bottom: 1px solid var(--color-border);
        background: var(--color-bg-primary);
    }

    .ce-virtual-list-demo__item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .ce-virtual-list-demo__item-body {
        margin: 0;
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .ce-virtual-list-demo__empty {
        padding: var(--space-8);
        text-align: center;
        color: var(--color-text-tertiary);
    }
</style>
