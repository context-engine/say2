<script lang="ts">
    interface Props {
        message: string;
        assertive?: boolean;
    }

    let { message, assertive = false }: Props = $props();
</script>

<div
    class="ce-live-region"
    role="status"
    aria-live={assertive ? "assertive" : "polite"}
    aria-atomic="true"
>
    {message}
</div>

<style>
    /* Visually hidden but accessible */
    .ce-live-region {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
</style>
