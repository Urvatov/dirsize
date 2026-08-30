import path from "node:path";

import Scanner from "./scanner";
import Printer from "./printer";

const inputPath = process.argv[2];

if (!inputPath) {
	console.error("Usage: dirsize <directory>");
	process.exitCode = 1;
} else {
	const directoryPath = path.resolve(inputPath);

	try {
		const folders = await Scanner.scanDirectory(directoryPath);

		Printer.printFolders(folders);
	} catch (error) {
		let message: string;

		if (error instanceof Error) {
			message = error.message;
		} else {
			message = String(error);
		}

		console.error(`Failed to scan "${directoryPath}": ${message}`);
		process.exitCode = 1;
	}
}
