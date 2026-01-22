<script lang="ts">
    import type { Snippet, Component } from "svelte";

    interface Props {
        title: string;
        description?: string;
        action?: Snippet;
        icon?: any;
    }

    let { title, description, action, icon: Icon }: Props = $props();
</script>

<div class="ce-empty-state">
    {#if Icon}
        <div class="ce-empty-state__icon">
            <Icon size={48} class="text-tertiary" />
        </div>
    {/if}

    <h3 class="ce-empty-state__title">{title}</h3>

    {#if description}
        <p class="ce-empty-state__description">{description}</p>
    {/if}

    {#if action}
        <div class="ce-empty-state__action">
            {@render action()}
        </div>
    {/if}
</div>

<style>
    .ce-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: var(--space-8);
        background: var(--color-bg-surface);
        border-radius: var(--radius-md);
        border: 1px dashed var(--color-border);
        height: 100%;
        min-height: 200px;
        color: var(--color-text-primary);
        font-family: var(--font-ui);
    }

    .ce-empty-state__icon {
        margin-bottom: var(--space-4);
        color: var(--color-text-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* We can't easily style the passed component directly via class if it doesn't accept class, 
       but we can wrap it or expect it to inherit color. Lucide icons inherit color usually. */

    .ce-empty-state__title {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--text-lg);
        font-weight: 600;
        color: var(--color-text-primary);
    }

    .ce-empty-state__description {
        margin: 0 0 var(--space-6) 0;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        max-width: 40ch;
        line-height: normal;
    }

    .ce-empty-state__action {
        display: flex;
        gap: var(--space-3);
    }

    /* Utility utility class for icon color if needed */
    :global(.text-tertiary) {
        color: var(--color-text-tertiary);
    }
</style>
