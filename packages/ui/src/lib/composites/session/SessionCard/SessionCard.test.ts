import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "bun:test";
import SessionCard from "./SessionCard.svelte";

const baseSession = {
    id: "session-1",
    name: "Test Session",
    status: "active" as const,
    messageCount: 10,
    createdAt: new Date("2026-01-21T12:00:00"),
    serverCommand: "tools/call",
};

describe("SessionCard", () => {
    it("renders session name", () => {
        const { getByText } = render(SessionCard, { session: baseSession });
        expect(getByText("Test Session")).toBeTruthy();
    });

    it("renders message count", () => {
        const { container } = render(SessionCard, { session: baseSession });
        const badge = container.querySelector(".badge--info");
        expect(badge?.textContent).toContain("10 messages");
    });

    it("applies selected style when selected", () => {
        const { container } = render(SessionCard, { session: baseSession, selected: true });
        const card = container.querySelector(".ce-session-card--selected");
        expect(card).toBeTruthy();
    });

    it("calls onClick when clicked", async () => {
        const onClick = vi.fn();
        const { container } = render(SessionCard, { session: baseSession, onClick });

        const button = container.querySelector(".ce-session-card");
        await fireEvent.click(button!);

        expect(onClick).toHaveBeenCalled();
    });
});
