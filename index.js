#!/usr/bin/env node

import { Command } from 'commander';
import pc from 'picocolors';
import prompts from 'prompts';
import open from 'open';

import { fetchStockNews } from './src/news.js';
import { displayPretty, displayJson } from './src/display.js';

const program = new Command();

program
  .name('google-stock-news')
  .description('Fetch the latest stock market news of US and Canada from Google News')
  .version('1.0.0')
  .option('-c, --country <type>', 'Country to fetch stock market news for: "us" or "ca"', 'us')
  .option('-s, --search <query>', 'Search term or stock ticker symbol (e.g. AAPL, TD)')
  .option('-l, --limit <number>', 'Number of news stories to display', (val) => parseInt(val, 10), 10)
  .option('-j, --json', 'Output results in JSON format')
  .option('-i, --interactive', 'Interactively select an article to open in your browser')
  .addHelpText('after', `
Examples:
  $ node index.js
  $ node index.js --country ca
  $ node index.js --search AAPL --limit 5
  $ node index.js -c ca -s "Royal Bank" -i
  $ node index.js --json > news.json
  `);

async function main() {
  try {
    program.parse(process.argv);
    const options = program.opts();

    const country = options.country.toLowerCase();
    if (country !== 'us' && country !== 'ca') {
      console.error(pc.red(`Error: Invalid country "${options.country}". Only "us" and "ca" are supported.`));
      process.exit(1);
    }

    if (isNaN(options.limit) || options.limit <= 0) {
      console.error(pc.red(`Error: Invalid limit "${options.limit}". Please specify a positive number.`));
      process.exit(1);
    }

    // Interactive or loading message (skipped if json output to keep stdout clean)
    if (!options.json) {
      console.log(pc.blue('⚡ Fetching stock news from Google News...'));
      console.log();
    }

    const news = await fetchStockNews({
      country,
      query: options.search
    });

    if (options.json) {
      displayJson(news, options.limit);
      return;
    }

    displayPretty(news, {
      country,
      query: options.search,
      limit: options.limit
    });

    // Handle interactive mode
    if (options.interactive && news.length > 0) {
      const articles = news.slice(0, options.limit);
      
      const response = await prompts({
        type: 'select',
        name: 'index',
        message: 'Select an article to open in your browser:',
        choices: [
          ...articles.map((item, idx) => ({
            title: `[${idx + 1}] ${item.title} (${item.source})`,
            value: idx
          })),
          { title: pc.red('Exit'), value: -1 }
        ]
      });

      if (response.index !== undefined && response.index !== -1) {
        const selected = articles[response.index];
        console.log(pc.green(`Opening "${selected.title}" in browser...`));
        await open(selected.link);
      }
    }

  } catch (error) {
    console.error(pc.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
}

main();
