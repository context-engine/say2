<!-- src/lib/primitives/Badge/Badge.svelte -->
<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** Color variant */
    variant?: "default" | "success" | "warning" | "error" | "info";
    /** Badge size */
    size?: "sm" | "md";
    /** Numeric count to display */
    count?: number;
    /** Dot-only mode (no text) */
    dot?: boolean;
    /** Badge content */
    children?: Snippet;
  }

  let {
    variant = "default",
    size = "md",
    count,
    dot = false,
    children,
  }: Props = $props();

  // Helper to format large counts
  let displayCount = $derived(
    count !== undefined && count > 99 ? "99+" : count,
  );
</script>

<span class="badge badge--{variant} badge--{size} {dot ? 'badge--dot' : ''}">
  {#if dot}
    <!-- Dot mode renders nothing inside, just shape -->
  {:else if count !== undefined}
    {displayCount}
  {:else if children}
    {@render children()}
  {/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    font-family: var(--font-ui);
    font-weight: var(--font-medium);
    white-space: nowrap;
    line-height: 1;
  }

  /* Sizes */
  .badge--sm {
    height: 20px;
    padding: 0 var(--space-2);
    font-size: var(--text-xs);
  }

  .badge--md {
    height: 24px;
    padding: 0 var(--space-3);
    font-size: var(--text-sm);
  }

  /* Dot mode overrides */
  .badge--dot {
    padding: 0;
    border-radius: 50%;
  }
  .badge--dot.badge--sm {
    width: 6px;
    height: 6px;
  }
  .badge--dot.badge--md {
    width: 8px;
    height: 8px;
  }

  /* Variants */
  .badge--default {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }

  .badge--success {
    background: color-mix(in srgb, var(--color-success) 15%, transparent);
    color: var(--color-success);
    border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
  }

  .badge--warning {
    background: color-mix(in srgb, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
    border: 1px solid color-mix(in srgb, var(--color-warning) 30%, transparent);
  }

  .badge--error {
    background: color-mix(in srgb, var(--color-error) 15%, transparent);
    color: var(--color-error);
    border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);
  }

  .badge--info {
    background: color-mix(in srgb, var(--color-info) 15%, transparent);
    color: var(--color-info);
    border: 1px solid color-mix(in srgb, var(--color-info) 30%, transparent);
  }
</style>
