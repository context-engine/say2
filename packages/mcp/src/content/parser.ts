/**
 * Content Parser
 *
 * Parses and validates tool content, including audio, images, and structured data.
 * Validates structuredContent against outputSchema using JSON Schema (Ajv).
 */

import Ajv from "ajv";
import { ToolContentSchema, type ToolContent } from "../types/tool";

export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}

export class ContentParser {
    private ajv = new Ajv();

    /**
     * Parse raw content array into typed ToolContent objects.
     * Validates types, base64 data, and mime types.
     * @param rawContent - The raw content array from JSON-RPC result
     * @throws Error if content is invalid
     */
    parseContent(rawContent: unknown[]): ToolContent[] {
        if (!Array.isArray(rawContent)) {
            throw new Error("Content must be an array");
        }

        return rawContent.map((item, index) => {
            const result = ToolContentSchema.safeParse(item);
            if (!result.success) {
                const issues = result.error.issues
                    .map((i) => `${i.path.join(".")}: ${i.message}`)
                    .join(", ");
                throw new Error(`Invalid content at index ${index}: ${issues}`);
            }
            return result.data;
        });
    }

    /**
     * Validate structured content against a JSON schema.
     * @param content - The structured content object
     * @param schema - The JSON schema (outputSchema)
     */
    validateStructuredOutput(
        content: unknown,
        schema?: object,
    ): ValidationResult {
        if (!schema) {
            // No schema = always valid
            return { valid: true };
        }

        try {
            const validate = this.ajv.compile(schema);
            const valid = validate(content);

            if (!valid) {
                return {
                    valid: false,
                    errors: validate.errors?.map(
                        (e) => `${e.instancePath || "/"} ${e.message}`,
                    ),
                };
            }

            return { valid: true };
        } catch (err: any) {
            return {
                valid: false,
                errors: [`Schema compilation error: ${err.message}`],
            };
        }
    }

    /**
     * Decode base64 data to Uint8Array.
     * @param data - Base64 string
     */
    decodeBase64(data: string): Uint8Array {
        try {
            // Use Buffer in Node.js environment for proper base64 decoding
            if (typeof Buffer !== "undefined") {
                return new Uint8Array(Buffer.from(data, "base64"));
            }
            // Fallback for browser-like environments
            const binary = atob(data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        } catch {
            throw new Error("Invalid base64 data");
        }
    }

    /**
     * Get the estimated byte size of a content item.
     * @param content - The tool content
     * @returns Estimated byte size
     */
    getContentSize(content: ToolContent): number {
        switch (content.type) {
            case "text":
                return content.text.length;
            case "image":
            case "audio":
                // Base64 is ~33% larger than binary, so multiply by 0.75 to get actual size
                return Math.floor(content.data.length * 0.75);
            case "resource_link":
                return 0;
            case "resource":
                if (content.resource.text) return content.resource.text.length;
                if (content.resource.blob)
                    return Math.floor(content.resource.blob.length * 0.75);
                return 0;
        }
    }

    /**
     * Validate a MIME type against allowed types.
     * @param mimeType - The MIME type to validate
     * @param allowedTypes - Array of allowed MIME types or prefixes
     */
    validateMimeType(mimeType: string, allowedTypes: readonly string[]): boolean {
        return allowedTypes.some((allowed) => {
            if (allowed.endsWith("/*")) {
                // Prefix match (e.g., "image/*")
                const prefix = allowed.slice(0, -1);
                return mimeType.startsWith(prefix);
            }
            return mimeType === allowed;
        });
    }
}

// Singleton instance
export const contentParser = new ContentParser();
