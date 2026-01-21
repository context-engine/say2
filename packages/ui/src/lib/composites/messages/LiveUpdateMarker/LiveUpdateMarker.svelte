<script lang="ts" module>
    export interface Props {
        /** Number of new messages */
        count?: number;
        /** Click handler */
        onClick?: () => void;
    }
</script>

<script lang="ts">
    import Button from "../../../primitives/Button/Button.svelte";
    import Badge from "../../../primitives/Badge/Badge.svelte";
    import { ArrowDown } from "lucide-svelte";

    let { count = 0, onClick }: Props = $props();
</script>

{#if count > 0}
    <div class="ce-live-update-marker">
        <Button variant="primary" size="sm" onclick={onClick}>
            <ArrowDown size={14} />
            <Badge variant="default">{count} new</Badge>
        </Button>
    </div>
{/if}

<style>
    .ce-live-update-marker {
        position: fixed;
        bottom: var(--space-6);
        left: 50%;
        transform: translateX(-50%);
        z-index: var(--z-toast);
        animation: slide-up 200ms var(--ease-out);
    }

    @keyframes slide-up {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(100%);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
</style>
