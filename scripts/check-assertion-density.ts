#!/usr/bin/env bun
/**
 * Assertion Density Check
 *
 * This script analyzes test files to ensure they have sufficient assertions.
 * It prevents "fake safety" tests that appear to test something but don't
 * actually verify behavior.
 *
 * Usage: bun run scripts/check-assertion-density.ts
 *
 * Exit codes:
 *   0 - All files pass
 *   1 - One or more files fail threshold
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

interface FileStats {
	file: string;
	tests: number;
	expects: number;
	density: number;
	pass: boolean;
}

// Configuration
const MIN_DENSITY = 1.0; // Minimum assertions per test (1.0 is baseline, 1.5 is recommended)
const TEST_PATTERNS = ["*.test.ts", "*.spec.ts"];
const EXCLUDE_PATTERNS = ["node_modules", "dist", ".stryker-tmp"];

// Patterns to count
const TEST_REGEX = /\b(test|it)\s*\(/g;
// Count both expect() and fc.assert() as assertions
const EXPECT_REGEX = /\b(expect|fc\.assert)\s*\(/g;

async function findTestFiles(dir: string): Promise<string[]> {
	const files: string[] = [];

	async function walk(currentDir: string) {
		const entries = await readdir(currentDir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name);

			// Skip excluded directories
			if (EXCLUDE_PATTERNS.some((p) => fullPath.includes(p))) {
				continue;
			}

			if (entry.isDirectory()) {
				await walk(fullPath);
			} else if (
				entry.isFile() &&
				(entry.name.endsWith(".test.ts") || entry.name.endsWith(".spec.ts"))
			) {
				files.push(fullPath);
			}
		}
	}

	await walk(dir);
	return files;
}

async function analyzeFile(filePath: string): Promise<FileStats> {
	const content = await readFile(filePath, "utf-8");

	const tests = (content.match(TEST_REGEX) || []).length;
	const expects = (content.match(EXPECT_REGEX) || []).length;
	const density = tests > 0 ? expects / tests : 0;

	return {
		file: filePath.replace(process.cwd() + "/", ""),
		tests,
		expects,
		density: Math.round(density * 100) / 100,
		pass: density >= MIN_DENSITY,
	};
}

async function main() {
	console.log("🔍 Assertion Density Check\n");
	console.log(`Minimum density required: ${MIN_DENSITY} assertions per test\n`);

	const packagesDir = join(process.cwd(), "packages");
	const testFiles = await findTestFiles(packagesDir);

	if (testFiles.length === 0) {
		console.log("No test files found.");
		process.exit(0);
	}

	const results = await Promise.all(testFiles.map(analyzeFile));

	// Calculate totals
	const totalTests = results.reduce((sum, r) => sum + r.tests, 0);
	const totalExpects = results.reduce((sum, r) => sum + r.expects, 0);
	const overallDensity = totalTests > 0 ? totalExpects / totalTests : 0;

	// Print table header
	console.log(
		"File".padEnd(60) +
			"Tests".padStart(8) +
			"Expects".padStart(10) +
			"Density".padStart(10) +
			"Status".padStart(10),
	);
	console.log("-".repeat(98));

	// Print each file
	for (const result of results) {
		const status = result.pass ? "✅ PASS" : "❌ FAIL";
		const shortFile =
			result.file.length > 58 ? "..." + result.file.slice(-55) : result.file;

		console.log(
			shortFile.padEnd(60) +
				result.tests.toString().padStart(8) +
				result.expects.toString().padStart(10) +
				result.density.toFixed(2).padStart(10) +
				status.padStart(10),
		);
	}

	// Print summary
	console.log("-".repeat(98));
	console.log(
		"TOTAL".padEnd(60) +
			totalTests.toString().padStart(8) +
			totalExpects.toString().padStart(10) +
			overallDensity.toFixed(2).padStart(10),
	);

	console.log("\n");

	// Check for failures
	const failures = results.filter((r) => !r.pass);

	if (failures.length > 0) {
		console.log(
			`❌ ${failures.length} file(s) failed the assertion density check:\n`,
		);
		for (const f of failures) {
			console.log(
				`   - ${f.file} (density: ${f.density}, required: ${MIN_DENSITY})`,
			);
		}
		console.log(
			"\n💡 Tip: Add more meaningful assertions to these test files.\n",
		);
		process.exit(1);
	} else {
		console.log("✅ All test files pass the assertion density check!\n");
		console.log(
			`📊 Overall density: ${overallDensity.toFixed(2)} assertions per test\n`,
		);
		process.exit(0);
	}
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
