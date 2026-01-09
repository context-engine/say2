// @ts-check
/**
 * Stryker Mutation Testing Configuration for Say2
 *
 * Uses the "command" test runner to work with Bun's built-in test runner.
 * Stryker will mutate source code and run tests to see if mutations are caught.
 */
const config = {
    // Use command runner since Bun doesn't have a native Stryker plugin yet
    testRunner: "command",
    commandRunner: {
        command: "bun test",
    },

    // TypeScript checker disabled for now (Bun compatibility)
    // To enable: npm install @stryker-mutator/typescript-checker
    // checkers: ["typescript"],
    // tsconfigFile: "tsconfig.json",

    // Files to mutate (source files only)
    mutate: [
        "packages/*/src/**/*.ts",
        "!packages/*/src/**/*.test.ts",
        "!packages/*/src/**/*.spec.ts",
        "!packages/*/src/**/index.ts", // Skip barrel exports
    ],

    // Reporter configuration
    reporters: ["html", "clear-text", "progress"],
    htmlReporter: {
        fileName: "reports/mutation/index.html",
    },

    // Coverage analysis (off for command runner)
    coverageAnalysis: "off",

    // Thresholds - fail if mutation score is below these
    thresholds: {
        high: 80,
        low: 60,
        break: 50, // Fail build if score < 50%
    },

    // Concurrency
    concurrency: 4,

    // Timeout settings (mutation tests may need more time)
    timeoutMS: 30000,
    timeoutFactor: 2,

    // Temp directory for mutated code
    tempDirName: ".stryker-tmp",

    // Disable sandbox for faster runs (source code is copied, not sandboxed)
    disableBail: false,

    // Log level
    logLevel: "info",
};

export default config;
