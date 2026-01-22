<script lang="ts">
    import ContextMenu, { type MenuItem } from "./ContextMenu.svelte";
    import { Copy, Link, Expand, Minimize, Trash2 } from "lucide-svelte";

    const menuItems: MenuItem[] = [
        {
            label: "Copy Value",
            icon: Copy,
            action: () => console.log("Copy Value"),
        },
        {
            label: "Copy Path",
            icon: Link,
            action: () => console.log("Copy Path"),
        },
        {
            label: "Expand All",
            icon: Expand,
            action: () => console.log("Expand All"),
        },
        {
            label: "Collapse All",
            icon: Minimize,
            action: () => console.log("Collapse All"),
        },
        {
            label: "Delete Node",
            icon: Trash2,
            action: () => console.log("Delete Node"),
            variant: "danger",
        },
    ];
</script>

<ContextMenu items={menuItems}>
    <div class="demo-area">
        <div class="demo-content">
            <h3>Right-click anywhere in this area</h3>
            <p>
                A context menu with JSON actions will appear at your mouse
                position.
            </p>
        </div>
    </div>
</ContextMenu>

<style>
    .demo-area {
        width: 100%;
        height: 300px;
        background: var(--color-bg-secondary);
        border: 2px dashed var(--color-border);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-secondary);
        font-family: var(--font-ui);
        user-select: none;
        cursor: context-menu;
    }

    .demo-content {
        text-align: center;
    }

    h3 {
        margin: 0 0 var(--space-2) 0;
        color: var(--color-text-primary);
    }
</style>
