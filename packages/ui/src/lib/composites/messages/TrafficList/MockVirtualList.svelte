<script lang="ts">
    // Mock VirtualList for testing
    let { items, children }: any = $props();

    // Export methods if needed (e.g. scrollToIndex)
    export function scrollToIndex(index: number) {}
</script>

<div class="ce-virtual-list-mock">
    {#each items as item, index}
        <div data-testid="virtual-item">
            {@render children(item, index)}
        </div>
    {/each}
</div>
