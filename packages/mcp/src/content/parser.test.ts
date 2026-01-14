import { beforeEach, describe, expect, test } from "bun:test";
import { ContentParser } from "./parser";

describe("ContentParser", () => {
    let parser: ContentParser;

    beforeEach(() => {
        parser = new ContentParser();
    });

    describe("parseContent()", () => {
        test("parses text content", () => {
            const raw = [{ type: "text", text: "Hello world" }];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(1);
            expect(result[0]?.type).toBe("text");
            if (result[0]?.type === "text") {
                expect(result[0].text).toBe("Hello world");
            }
        });

        test("parses image content with base64 data", () => {
            const raw = [
                {
                    type: "image",
                    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
                    mimeType: "image/png",
                },
            ];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(1);
            expect(result[0]?.type).toBe("image");
            if (result[0]?.type === "image") {
                expect(result[0].data).toBeDefined();
                expect(result[0].mimeType).toBe("image/png");
            }
        });

        test("parses audio content", () => {
            const raw = [
                {
                    type: "audio",
                    data: "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
                    mimeType: "audio/wav",
                },
            ];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(1);
            expect(result[0]?.type).toBe("audio");
            if (result[0]?.type === "audio") {
                expect(result[0].mimeType).toBe("audio/wav");
            }
        });

        test("parses resource_link content", () => {
            const raw = [
                {
                    type: "resource_link",
                    uri: "file:///path/to/file.txt",
                    name: "My File",
                    mimeType: "text/plain",
                },
            ];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(1);
            expect(result[0]?.type).toBe("resource_link");
            if (result[0]?.type === "resource_link") {
                expect(result[0].uri).toBe("file:///path/to/file.txt");
                expect(result[0].name).toBe("My File");
            }
        });

        test("parses embedded resource content", () => {
            const raw = [
                {
                    type: "resource",
                    resource: {
                        uri: "file:///data.json",
                        text: '{"key": "value"}',
                        mimeType: "application/json",
                    },
                },
            ];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(1);
            expect(result[0]?.type).toBe("resource");
            if (result[0]?.type === "resource") {
                expect(result[0].resource.uri).toBe("file:///data.json");
                expect(result[0].resource.text).toBe('{"key": "value"}');
            }
        });

        test("parses mixed content types", () => {
            const raw = [
                { type: "text", text: "Hello" },
                { type: "image", data: "abc123", mimeType: "image/jpeg" },
                { type: "resource_link", uri: "file:///test", name: "Test" },
            ];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(3);
            expect(result[0]?.type).toBe("text");
            expect(result[1]?.type).toBe("image");
            expect(result[2]?.type).toBe("resource_link");
        });

        test("throws on invalid content type", () => {
            const raw = [{ type: "invalid_type", data: "foo" }];

            expect(() => parser.parseContent(raw)).toThrow();
        });

        test("preserves annotations", () => {
            const raw = [
                {
                    type: "text",
                    text: "User-only message",
                    annotations: {
                        audience: ["user"],
                        priority: 0.8,
                    },
                },
            ];
            const result = parser.parseContent(raw);

            expect(result[0]?.annotations).toBeDefined();
            expect(result[0]?.annotations?.audience).toContain("user");
            expect(result[0]?.annotations?.priority).toBe(0.8);
        });
    });

    describe("validateStructuredOutput()", () => {
        test("returns valid for content matching schema", () => {
            const content = { name: "test", count: 42 };
            const schema = {
                type: "object",
                properties: {
                    name: { type: "string" },
                    count: { type: "number" },
                },
                required: ["name"],
            };

            const result = parser.validateStructuredOutput(content, schema);
            expect(result.valid).toBe(true);
            expect(result.errors).toBeUndefined();
        });

        test("returns invalid with errors for mismatched content", () => {
            const content = { name: 123 }; // name should be string
            const schema = {
                type: "object",
                properties: {
                    name: { type: "string" },
                },
                required: ["name"],
            };

            const result = parser.validateStructuredOutput(content, schema);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);
        });

        test("returns valid when no schema provided", () => {
            const content = { anything: "goes" };

            const result = parser.validateStructuredOutput(content);
            expect(result.valid).toBe(true);
        });

        test("validates nested objects", () => {
            const content = {
                user: { name: "John", age: 30 },
            };
            const schema = {
                type: "object",
                properties: {
                    user: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            age: { type: "number" },
                        },
                    },
                },
            };

            const result = parser.validateStructuredOutput(content, schema);
            expect(result.valid).toBe(true);
        });
    });

    describe("decodeBase64()", () => {
        test("decodes valid base64 to Uint8Array", () => {
            // "Hello" in base64
            const base64 = "SGVsbG8=";
            const result = parser.decodeBase64(base64);

            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.length).toBe(5);
            // H=72, e=101, l=108, l=108, o=111
            expect(result[0]).toBe(72);
            expect(result[4]).toBe(111);
        });

        test("decodes empty base64", () => {
            const result = parser.decodeBase64("");
            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.length).toBe(0);
        });

        test("throws on invalid base64", () => {
            const invalid = "not!valid@base64#";

            expect(() => parser.decodeBase64(invalid)).toThrow();
        });

        test("handles base64 with padding", () => {
            // "Hi" = "SGk=" (with padding)
            const result = parser.decodeBase64("SGk=");
            expect(result.length).toBe(2);
        });

        test("handles base64 without padding", () => {
            // Some base64 implementations strip padding
            const result = parser.decodeBase64("SGk");
            expect(result.length).toBe(2);
        });
    });
});
