export function printHelp(version: string): void {
	console.log(`dirsize v${version}
CLI tool for finding the largest directories

Usage:
  dirsize [directory] [options]

Arguments:
  [directory]         Directory to scan (default: current directory ".")

Options:
  -d, --depth <n>     Depth of directory traversal (default: 1)
  -n, --limit <n>     Limit output to top N directories
  -a, --all           Include direct files in the target directory
      --no-emoji      Display plain text types (FOLDER, FILE) instead of emojis
      --verbose       Show warnings for inaccessible files and directories
  -h, --help          Show this help message
  -v, --version       Show version number

Examples:
  dirsize
  dirsize ./src
  dirsize . -d 2
  dirsize . -n 10
  dirsize . --all
  dirsize . --no-emoji`);
}

export default {
	printHelp,
};
