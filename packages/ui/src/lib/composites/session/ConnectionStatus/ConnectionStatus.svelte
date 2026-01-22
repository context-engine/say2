<script lang="ts" module>
    export type ConnectionState =
        | "disconnected"
        | "connecting"
        | "connected"
        | "reconnecting"
        | "error";

    export interface Props {
        /** Current connection state */
        state: ConnectionState;
        /** If true, only show the circle/spinner (with tooltip) */
        compact?: boolean;
    }
</script>

<script lang="ts">
    import StatusDot from "../../../primitives/StatusDot/StatusDot.svelte";
    import Spinner from "../../../primitives/Spinner/Spinner.svelte";
    import Tooltip from "../../../primitives/Tooltip/Tooltip.svelte";

    let { state = "disconnected", compact = false }: Props = $props();

    const stateConfig = $derived.by(() => {
        switch (state) {
            case "connected":
                return {
                    label: "Connected",
                    status: "success" as const,
                    pulse: true,
                };
            case "connecting":
                return {
                    label: "Connecting...",
                    status: "warning" as const,
                    loading: true,
                };
            case "reconnecting":
                return {
                    label: "Reconnecting...",
                    status: "warning" as const,
                    loading: true,
                };
            case "error":
                return { label: "Connection Failed", status: "error" as const };
            case "disconnected":
            default:
                return { label: "Disconnected", status: "neutral" as const };
        }
    });
</script>

{#snippet indicator()}
    <div class="ce-connection-status__indicator">
        {#if stateConfig.loading}
            <Spinner
                size="sm"
                color="var(--color-warning)"
                label={compact ? stateConfig.label : ""}
            />
        {:else}
            <StatusDot
                status={stateConfig.status}
                pulse={stateConfig.pulse}
                size="sm"
                label={compact ? stateConfig.label : ""}
            />
        {/if}
    </div>
{/snippet}

<div
    class="ce-connection-status ce-connection-status--{state} {compact
        ? 'ce-connection-status--compact'
        : ''}"
    role="status"
    aria-busy={stateConfig.loading}
>
    {#if compact}
        <Tooltip content={stateConfig.label}>
            {@render indicator()}
        </Tooltip>
    {:else}
        {@render indicator()}
        <span class="ce-connection-status__label">
            {stateConfig.label}
        </span>
    {/if}
</div>

<style>
    .ce-connection-status {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        color: var(--color-text-primary);
        line-height: 1;
        user-select: none;
    }

    .ce-connection-status--compact {
        gap: 0;
    }

    .ce-connection-status__indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem; /* Match Spinner sm size for consistent layout */
        height: 1.25rem;
    }

    .ce-connection-status__label {
        font-weight: 500;
        white-space: nowrap;
    }
</style>
