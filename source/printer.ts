import Table from "cli-table3";
import { EntryType, type FolderInfo } from "./scanner";

const FILE_EMOJI: string = "📄";
const FOLDER_EMOJI: string = "📁";
const UNKNOWN_EMOJI: string = "❓";

const FILE_TEXT: string = "FILE";
const FOLDER_TEXT: string = "FOLDER";
const UNKNOWN_TEXT: string = "OTHER";

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
	totalSize?: number;
	elapsedMs?: number;
	noEmoji?: boolean;
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
	let formattedSize = size.toFixed(2);
	if (size % 1 === 0) {
		formattedSize = String(size);
	}

	return `${formattedSize} ${unit}`;
}

function formatPercent(size: number, total: number): string {
	if (total <= 0) {
		return "0.0%";
	}

	return `${((size / total) * 100).toFixed(1)}%`;
}

export function printFolders(folders: FolderInfo[], options: PrintFoldersOptions = {}): void {
	const entries = [...folders].sort((a, b) => b.size - a.size || a.name.localeCompare(b.name));
	const total = options.totalSize ?? entries.reduce((sum, { size }) => sum + size, 0);

	console.log(`Total: ${formatSize(total)}`);

	if (options.elapsedMs !== undefined) {
		console.log(`Time: ${(options.elapsedMs / 1000).toFixed(2)}s`);
	}

	if (entries.length === 0) {
		console.log("No items found.");
		return;
	}

	let limit = entries.length;
	if (options.limit && options.limit > 0) {
		limit = options.limit;
	}

	const visible = entries.slice(0, limit);
	const remaining = entries.slice(limit);

	const table = new Table({
		head: ["#", "Type", "Entry", "Size", "%"],
		style: { head: ["bold"] },
	});

	visible.forEach(({ name, size, entryType }, index) => {
		const percent = formatPercent(size, total);
		let typeLabel: string;

		if (options.noEmoji) {
			switch (entryType) {
				case EntryType.Folder:
					typeLabel = FOLDER_TEXT;
					break;
				case EntryType.File:
					typeLabel = FILE_TEXT;
					break;
				default:
					typeLabel = UNKNOWN_TEXT;
					break;
			}
		} else {
			switch (entryType) {
				case EntryType.Folder:
					typeLabel = FOLDER_EMOJI;
					break;
				case EntryType.File:
					typeLabel = FILE_EMOJI;
					break;
				default:
					typeLabel = UNKNOWN_EMOJI;
					break;
			}
		}

		table.push([index + 1, typeLabel, name, formatSize(size), percent]);
	});

	if (remaining.length > 0) {
		const remainingSize = remaining.reduce((sum, { size }) => sum + size, 0);
		const remainingPercent = formatPercent(remainingSize, total);
		let remainingType = UNKNOWN_EMOJI;
		if (options.noEmoji) {
			remainingType = UNKNOWN_TEXT;
		}

		table.push(["-", remainingType, `(${remaining.length} other entries)`, formatSize(remainingSize), remainingPercent]);
	}

	console.log(table.toString());
}

export default {
	SizeUnit,
	UNIT_ORDER,
	formatSize,
	printFolders,
};
