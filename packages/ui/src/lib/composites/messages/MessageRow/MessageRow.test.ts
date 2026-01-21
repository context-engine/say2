import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, expect, it, vi } from "bun:test";
import MessageRow from "./MessageRow.svelte";

describe("MessageRow", () => {
    const defaultProps = {
        id: "msg-123",
        direction: "inbound" as const,
        type: "request" as const,
        method: "test.method",
        preview: "Test preview content",
        timestamp: new Date("2024-01-01T12:00:00")
    };

    it("renders method and preview", () => {
        render(MessageRow, defaultProps);
        expect(screen.getByText("test.method")).toBeTruthy();
        expect(screen.getByText("Test preview content")).toBeTruthy();
    });

    it("renders timestamp correctly", () => {
        render(MessageRow, defaultProps);
        // Assuming implementation uses toLocaleTimeString
        // Checking for partial match since locale might vary in specific environment
        expect(screen.getByText(/12:00:00/)).toBeTruthy();
    });

    it("shows direction badge with correct text", () => {
        render(MessageRow, defaultProps);
        // Badge content is 'request'
        const badges = screen.getAllByText("request");
        expect(badges.length).toBeGreaterThan(0);
    });

    it("applies selected class when selected prop is true", () => {
        const { container } = render(MessageRow, { ...defaultProps, selected: true });
        const row = container.querySelector(".ce-message-row--selected");
        expect(row).toBeTruthy();
    });

    it("fires onClick handler with id when clicked", async () => {
        const onClick = vi.fn();
        render(MessageRow, { ...defaultProps, onClick });

        const row = screen.getByText("test.method").closest(".ce-message-row");
        expect(row).toBeTruthy();

        await fireEvent.click(row!);
        expect(onClick).toHaveBeenCalledWith("msg-123");
    });
});
