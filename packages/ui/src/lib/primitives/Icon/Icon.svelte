<!-- src/lib/primitives/Icon/Icon.svelte -->
<script lang="ts">
  import type { Component } from "svelte";

  interface Props {
    /** Lucide icon component */
    icon: Component<any>;
    /** Icon size */
    size?: number | "sm" | "md" | "lg";
    /** Icon color */
    color?: string;
    /** Stroke width */
    strokeWidth?: number;
    /** Accessible label */
    label?: string;
    /** Additional classes */
    class?: string;
  }

  let {
    icon: IconComponent,
    size = "md",
    color = "currentColor",
    strokeWidth = 2,
    label,
    class: className,
    ...rest
  }: Props = $props();

  // Size mapping
  const sizeMap = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  let computedSize = $derived(typeof size === "number" ? size : sizeMap[size]);
</script>

{#if label}
  <span class="sr-only">{label}</span>
{/if}

<span
  class="icon {className || ''}"
  aria-hidden={!label}
  role={label ? "img" : undefined}
  {...rest}
>
  <IconComponent size={computedSize} {color} {strokeWidth} />
</span>

<style>
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  /* Screen reader only helper */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
