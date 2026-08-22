import Scanner from "./scanner";
import Printer from "./printer";

const directoryPath = process.argv[2];

if (!directoryPath) {
	console.error("Usage: scanner <directory>");
	process.exit(1);
}

const folders = await Scanner.scanDirectory(directoryPath);

Printer.printFolders(folders);
