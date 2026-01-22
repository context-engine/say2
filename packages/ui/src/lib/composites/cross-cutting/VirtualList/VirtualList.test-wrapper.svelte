<script lang="ts">
    import VirtualList from "./VirtualList.svelte";

    let { items, itemHeight }: { items: any[]; itemHeight: number } = $props();
</script>

<VirtualList {items} {itemHeight}>
    {#snippet children(item, index)}
        <div data-index={index}>{item.text}</div>
    {/snippet}
</VirtualList>
