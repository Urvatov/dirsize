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
	concurrency?: number;
	verbose?: boolean;
	onProgress?: (scannedFiles: number) => void;
}

export interface ScanResult {
	entries: FolderInfo[];
	totalSize: number;
}

/**
 * Scans a directory tree and returns the sizes of the discovered entries.
 *
 * `concurrency` controls how many directories are read at the same time:
 * - `0` or omitted: no limit (fastest, matches the behaviour of older versions)
 * - `1`: one directory at a time (useful for slow or network drives)
 * - `n`: at most `n` directories at a time
 */
export async function scanDirectory(directoryPath: string, options: ScanOptions = {}): Promise<ScanResult> {
	const maxDepth = options.depth && options.depth > 0 ? options.depth : 1;
	const concurrency =
		options.concurrency && options.concurrency > 0 ? options.concurrency : Number.POSITIVE_INFINITY;
	const folderSizes = new Map<string, number>();
	const discoveredFolders: Array<{ relPath: string; depth: number }> = [];
	const discoveredFiles: Array<{ relPath: string; size: number; depth: number }> = [];

	let scannedFilesCount = 0;

	interface QueueItem {
		fullPath: string;
		relPath: string;
		depth: number;
	}

	const queue: QueueItem[] = [];
	let activeCount = 0;
	let pendingCount = 0;
	let scanError: unknown;
	let resolveScan: () => void = () => {};
	const scanComplete = new Promise<void>((resolve) => {
		resolveScan = resolve;
	});

	async function scanOne(current: QueueItem): Promise<void> {
		let dirEntries;
		try {
			dirEntries = await fs.readdir(current.fullPath, { withFileTypes: true });
		} catch (error) {
			logScanError(current.fullPath, error, options.verbose);
			return;
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
				schedule({
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

	function drainQueue(): void {
		while (activeCount < concurrency && queue.length > 0) {
			const item = queue.pop();
			if (!item) {
				return;
			}

			activeCount++;
			void scanOne(item)
				.catch((error: unknown) => {
					scanError ??= error;
				})
				.finally(() => {
					activeCount--;
					pendingCount--;

					if (pendingCount === 0) {
						resolveScan();
						return;
					}

					drainQueue();
				});
		}
	}

	function schedule(item: QueueItem): void {
		pendingCount++;
		queue.push(item);
		drainQueue();
	}

	schedule({ fullPath: directoryPath, relPath: "", depth: 0 });
	await scanComplete;

	if (scanError) {
		throw scanError;
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
