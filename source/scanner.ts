import * as fs from "node:fs/promises";
import path from "node:path";

async function scanDirectory(directoryPath: string) {
	const result: Record<string, number> = {};

	const entries = await fs.readdir(directoryPath, {
		withFileTypes: true,
	});

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}

		const folderPath = path.join(directoryPath, entry.name);
		const size = await getFolderSize(folderPath);

		result[entry.name] = size;
	}

	return result;
}

async function getFolderSize(folderPath: string) {
	const entries = await fs.readdir(folderPath, {
		recursive: true,
		withFileTypes: true,
	});

	let size = 0;

	for (const entry of entries) {
		if (!entry.isFile()) {
			continue;
		}

		const fullPath = path.join(entry.parentPath, entry.name);
		const stat = await fs.stat(fullPath);

		size += stat.size;
	}

	return size;
}

export default {
	scanDirectory,
};
