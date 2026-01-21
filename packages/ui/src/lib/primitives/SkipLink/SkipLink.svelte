<!-- src/lib/primitives/SkipLink/SkipLink.svelte -->
<script lang="ts" module>
	export interface Props {
		href?: string;
		targetId?: string;
		label?: string;
	}
</script>

<script lang="ts">
	const {
		href = "#main-content",
		targetId = "main-content",
		label = "Skip to main content",
	}: Props = $props();
</script>

<a
	class="ce-skip-link"
	{href}
	data-sveltekit-preload-data="off"
	onclick={(e) => {
		e.preventDefault();
		const target = document.getElementById(targetId);
		if (target) {
			target.setAttribute("tabindex", "-1");
			target.focus();
			target.removeAttribute("tabindex");
		}
	}}
>
	{label}
</a>

<style>
	/* Prefix: ce = Context Engine */
	.ce-skip-link {
		position: absolute;
		top: -100%;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		font-family: var(--font-ui);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		text-decoration: none;
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-lg);
		z-index: var(--z-tooltip);
		transition: top var(--duration-fast) var(--ease-out);
	}

	.ce-skip-link:focus {
		top: var(--space-4);
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}
</style>
