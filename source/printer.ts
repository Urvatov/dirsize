import Table from "cli-table3";
import { EntryType, type FolderInfo } from "./scanner";

const FILE_EMOJI: string = "📄";
const FOLDER_EMOJI: string = "📁";
const UNKNOWN_EMOJI: string = "❓";

export enum SizeUnit {
	Byte = "B",
	Kilobyte = "KB",
	Megabyte = "MB",
	Gigabyte = "GB",
	Terabyte = "TB",
	Petabyte = "PB",
}

export const UNIT_ORDER: readonly SizeUnit[] = [
	SizeUnit.Byte,
	SizeUnit.Kilobyte,
	SizeUnit.Megabyte,
	SizeUnit.Gigabyte,
	SizeUnit.Terabyte,
	SizeUnit.Petabyte,
];

export interface PrintFoldersOptions {
	limit?: number;
}

export function formatSize(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return `0 ${SizeUnit.Byte}`;
	}

	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < UNIT_ORDER.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	if (size >= 1023.995 && unitIndex < UNIT_ORDER.length - 1) {
		size = 1;
		unitIndex++;
	}

	const unit = UNIT_ORDER[unitIndex];
	const formattedSize = size % 1 === 0 ? String(size) : size.toFixed(2);

	return `${formattedSize} ${unit}`;
}

export function printFolders(folders: FolderInfo[], options: PrintFoldersOptions = {}): void {
	const entries = [...folders].sort((a, b) => b.size - a.size);
	const total = entries.reduce((sum, { size }) => sum + size, 0);

	console.log(`Total: ${formatSize(total)}`);

	if (entries.length === 0) {
		console.log("No items found.");
		return;
	}

	const limit = options.limit && options.limit > 0 ? options.limit : entries.length;
	const visible = entries.slice(0, limit);
	const remaining = entries.slice(limit);

	const table = new Table({
		head: ["#", "Type", "Entry", "Size", "%"],
		style: { head: ["bold"] },
	});

	visible.forEach(({ name, size, entryType }, index) => {
		const percent = total > 0 ? ((size / total) * 100).toFixed(1) + "%" : "0.0%";
		let prefixEmoji: string;

		switch (entryType) {
			case EntryType.Folder:
				prefixEmoji = FOLDER_EMOJI;
				break;
			case EntryType.File:
				prefixEmoji = FILE_EMOJI;
				break;
			default:
				prefixEmoji = UNKNOWN_EMOJI;
				break;
		}

		table.push([index + 1, prefixEmoji, name, formatSize(size), percent]);
	});

	if (remaining.length > 0) {
		const remainingSize = remaining.reduce((sum, { size }) => sum + size, 0);
		const remainingPercent = total > 0 ? ((remainingSize / total) * 100).toFixed(1) + "%" : "0.0%";
		table.push(["-", UNKNOWN_EMOJI, `(${remaining.length} other entries)`, formatSize(remainingSize), remainingPercent]);
	}

	console.log(table.toString());
}

export default {
	SizeUnit,
	UNIT_ORDER,
	formatSize,
	printFolders,
};
