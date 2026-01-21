import { render } from "@testing-library/svelte";
import { describe, it, expect } from "bun:test";
import StatsPanel from "./StatsPanel.svelte";

describe("StatsPanel", () => {
    const defaultStats = {
        totalMessages: 1234,
        requestCount: 456,
        responseCount: 432,
        notificationCount: 346,
        errorCount: 12,
        avgLatency: 42,
    };

    it("displays all stats correctly", () => {
        const { getByText } = render(StatsPanel, { stats: defaultStats });

        expect(getByText("1,234")).toBeTruthy(); // totalMessages
        expect(getByText("456")).toBeTruthy();   // requestCount
        expect(getByText("432")).toBeTruthy();   // responseCount
        expect(getByText("346")).toBeTruthy();   // notificationCount
        expect(getByText("12")).toBeTruthy();    // errorCount
        expect(getByText("42ms")).toBeTruthy();  // avgLatency with suffix
    });

    it("formats large numbers with commas", () => {
        const { getByText } = render(StatsPanel, {
            stats: {
                totalMessages: 1234567,
                requestCount: 456789,
                responseCount: 0,
                notificationCount: 0,
                errorCount: 0,
                avgLatency: 0,
            },
        });

        expect(getByText("1,234,567")).toBeTruthy();
        expect(getByText("456,789")).toBeTruthy();
    });

    it("displays zero values correctly", () => {
        const { container, getByText } = render(StatsPanel, {
            stats: {
                totalMessages: 0,
                requestCount: 0,
                responseCount: 0,
                notificationCount: 0,
                errorCount: 0,
                avgLatency: 0,
            },
        });

        // Should show "0", not empty or dash - check badges exist
        const badges = container.querySelectorAll(".badge");
        expect(badges.length).toBe(6);
        // Check latency shows 0ms
        expect(container.textContent).toContain("0ms");
    });

    it("shows skeleton placeholders when loading", () => {
        const { container } = render(StatsPanel, {
            stats: defaultStats,
            loading: true,
        });

        const skeletons = container.querySelectorAll(".ce-stats-panel__skeleton");
        expect(skeletons.length).toBe(6); // 6 stats
    });

    it("displays avgLatency with ms suffix", () => {
        const { container } = render(StatsPanel, { stats: defaultStats });
        expect(container.textContent).toContain("42ms");
    });
});
