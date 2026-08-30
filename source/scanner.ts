import fs from "node:fs/promises";
import path from "node:path";

export interface FolderInfo {
	name: string;
	size: number;
}

async function scanDirectory(directoryPath: string): Promise<FolderInfo[]> {
	const entries = await fs.readdir(directoryPath, {
		withFileTypes: true,
	});

	const folders = entries.filter((entry) => entry.isDirectory());

	return Promise.all(
		folders.map(async (entry) => {
			const folderPath = path.join(directoryPath, entry.name);

			return {
				name: entry.name,
				size: await getFolderSize(folderPath),
			};
		}),
	);
}

async function getFolderSize(folderPath: string): Promise<number> {
	let entries;

	try {
		entries = await fs.readdir(folderPath, {
			recursive: true,
			withFileTypes: true,
		});
	} catch (error) {
		logScanError(folderPath, error);

		return 0;
	}

	const files = entries.filter((entry) => entry.isFile());

	const results = await Promise.all(
		files.map(async (entry) => {
			const fullPath = path.join(entry.parentPath, entry.name);

			try {
				const stat = await fs.stat(fullPath);

				return stat.size;
			} catch (error) {
				logScanError(fullPath, error);

				return 0;
			}
		}),
	);

	return results.reduce((total, size) => total + size, 0);
}

function logScanError(targetPath: string, error: unknown): void {
	let message: string;

	if (error instanceof Error) {
		message = error.message;
	} else {
		message = String(error);
	}
	console.warn(`Warning: cannot access "${targetPath}": ${message}`);
}

export default {
	scanDirectory,
};
