<!-- src/lib/primitives/Input/Input.svelte -->
<script lang="ts">
  import type { Component } from "svelte";

  interface Props {
    /** Input type (text, search, number, password) */
    type?: "text" | "search" | "number" | "password";
    /** Input value */
    value?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Error state */
    error?: boolean;
    /** Input size */
    size?: "sm" | "md";
    /** Leading icon component */
    icon?: Component<any>;
    /** ID for label association */
    id?: string;
    /** Input handler - called on every keystroke */
    oninput?: (value: string) => void;
    /** Change handler - called on blur/enter */
    onchange?: (value: string) => void;
    /** Aria label for accessibility if no label associated */
    "aria-label"?: string;
  }

  let {
    type = "text",
    value = "",
    placeholder,
    disabled = false,
    error = false,
    size = "md",
    icon: Icon,
    id,
    oninput,
    onchange,
    ...rest
  }: Props = $props();

  function handleInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    oninput?.(val);
  }

  function handleChange(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    onchange?.(val);
  }
</script>

<div
  class="input-wrapper input-wrapper--{size} {disabled
    ? 'input-wrapper--disabled'
    : ''} {error ? 'input-wrapper--error' : ''}"
>
  {#if Icon}
    <span class="input-icon">
      <Icon size={size === "sm" ? "14" : "16"} />
    </span>
  {/if}

  <input
    class="input {Icon ? 'input--with-icon' : ''}"
    {type}
    {value}
    {placeholder}
    {disabled}
    {id}
    aria-invalid={error}
    aria-disabled={disabled}
    aria-label={rest["aria-label"]}
    oninput={handleInput}
    onchange={handleChange}
    {...rest}
  />
</div>

<style>
  .input-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 100%;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    transition: all var(--duration-fast) var(--ease-out);
  }

  .input-wrapper:focus-within {
    border-color: var(--color-info);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-info) 20%, transparent);
  }

  .input-wrapper--error {
    border-color: var(--color-error);
  }
  .input-wrapper--error:focus-within {
    box-shadow: 0 0 0 2px
      color-mix(in srgb, var(--color-error) 20%, transparent);
  }

  .input-wrapper--disabled {
    background: var(--color-bg-secondary);
    cursor: not-allowed;
    opacity: 0.7;
  }

  .input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-family: var(--font-ui);
    outline: none;
    padding: 0;
  }

  .input::placeholder {
    color: var(--color-text-tertiary);
  }

  .input:disabled {
    cursor: not-allowed;
  }

  /* Sizes */
  .input-wrapper--sm {
    height: 32px;
    padding: 0 var(--space-3);
  }
  .input-wrapper--sm .input {
    font-size: var(--text-sm);
  }

  .input-wrapper--md {
    height: 40px;
    padding: 0 var(--space-3);
  }
  .input-wrapper--md .input {
    font-size: var(--text-base);
  }

  /* Icon handling */
  .input-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    margin-right: var(--space-2);
    pointer-events: none;
  }
</style>
