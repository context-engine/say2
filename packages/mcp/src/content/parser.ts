/**
 * Content Parser
 *
 * Parses and validates tool content, including audio, images, and structured data.
 */

import type { ToolContent } from "../types/tool";

export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}

export class ContentParser {
    /**
     * Parse raw content array into typed ToolContent objects.
     * Validates types, base64 data, and mime types.
     * @param rawContent - The raw content array from JSON-RPC result
     * @throws Error if content is invalid
     */
    parseContent(rawContent: unknown[]): ToolContent[] {
        throw new Error("Not implemented: ContentParser.parseContent");
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
        throw new Error("Not implemented: ContentParser.validateStructuredOutput");
    }

    /**
     * Decode base64 data to Uint8Array.
     * @param data - Base64 string
     */
    decodeBase64(data: string): Uint8Array {
        throw new Error("Not implemented: ContentParser.decodeBase64");
    }
}

// Singleton instance
export const contentParser = new ContentParser();
