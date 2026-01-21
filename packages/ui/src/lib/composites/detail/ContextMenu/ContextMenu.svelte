<script lang="ts" module>
    import type { Component } from "svelte";

    export interface MenuItem {
        label: string;
        icon?: any;
        action: () => void;
        disabled?: boolean;
        variant?: "default" | "danger";
    }
</script>

<script lang="ts">
    import { ContextMenu } from "bits-ui";
    import { fade } from "svelte/transition";
    import type { Snippet } from "svelte";

    interface Props {
        /** Menu items to display */
        items: MenuItem[];
        /** Content that should trigger the context menu */
        children: Snippet;
        /** Optional class for the content container */
        class?: string;
    }

    let { items, children, class: className }: Props = $props();
</script>

<ContextMenu.Root>
    <ContextMenu.Trigger class="ce-context-menu-trigger">
        {@render children()}
    </ContextMenu.Trigger>

    <ContextMenu.Portal>
        <ContextMenu.Content
            class="ce-context-menu-content {className || ''}"
            sideOffset={5}
            align="start"
        >
            {#each items as item}
                <ContextMenu.Item
                    class="ce-context-menu-item ce-context-menu-item--{item.variant ||
                        'default'} {item.disabled ? 'disabled' : ''}"
                    onSelect={item.action}
                    disabled={item.disabled}
                >
                    {#if item.icon}
                        {@const Icon = item.icon}
                        <span class="ce-context-menu-icon">
                            <Icon size={16} />
                        </span>
                    {/if}
                    <span class="ce-context-menu-label">{item.label}</span>
                </ContextMenu.Item>
            {/each}
        </ContextMenu.Content>
    </ContextMenu.Portal>
</ContextMenu.Root>

<style>
    :global(.ce-context-menu-trigger) {
        display: contents;
    }

    :global(.ce-context-menu-content) {
        min-width: 160px;
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        padding: var(--space-1);
        z-index: var(--z-dropdown);
        outline: none;
    }

    :global(.ce-context-menu-item) {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        color: var(--color-text-primary);
        transition: background var(--duration-fast) var(--ease-out);
        outline: none;
    }

    :global(.ce-context-menu-item:hover:not(.disabled)),
    :global(.ce-context-menu-item[data-highlighted]:not(.disabled)) {
        background: var(--color-bg-secondary);
    }

    :global(.ce-context-menu-item--danger) {
        color: var(--color-error);
    }

    :global(.ce-context-menu-item--danger:hover:not(.disabled)),
    :global(.ce-context-menu-item--danger[data-highlighted]:not(.disabled)) {
        background: color-mix(in srgb, var(--color-error) 10%, transparent);
    }

    :global(.ce-context-menu-item.disabled) {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .ce-context-menu-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-tertiary);
    }

    :global(.ce-context-menu-item:hover) .ce-context-menu-icon {
        color: var(--color-text-primary);
    }

    .ce-context-menu-label {
        flex: 1;
    }
</style>
