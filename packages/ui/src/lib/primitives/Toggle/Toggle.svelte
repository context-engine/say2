<!-- src/lib/primitives/Toggle/Toggle.svelte -->
<script lang="ts" module>
	export interface Props {
		checked?: boolean;
		disabled?: boolean;
		size?: "sm" | "md";
		label?: string;
		id?: string;
		onchange?: (checked: boolean) => void;
	}
</script>

<script lang="ts">
	import { Switch } from "bits-ui";

	const {
		checked = $bindable(false),
		disabled = false,
		size = "md",
		label,
		id = `toggle-${Math.random().toString(36).slice(2, 9)}`,
		onchange,
	}: Props = $props();
</script>

<div class="ce-toggle-wrapper" class:disabled>
	{#if label}
		<label for={id} class="ce-toggle-label">
			{label}
		</label>
	{/if}
	<Switch.Root
		{checked}
		{disabled}
		{id}
		onCheckedChange={(v) => onchange?.(v ?? false)}
		class="ce-switch ce-switch--{size}"
	>
		<div class="ce-switch-control">
			<Switch.Thumb class="ce-switch-thumb" />
		</div>
	</Switch.Root>
</div>

<style>
	/* Prefix: ce = Context Engine */
	.ce-toggle-wrapper {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.ce-toggle-wrapper.disabled {
		opacity: 0.5;
	}

	.ce-toggle-label {
		font-family: var(--font-ui);
		font-size: var(--text-base);
		color: var(--color-text-primary);
		cursor: pointer;
	}

	.ce-toggle-wrapper.disabled .ce-toggle-label {
		cursor: not-allowed;
	}

	/* bits-ui renders elements, so we need :global() */
	:global(.ce-switch) {
		cursor: pointer;
		transition: opacity var(--duration-fast) var(--ease-out);
		/* Reset button defaults from bits-ui */
		border: none;
		background: transparent;
		padding: 0;
		margin: 0;
	}

	:global(.ce-switch:disabled) {
		cursor: not-allowed;
		opacity: 0.5;
	}

	:global(.ce-switch:focus-visible) {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	:global(.ce-switch--sm) {
		width: 2rem; /* 32px */
		height: 1.125rem; /* 18px */
	}

	:global(.ce-switch--md) {
		width: 2.75rem; /* 44px */
		height: 1.5rem; /* 24px */
	}

	.ce-switch-control {
		display: flex;
		align-items: center;
		width: 100%;
		height: 100%;
		background: var(--color-bg-control);
		border-radius: var(--radius-full);
		padding: 0.125rem; /* 2px */
		transition: background var(--duration-fast) var(--ease-out);
	}

	:global(.ce-switch[data-state="checked"]) .ce-switch-control {
		background: var(--color-request);
	}

	:global(.ce-switch-thumb) {
		background: var(--color-text-inverse);
		border-radius: var(--radius-full);
		box-shadow: var(--shadow-sm);
		transition: transform var(--duration-fast) var(--ease-out);
	}

	:global(.ce-switch--sm .ce-switch-thumb) {
		width: 0.875rem; /* 14px */
		height: 0.875rem;
	}

	:global(.ce-switch--md .ce-switch-thumb) {
		width: 1.25rem; /* 20px */
		height: 1.25rem;
	}

	:global(.ce-switch--sm.ce-switch[data-state="checked"] .ce-switch-thumb) {
		transform: translateX(0.875rem); /* 14px */
	}

	:global(.ce-switch--md.ce-switch[data-state="checked"] .ce-switch-thumb) {
		transform: translateX(1.25rem); /* 20px */
	}
</style>
