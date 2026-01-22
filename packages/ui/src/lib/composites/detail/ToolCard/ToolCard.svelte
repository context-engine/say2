<script lang="ts" module>
    export interface Tool {
        name: string;
        description?: string;
        inputSchema?: any;
        annotations?: {
            title?: string;
            readOnlyHint?: boolean;
            destructiveHint?: boolean;
            idempotentHint?: boolean;
            openWorldHint?: boolean;
        };
    }
</script>

<script lang="ts">
    import { Wrench } from "lucide-svelte";
    import Badge from "../../../primitives/Badge/Badge.svelte";

    interface Props {
        tool: Tool;
        onclick?: () => void;
    }

    let { tool, onclick }: Props = $props();
</script>

<button
    class="ce-tool-card"
    {onclick}
    type="button"
    aria-label="Tool: {tool.name}"
>
    <div class="ce-tool-card__icon">
        <Wrench size={20} />
    </div>

    <div class="ce-tool-card__info">
        <h4 class="ce-tool-card__name">{tool.name}</h4>
        {#if tool.description}
            <p class="ce-tool-card__desc" title={tool.description}>
                {tool.description}
            </p>
        {/if}
    </div>

    <div class="ce-tool-card__badges">
        {#if tool.annotations?.destructiveHint}
            <Badge variant="error" size="sm">destructive</Badge>
        {/if}
        {#if tool.annotations?.readOnlyHint}
            <Badge variant="info" size="sm">read-only</Badge>
        {/if}
        {#if tool.annotations?.openWorldHint}
            <Badge variant="warning" size="sm">open-world</Badge>
        {/if}
    </div>
</button>

<style>
    .ce-tool-card {
        display: flex;
        align-items: center;
        width: 100%;
        padding: var(--space-3) var(--space-4);
        gap: var(--space-3);
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        cursor: pointer;
        text-align: left;
        transition: all var(--duration-fast) var(--ease-out);
        font-family: var(--font-ui);
        outline: none;
    }

    .ce-tool-card:hover {
        background: var(--color-bg-secondary);
        border-color: var(--color-border-hover);
    }

    .ce-tool-card:focus-visible {
        border-color: var(--color-info);
        box-shadow: 0 0 0 2px
            color-mix(in srgb, var(--color-info) 20%, transparent);
    }

    .ce-tool-card__icon {
        flex-shrink: 0;
        color: var(--color-text-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .ce-tool-card:hover .ce-tool-card__icon {
        color: var(--color-text-primary);
    }

    .ce-tool-card__info {
        flex: 1;
        min-width: 0; /* Important for ellipsis */
        display: flex;
        flex-direction: column;
    }

    .ce-tool-card__name {
        margin: 0;
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text-primary);
        line-height: 1.2;
    }

    .ce-tool-card__desc {
        margin: var(--space-1) 0 0 0;
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .ce-tool-card__badges {
        display: flex;
        gap: var(--space-2);
        flex-shrink: 0;
    }
</style>
