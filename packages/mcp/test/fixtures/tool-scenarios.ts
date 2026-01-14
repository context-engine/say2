/**
 * Phase 2a Test Fixtures
 *
 * Pre-configured mock server configs and sample data for Phase 2a tool operation testing.
 */

import type { ToolBehavior, ToolContentConfig } from "./mock-server";

// =============================================================================
// Sample Content Types
// =============================================================================

/** Sample text content */
export const sampleTextContent: ToolContentConfig = {
    type: "text",
    text: "Hello from the tool!",
};

/** Sample image content (1x1 red PNG) */
export const sampleImageContent: ToolContentConfig = {
    type: "image",
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
    mimeType: "image/png",
};

/** Sample audio content (short WAV header) */
export const sampleAudioContent: ToolContentConfig = {
    type: "audio",
    data: "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
    mimeType: "audio/wav",
};

/** Sample resource link */
export const sampleResourceLinkContent: ToolContentConfig = {
    type: "resource_link",
    uri: "file:///path/to/resource.txt",
    name: "Resource File",
    mimeType: "text/plain",
};

/** Sample embedded resource */
export const sampleEmbeddedResourceContent: ToolContentConfig = {
    type: "resource",
    resource: {
        uri: "file:///path/to/data.json",
        text: '{"key": "value"}',
        mimeType: "application/json",
    },
};

/** Sample content with annotations */
export const sampleAnnotatedContent: ToolContentConfig = {
    type: "text",
    text: "This is for the user only",
    annotations: {
        audience: ["user"],
        priority: 0.8,
    },
};

// =============================================================================
// Tool Behaviors for Testing
// =============================================================================

/** Default tool behaviors for scenarios */
export const scenarioToolBehaviors: Record<string, ToolBehavior> = {
    // Basic echo - uses default behavior
    echo: {},

    // Returns image content
    getImage: {
        content: [sampleImageContent],
    },

    // Returns audio content
    getAudio: {
        content: [sampleAudioContent],
    },

    // Returns resource link
    getResourceLink: {
        content: [sampleResourceLinkContent],
    },

    // Returns embedded resource
    getEmbeddedResource: {
        content: [sampleEmbeddedResourceContent],
    },

    // Returns multiple content types
    getMixed: {
        content: [
            sampleTextContent,
            sampleImageContent,
            sampleResourceLinkContent,
        ],
    },

    // Returns with annotations
    getAnnotated: {
        content: [sampleAnnotatedContent],
    },

    // Returns isError: true
    failingTool: {
        content: [{ type: "text", text: "Something went wrong" }],
        isError: true,
    },

    // Returns structured output
    getStructured: {
        content: [{ type: "text", text: "Structured data available" }],
        structuredContent: {
            result: "success",
            count: 42,
            items: ["a", "b", "c"],
        },
    },

    // Simulates slow operation (for timeout/cancel tests)
    slowTool: {
        content: [{ type: "text", text: "Completed after delay" }],
        delayMs: 5000,
    },

    // Slow with progress notifications
    slowWithProgress: {
        content: [{ type: "text", text: "All steps complete" }],
        delayMs: 3000,
        progressSteps: 3,
    },

    // Very slow (for timeout)
    verySlowTool: {
        content: [{ type: "text", text: "Should timeout" }],
        delayMs: 60000,
    },
};

/** Tool definitions with full schema */
export const scenarioToolDefinitions = [
    {
        name: "echo",
        description: "Echoes input back",
        inputSchema: {
            type: "object",
            properties: {
                message: { type: "string" },
            },
            required: ["message"],
        },
    },
    {
        name: "greet",
        description: "Returns a greeting",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string" },
            },
        },
    },
    {
        name: "getImage",
        description: "Returns image content",
    },
    {
        name: "getAudio",
        description: "Returns audio content",
    },
    {
        name: "getResourceLink",
        description: "Returns resource link",
    },
    {
        name: "getEmbeddedResource",
        description: "Returns embedded resource",
    },
    {
        name: "getMixed",
        description: "Returns mixed content types",
    },
    {
        name: "getAnnotated",
        description: "Returns annotated content",
    },
    {
        name: "failingTool",
        description: "Always returns isError: true",
    },
    {
        name: "getStructured",
        description: "Returns structured output",
        outputSchema: {
            type: "object",
            properties: {
                result: { type: "string" },
                count: { type: "number" },
                items: { type: "array", items: { type: "string" } },
            },
            required: ["result"],
        },
    },
    {
        name: "slowTool",
        description: "Simulates 5 second delay",
    },
    {
        name: "slowWithProgress",
        description: "Slow with progress updates",
    },
    {
        name: "verySlowTool",
        description: "60 second delay for timeout testing",
    },
];

// =============================================================================
// Pre-configured Mock Configs
// =============================================================================

/** Full mock config with all tools and behaviors */
export const scenarioMockConfig = {
    name: "scenario-mock-server",
    version: "1.0.0",
    protocolVersion: "2024-11-05",
    capabilities: {
        tools: true,
        resources: true,
        prompts: true,
    },
    tools: scenarioToolDefinitions,
    toolBehaviors: scenarioToolBehaviors,
    strictToolValidation: true,
};

/** Minimal config for basic tests */
export const minimalMockConfig = {
    tools: [
        { name: "echo", description: "Echo tool" },
        { name: "greet", description: "Greeting tool" },
    ],
    strictToolValidation: true,
};
