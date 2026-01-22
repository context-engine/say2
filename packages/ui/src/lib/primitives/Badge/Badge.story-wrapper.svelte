<!-- Badge Story Wrapper for Svelte 5 Snippet support -->
<script lang="ts">
    import Badge from "./Badge.svelte";

    interface Props {
        variant?: "default" | "success" | "warning" | "error" | "info";
        size?: "sm" | "md";
        count?: number;
        dot?: boolean;
        /** Text content for the badge (converted to snippet internally) */
        text?: string;
    }

    let {
        variant = "default",
        size = "md",
        count,
        dot = false,
        text = "Badge",
    }: Props = $props();
</script>

<Badge {variant} {size} {count} {dot}>
    {text}
</Badge>
