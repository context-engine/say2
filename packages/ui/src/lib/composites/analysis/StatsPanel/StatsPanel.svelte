<script lang="ts" module>
    export interface TrafficStats {
        totalMessages: number;
        requestCount: number;
        responseCount: number;
        notificationCount: number;
        errorCount: number;
        avgLatency: number;
    }

    export interface Props {
        /** Traffic statistics */
        stats: TrafficStats;
        /** Show skeleton loading state */
        loading?: boolean;
    }
</script>

<script lang="ts">
    import Badge from "../../../primitives/Badge/Badge.svelte";

    let { stats, loading = false }: Props = $props();

    function formatNumber(n: number): string {
        return n.toLocaleString();
    }
</script>

<div class="ce-stats-panel">
    <div class="ce-stats-panel__title">Statistics</div>

    <div class="ce-stats-panel__grid">
        <div class="ce-stats-panel__stat">
            <span class="ce-stats-panel__label">Total Messages</span>
            {#if loading}
                <span class="ce-stats-panel__skeleton"></span>
            {:else}
                <Badge variant="default"
                    >{formatNumber(stats.totalMessages)}</Badge
                >
            {/if}
        </div>

        <div class="ce-stats-panel__stat">
            <span class="ce-stats-panel__label">Requests</span>
            {#if loading}
                <span class="ce-stats-panel__skeleton"></span>
            {:else}
                <Badge variant="info">{formatNumber(stats.requestCount)}</Badge>
            {/if}
        </div>

        <div class="ce-stats-panel__stat">
            <span class="ce-stats-panel__label">Responses</span>
            {#if loading}
                <span class="ce-stats-panel__skeleton"></span>
            {:else}
                <Badge variant="success"
                    >{formatNumber(stats.responseCount)}</Badge
                >
            {/if}
        </div>

        <div class="ce-stats-panel__stat">
            <span class="ce-stats-panel__label">Notifications</span>
            {#if loading}
                <span class="ce-stats-panel__skeleton"></span>
            {:else}
                <Badge variant="warning"
                    >{formatNumber(stats.notificationCount)}</Badge
                >
            {/if}
        </div>

        <div class="ce-stats-panel__stat">
            <span class="ce-stats-panel__label">Errors</span>
            {#if loading}
                <span class="ce-stats-panel__skeleton"></span>
            {:else}
                <Badge variant="error">{formatNumber(stats.errorCount)}</Badge>
            {/if}
        </div>

        <div class="ce-stats-panel__stat">
            <span class="ce-stats-panel__label">Avg Latency</span>
            {#if loading}
                <span class="ce-stats-panel__skeleton"></span>
            {:else}
                <Badge variant="default"
                    >{formatNumber(stats.avgLatency)}ms</Badge
                >
            {/if}
        </div>
    </div>
</div>

<style>
    .ce-stats-panel {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
    }

    .ce-stats-panel__title {
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        color: var(--color-text-primary);
    }

    .ce-stats-panel__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--space-3);
    }

    .ce-stats-panel__stat {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    .ce-stats-panel__label {
        font-family: var(--font-ui);
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
    }

    .ce-stats-panel__skeleton {
        height: 1.5rem;
        width: 60px;
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
