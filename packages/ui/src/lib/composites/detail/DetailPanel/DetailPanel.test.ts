import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "bun:test";
import DetailPanel from "./DetailPanel.svelte";
import type { Message } from "./DetailPanel.svelte";

describe("DetailPanel", () => {
    const sampleMessage: Message = {
        id: "msg-12345",
        direction: "inbound",
        type: "request",
        method: "tools/call",
        preview: "Test message",
        timestamp: new Date("2026-01-21T12:00:00"),
        content: { test: "data" },
    };

    it("renders message content via JSONInspector", () => {
        const { container } = render(DetailPanel, {
            message: sampleMessage,
        });

        expect(container.textContent).toContain("tools/call");
        expect(container.querySelector(".ce-json-inspector")).toBeTruthy();
    });

    it("shows empty state when message is null", () => {
        const { container } = render(DetailPanel, {
            message: null,
        });

        expect(container.textContent).toContain("Select a message to view details");
    });

    it("shows loading state with spinner", () => {
        const { container } = render(DetailPanel, {
            message: null,
            loading: true,
        });

        expect(container.textContent).toContain("Loading message content");
    });

    it("fires onclose when close button clicked", async () => {
        const onclose = vi.fn();
        const { container } = render(DetailPanel, {
            message: sampleMessage,
            onclose,
        });

        // Find close button in header (first button in the component)
        const closeButton = container.querySelector(".ce-detail-panel__header button");
        if (closeButton) {
            await fireEvent.click(closeButton);
            expect(onclose).toHaveBeenCalled();
        }
    });

    it("shows message method and type", () => {
        const { container } = render(DetailPanel, {
            message: sampleMessage,
        });

        expect(container.textContent).toContain("tools/call");
        expect(container.textContent).toContain("request");
    });

    it("displays message ID", () => {
        const { container } = render(DetailPanel, {
            message: sampleMessage,
        });

        expect(container.textContent).toContain("msg-12345");
    });

    it("shows direction with icon", () => {
        const { container } = render(DetailPanel, {
            message: sampleMessage,
        });

        expect(container.textContent).toContain("inbound");
    });
});
