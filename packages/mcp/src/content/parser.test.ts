import { describe, expect, test } from "bun:test";
import { ContentParser } from "./parser";

describe("ContentParser", () => {
    const parser = new ContentParser();

    describe("parseContent", () => {
        test("parses text content", () => {
            const raw = [{ type: "text", text: "Hello world" }];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(1);
            expect(result[0]!.type).toBe("text");
            expect((result[0] as any).text).toBe("Hello world");
        });

        test("parses image content", () => {
            const raw = [
                {
                    type: "image",
                    data: "iVBORw0KGgo=", // sample base64
                    mimeType: "image/png",
                },
            ];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(1);
            expect(result[0]!.type).toBe("image");
            expect((result[0] as any).mimeType).toBe("image/png");
        });

        test("parses audio content", () => {
            const raw = [
                {
                    type: "audio",
                    data: "UklGRiQAAABX",
                    mimeType: "audio/wav",
                },
            ];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(1);
            expect(result[0]!.type).toBe("audio");
            expect((result[0] as any).mimeType).toBe("audio/wav");
        });

        test("parses resource_link content", () => {
            const raw = [
                {
                    type: "resource_link",
                    uri: "file:///path/to/file.txt",
                    name: "Test File",
                },
            ];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(1);
            expect(result[0]!.type).toBe("resource_link");
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
            expect(result[0]!.type).toBe("resource");
        });

        test("parses content with annotations", () => {
            const raw = [
                {
                    type: "text",
                    text: "User only message",
                    annotations: {
                        audience: ["user"],
                        priority: 0.8,
                    },
                },
            ];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(1);
            const item = result[0] as any;
            expect(item.annotations?.audience).toEqual(["user"]);
            expect(item.annotations?.priority).toBe(0.8);
        });

        test("parses multiple content items", () => {
            const raw = [
                { type: "text", text: "Hello" },
                { type: "text", text: "World" },
            ];
            const result = parser.parseContent(raw);

            expect(result).toHaveLength(2);
        });

        test("throws for invalid content type", () => {
            const raw = [{ type: "invalid_type", data: "test" }];

            expect(() => parser.parseContent(raw)).toThrow(/Invalid content/);
        });

        test("throws for missing required fields", () => {
            const raw = [{ type: "text" }]; // missing text field

            expect(() => parser.parseContent(raw)).toThrow(/Invalid content/);
        });

        test("throws for non-array input", () => {
            expect(() => parser.parseContent({} as any)).toThrow(
                "Content must be an array",
            );
        });
    });

    describe("validateStructuredOutput", () => {
        test("returns valid for any content without schema", () => {
            const result = parser.validateStructuredOutput({ anything: "goes" });

            expect(result.valid).toBe(true);
            expect(result.errors).toBeUndefined();
        });

        test("validates content against schema", () => {
            const schema = {
                type: "object",
                properties: {
                    name: { type: "string" },
                    count: { type: "number" },
                },
                required: ["name"],
            };
            const validContent = { name: "test", count: 42 };

            const result = parser.validateStructuredOutput(validContent, schema);

            expect(result.valid).toBe(true);
        });

        test("returns errors for invalid content", () => {
            const schema = {
                type: "object",
                properties: {
                    name: { type: "string" },
                },
                required: ["name"],
            };
            const invalidContent = { count: 42 }; // missing required "name"

            const result = parser.validateStructuredOutput(invalidContent, schema);

            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);
        });

        test("validates array schema", () => {
            const schema = {
                type: "array",
                items: { type: "string" },
            };
            const validContent = ["a", "b", "c"];

            const result = parser.validateStructuredOutput(validContent, schema);

            expect(result.valid).toBe(true);
        });

        test("handles invalid schema gracefully", () => {
            const invalidSchema = { type: "not_a_real_type" };
            const content = { test: true };

            const result = parser.validateStructuredOutput(content, invalidSchema);

            // Should either return valid (if Ajv ignores unknown type) or error
            expect(typeof result.valid).toBe("boolean");
        });
    });

    describe("decodeBase64", () => {
        test("decodes valid base64 to Uint8Array", () => {
            // "Hello" in base64 is "SGVsbG8="
            const result = parser.decodeBase64("SGVsbG8=");

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

        // Note: Node's Buffer.from is lenient with invalid base64, so we don't test error throwing
    });

    describe("getContentSize", () => {
        test("returns text length for text content", () => {
            const content = { type: "text" as const, text: "Hello" };

            expect(parser.getContentSize(content)).toBe(5);
        });

        test("returns estimated size for image content", () => {
            const content = {
                type: "image" as const,
                data: "1234567890", // 10 chars
                mimeType: "image/png",
            };

            // 10 * 0.75 = 7.5, floor = 7
            expect(parser.getContentSize(content)).toBe(7);
        });

        test("returns estimated size for audio content", () => {
            const content = {
                type: "audio" as const,
                data: "12345678901234567890", // 20 chars
                mimeType: "audio/wav",
            };

            // 20 * 0.75 = 15
            expect(parser.getContentSize(content)).toBe(15);
        });

        test("returns 0 for resource_link", () => {
            const content = {
                type: "resource_link" as const,
                uri: "file:///test.txt",
            };

            expect(parser.getContentSize(content)).toBe(0);
        });

        test("returns text length for embedded resource with text", () => {
            const content = {
                type: "resource" as const,
                resource: {
                    uri: "file:///data.json",
                    text: "Hello World",
                },
            };

            expect(parser.getContentSize(content)).toBe(11);
        });
    });

    describe("validateMimeType", () => {
        test("validates exact match", () => {
            expect(
                parser.validateMimeType("image/png", ["image/png", "image/jpeg"]),
            ).toBe(true);
        });

        test("rejects non-matching type", () => {
            expect(parser.validateMimeType("image/gif", ["image/png"])).toBe(false);
        });

        test("validates prefix match with wildcard", () => {
            expect(parser.validateMimeType("image/png", ["image/*"])).toBe(true);
            expect(parser.validateMimeType("image/jpeg", ["image/*"])).toBe(true);
            expect(parser.validateMimeType("audio/wav", ["image/*"])).toBe(false);
        });

        test("validates audio mime types", () => {
            expect(parser.validateMimeType("audio/wav", ["audio/*"])).toBe(true);
            expect(parser.validateMimeType("audio/mp3", ["audio/*"])).toBe(true);
        });
    });
});
