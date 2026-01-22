import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "bun:test";
import CreateSessionForm from "./CreateSessionForm.svelte";

describe("CreateSessionForm", () => {
    it("renders form title", () => {
        const { getByText } = render(CreateSessionForm);
        expect(getByText("Create Session")).toBeTruthy();
    });

    it("renders error message when provided", () => {
        const { getByText } = render(CreateSessionForm, { error: "Connection failed" });
        expect(getByText("Connection failed")).toBeTruthy();
    });

    it("disables inputs when loading", () => {
        const { container } = render(CreateSessionForm, { loading: true });
        const inputs = container.querySelectorAll("input:disabled");
        expect(inputs.length).toBeGreaterThan(0);
    });

    it("calls onCancel when cancel button is clicked", async () => {
        const onCancel = vi.fn();
        const { container } = render(CreateSessionForm, { onCancel });

        const cancelBtn = container.querySelector(".ce-button--ghost");
        await fireEvent.click(cancelBtn!);
        expect(onCancel).toHaveBeenCalled();
    });
});
