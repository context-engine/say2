<script lang="ts">
    import TrafficList from "./TrafficList.svelte";

    let props = $props();
</script>

<div
    style="height: 600px; width: 100%; border: 1px solid var(--color-border); display: flex; flex-direction: column;"
>
    <TrafficList {...props} />
</div>
