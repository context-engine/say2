<script lang="ts">
    import EmptyState from "./EmptyState.svelte";
    import Button from "../../../primitives/Button/Button.svelte";
    import { Search, FolderOpen, WifiOff } from "lucide-svelte";
    import type { Component } from "svelte";

    // Re-export props for Storybook controls
    interface Props {
        title: string;
        description?: string;
        showAction?: boolean;
        actionText?: string;
        iconName?: "search" | "folder" | "wifi";
    }

    let {
        title,
        description,
        showAction = false,
        actionText = "Create New",
        iconName,
    }: Props = $props();

    const icons: Record<string, Component> = {
        search: Search,
        folder: FolderOpen,
        wifi: WifiOff,
    };

    let selectedIcon = $derived(iconName ? icons[iconName] : undefined);
</script>

<div style="width: 100%; max-width: 600px; padding: 1rem;">
    <EmptyState {title} {description} icon={selectedIcon}>
        <!-- Using snippet slot syntax if component supports it via prop, 
             Wait, EmptyState uses `action` prop of type Snippet.
             In Svelte 5 usage: <EmptyState ... action={mySnippet} />
             Or using named block if component uses default slot?
             No, I defined it as a Prop `action`.
             So I must pass it.
        -->
        {#snippet action()}
            {#if showAction}
                <Button
                    variant="primary"
                    onclick={() => alert("Action clicked!")}
                >
                    {actionText}
                </Button>
            {/if}
        {/snippet}
    </EmptyState>
</div>
