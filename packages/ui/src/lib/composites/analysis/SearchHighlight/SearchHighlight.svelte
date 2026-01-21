<script lang="ts">
    interface Props {
        /** Text to display */
        text: string;
        /** Search query to highlight */
        query: string;
        /** Case-sensitive matching */
        caseSensitive?: boolean;
    }

    let { text, query, caseSensitive = false }: Props = $props();

    interface Segment {
        text: string;
        highlighted: boolean;
    }

    // Escape regex special characters to prevent injection
    function escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function splitByQuery(
        text: string,
        query: string,
        caseSensitive: boolean,
    ): Segment[] {
        if (!query) return [{ text, highlighted: false }];

        const flags = caseSensitive ? "g" : "gi";
        const escaped = escapeRegExp(query);
        const regex = new RegExp(`(${escaped})`, flags);
        const parts = text.split(regex);

        return parts.filter(Boolean).map((part) => {
            const isMatch = caseSensitive
                ? part === query
                : part.toLowerCase() === query.toLowerCase();
            return {
                text: part,
                highlighted: isMatch,
            };
        });
    }

    const segments = $derived(splitByQuery(text, query, caseSensitive));
</script>

<!-- Safe: No @html, renders as text nodes to prevent XSS -->
{#each segments as segment}
    {#if segment.highlighted}
        <mark class="ce-search-highlight">{segment.text}</mark>
    {:else}{segment.text}{/if}
{/each}

<style>
    .ce-search-highlight {
        background: var(--color-warning);
        color: var(--color-text-primary);
        border-radius: var(--radius-sm);
        padding: 0 2px;
    }
</style>
