<script lang="ts" module>
    export interface Props {
        /** Whether auto-scroll is active */
        active?: boolean;
        /** Toggle handler */
        onToggle?: (active: boolean) => void;
        /** Manual scroll to bottom handler */
        onScrollToBottom?: () => void;
    }
</script>

<script lang="ts">
    import Button from "../../../primitives/Button/Button.svelte";
    import Toggle from "../../../primitives/Toggle/Toggle.svelte";
    import { ArrowDownToLine } from "lucide-svelte";

    let { active = false, onToggle, onScrollToBottom }: Props = $props();
</script>

<div class="ce-scroll-to-latest">
    <Button
        variant="ghost"
        size="sm"
        onclick={onScrollToBottom}
        aria-label="Scroll to bottom"
    >
        <ArrowDownToLine size={16} />
    </Button>

    <div class="ce-scroll-to-latest__toggle">
        <Toggle checked={active} onchange={onToggle} />
        <span class="ce-scroll-to-latest__label">Auto-scroll</span>
    </div>
</div>

<style>
    .ce-scroll-to-latest {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-3);
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-family: var(--font-ui);
    }

    .ce-scroll-to-latest__toggle {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .ce-scroll-to-latest__label {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        white-space: nowrap;
    }
</style>
