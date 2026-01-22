<script lang="ts">
    import Button from "../../../primitives/Button/Button.svelte";
    import { Copy, Check } from "lucide-svelte";
    import { onDestroy } from "svelte";
    import { fade } from "svelte/transition";

    interface Props {
        /** The text to copy to clipboard */
        value: string;
        /** Optional label text */
        label?: string;
        /** Button variant */
        variant?: "primary" | "secondary" | "ghost" | "danger";
        /** Button size */
        size?: "sm" | "md" | "lg";
        /** Optional class name */
        class?: string;
    }

    let {
        value,
        label,
        variant = "ghost",
        size = "sm",
        class: className,
    }: Props = $props();

    let copied = $state(false);
    let timeout: ReturnType<typeof setTimeout>;

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(value);
            copied = true;

            clearTimeout(timeout);
            timeout = setTimeout(() => {
                copied = false;
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    }

    onDestroy(() => {
        clearTimeout(timeout);
    });
</script>

<Button
    {variant}
    {size}
    class="ce-copy-button {className || ''}"
    onclick={handleCopy}
    aria-label={label ? `Copy ${label}` : "Copy to clipboard"}
>
    <div class="ce-copy-button__content">
        <span class="ce-copy-button__icon {copied ? 'copied' : ''}">
            {#if copied}
                <Check size={size === "sm" ? 14 : 16} />
            {:else}
                <Copy size={size === "sm" ? 14 : 16} />
            {/if}
        </span>

        {#if label || copied}
            <span
                class="ce-copy-button__text"
                transition:fade={{ duration: 100 }}
            >
                {copied ? "Copied!" : label}
            </span>
        {/if}
    </div>
</Button>

<style>
    .ce-copy-button__content {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .ce-copy-button__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color var(--duration-fast);
    }

    .ce-copy-button__icon.copied {
        color: var(--color-success);
    }

    .ce-copy-button__text {
        font-size: inherit;
        font-weight: 500;
    }
</style>
