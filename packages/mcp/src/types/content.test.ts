import { describe, expect, test } from "bun:test";
import {
    AnnotationsSchema,
    AudioContentSchema,
    AudioMimeTypes,
    ImageContentSchema,
    ImageMimeTypes,
    ResourceLinkContentSchema,
    TextContentSchema,
} from "./content";

describe("Content Schemas", () => {
    describe("AnnotationsSchema", () => {
        test("validates valid annotations", () => {
            const valid = {
                audience: ["user"],
                priority: 0.5,
            };
            const result = AnnotationsSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        test("allows missing optional fields", () => {
            const valid = {};
            const result = AnnotationsSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        test("validates audience values", () => {
            const invalid = { audience: ["admin"] };
            const result = AnnotationsSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        test("validates priority range", () => {
            const invalid = { priority: 1.5 };
            const result = AnnotationsSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe("Content Types", () => {
        test("TextContentSchema validates", () => {
            const valid = { type: "text", text: "Hello" };
            expect(TextContentSchema.safeParse(valid).success).toBe(true);
        });

        test("ImageContentSchema validates basic structure", () => {
            const valid = {
                type: "image",
                data: "abc",
                mimeType: "image/png",
            };
            expect(ImageContentSchema.safeParse(valid).success).toBe(true);
        });

        test("AudioContentSchema validates basic structure", () => {
            const valid = {
                type: "audio",
                data: "abc",
                mimeType: "audio/wav",
            };
            expect(AudioContentSchema.safeParse(valid).success).toBe(true);
        });

        test("ResourceLinkContentSchema validates", () => {
            const valid = {
                type: "resource_link",
                uri: "file:///test.txt",
                name: "Test",
            };
            expect(ResourceLinkContentSchema.safeParse(valid).success).toBe(true);
        });
    });

    describe("Mime Types Lists", () => {
        test("ImageMimeTypes contains standard types", () => {
            expect(ImageMimeTypes).toContain("image/png");
            expect(ImageMimeTypes).toContain("image/jpeg");
        });

        test("AudioMimeTypes contains standard types", () => {
            expect(AudioMimeTypes).toContain("audio/wav");
            expect(AudioMimeTypes).toContain("audio/mp3");
        });
    });
});
