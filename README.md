# dirsize

A small CLI tool for finding the largest directories.

## Installation

```bash
bun add -g https://github.com/Urvatov/dirsize.git
```

## Usage

```bash
dirsize <directory>
```

## Example

```
$ dirsize .
Total: 58.03 MB
┌───┬──────────────┬──────────┐
│ # │ Folder       │ Size     │
├───┼──────────────┼──────────┤
│ 1 │ node_modules │ 57.99 MB │
├───┼──────────────┼──────────┤
│ 2 │ .git         │ 34.53 KB │
├───┼──────────────┼──────────┤
│ 3 │ source       │ 3.06 KB  │
└───┴──────────────┴──────────┘
```
