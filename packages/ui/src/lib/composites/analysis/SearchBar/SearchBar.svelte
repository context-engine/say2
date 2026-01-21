<script lang="ts" module>
    export interface Props {
        /** Search query */
        query: string;
        /** Number of matches */
        resultCount: number;
        /** Current match index (1-based) */
        currentIndex: number;
        /** Search handler */
        onsearch?: (query: string) => void;
        /** Go to next match */
        onnext?: () => void;
        /** Go to previous match */
        onprev?: () => void;
        /** Close search */
        onclose?: () => void;
    }
</script>

<script lang="ts">
    import Input from "../../../primitives/Input/Input.svelte";
    import Button from "../../../primitives/Button/Button.svelte";
    import { Search, ChevronUp, ChevronDown, X } from "lucide-svelte";

    let {
        query,
        resultCount,
        currentIndex,
        onsearch,
        onnext,
        onprev,
        onclose,
    }: Props = $props();

    let inputElement: HTMLInputElement | undefined = $state();

    // Exported method for parent to focus the input
    export function focus() {
        inputElement?.focus();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) {
                onprev?.();
            } else {
                onnext?.();
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            onclose?.();
        }
    }

    function handleInput(value: string) {
        onsearch?.(value);
    }

    const resultText = $derived(() => {
        if (!query) return "";
        if (resultCount === 0) return "No results";
        return `${currentIndex} of ${resultCount}`;
    });
</script>

<div class="ce-search-bar" role="search">
    <div class="ce-search-bar__input-wrapper">
        <Input
            type="search"
            value={query}
            placeholder="Search..."
            icon={Search}
            oninput={handleInput}
            aria-label="Search"
            size="sm"
            bind:this={inputElement}
            onkeydown={handleKeydown}
        />
    </div>

    {#if query}
        <span class="ce-search-bar__results" aria-live="polite">
            {resultText()}
        </span>

        <div class="ce-search-bar__actions">
            <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={ChevronUp}
                onclick={onprev}
                disabled={resultCount === 0}
                aria-label="Previous match"
            />
            <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={ChevronDown}
                onclick={onnext}
                disabled={resultCount === 0}
                aria-label="Next match"
            />
            <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={X}
                onclick={onclose}
                aria-label="Close search"
            />
        </div>
    {/if}
</div>

<style>
    .ce-search-bar {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2);
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
    }

    .ce-search-bar__input-wrapper {
        flex: 1;
        min-width: 150px;
    }

    .ce-search-bar__results {
        font-family: var(--font-ui);
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        white-space: nowrap;
    }

    .ce-search-bar__actions {
        display: flex;
        align-items: center;
        gap: var(--space-1);
    }
</style>
