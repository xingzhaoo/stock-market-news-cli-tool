# Google Stock Market News CLI Tool

A fast, colorized Node.js command-line application to fetch and display the latest stock market news for the United States and Canada from Google News without requiring any API keys or registration.

---

## ✨ Features

- **No API Keys or Setup Needed:** Queries Google News RSS feeds directly out of the box.
- **Ticker Lookups (Today's News Only):** When searching for a specific stock ticker (e.g. `AAPL`, `TD`), the CLI automatically filters to retrieve **only today's news**.
- **Top 6 Most Recent Stories:** Defaults to the **6 most recent news items**, strictly sorted from **most recent to least recent (top to bottom)**.
- **Alternating Card Colors:** Neighboring news items alternate between **Cyan** and **Yellow** for clear visual distinction in the terminal.
- **Dual-Country Support:** Seamlessly switch between United States (`us`) and Canadian (`ca`) market coverage.
- **Interactive Browser Mode:** Browse news cards in your terminal and select an article to open directly in your default web browser.
- **Pipeable JSON Output:** Easily pipe clean JSON to files or command-line utilities like `jq`.
- **Zero Third-Party Test Dependencies:** Comprehensive test suite powered by Node's native test runner (`node:test`).

---

## 💻 Terminal Preview

```text
⚡ Fetching stock news from Google News...

╔══════════════════════════════════════════════════╗
║             GOOGLE STOCK MARKET NEWS             ║
║                 🇺🇸 UNITED STATES                ║
║           Search: "AAPL" (Today's News)          ║
╚══════════════════════════════════════════════════╝

 [1]  Apple Expands AI Partnerships Ahead of Q4 Earnings
     Bloomberg  •  12m ago
     https://news.google.com/rss/articles/...
     ────────────────────────────────────────────────────────────────────────
 [2]  Tech Stocks Rally as Nasdaq Gains on Chip Sector Momentum
     Reuters  •  45m ago
     https://news.google.com/rss/articles/...
     ────────────────────────────────────────────────────────────────────────
 [3]  Apple Supplier Report Shows Strong Holiday Demand
     CNBC  •  2h ago
     https://news.google.com/rss/articles/...
     ────────────────────────────────────────────────────────────────────────

  Showing 3 of 3 articles.
```

*(Note: Items alternate colors between Cyan and Yellow in supported terminals.)*

---

## 🚀 Installation

Ensure you have **Node.js (v18.0.0 or higher)** installed.

```bash
# Clone or download this repository
git clone https://github.com/xingzhaoo/stock-market-news-cli-tool.git
cd stock-market-news-cli-tool

# Install dependencies
npm install
```

---

## 📖 Usage

Run the CLI using `node index.js`:

### 1. General Market News

Fetch the 6 most recent **US** stock market news items:
```bash
node index.js
```

Fetch the 6 most recent **Canadian** stock market news items:
```bash
node index.js --country ca
```

### 2. Ticker Search (Today's News Only)

Search for a specific ticker to get only today's news:
```bash
# US ticker (e.g. Apple)
node index.js --search AAPL

# Canadian ticker (e.g. TD Bank)
node index.js -c ca -s TD
```

### 3. Custom Story Count

Override the default limit of 6 stories:
```bash
node index.js --limit 10
node index.js -s NVDA --limit 3
```

### 4. Interactive Browser Mode

Add `-i` or `--interactive` to prompt you to select an article from the list and open it in your default web browser:
```bash
node index.js --search AAPL --interactive
```

### 5. JSON Output for Automation

Stream raw JSON array output for automation, scripts, or piping into `jq`:
```bash
node index.js -s AAPL --json
# Pipe to file
node index.js --json > latest_news.json
```

---

## ⚙️ Command Line Options

| Option | Flag | Description | Default |
| :--- | :--- | :--- | :--- |
| `--country <us\|ca>` | `-c` | Country market to fetch news for (`us` or `ca`) | `us` |
| `--search <query>` | `-s` | Ticker symbol or topic phrase (retrieves today's news) | None |
| `--limit <number>` | `-l` | Maximum number of news stories to display | `6` |
| `--interactive` | `-i` | Prompts you to pick an article to open in browser | `false` |
| `--json` | `-j` | Output results in JSON format to stdout | `false` |
| `--version` | `-V` | Output version number | `1.0.0` |
| `--help` | `-h` | Display help and usage guide | `false` |

---

## 🧪 Running Tests

The application includes unit and integration tests using Node.js's built-in test runner (`node:test` and `node:assert`).

Run all tests:
```bash
npm test
```

### Test Coverage Breakdown:
- **`tests/news.test.js`**: Google RSS URL generation, title & publisher parsing, `isToday` calendar matching (local/UTC), and today-only ticker filtering.
- **`tests/display.test.js`**: Relative time formatting, text wrapping, top-to-bottom chronological sort enforcement, alternating Cyan/Yellow color schemes, and JSON output formatting.
- **`tests/cli.test.js`**: Integration tests verifying `--help`, `--version`, argument error handling, and subprocess execution.
