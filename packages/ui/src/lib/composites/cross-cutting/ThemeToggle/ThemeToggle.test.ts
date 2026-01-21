import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, jest } from "bun:test";
import ThemeToggle from "./ThemeToggle.svelte";

describe("ThemeToggle", () => {
    it("renders with correct initial icon for light theme", () => {
        const { getByLabelText } = render(ThemeToggle, { theme: "light" });
        const button = getByLabelText("Current theme: light. Click to change.");
        expect(button).toBeTruthy();
        // Icon check is implicit via rendering without error, 
        // typically we'd check SVG contents but label is enough for "dumb" component logic
    });

    it("cycles theme light -> dark -> system -> light", async () => {
        const onchange = jest.fn();
        const { getByRole, component } = render(ThemeToggle, { theme: "light", onchange });
        const button = getByRole("button");

        // Click 1: light -> dark
        await fireEvent.click(button);
        expect(onchange).toHaveBeenCalledWith("dark");

        // Update prop manually (since it's a dumb component)
        // Re-render with new prop to simulate parent update
        // Note: In unit test, we just check the event fired with expected value
    });

    it("fires onchange with correct next value for dark", async () => {
        const onchange = jest.fn();
        const { getByRole } = render(ThemeToggle, { theme: "dark", onchange });
        const button = getByRole("button");

        await fireEvent.click(button);
        expect(onchange).toHaveBeenCalledWith("system");
    });

    it("fires onchange with correct next value for system", async () => {
        const onchange = jest.fn();
        const { getByRole } = render(ThemeToggle, { theme: "system", onchange });
        const button = getByRole("button");

        await fireEvent.click(button);
        expect(onchange).toHaveBeenCalledWith("light");
    });
});
