<script lang="ts">
    import Badge from "../../../primitives/Badge/Badge.svelte";
    import { cn } from "../../../utils";
    import { ArrowDownLeft, ArrowUpRight, type Icon } from "lucide-svelte";
    import { onDestroy } from "svelte";

    interface Props {
        id: string;
        direction: "inbound" | "outbound";
        type?: "request" | "response" | "notification";
        method: string;
        preview: string;
        timestamp: Date | string;
        hasResponse?: boolean;
        selected?: boolean;
        onClick?: (id: string) => void;
    }

    let {
        id,
        direction,
        type = "request",
        method,
        preview,
        timestamp,
        hasResponse = false,
        selected = false,
        onClick,
    }: Props = $props();

    function formatTime(date: Date | string): string {
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
    }

    const badgeVariant = $derived(
        type === "notification"
            ? "warning"
            : type === "response"
              ? "info"
              : "default" /* request */,
    );

    const DirectionIcon = $derived(
        direction === "inbound" ? ArrowDownLeft : ArrowUpRight,
    );
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class={cn("ce-message-row", {
        "ce-message-row--selected": selected,
        "ce-message-row--outbound": direction === "outbound",
        "ce-message-row--inbound": direction === "inbound",
    })}
    onclick={() => onClick?.(id)}
>
    <div class="ce-message-row__icon">
        <div class="ce-message-row__icon-bg">
            <DirectionIcon size={14} strokeWidth={2.5} />
        </div>
    </div>

    <div class="ce-message-row__content">
        <div class="ce-message-row__header">
            <span class="ce-message-row__method" title={method}>{method}</span>
            <div class="ce-message-row__meta">
                {#if hasResponse}
                    <!-- Placeholder for pair indicator or similar visual cue -->
                    <div class="ce-message-row__pair-dot"></div>
                {/if}
                <Badge variant={badgeVariant} size="sm">{type}</Badge>
                <span class="ce-message-row__time">{formatTime(timestamp)}</span
                >
            </div>
        </div>
        <div class="ce-message-row__preview" title={preview}>
            {preview}
        </div>
    </div>
</div>

<style>
    .ce-message-row {
        display: flex;
        align-items: flex-start;
        padding: var(--space-3) var(--space-4);
        gap: var(--space-3);
        cursor: pointer;
        border-bottom: 1px solid var(--color-border);
        transition: background-color var(--duration-fast) var(--ease-out);
        background: var(--color-bg-primary);
        height: 100%;
        box-sizing: border-box;
    }

    .ce-message-row:hover {
        background: var(--color-bg-secondary);
    }

    .ce-message-row.ce-message-row--selected {
        background: color-mix(
            in srgb,
            var(--color-info) 15%,
            var(--color-bg-primary)
        );
        border-left: 4px solid var(--color-info);
        padding-left: calc(var(--space-4) - 4px); /* Compensate for border */
    }

    /* Icon Column */
    .ce-message-row__icon {
        flex-shrink: 0;
        margin-top: 2px;
    }

    .ce-message-row__icon-bg {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: var(--radius-full);
        background: var(--color-bg-tertiary);
        color: var(--color-text-secondary);
    }

    .ce-message-row--inbound .ce-message-row__icon-bg {
        color: var(--color-info);
        background: color-mix(in srgb, var(--color-info) 10%, transparent);
    }

    .ce-message-row--outbound .ce-message-row__icon-bg {
        color: var(
            --color-success
        ); /* Use success color to differentiate or create new token */
        background: color-mix(in srgb, var(--color-success) 10%, transparent);
    }

    /* Content Column */
    .ce-message-row__content {
        flex: 1;
        min-width: 0; /* Enable truncation */
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    .ce-message-row__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
    }

    .ce-message-row__method {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--color-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .ce-message-row__meta {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-shrink: 0;
    }

    .ce-message-row__time {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--color-text-tertiary);
    }

    .ce-message-row__pair-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--color-border-active);
    }

    /* Preview */
    .ce-message-row__preview {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        opacity: 0.8;
    }
</style>
