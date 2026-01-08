import { describe, expect, it } from "bun:test";

describe("@say2/server", () => {
    describe("Health endpoint", () => {
        it("should return healthy status", async () => {
            // Import the app
            const { default: app } = await import("./index");

            // Create a request to /health
            const request = new Request("http://localhost/health");
            const response = await app.fetch(request);

            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body).toEqual({ status: "healthy" });
        });
    });

    describe("Root endpoint", () => {
        it("should return Say2 info", async () => {
            const { default: app } = await import("./index");

            const request = new Request("http://localhost/");
            const response = await app.fetch(request);

            expect(response.status).toBe(200);

            const body = (await response.json()) as { name: string; status: string; version: string };
            expect(body.name).toBe("Say2");
            expect(body.status).toBe("ok");
            expect(body.version).toBeDefined();
        });
    });
});
