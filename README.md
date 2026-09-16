# dirsize

A fast, lightweight CLI tool for finding the largest directories.

## Installation

### From GitHub Releases

#### With Node.js / npm

Install globally via the release package:

```bash
npm install -g https://github.com/Urvatov/dirsize/releases/latest/download/dirsize-0.2.1.tgz
```

#### With Bun

```bash
bun add -g https://github.com/Urvatov/dirsize/releases/latest/download/dirsize-0.2.1.tgz
```

#### Standalone Executable (No Bun or Node required)

Download the single executable binary for your OS directly from [GitHub Releases](https://github.com/Urvatov/dirsize/releases/latest):

- **Windows**: `dirsize-windows-x64.exe`
- **Linux**: `dirsize-linux-x64`
- **macOS (Apple Silicon)**: `dirsize-darwin-arm64`

Example for Linux / macOS:

```bash
curl -fsSL https://github.com/Urvatov/dirsize/releases/latest/download/dirsize-linux-x64 -o /usr/local/bin/dirsize && chmod +x /usr/local/bin/dirsize
```

## Usage

```bash
dirsize [directory] [options]
```

If no directory is specified, `dirsize` scans the current directory (`.`) by default.

### Options

| Option        | Alias | Description                                                            |
| ------------- | ----- | ---------------------------------------------------------------------- |
| `--depth <n>` | `-d`  | Depth of directory traversal (default: 1)                              |
| `--limit <n>` | `-n`  | Limit output to top N directories (remaining folders grouped together) |
| `--all`       | `-a`  | Include direct files in the target directory                           |
| `--no-emoji`  |       | Display plain text types (FOLDER, FILE) instead of emojis              |
| `--verbose`   |       | Show warnings for inaccessible files and directories                   |
| `--help`      | `-h`  | Show usage instructions                                                |
| `--version`   | `-v`  | Show version                                                           |

## Example

```
$ dirsize .
Total: 46.49 MB
┌───┬──────┬──────────────┬───────────┬───────┐
│ # │ Type │ Entry        │ Size      │ %     │
├───┼──────┼──────────────┼───────────┼───────┤
│ 1 │ 📁   │ node_modules │ 46.20 MB  │ 99.4% │
├───┼──────┼──────────────┼───────────┼───────┤
│ 2 │ 📁   │ .git         │ 101.38 KB │ 0.2%  │
├───┼──────┼──────────────┼───────────┼───────┤
│ 3 │ 📁   │ dist         │ 85.55 KB  │ 0.2%  │
├───┼──────┼──────────────┼───────────┼───────┤
│ 4 │ 📁   │ source       │ 11.01 KB  │ 0.0%  │
└───┴──────┴──────────────┴───────────┴───────┘
```

With `--limit`:

```
$ dirsize . -n 2
Total: 46.49 MB
┌───┬──────┬───────────────────┬───────────┬───────┐
│ # │ Type │ Entry             │ Size      │ %     │
├───┼──────┼───────────────────┼───────────┼───────┤
│ 1 │ 📁   │ node_modules      │ 46.20 MB  │ 99.4% │
├───┼──────┼───────────────────┼───────────┼───────┤
│ 2 │ 📁   │ .git              │ 101.38 KB │ 0.2%  │
├───┼──────┼───────────────────┼───────────┼───────┤
│ - │ ❓   │ (2 other entries) │ 96.56 KB  │ 0.2%  │
└───┴──────┴───────────────────┴───────────┴───────┘
```

## Development

```bash
# Clone the repository
git clone https://github.com/Urvatov/dirsize.git
cd dirsize

# With Bun
bun install
bun run lint
bun run build

# With Node.js
npm install
npm run lint
npm run build:tsc
npm run start:node
```
