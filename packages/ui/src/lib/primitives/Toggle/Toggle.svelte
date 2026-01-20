<!-- src/lib/primitives/Toggle/Toggle.svelte -->
<script lang="ts">
import { Switch } from "bits-ui";

interface Props {
	checked?: boolean;
	disabled?: boolean;
	size?: "sm" | "md";
	label?: string;
	id?: string;
	onchange?: (checked: boolean) => void;
}

const {
	checked = $bindable(false),
	disabled = false,
	size = "md",
	label,
	id = `toggle-${Math.random().toString(36).slice(2, 9)}`,
	onchange,
}: Props = $props();
</script>

<div class="toggle-wrapper" class:disabled>
	{#if label}
		<label for={id} class="toggle-label">
			{label}
		</label>
	{/if}
	<Switch.Root
		bind:checked
		{disabled}
		{id}
		onCheckedChange={(v) => onchange?.(v ?? false)}
		class="switch switch--{size}"
	>
		<div class="switch-control">
			<Switch.Thumb class="switch-thumb" />
		</div>
	</Switch.Root>
</div>

<style>
	.toggle-wrapper {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.toggle-wrapper.disabled {
		opacity: 0.5;
	}

	.toggle-label {
		font-family: var(--font-ui);
		font-size: var(--text-base);
		color: var(--color-text-primary);
		cursor: pointer;
	}

	.toggle-wrapper.disabled .toggle-label {
		cursor: not-allowed;
	}

	.switch {
		cursor: pointer;
		transition: opacity var(--duration-fast) var(--ease-out);
	}

	.switch:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.switch:focus-visible {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	.switch--sm {
		width: 32px;
		height: 18px;
	}

	.switch--md {
		width: 44px;
		height: 24px;
	}

	.switch-control {
		display: flex;
		align-items: center;
		width: 100%;
		height: 100%;
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-full);
		padding: 2px;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.switch[data-state="checked"] .switch-control {
		background: var(--color-request);
	}

	.switch-thumb {
		background: white;
		border-radius: var(--radius-full);
		box-shadow: var(--shadow-sm);
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.switch--sm .switch-thumb {
		width: 14px;
		height: 14px;
	}

	.switch--md .switch-thumb {
		width: 20px;
		height: 20px;
	}

	.switch--sm.switch[data-state="checked"] .switch-thumb {
		transform: translateX(14px);
	}

	.switch--md.switch[data-state="checked"] .switch-thumb {
		transform: translateX(20px);
	}
</style>
