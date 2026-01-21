<!-- src/lib/primitives/Tooltip/Tooltip.story-wrapper.svelte -->
<script lang="ts">
    import Tooltip from "./Tooltip.svelte";
    import Button from "../Button/Button.svelte";
</script>

<div class="story-container">
    <div class="row">
        <Tooltip content="Tooltip on top" side="top">
            <Button size="sm">Top</Button>
        </Tooltip>

        <Tooltip content="Tooltip on bottom" side="bottom">
            <Button size="sm">Bottom</Button>
        </Tooltip>

        <Tooltip content="Tooltip on left" side="left">
            <Button size="sm">Left</Button>
        </Tooltip>

        <Tooltip content="Tooltip on right" side="right">
            <Button size="sm">Right</Button>
        </Tooltip>
    </div>

    <div class="row">
        <Tooltip
            content="This is a longer tooltip that demonstrates text handling"
            side="top"
        >
            <Button>Hover for details</Button>
        </Tooltip>
    </div>
</div>

<style>
    .story-container {
        padding: var(--space-8);
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
    }

    .row {
        display: flex;
        gap: var(--space-4);
        align-items: center;
    }
</style>
