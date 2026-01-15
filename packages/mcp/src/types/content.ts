/**
 * Tool Content Types
 *
 * Zod schemas and TypeScript types for Tool Content.
 * Moved from tool.ts to align with spec structure.
 */

import { z } from "zod";

/**
 * Supported audio MIME types per MCP spec.
 */
export const AudioMimeTypes = [
    "audio/wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
] as const;

/**
 * Supported image MIME types per MCP spec.
 */
export const ImageMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
] as const;

/**
 * Annotations for content items.
 * Used to indicate intended audience and priority.
 *
 * NOTE: This is ContentAnnotationsSchema (audience/priority for content).
 * For tool behavioral hints, see ToolAnnotationsSchema in tool-annotations.ts.
 */
export const ContentAnnotationsSchema = z.object({
    audience: z.array(z.enum(["user", "assistant"])).optional(),
    priority: z.number().min(0).max(1).optional(),
});

export type ContentAnnotations = z.infer<typeof ContentAnnotationsSchema>;

// Backward compatibility alias
export const AnnotationsSchema = ContentAnnotationsSchema;
export type Annotations = ContentAnnotations;

/**
 * Text content returned by a tool.
 */
export const TextContentSchema = z.object({
    type: z.literal("text"),
    text: z.string(),
    annotations: AnnotationsSchema.optional(),
});

export type TextContent = z.infer<typeof TextContentSchema>;

/**
 * Image content returned by a tool (base64 encoded).
 */
export const ImageContentSchema = z.object({
    type: z.literal("image"),
    data: z.string(), // base64
    mimeType: z.string(),
    annotations: AnnotationsSchema.optional(),
});

export type ImageContent = z.infer<typeof ImageContentSchema>;

/**
 * Audio content returned by a tool (base64 encoded).
 * Added in later MCP spec versions.
 */
export const AudioContentSchema = z.object({
    type: z.literal("audio"),
    data: z.string(), // base64
    mimeType: z.string(),
    annotations: AnnotationsSchema.optional(),
});

export type AudioContent = z.infer<typeof AudioContentSchema>;

/**
 * Resource link content - a reference to a resource.
 */
export const ResourceLinkContentSchema = z.object({
    type: z.literal("resource_link"),
    uri: z.string(),
    name: z.string().optional(),
    mimeType: z.string().optional(),
    annotations: AnnotationsSchema.optional(),
});

export type ResourceLinkContent = z.infer<typeof ResourceLinkContentSchema>;

/**
 * Embedded resource content - inline resource data.
 */
export const EmbeddedResourceContentSchema = z.object({
    type: z.literal("resource"),
    resource: z.object({
        uri: z.string(),
        mimeType: z.string().optional(),
        text: z.string().optional(),
        blob: z.string().optional(), // base64
    }),
    annotations: AnnotationsSchema.optional(),
});

export type EmbeddedResourceContent = z.infer<typeof EmbeddedResourceContentSchema>;

/**
 * Helper schema for any tool content item.
 */
export const ToolContentSchema = z.discriminatedUnion("type", [
    TextContentSchema,
    ImageContentSchema,
    AudioContentSchema,
    ResourceLinkContentSchema,
    EmbeddedResourceContentSchema,
]);

export type ToolContent = z.infer<typeof ToolContentSchema>;
