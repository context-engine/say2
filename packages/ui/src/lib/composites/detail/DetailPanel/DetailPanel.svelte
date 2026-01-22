<script lang="ts" module>
    export interface Message {
        id: string;
        direction: "inbound" | "outbound";
        type: "request" | "response" | "notification";
        method: string;
        preview: string;
        timestamp: Date;
        hasResponse?: boolean;
        content?: unknown;
    }

    export interface Props {
        /** Selected message */
        message: Message | null;
        /** Loading message content */
        loading?: boolean;
        /** Close panel handler */
        onclose?: () => void;
    }
</script>

<script lang="ts">
    import {
        X,
        MessageSquare,
        ArrowDownLeft,
        ArrowUpRight,
        Copy,
    } from "lucide-svelte";
    import Button from "../../../primitives/Button/Button.svelte";
    import Badge from "../../../primitives/Badge/Badge.svelte";
    import Spinner from "../../../primitives/Spinner/Spinner.svelte";
    import JSONInspector from "../JSONInspector/JSONInspector.svelte";
    import CopyButton from "../CopyButton/CopyButton.svelte";

    let { message, loading = false, onclose }: Props = $props();

    const typeVariant = $derived(() => {
        if (!message) return "default";
        switch (message.type) {
            case "request":
                return "info";
            case "response":
                return "success";
            case "notification":
                return "warning";
            default:
                return "default";
        }
    });

    const DirectionIcon = $derived(
        !message
            ? MessageSquare
            : message.direction === "inbound"
              ? ArrowDownLeft
              : ArrowUpRight,
    );

    function formatTimestamp(date: Date): string {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }
</script>

<div class="ce-detail-panel">
    <header class="ce-detail-panel__header">
        <h2 class="ce-detail-panel__title">Message Details</h2>
        <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={X}
            onclick={onclose}
            aria-label="Close panel"
        />
    </header>

    {#if loading}
        <div class="ce-detail-panel__loading">
            <Spinner size="lg" />
            <span>Loading message content...</span>
        </div>
    {:else if !message}
        <div class="ce-detail-panel__empty">
            <MessageSquare size={48} strokeWidth={1.5} />
            <p>Select a message to view details</p>
        </div>
    {:else}
        <div class="ce-detail-panel__content">
            <!-- Metadata section -->
            <section class="ce-detail-panel__meta">
                <div class="ce-detail-panel__field">
                    <span class="ce-detail-panel__field-label">Method</span>
                    <div class="ce-detail-panel__field-value">
                        <code
                            class="ce-detail-panel__code ce-detail-panel__code--method"
                            >{message.method}</code
                        >
                        <CopyButton value={message.method} size="sm" />
                    </div>
                </div>

                <div class="ce-detail-panel__field">
                    <span class="ce-detail-panel__field-label">Type</span>
                    <div class="ce-detail-panel__field-value">
                        <Badge variant={typeVariant()} size="sm"
                            >{message.type}</Badge
                        >
                    </div>
                </div>

                <div class="ce-detail-panel__field">
                    <span class="ce-detail-panel__field-label">Direction</span>
                    <div
                        class="ce-detail-panel__field-value ce-detail-panel__direction"
                    >
                        <DirectionIcon size={14} />
                        <span>{message.direction}</span>
                    </div>
                </div>

                <div class="ce-detail-panel__field">
                    <span class="ce-detail-panel__field-label">Time</span>
                    <div class="ce-detail-panel__field-value">
                        <time class="ce-detail-panel__time"
                            >{formatTimestamp(message.timestamp)}</time
                        >
                    </div>
                </div>

                <div class="ce-detail-panel__field">
                    <span class="ce-detail-panel__field-label">ID</span>
                    <div class="ce-detail-panel__field-value">
                        <code
                            class="ce-detail-panel__code ce-detail-panel__code--id"
                            >{message.id}</code
                        >
                        <CopyButton value={message.id} size="sm" />
                    </div>
                </div>
            </section>

            <!-- Content section -->
            <section class="ce-detail-panel__body">
                <header class="ce-detail-panel__section-header">
                    <h3 class="ce-detail-panel__section-title">Content</h3>
                    <CopyButton
                        value={JSON.stringify(message.content, null, 2)}
                        size="sm"
                    />
                </header>

                <div class="ce-detail-panel__json">
                    {#if message.content}
                        <JSONInspector data={message.content} expandLevel={3} />
                    {:else}
                        <div class="ce-detail-panel__no-content">
                            No content available
                        </div>
                    {/if}
                </div>
            </section>
        </div>
    {/if}
</div>

<style>
    .ce-detail-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-width: 320px;
        background: var(--color-bg-primary);
        border-left: 1px solid var(--color-border);
    }

    .ce-detail-panel__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4);
        border-bottom: 1px solid var(--color-border);
        background: var(--color-bg-surface);
    }

    .ce-detail-panel__title {
        margin: 0;
        font-family: var(--font-ui);
        font-size: var(--text-base);
        font-weight: var(--font-semibold);
        color: var(--color-text-primary);
    }

    .ce-detail-panel__loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        flex: 1;
        padding: var(--space-8);
        min-height: 200px;
        color: var(--color-text-secondary);
        font-family: var(--font-ui);
        font-size: var(--text-sm);
    }

    .ce-detail-panel__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        flex: 1;
        color: var(--color-text-tertiary);
        text-align: center;
        padding: var(--space-8);
    }

    .ce-detail-panel__empty p {
        margin: 0;
        font-family: var(--font-ui);
        font-size: var(--text-sm);
    }

    .ce-detail-panel__content {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: auto;
    }

    /* Metadata section */
    .ce-detail-panel__meta {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--color-bg-surface);
        border-bottom: 1px solid var(--color-border);
    }

    .ce-detail-panel__field {
        display: grid;
        grid-template-columns: 80px 1fr;
        align-items: center;
        gap: var(--space-3);
    }

    .ce-detail-panel__field-label {
        font-family: var(--font-ui);
        font-size: var(--text-xs);
        font-weight: var(--font-medium);
        color: var(--color-text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .ce-detail-panel__field-value {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .ce-detail-panel__code {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        background: var(--color-bg-tertiary);
    }

    .ce-detail-panel__code--method {
        color: var(--color-info);
        font-weight: var(--font-medium);
    }

    .ce-detail-panel__code--id {
        color: var(--color-text-secondary);
        font-size: var(--text-xs);
    }

    .ce-detail-panel__direction {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
    }

    .ce-detail-panel__time {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
    }

    /* Content section */
    .ce-detail-panel__body {
        display: flex;
        flex-direction: column;
        flex: 1;
        padding: var(--space-4);
        gap: var(--space-3);
    }

    .ce-detail-panel__section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .ce-detail-panel__section-title {
        margin: 0;
        font-family: var(--font-ui);
        font-size: var(--text-xs);
        font-weight: var(--font-semibold);
        color: var(--color-text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .ce-detail-panel__json {
        flex: 1;
        overflow: auto;
    }

    .ce-detail-panel__no-content {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        color: var(--color-text-tertiary);
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-md);
        border: 1px dashed var(--color-border);
    }
</style>
