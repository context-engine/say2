<script lang="ts">
    import MessageRow from "./MessageRow.svelte";
    import Badge from "../../../primitives/Badge/Badge.svelte";

    // We'll use mock data for the list
    const messages = [
        {
            id: "1",
            method: "mcp.prompts.list",
            preview: '{ "filter": "technical" }',
            type: "request",
            direction: "inbound",
            timestamp: new Date(),
        },
        {
            id: "2",
            method: "mcp.prompts.list",
            preview: '{ "prompts": [ ... ] }',
            type: "response",
            direction: "outbound",
            timestamp: new Date(),
        },
        {
            id: "3",
            method: "notifications/initialized",
            preview: "Server is ready",
            type: "notification",
            direction: "inbound",
            timestamp: new Date(),
        },
    ];

    let selectedId = $state("1");

    function handleSelect(id: string) {
        selectedId = id;
    }
</script>

<div class="message-row-demo">
    <div class="message-row-demo__header">
        <Badge variant="info">Selected ID: {selectedId}</Badge>
        <div class="message-row-demo__hint">Click a row to select it</div>
    </div>

    <div class="message-row-demo__list">
        {#each messages as msg (msg.id)}
            <MessageRow
                id={msg.id}
                direction={msg.direction as any}
                type={msg.type as any}
                method={msg.method}
                preview={msg.preview}
                timestamp={msg.timestamp}
                selected={selectedId === msg.id}
                onClick={handleSelect}
            />
        {/each}
    </div>
</div>

<style>
    .message-row-demo {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border);
        width: 100%;
        max-width: 600px;
    }

    .message-row-demo__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: var(--space-2);
        border-bottom: 1px solid var(--color-border);
    }

    .message-row-demo__hint {
        font-size: var(--text-sm);
        color: var(--color-text-tertiary);
    }

    .message-row-demo__list {
        display: flex;
        flex-direction: column;
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        overflow: hidden;
    }
</style>
