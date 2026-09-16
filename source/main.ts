#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import yoctoSpinner from "yocto-spinner";

import pkg from "../package.json" with { type: "json" };
import { scanDirectory } from "./scanner";
import { printFolders } from "./printer";
import { printHelp } from "./help";

const VERSION = pkg.version;

async function run(): Promise<void> {
	let args;
	try {
		args = parseArgs({
			args: process.argv.slice(2),
			options: {
				help: { type: "boolean", short: "h", default: false },
				version: { type: "boolean", short: "v", default: false },
				limit: { type: "string", short: "n" },
				depth: { type: "string", short: "d" },
				all: { type: "boolean", short: "a", default: false },
				"no-emoji": { type: "boolean", default: false },
				noemoji: { type: "boolean", default: false },
				verbose: { type: "boolean", default: false },
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
		printHelp(VERSION);
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

	let depth = 1;
	if (typeof values.depth === "string") {
		const parsedDepth = Number.parseInt(values.depth, 10);
		if (Number.isNaN(parsedDepth) || parsedDepth <= 0) {
			console.error(`Error: Invalid depth value "${values.depth}". Must be a positive integer.`);
			process.exitCode = 1;
			return;
		}
		depth = parsedDepth;
	}

	const noEmoji = Boolean(values["no-emoji"] || values.noemoji);
	const verbose = Boolean(values.verbose);

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

	const spinner = yoctoSpinner({ text: "Scanning..." });
	spinner.start();

	try {
		const { entries, totalSize } = await scanDirectory(directoryPath, {
			includeFiles: Boolean(values.all),
			depth,
			verbose,
			onProgress: (scannedFiles) => {
				spinner.text = `Scanning... (${scannedFiles} files)`;
			},
		});
		spinner.stop();
		printFolders(entries, { limit, totalSize, noEmoji });
	} catch (error) {
		spinner.stop();
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Failed to scan "${directoryPath}": ${message}`);
		process.exitCode = 1;
	}
}

run();
