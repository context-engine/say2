import { describe, expect, it } from "bun:test";
import { VERSION } from "./index";

describe("@say2/core", () => {
    describe("VERSION", () => {
        it("should be defined", () => {
            expect(VERSION).toBeDefined();
        });

        it("should be a valid semver string", () => {
            expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
        });
    });
});
