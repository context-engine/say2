<script lang="ts">
    import { onMount } from "svelte";
    import VirtualList from "../../cross-cutting/VirtualList/VirtualList.svelte";
    import MessageRow from "../MessageRow/MessageRow.svelte";
    import LiveUpdateMarker from "../LiveUpdateMarker/LiveUpdateMarker.svelte";
    import ScrollToLatest from "../ScrollToLatest/ScrollToLatest.svelte";
    import EmptyState from "../../cross-cutting/EmptyState/EmptyState.svelte";
    import { Search } from "lucide-svelte";

    // Define local Message interface to match implementation plan
    // In a real app, this should be imported from types
    export interface Message {
        id: string;
        direction: "inbound" | "outbound";
        type?: "request" | "response" | "notification"; // Made optional to match MessageRow props leniency
        method: string;
        timestamp: Date | string;
        hasResponse?: boolean;
        preview: string;
    }

    interface Props {
        messages: Message[];
        selectedId?: string | null;
        loading?: boolean;
        autoScroll?: boolean;
        atBottom?: boolean;
        onSelect?: (id: string) => void;
        onAutoScrollChange?: (enabled: boolean) => void;
    }

    let {
        messages = [],
        selectedId = null,
        loading = false,
        autoScroll = true,
        atBottom = true,
        onSelect,
        onAutoScrollChange,
    }: Props = $props();

    let virtualListRef: any = $state(undefined); // Type reference for VirtualList if available

    // Detect when messages change to handle auto-scrolling
    // Effects and derived state would typically handle this

    function handleScroll(
        e: CustomEvent<{
            scrollTop: number;
            scrollHeight: number;
            clientHeight: number;
        }>,
    ) {
        // Check if at bottom
        const { scrollTop, scrollHeight, clientHeight } = e.detail;
        const isAtBottom =
            Math.abs(scrollHeight - clientHeight - scrollTop) < 50; // Threshold

        // If user scrolls up, disable auto-scroll
        if (!isAtBottom && autoScroll) {
            onAutoScrollChange?.(false);
        } else if (isAtBottom && !autoScroll) {
            // Optional: Re-enable auto-scroll if they hit bottom manually
            // onAutoScrollChange?.(true);
        }
    }

    function scrollToBottom() {
        // Logic to trigger scroll to bottom via VirtualList
        if (virtualListRef) {
            virtualListRef.scrollToIndex(messages.length - 1);
        }
        onAutoScrollChange?.(true);
    }

    // Effect to auto-scroll when new messages arrive
    $effect(() => {
        if (autoScroll && messages.length > 0) {
            // Defer scroll slightly to allow render
            setTimeout(() => {
                if (virtualListRef) {
                    virtualListRef.scrollToIndex(messages.length - 1);
                }
            }, 0);
        }
    });
</script>

<div class="ce-traffic-list">
    {#if messages.length === 0 && !loading}
        <div class="ce-traffic-list__empty">
            <EmptyState
                title="No messages yet"
                description="Messages will appear as they are captured."
            />
        </div>
    {:else}
        <div class="ce-traffic-list__content">
            <VirtualList
                items={messages}
                itemHeight={64}
                bind:this={virtualListRef}
                onscroll={handleScroll}
            >
                {#snippet children(message, index)}
                    <MessageRow
                        id={message.id}
                        direction={message.direction}
                        type={message.type}
                        method={message.method}
                        preview={message.preview}
                        timestamp={message.timestamp}
                        hasResponse={message.hasResponse}
                        selected={selectedId === message.id}
                        onClick={onSelect}
                    />
                {/snippet}
            </VirtualList>
        </div>
    {/if}

    <!-- Floating Controls -->
    <div class="ce-traffic-list__controls">
        {#if !atBottom || !autoScroll}
            <div class="ce-traffic-list__marker">
                <LiveUpdateMarker
                    active={!atBottom}
                    count={0}
                    onClick={scrollToBottom}
                />
            </div>
        {/if}

        <ScrollToLatest
            {autoScroll}
            onClick={scrollToBottom}
            onToggle={() => onAutoScrollChange?.(!autoScroll)}
            showButton={!atBottom}
        />
    </div>
</div>

<style>
    .ce-traffic-list {
        position: relative;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        background: var(--color-bg-primary);
    }

    .ce-traffic-list__empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
    }

    .ce-traffic-list__content {
        flex: 1;
        min-height: 0;
    }

    .ce-traffic-list__controls {
        position: absolute;
        bottom: var(--space-4);
        right: var(--space-4);
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-2);
        pointer-events: none; /* Allow clicking through container */
    }

    .ce-traffic-list__controls > * {
        pointer-events: auto; /* Re-enable pointer events for buttons */
    }

    .ce-traffic-list__marker {
        margin-bottom: var(--space-2);
    }
</style>
