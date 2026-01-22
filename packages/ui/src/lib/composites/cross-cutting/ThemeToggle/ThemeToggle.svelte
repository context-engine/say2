<script lang="ts">
    import { Button } from "../../../primitives/Button";
    import { Sun, Moon, Monitor } from "lucide-svelte";

    export interface Props {
        theme: "light" | "dark" | "system";
        onchange?: (theme: "light" | "dark" | "system") => void;
    }

    let { theme, onchange }: Props = $props();

    function cycleTheme() {
        const next =
            theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
        onchange?.(next);
    }

    // Dynamic icon based on theme
    const icons = {
        light: Sun,
        dark: Moon,
        system: Monitor,
    };

    let Icon = $derived(icons[theme]);
</script>

<div class="ce-theme-toggle">
    <Button
        variant="ghost"
        size="sm"
        iconOnly
        onclick={cycleTheme}
        aria-label={`Current theme: ${theme}. Click to change.`}
        icon={Icon as any}
    />
</div>

<style>
    .ce-theme-toggle {
        display: inline-block;
    }
</style>
