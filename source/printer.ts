function formatSize(bytes: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];

	let size = bytes;
	let unit = 0;

	while (size >= 1024 && unit < units.length - 1) {
		size /= 1024;
		unit++;
	}

	return `${size.toFixed(2)} ${units[unit]}`;
}

function printFolders(folders: Record<string, number>) {
	const entries = Object.entries(folders).sort(
		([, sizeA], [, sizeB]) => sizeB - sizeA,
	);

	const nameWidth = Math.max(
		"Folder".length,
		...entries.map(([name]) => name.length),
	);

	const sizeWidth = Math.max(
		"Size".length,
		...entries.map(([, size]) => formatSize(size).length),
	);

	const numberWidth = String(entries.length).length;

	const separator = `+-${"-".repeat(numberWidth)}-+-${"-".repeat(nameWidth)}-+-${"-".repeat(sizeWidth)}-+`;

	console.log(separator);
	console.log(
		`| ${"#".padStart(numberWidth)} | ` +
			`${"Folder".padEnd(nameWidth)} | ` +
			`${"Size".padStart(sizeWidth)} |`,
	);
	console.log(separator);

	entries.forEach(([name, size], index) => {
		console.log(
			`| ${String(index + 1).padStart(numberWidth)} | ` +
				`${name.padEnd(nameWidth)} | ` +
				`${formatSize(size).padStart(sizeWidth)} |`,
		);
	});

	console.log(separator);
}

export default {
	printFolders,
};
