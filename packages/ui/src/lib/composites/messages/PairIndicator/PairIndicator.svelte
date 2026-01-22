<script lang="ts" module>
    export interface Props {
        /** Whether the message is paired (has matching response) */
        paired?: boolean;
        /** Whether the pair is pending */
        pending?: boolean;
    }
</script>

<script lang="ts">
    import Spinner from "../../../primitives/Spinner/Spinner.svelte";
    import { Link2, Link2Off } from "lucide-svelte";

    let { paired = false, pending = false }: Props = $props();
</script>

<span
    class="ce-pair-indicator {paired
        ? 'ce-pair-indicator--paired'
        : 'ce-pair-indicator--unpaired'}"
    title={paired ? "Paired" : pending ? "Awaiting response" : "Unpaired"}
>
    {#if pending}
        <Spinner
            size="sm"
            color="var(--color-warning)"
            label="Awaiting response"
        />
    {:else if paired}
        <Link2 size={14} />
    {:else}
        <Link2Off size={14} />
    {/if}
</span>

<style>
    .ce-pair-indicator {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
    }

    .ce-pair-indicator--paired {
        color: var(--color-success);
    }

    .ce-pair-indicator--unpaired {
        color: var(--color-text-tertiary);
    }
</style>
