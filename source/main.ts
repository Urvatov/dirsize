#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { scanDirectory } from "./scanner";
import { printFolders } from "./printer";

const VERSION = "0.2.0";

function printHelp(): void {
	console.log(`dirsize v${VERSION}
CLI tool for finding the largest directories

Usage:
  dirsize [directory] [options]

Arguments:
  [directory]         Directory to scan (default: current directory ".")

Options:
  -n, --limit <n>     Limit output to top N directories
  -a, --all           Include direct files in the target directory
  -h, --help          Show this help message
  -v, --version       Show version number

Examples:
  dirsize
  dirsize ./src
  dirsize . -n 10
  dirsize . --all`);
}

async function run(): Promise<void> {
	let args;
	try {
		args = parseArgs({
			args: process.argv.slice(2),
			options: {
				help: { type: "boolean", short: "h", default: false },
				version: { type: "boolean", short: "v", default: false },
				limit: { type: "string", short: "n" },
				all: { type: "boolean", short: "a", default: false },
			},
			allowPositionals: true,
			strict: false,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		console.error("Run 'dirsize --help' for usage instructions.");
		process.exitCode = 1;
		return;
	}

	const { values, positionals } = args;

	if (values.help) {
		printHelp();
		return;
	}

	if (values.version) {
		console.log(`dirsize v${VERSION}`);
		return;
	}

	let limit: number | undefined;
	if (typeof values.limit === "string") {
		const parsedLimit = Number.parseInt(values.limit, 10);
		if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
			console.error(`Error: Invalid limit value "${values.limit}". Must be a positive integer.`);
			process.exitCode = 1;
			return;
		}
		limit = parsedLimit;
	}

	const rawPath = positionals[0] ?? ".";
	const directoryPath = path.resolve(rawPath);

	try {
		const stat = await fs.stat(directoryPath);
		if (!stat.isDirectory()) {
			console.error(`Error: "${directoryPath}" is not a directory.`);
			process.exitCode = 1;
			return;
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: Cannot access "${directoryPath}": ${message}`);
		process.exitCode = 1;
		return;
	}

	try {
		const folders = await scanDirectory(directoryPath, {
			includeFiles: Boolean(values.all),
		});
		printFolders(folders, { limit });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Failed to scan "${directoryPath}": ${message}`);
		process.exitCode = 1;
	}
}

run();
