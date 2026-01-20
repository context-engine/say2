import { describe, expect, it } from "bun:test";

describe("Test Setup", () => {
	it("bun test works", () => {
		expect(1 + 1).toBe(2);
	});

	it("DOM is available via happy-dom", () => {
		const div = document.createElement("div");
		div.textContent = "Hello";
		expect(div.textContent).toBe("Hello");
	});
});


