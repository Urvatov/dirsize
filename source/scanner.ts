import fs from "node:fs/promises";
import path from "node:path";

export interface FolderInfo {
	name: string;
	size: number;
}

export interface ScanOptions {
	includeFiles?: boolean;
}

export async function scanDirectory(
	directoryPath: string,
	options: ScanOptions = {},
): Promise<FolderInfo[]> {
	const entries = await fs.readdir(directoryPath, {
		withFileTypes: true,
	});

	const folderEntries = entries.filter((entry) => entry.isDirectory());
	const fileEntries = entries.filter((entry) => entry.isFile());

	const folderResults = await Promise.all(
		folderEntries.map(async (entry) => {
			const folderPath = path.join(directoryPath, entry.name);
			return {
				name: entry.name,
				size: await getFolderSize(folderPath),
			};
		}),
	);

	if (options.includeFiles && fileEntries.length > 0) {
		const statPromises = fileEntries.map(async (entry) => {
			const filePath = path.join(directoryPath, entry.name);
			try {
				const stat = await fs.lstat(filePath);
				return stat.size;
			} catch (error) {
				logScanError(filePath, error);
				return 0;
			}
		});

		const fileSizes = await Promise.all(statPromises);
		const totalFilesSize = fileSizes.reduce((sum, size) => sum + size, 0);

		if (totalFilesSize > 0) {
			folderResults.push({
				name: "(files in root)",
				size: totalFilesSize,
			});
		}
	}

	return folderResults;
}

export async function getFolderSize(folderPath: string): Promise<number> {
	let totalSize = 0;
	const stack: string[] = [folderPath];

	while (stack.length > 0) {
		const currentPath = stack.pop();
		if (!currentPath) {
			continue;
		}

		let entries;
		try {
			entries = await fs.readdir(currentPath, { withFileTypes: true });
		} catch (error) {
			logScanError(currentPath, error);
			continue;
		}

		const statPromises: Promise<number>[] = [];

		for (const entry of entries) {
			const fullPath = path.join(currentPath, entry.name);

			if (entry.isDirectory()) {
				stack.push(fullPath);
			} else if (entry.isFile()) {
				statPromises.push(
					fs.lstat(fullPath)
						.then((stat) => stat.size)
						.catch((error) => {
							logScanError(fullPath, error);
							return 0;
						}),
				);
			}
		}

		if (statPromises.length > 0) {
			const sizes = await Promise.all(statPromises);
			for (const size of sizes) {
				totalSize += size;
			}
		}
	}

	return totalSize;
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
	getFolderSize,
};
