<!-- src/lib/primitives/Tooltip/Tooltip.svelte -->
<script lang="ts" module>
	import type { Snippet } from "svelte";

	export interface Props {
		content?: string;
		side?: "top" | "right" | "bottom" | "left";
		delay?: number;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { Tooltip } from "bits-ui";

	const {
		content = "",
		side = "top",
		delay = 300,
		children,
	}: Props = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root delayDuration={delay}>
		<Tooltip.Trigger class="ce-tooltip-trigger">
			{@render children?.()}
		</Tooltip.Trigger>
		<Tooltip.Portal>
			<Tooltip.Content class="ce-tooltip-content" {side} sideOffset={6}>
				{content}
			</Tooltip.Content>
		</Tooltip.Portal>
	</Tooltip.Root>
</Tooltip.Provider>

<style>
	/* Prefix: ce = Context Engine */
	/* bits-ui renders elements, so we need :global() */
	:global(.ce-tooltip-trigger) {
		display: inline-flex;
		cursor: pointer;
		/* Reset button defaults from bits-ui */
		border: none;
		background: transparent;
		padding: 0;
		margin: 0;
	}

	:global(.ce-tooltip-content) {
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		font-family: var(--font-ui);
		font-size: var(--text-sm);
		box-shadow: var(--shadow-lg);
		z-index: var(--z-tooltip);
		max-width: 250px;
	}
</style>
