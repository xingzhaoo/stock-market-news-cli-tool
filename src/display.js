import pc from 'picocolors';

/**
 * Formats a date string into a relative time (e.g. "2 hours ago")
 * @param {string} dateStr 
 * @returns {string}
 */
export function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  
  if (isNaN(diffMs)) {
    return dateStr;
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHr < 24) {
    return `${diffHr}h ago`;
  } else if (diffDay < 30) {
    return `${diffDay}d ago`;
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

/**
 * Wraps text to a maximum width, avoiding breaking words.
 * @param {string} text 
 * @param {number} width 
 * @param {string} [indent] 
 * @returns {string}
 */
export function wrapText(text, width, indent = '') {
  const words = text.split(/\s+/);
  let lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + (currentLine ? ' ' : '') + word).length > width) {
      if (currentLine) {
        lines.push(indent + currentLine);
      }
      currentLine = word;
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }
  if (currentLine) {
    lines.push(indent + currentLine);
  }

  return lines.join('\n');
}

/**
 * Display the header for the stock news CLI.
 * @param {string} country 
 * @param {string} [query] 
 */
export function displayHeader(country, query) {
  const title = `GOOGLE STOCK MARKET NEWS`;
  const location = country.toUpperCase() === 'CA' ? '🇨🇦 CANADA' : '🇺🇸 UNITED STATES';
  const subtitle = query ? `Search: "${query}"` : 'Latest General Market News';
  
  const width = Math.max(title.length, location.length + 3, subtitle.length) + 6;
  const border = '═'.repeat(width);

  console.log(pc.cyan(`╔${border}╗`));
  
  // Center helper
  const center = (text) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    const rightPad = Math.max(0, width - text.length - pad);
    return '║' + ' '.repeat(pad) + text + ' '.repeat(rightPad) + '║';
  };

  console.log(pc.cyan(center(pc.bold(pc.white(title)))));
  console.log(pc.cyan(center(pc.yellow(location))));
  console.log(pc.cyan(center(pc.dim(subtitle))));
  console.log(pc.cyan(`╚${border}╝`));
  console.log();
}

/**
 * Prints the list of news articles to the console.
 * @param {Array<object>} items 
 * @param {object} options 
 * @param {string} options.country 
 * @param {string} [options.query] 
 * @param {number} [options.limit] 
 */
export function displayPretty(items, { country, query, limit = 10 }) {
  displayHeader(country, query);

  if (items.length === 0) {
    console.log(pc.yellow('  No news articles found.'));
    console.log();
    return;
  }

  const articlesToPrint = items.slice(0, limit);
  const termWidth = process.stdout.columns || 80;
  const contentWidth = Math.max(40, termWidth - 8);

  articlesToPrint.forEach((item, index) => {
    const numStr = pc.bold(pc.green(`[${index + 1}]`));
    const relativeTime = formatRelativeTime(item.isoDate);
    const meta = `${pc.magenta(pc.bold(item.source))}  •  ${pc.yellow(relativeTime)}`;
    
    // Format title and handle wrapping
    const formattedTitle = pc.white(pc.bold(item.title));
    const titleLines = wrapText(formattedTitle, contentWidth, '     ');
    
    console.log(` ${numStr}  ${titleLines.trimStart()}`);
    console.log(`     ${meta}`);
    console.log(`     ${pc.cyan(item.link)}`);
    console.log(pc.dim('     ' + '─'.repeat(contentWidth)));
  });

  console.log(pc.dim(`  Showing ${articlesToPrint.length} of ${items.length} articles.`));
  console.log();
}

/**
 * Prints the news items as JSON to stdout.
 * @param {Array<object>} items 
 * @param {number} limit 
 */
export function displayJson(items, limit = 10) {
  const result = items.slice(0, limit);
  console.log(JSON.stringify(result, null, 2));
}
