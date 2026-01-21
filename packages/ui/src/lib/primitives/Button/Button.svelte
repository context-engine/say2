<!-- src/lib/primitives/Button/Button.svelte -->
<script lang="ts" module>
	import type { Component, Snippet } from "svelte";

	export interface Props {
		variant?: "primary" | "secondary" | "ghost" | "danger";
		size?: "sm" | "md" | "lg";
		disabled?: boolean;
		loading?: boolean;
		loadingLabel?: string;
		icon?: any;
		iconOnly?: boolean;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
		"aria-label"?: string;
		type?: "button" | "submit" | "reset";
		class?: string;
	}
</script>

<script lang="ts">
	import { Button } from "bits-ui";
	import Spinner from "../Spinner/Spinner.svelte";

	const {
		variant = "primary",
		size = "md",
		disabled = false,
		loading = false,
		loadingLabel = "Loading",
		icon: Icon,
		iconOnly = false,
		onclick,
		children,
		class: className,
		...rest
	}: Props = $props();
</script>

<Button.Root
	disabled={disabled || loading}
	{onclick}
	class="ce-button ce-button--{variant} ce-button--{size} {iconOnly
		? 'ce-button--icon-only'
		: ''} {className || ''}"
	aria-busy={loading}
	aria-label={rest["aria-label"]}
	{...rest}
>
	{#if loading}
		<Spinner size={size === "lg" ? "md" : "sm"} label={loadingLabel} />
	{:else if Icon}
		<span class="ce-button-icon">
			<Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
		</span>
	{/if}

	{#if children && !iconOnly}
		{@render children()}
	{/if}
</Button.Root>

<style>
	/* Global styles needed because bits-ui renders its own element */
	/* Prefix: ce = Context Engine */
	:global(.ce-button) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		border: none;
		cursor: pointer;
		font-family: var(--font-ui);
		font-weight: var(--font-medium);
		border-radius: var(--radius-sm);
		transition: all var(--duration-fast) var(--ease-out);
		white-space: nowrap;
	}

	:global(.ce-button:disabled) {
		cursor: not-allowed;
		opacity: 0.6;
	}

	:global(.ce-button:focus-visible) {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	/* Sizes */
	:global(.ce-button--sm) {
		height: 1.75rem; /* 28px */
		padding: 0 var(--space-3);
		font-size: var(--text-sm);
	}

	:global(.ce-button--md) {
		height: 2.25rem; /* 36px */
		padding: 0 var(--space-4);
		font-size: var(--text-base);
	}

	:global(.ce-button--lg) {
		height: 2.75rem; /* 44px */
		padding: 0 var(--space-6);
		font-size: var(--text-base);
	}

	:global(.ce-button--icon-only) {
		padding: 0;
		aspect-ratio: 1;
	}

	:global(.ce-button--icon-only.ce-button--sm) {
		width: 1.75rem; /* 28px */
	}

	:global(.ce-button--icon-only.ce-button--md) {
		width: 2.25rem; /* 36px */
	}

	:global(.ce-button--icon-only.ce-button--lg) {
		width: 2.75rem; /* 44px */
	}

	/* Variants */
	:global(.ce-button--primary) {
		background: var(--color-info);
		color: var(--color-text-inverse);
	}

	:global(.ce-button--primary:hover:not(:disabled)) {
		filter: brightness(1.1);
	}

	:global(.ce-button--primary:active:not(:disabled)) {
		filter: brightness(0.95);
		transform: scale(0.98);
	}

	:global(.ce-button--secondary) {
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
	}

	:global(.ce-button--secondary:hover:not(:disabled)) {
		background: var(--color-bg-tertiary);
	}

	:global(.ce-button--secondary:active:not(:disabled)) {
		background: var(--color-bg-secondary);
		transform: scale(0.98);
	}

	:global(.ce-button--ghost) {
		background: transparent;
		color: var(--color-text-primary);
	}

	:global(.ce-button--ghost:hover:not(:disabled)) {
		background: var(--color-bg-tertiary);
	}

	:global(.ce-button--ghost:active:not(:disabled)) {
		background: var(--color-bg-secondary);
		transform: scale(0.98);
	}

	:global(.ce-button--danger) {
		background: var(--color-error);
		color: var(--color-text-inverse);
	}

	:global(.ce-button--danger:hover:not(:disabled)) {
		filter: brightness(0.9);
	}

	:global(.ce-button--danger:active:not(:disabled)) {
		filter: brightness(0.85);
		transform: scale(0.98);
	}

	.ce-button-icon {
		display: flex;
		align-items: center;
	}
</style>
