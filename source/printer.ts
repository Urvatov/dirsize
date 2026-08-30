import Table from "cli-table3";
import type { FolderInfo } from "./scanner";

function formatSize(bytes: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];

	let size = bytes;
	let unit = 0;

	while (size >= 1024 && unit < units.length - 1) {
		size /= 1024;
		unit++;
	}

	let formattedSize: string;

	if (size % 1 === 0) {
		formattedSize = String(size);
	} else {
		formattedSize = size.toFixed(2);
	}

	return `${formattedSize} ${units[unit]}`;
}

function printFolders(folders: FolderInfo[]): void {
	const entries = [...folders].sort((a, b) => b.size - a.size);
	const total = entries.reduce((sum, { size }) => sum + size, 0);

	console.log(`Total: ${formatSize(total)}`);

	const table = new Table({
		head: ["#", "Folder", "Size"],
		style: { head: ["bold"] },
	});

	entries.forEach(({ name, size }, index) => {
		table.push([index + 1, name, formatSize(size)]);
	});

	console.log(table.toString());
}

export default {
	printFolders,
};
