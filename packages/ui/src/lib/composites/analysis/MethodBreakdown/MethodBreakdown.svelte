<script lang="ts" module>
    export interface MethodCount {
        method: string;
        count: number;
        percentage: number;
    }

    export interface Props {
        /** Method distribution */
        breakdown: MethodCount[];
        /** Show skeleton loading state */
        loading?: boolean;
        /** Filter by method handler */
        onmethodclick?: (method: string) => void;
    }
</script>

<script lang="ts">
    let { breakdown, loading = false, onmethodclick }: Props = $props();

    // Sort by count descending for display
    const sortedBreakdown = $derived(
        [...breakdown].sort((a, b) => b.count - a.count),
    );
</script>

<div class="ce-method-breakdown">
    <div class="ce-method-breakdown__title">Method Breakdown</div>

    {#if loading}
        <div class="ce-method-breakdown__list">
            {#each [1, 2, 3] as _}
                <div class="ce-method-bar ce-method-bar--skeleton">
                    <span class="ce-method-bar__label-skeleton"></span>
                    <div class="ce-method-bar__track">
                        <div class="ce-method-bar__fill-skeleton"></div>
                    </div>
                    <span class="ce-method-bar__count-skeleton"></span>
                </div>
            {/each}
        </div>
    {:else if sortedBreakdown.length === 0}
        <div class="ce-method-breakdown__empty">No methods recorded yet</div>
    {:else}
        <div class="ce-method-breakdown__list">
            {#each sortedBreakdown as { method, count, percentage }}
                <button
                    class="ce-method-bar"
                    onclick={() => onmethodclick?.(method)}
                    type="button"
                >
                    <span class="ce-method-bar__label">{method}</span>
                    <div class="ce-method-bar__track">
                        <div
                            class="ce-method-bar__fill"
                            style:width="{percentage}%"
                        ></div>
                    </div>
                    <span class="ce-method-bar__count"
                        >{count.toLocaleString()}</span
                    >
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .ce-method-breakdown {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
    }

    .ce-method-breakdown__title {
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        color: var(--color-text-primary);
    }

    .ce-method-breakdown__list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .ce-method-breakdown__empty {
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        color: var(--color-text-tertiary);
        text-align: center;
        padding: var(--space-4);
    }

    .ce-method-bar {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        cursor: pointer;
        padding: var(--space-1);
        border-radius: var(--radius-sm);
        transition: background var(--duration-fast) var(--ease-out);
        background: transparent;
        border: none;
        width: 100%;
        text-align: left;
    }

    .ce-method-bar:hover {
        background: var(--color-bg-secondary);
    }

    .ce-method-bar:focus-visible {
        outline: 2px solid var(--color-info);
        outline-offset: 2px;
    }

    .ce-method-bar__label {
        width: 140px;
        font-size: var(--text-sm);
        font-family: var(--font-mono);
        color: var(--color-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .ce-method-bar__track {
        flex: 1;
        height: 8px;
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-full);
        overflow: hidden;
    }

    .ce-method-bar__fill {
        height: 100%;
        background: var(--color-info);
        border-radius: var(--radius-full);
        transition: width var(--duration-normal) var(--ease-out);
    }

    .ce-method-bar__count {
        min-width: 48px;
        text-align: right;
        font-size: var(--text-sm);
        font-family: var(--font-mono);
        color: var(--color-text-secondary);
    }

    /* Skeleton styles */
    .ce-method-bar--skeleton {
        cursor: default;
    }

    .ce-method-bar--skeleton:hover {
        background: transparent;
    }

    .ce-method-bar__label-skeleton {
        width: 100px;
        height: 14px;
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-sm);
        animation: pulse 1.5s ease-in-out infinite;
    }

    .ce-method-bar__fill-skeleton {
        width: 60%;
        height: 100%;
        background: var(--color-bg-secondary);
        animation: pulse 1.5s ease-in-out infinite;
    }

    .ce-method-bar__count-skeleton {
        width: 32px;
        height: 14px;
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-sm);
        animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
</style>
