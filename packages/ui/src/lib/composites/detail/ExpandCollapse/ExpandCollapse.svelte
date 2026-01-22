<script lang="ts">
    import { ChevronRight } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import type { Snippet } from "svelte";

    interface Props {
        /** Controlled expanded state */
        expanded: boolean;
        /** Label text or custom snippet */
        label: string | Snippet;
        /** Content to show when expanded */
        children: Snippet;
        /** Toggle callback */
        ontoggle?: () => void;
        /** Optional class for the wrapper */
        class?: string;
    }

    let {
        expanded,
        label,
        children,
        ontoggle,
        class: className,
    }: Props = $props();
</script>

<div class="ce-expand-collapse {className || ''}">
    <button
        class="ce-ec-header"
        onclick={ontoggle}
        aria-expanded={expanded}
        type="button"
    >
        <span class="ce-ec-icon-wrapper {expanded ? 'expanded' : ''}">
            <ChevronRight size={16} />
        </span>

        <span class="ce-ec-label">
            {#if typeof label === "string"}
                {label}
            {:else}
                {@render label()}
            {/if}
        </span>
    </button>

    {#if expanded}
        <div class="ce-ec-content" transition:slide={{ duration: 200 }}>
            {@render children()}
        </div>
    {/if}
</div>

<style>
    .ce-expand-collapse {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-bg-surface);
        overflow: hidden;
    }

    .ce-ec-header {
        display: flex;
        align-items: center;
        width: 100%;
        padding: var(--space-2) var(--space-3);
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        color: var(--color-text-primary);
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        transition: background-color var(--duration-fast);
        outline: none;
    }

    .ce-ec-header:hover {
        background-color: var(--color-bg-secondary);
    }

    .ce-ec-header:focus-visible {
        background-color: var(--color-bg-secondary);
        box-shadow: inset 0 0 0 2px var(--color-info);
    }

    .ce-ec-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: var(--space-2);
        color: var(--color-text-tertiary);
        transition: transform var(--duration-normal) var(--ease-out);
    }

    .ce-ec-icon-wrapper.expanded {
        transform: rotate(90deg);
        color: var(--color-text-primary);
    }

    .ce-ec-label {
        font-weight: 500;
        flex: 1;
    }

    .ce-ec-content {
        padding: var(--space-3);
        border-top: 1px solid var(--color-border);
        background: var(--color-bg-surface);
        font-size: var(--text-sm);
    }
</style>
