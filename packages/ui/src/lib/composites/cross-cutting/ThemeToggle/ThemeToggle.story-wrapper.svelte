<script lang="ts">
    import ThemeToggle from "./ThemeToggle.svelte";

    let theme: "light" | "dark" | "system" = $state("light");

    function handleChange(newTheme: "light" | "dark" | "system") {
        theme = newTheme;
    }
</script>

<div style="padding: 2rem; border: 1px dashed #ccc; border-radius: 8px;">
    <p
        style="margin-bottom: 1rem; font-family: sans-serif; font-size: 0.875rem;"
    >
        Click to cycle theme (State: <strong>{theme}</strong>)
    </p>
    <ThemeToggle {theme} onchange={handleChange} />
</div>
