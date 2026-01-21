<!-- Button Story Wrapper for Svelte 5 Snippet support -->
<script lang="ts">
    import Button from "./Button.svelte";
    import type { Component } from "svelte";

    interface Props {
        variant?: "primary" | "secondary" | "ghost" | "danger";
        size?: "sm" | "md" | "lg";
        disabled?: boolean;
        loading?: boolean;
        icon?: Component<{ size?: number }>;
        iconOnly?: boolean;
        "aria-label"?: string;
        /** Text content for the button (converted to snippet internally) */
        text?: string;
    }

    let {
        variant = "primary",
        size = "md",
        disabled = false,
        loading = false,
        icon,
        iconOnly = false,
        text = "Button",
        ...rest
    }: Props = $props();
</script>

<Button {variant} {size} {disabled} {loading} {icon} {iconOnly} {...rest}>
    {text}
</Button>
