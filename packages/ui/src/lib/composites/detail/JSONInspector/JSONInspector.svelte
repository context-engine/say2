<script lang="ts" module>
    export interface Props {
        /** JSON data to display */
        data: unknown;
        /** Initial expand depth */
        expandLevel?: number;
        /** Maximum recursion depth */
        maxDepth?: number;
        /** Search query to highlight */
        searchQuery?: string;
        /** Copy JSON path handler */
        oncopypath?: (path: string) => void;
    }
</script>

<script lang="ts">
    import { ChevronRight, Copy } from "lucide-svelte";
    import SearchHighlight from "../../analysis/SearchHighlight/SearchHighlight.svelte";

    let {
        data,
        expandLevel = 2,
        maxDepth = 10,
        searchQuery = "",
        oncopypath,
    }: Props = $props();

    function getValueType(value: unknown): string {
        if (value === null) return "null";
        if (Array.isArray(value)) return "array";
        return typeof value;
    }

    function getEntries(value: unknown, type: string): [string, unknown][] {
        if (type === "array") {
            return (value as unknown[]).map((v, i) => [String(i), v]);
        }
        return Object.entries(value as object);
    }

    function buildChildPath(
        parentPath: string,
        key: string,
        isArray: boolean,
    ): string {
        if (isArray) {
            return `${parentPath}[${key}]`;
        }
        return parentPath ? `${parentPath}.${key}` : key;
    }
</script>

<!-- Recursive component using self-reference -->
{#snippet renderValue(value: unknown, path: string, depth: number)}
    {@const valueType = getValueType(value)}

    {#if depth >= maxDepth}
        <span class="ce-json-truncated">...</span>
    {:else if valueType === "object" || valueType === "array"}
        {@const isArray = valueType === "array"}
        {@const entries = getEntries(value, valueType)}
        {@const isEmpty = entries.length === 0}
        {@const initiallyExpanded = depth < expandLevel}

        {#if isEmpty}
            <span class="ce-json-bracket">{isArray ? "[]" : "{}"}</span>
        {:else}
            <details class="ce-json-details" open={initiallyExpanded}>
                <summary class="ce-json-summary">
                    <ChevronRight size={14} class="ce-json-chevron" />
                    <span class="ce-json-bracket">{isArray ? "[" : "{"}</span>
                    <span class="ce-json-count"
                        >{entries.length} {isArray ? "items" : "keys"}</span
                    >
                </summary>
                <div class="ce-json-content">
                    {#each entries as [key, val]}
                        {@const childPath = buildChildPath(path, key, isArray)}
                        <div class="ce-json-entry">
                            <span class="ce-json-key">
                                {#if searchQuery}
                                    <SearchHighlight
                                        text={key}
                                        query={searchQuery}
                                    />
                                {:else}
                                    {key}
                                {/if}
                            </span>
                            <span class="ce-json-colon">:</span>
                            {@render renderValue(val, childPath, depth + 1)}
                            <button
                                class="ce-json-copy-path"
                                onclick={() => oncopypath?.(childPath)}
                                title="Copy path: {childPath}"
                                type="button"
                            >
                                <Copy size={12} />
                            </button>
                        </div>
                    {/each}
                </div>
                <span class="ce-json-bracket">{isArray ? "]" : "}"}</span>
            </details>
        {/if}
    {:else if valueType === "string"}
        <span class="ce-json-value ce-json-value--string">
            "{#if searchQuery}<SearchHighlight
                    text={String(value)}
                    query={searchQuery}
                />{:else}{value}{/if}"
        </span>
    {:else if valueType === "number"}
        <span class="ce-json-value ce-json-value--number">{value}</span>
    {:else if valueType === "boolean"}
        <span class="ce-json-value ce-json-value--boolean">{String(value)}</span
        >
    {:else if valueType === "null"}
        <span class="ce-json-value ce-json-value--null">null</span>
    {:else}
        <span class="ce-json-value">{String(value)}</span>
    {/if}
{/snippet}

<div class="ce-json-inspector">
    {@render renderValue(data, "", 0)}
</div>

<style>
    .ce-json-inspector {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        line-height: 1.5;
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-3);
        overflow: auto;
    }

    .ce-json-details {
        margin-left: var(--space-3);
    }

    .ce-json-details[open] > .ce-json-summary :global(.ce-json-chevron) {
        transform: rotate(90deg);
    }

    .ce-json-summary {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        cursor: pointer;
        list-style: none;
        user-select: none;
    }

    .ce-json-summary::-webkit-details-marker {
        display: none;
    }

    .ce-json-summary :global(.ce-json-chevron) {
        transition: transform var(--duration-fast);
        color: var(--color-text-tertiary);
    }

    .ce-json-bracket {
        color: var(--color-text-secondary);
    }

    .ce-json-count {
        color: var(--color-text-tertiary);
        font-size: var(--text-xs);
        margin-left: var(--space-1);
    }

    .ce-json-content {
        margin-left: var(--space-4);
        border-left: 1px solid var(--color-border);
        padding-left: var(--space-2);
    }

    .ce-json-entry {
        display: flex;
        align-items: flex-start;
        gap: var(--space-1);
        padding: 2px 0;
    }

    .ce-json-entry:hover {
        background: var(--color-bg-secondary);
        border-radius: var(--radius-sm);
    }

    .ce-json-key {
        color: var(--color-text-primary);
        font-weight: 500;
    }

    .ce-json-colon {
        color: var(--color-text-tertiary);
    }

    .ce-json-value--string {
        color: var(--color-success);
    }

    .ce-json-value--number {
        color: var(--color-info);
    }

    .ce-json-value--boolean {
        color: #a855f7;
    }

    .ce-json-value--null {
        color: var(--color-text-tertiary);
        font-style: italic;
    }

    .ce-json-truncated {
        color: var(--color-text-tertiary);
        font-style: italic;
    }

    .ce-json-copy-path {
        opacity: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0 var(--space-1);
        color: var(--color-text-tertiary);
        transition: opacity var(--duration-fast);
        display: flex;
        align-items: center;
    }

    .ce-json-entry:hover .ce-json-copy-path {
        opacity: 0.7;
    }

    .ce-json-copy-path:hover {
        opacity: 1 !important;
        color: var(--color-text-primary);
    }
</style>
