<script lang="ts" module>
    import type { Snippet } from "svelte";

    export interface ScrollInfo {
        scrollTop: number;
        scrollHeight: number;
        clientHeight: number;
        startIndex: number;
        endIndex: number;
    }

    export interface Props<T> {
        /** Items to render */
        items: T[];
        /** Estimated or fixed height of each row */
        itemHeight: number | ((item: T, index: number) => number);
        /** Number of items to render outside the visible area */
        overscan?: number;
        /** Item renderer snippet */
        children: Snippet<[T, number]>;
        /** Optional empty state snippet */
        empty?: Snippet;
        /** Scroll metadata callback */
        onScroll?: (info: ScrollInfo) => void;
    }
</script>

<script lang="ts" generics="T">
    import { createVirtualizer } from "@tanstack/svelte-virtual";
    import { onMount } from "svelte";

    let {
        items,
        itemHeight,
        overscan = 3,
        children,
        empty,
        onScroll,
    }: Props<T> = $props();

    let containerElement: HTMLDivElement | undefined = $state();

    // The estimateSize function needs to be reactive to itemHeight and items.
    // By defining it directly within the virtualizer options as a getter,
    // or as a derived value, it ensures reactivity.
    // The original `estimateSize` variable was not reactive to changes in `itemHeight` or `items`.
    // The user's proposed change for `estimateSize` variable was slightly off,
    // but the change within `createVirtualizer` options correctly addresses reactivity.

    const virtualizer = createVirtualizer({
        get count() {
            return items.length;
        },
        getScrollElement: () => containerElement!,
        get estimateSize() {
            return typeof itemHeight === "number"
                ? () => itemHeight
                : (index: number) =>
                      (itemHeight as (item: T, index: number) => number)(
                          items[index]!, // Added non-null assertion
                          index,
                      );
        },
        get overscan() {
            return overscan;
        },
    });

    // Exported methods for binding
    export function scrollToIndex(
        index: number,
        options?: { align?: "start" | "center" | "end" | "auto" },
    ) {
        $virtualizer.scrollToIndex(index, options);
    }

    export function scrollToOffset(
        offset: number,
        options?: { align?: "start" | "center" | "end" | "auto" },
    ) {
        $virtualizer.scrollToOffset(offset, options);
    }

    const virtualItems = $derived($virtualizer.getVirtualItems());
    const totalSize = $derived($virtualizer.getTotalSize());

    function handleScroll(e: Event) {
        if (!containerElement) return;

        const { scrollTop, scrollHeight, clientHeight } = containerElement;
        const items = $virtualizer.getVirtualItems();

        if (items.length > 0) {
            onScroll?.({
                scrollTop,
                scrollHeight,
                clientHeight,
                startIndex: items[0]!.index,
                endIndex: items[items.length - 1]!.index,
            });
        }
    }
</script>

<div
    bind:this={containerElement}
    class="ce-virtual-list"
    onscroll={handleScroll}
>
    {#if items.length === 0}
        <div class="ce-virtual-list__empty">
            {#if empty}
                {@render empty()}
            {:else}
                <p>No items to display</p>
            {/if}
        </div>
    {:else}
        <div
            class="ce-virtual-list__content"
            style:height="{totalSize}px"
            style:width="100%"
            style:position="relative"
        >
            {#each virtualItems as virtualItem (virtualItem.index)}
                <div
                    class="ce-virtual-list__item-wrapper"
                    style:position="absolute"
                    style:top="0"
                    style:left="0"
                    style:width="100%"
                    style:height="{virtualItem.size}px"
                    style:transform="translateY({virtualItem.start}px)"
                    data-index={virtualItem.index}
                >
                    {@render children(
                        items[virtualItem.index]!,
                        virtualItem.index,
                    )}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .ce-virtual-list {
        height: 100%;
        width: 100%;
        overflow-y: auto;
        position: relative;
        contain: strict;
        font-family: var(--font-ui);
    }

    .ce-virtual-list__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--color-text-tertiary);
    }

    .ce-virtual-list__item-wrapper {
        will-change: transform;
    }
</style>
