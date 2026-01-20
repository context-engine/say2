<!-- src/lib/primitives/Toggle/Toggle.svelte -->
<script lang="ts">
interface Props {
	checked?: boolean;
	disabled?: boolean;
	size?: "sm" | "md";
	label?: string;
	id?: string;
	onchange?: (checked: boolean) => void;
}

let {
	checked = false,
	disabled = false,
	size = "md",
	label,
	id = `toggle-${Math.random().toString(36).slice(2, 9)}`,
	onchange,
}: Props = $props();

function handleClick() {
	if (disabled) return;
	checked = !checked;
	onchange?.(checked);
}

function handleKeydown(e: KeyboardEvent) {
	if (disabled) return;
	if (e.key === " " || e.key === "Enter") {
		e.preventDefault();
		handleClick();
	}
}
</script>

<div class="toggle-wrapper" class:disabled>
	{#if label}
		<label for={id} class="toggle-label">
			{label}
		</label>
	{/if}
	<button
		{id}
		type="button"
		role="switch"
		aria-checked={checked}
		aria-disabled={disabled}
		class="toggle toggle--{size}"
		class:checked
		disabled
		onclick={handleClick}
		onkeydown={handleKeydown}
	>
		<span class="toggle-thumb" aria-hidden="true"></span>
	</button>
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

	.toggle {
		position: relative;
		border: none;
		background: var(--color-bg-tertiary);
		cursor: pointer;
		transition: background var(--duration-fast) var(--ease-out);
		flex-shrink: 0;
	}

	.toggle:focus-visible {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	.toggle--sm {
		width: 32px;
		height: 18px;
		border-radius: var(--radius-full);
	}

	.toggle--md {
		width: 44px;
		height: 24px;
		border-radius: var(--radius-full);
	}

	.toggle.checked {
		background: var(--color-request);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		background: white;
		border-radius: var(--radius-full);
		transition: transform var(--duration-fast) var(--ease-out);
		box-shadow: var(--shadow-sm);
	}

	.toggle--sm .toggle-thumb {
		width: 14px;
		height: 14px;
	}

	.toggle--md .toggle-thumb {
		width: 20px;
		height: 20px;
	}

	.toggle.checked .toggle-thumb {
		transform: translateX(
			var(
				--toggle-translate-sm,
				calc(32px - 18px + 2px)
			)
		);
	}

	.toggle--md.checked .toggle-thumb {
		transform: translateX(
			var(
				--toggle-translate-md,
				calc(44px - 24px + 2px)
			)
		);
	}
</style>
