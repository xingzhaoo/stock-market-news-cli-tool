# Google Stock Market News CLI Tool

A modern, colorized Node.js command-line application to fetch and view the latest US and Canadian stock market news from Google News without requiring any API keys.

---

## Features

- **No Setup Needed:** Instantly parses Google News RSS feeds (no API keys, registration, or credentials required).
- **Dual-Country Support:** Access curated market news for both the United States and Canada.
- **Search & Symbol Lookups:** Filter news by specific stock ticker symbols (e.g. `AAPL`, `TD`) or topic terms.
- **Modern UI Styling:** Formatted console output featuring ASCII card structures, relative timestamps, publisher metadata, and terminal wrapping.
- **Interactive Mode:** Browse news directly in the terminal and choose stories to launch in your system's default web browser.
- **JSON Output:** Stream results in raw JSON format to piping utilities (like `jq`) or automation scripts.

---

## Installation

Ensure you have Node.js (version 18 or higher) installed. Clone/download the codebase and install dependencies:

```bash
# Install dependencies
npm install
```

---

## Usage

Run the tool using `node index.js`.

### Basic Usage

Fetch the latest general **US** stock market news (default limit is 10 stories):
```bash
node index.js
```

Fetch the latest general **Canadian** stock market news:
```bash
node index.js --country ca
```

### Advanced Usage

Filter by a specific stock ticker or search phrase:
```bash
node index.js --search AAPL
# or for Canadian symbols
node index.js -c ca -s TD
```

Change the number of news articles shown:
```bash
node index.js --limit 5
```

### Interactive Mode

Run the command with the `-i` or `--interactive` flag. After listing the articles, the tool will prompt you to select one to open immediately in your web browser:
```bash
node index.js --interactive
# or search and select
node index.js -c ca -s "Royal Bank" -i
```

### JSON Output

Pipe raw JSON details for scripts:
```bash
node index.js --json
```

---

## Command Line Options

| Option | Shorthand | Description | Default |
| :--- | :--- | :--- | :--- |
| `--country <us\|ca>` | `-c` | The country market to fetch news for. | `us` |
| `--search <query>` | `-s` | Ticker symbol or topic phrase. | None |
| `--limit <number>` | `-l` | Number of news stories to display. | `10` |
| `--interactive` | `-i` | Prompts you to select and open a link. | `false` |
| `--json` | `-j` | Prints results to standard output as JSON. | `false` |
| `--help` | `-h` | Display the helper documentation. | `false` |
