import fs from "node:fs/promises";
import path from "node:path";

export enum EntryType {
	Folder = "FOLDER",
	File = "FILE",
}

export interface FolderInfo {
	name: string;
	size: number;
	entryType: EntryType;
}

export interface ScanOptions {
	includeFiles?: boolean;
	depth?: number;
	verbose?: boolean;
	onProgress?: (scannedFiles: number) => void;
}

export interface ScanResult {
	entries: FolderInfo[];
	totalSize: number;
}

export async function scanDirectory(directoryPath: string, options: ScanOptions = {}): Promise<ScanResult> {
	const maxDepth = options.depth && options.depth > 0 ? options.depth : 1;
	const folderSizes = new Map<string, number>();
	const discoveredFolders: Array<{ relPath: string; depth: number }> = [];
	const discoveredFiles: Array<{ relPath: string; size: number; depth: number }> = [];

	let scannedFilesCount = 0;

	interface QueueItem {
		fullPath: string;
		relPath: string;
		depth: number;
	}

	const stack: QueueItem[] = [{ fullPath: directoryPath, relPath: "", depth: 0 }];

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) {
			continue;
		}

		let dirEntries;
		try {
			dirEntries = await fs.readdir(current.fullPath, { withFileTypes: true });
		} catch (error) {
			logScanError(current.fullPath, error, options.verbose);
			continue;
		}

		const statPromises: Promise<{ relPath: string; size: number; depth: number }>[] = [];

		for (const entry of dirEntries) {
			const entryRelPath = current.relPath ? `${current.relPath}/${entry.name}` : entry.name;
			const entryFullPath = path.join(current.fullPath, entry.name);
			const entryDepth = current.depth + 1;

			if (entry.isDirectory()) {
				if (entryDepth <= maxDepth) {
					discoveredFolders.push({ relPath: entryRelPath, depth: entryDepth });
				}
				stack.push({
					fullPath: entryFullPath,
					relPath: entryRelPath,
					depth: entryDepth,
				});
			} else if (entry.isFile()) {
				statPromises.push(
					fs
						.lstat(entryFullPath)
						.then((stat) => ({
							relPath: entryRelPath,
							size: stat.size,
							depth: entryDepth,
						}))
						.catch((error) => {
							logScanError(entryFullPath, error, options.verbose);
							return {
								relPath: entryRelPath,
								size: 0,
								depth: entryDepth,
							};
						}),
				);
			}
		}

		if (statPromises.length > 0) {
			const fileResults = await Promise.all(statPromises);
			scannedFilesCount += fileResults.length;
			if (options.onProgress) {
				options.onProgress(scannedFilesCount);
			}

			for (const file of fileResults) {
				if (options.includeFiles && file.depth <= maxDepth) {
					discoveredFiles.push(file);
				}

				const lastSlash = file.relPath.lastIndexOf("/");
				let folderPath = lastSlash === -1 ? "" : file.relPath.slice(0, lastSlash);

				while (true) {
					folderSizes.set(folderPath, (folderSizes.get(folderPath) ?? 0) + file.size);
					if (!folderPath) {
						break;
					}
					const prevSlash = folderPath.lastIndexOf("/");
					folderPath = prevSlash === -1 ? "" : folderPath.slice(0, prevSlash);
				}
			}
		}
	}

	const totalSize = folderSizes.get("") ?? 0;

	const entries: FolderInfo[] = discoveredFolders.map((folder) => ({
		name: folder.relPath,
		size: folderSizes.get(folder.relPath) ?? 0,
		entryType: EntryType.Folder,
	}));

	if (options.includeFiles) {
		const fileEntries: FolderInfo[] = discoveredFiles.map((file) => ({
			name: file.relPath,
			size: file.size,
			entryType: EntryType.File,
		}));
		entries.push(...fileEntries);
	}

	return { entries, totalSize };
}

export async function getFolderSize(folderPath: string, options: { verbose?: boolean } = {}): Promise<number> {
	const result = await scanDirectory(folderPath, { depth: 1, verbose: options.verbose });
	return result.totalSize;
}

function logScanError(targetPath: string, error: unknown, verbose?: boolean): void {
	if (!verbose) {
		return;
	}

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
	EntryType,
};
