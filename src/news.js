import Parser from 'rss-parser';

const parser = new Parser();

/**
 * Builds the Google News RSS URL based on country and optional query.
 * @param {string} country - 'us' or 'ca'
 * @param {string} [query] - Optional stock symbol or search query
 * @returns {string}
 */
export function buildFeedUrl(country, query) {
  const c = country.toLowerCase();
  let hl = 'en-US';
  let gl = 'US';
  let ceid = 'US:en';

  if (c === 'ca') {
    hl = 'en-CA';
    gl = 'CA';
    ceid = 'CA:en';
  }

  let q = query ? query.trim() : '';
  if (!q) {
    q = c === 'ca' ? 'Canada stock market' : 'US stock market';
  }

  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

/**
 * Parses a feed item into a structured object.
 * @param {object} item - Parsed RSS item
 * @returns {object}
 */
export function parseNewsItem(item) {
  let title = item.title || '';
  let source = 'Unknown Source';

  // Google News titles are usually: "Headline text - Source Name"
  const lastDashIndex = title.lastIndexOf(' - ');
  if (lastDashIndex !== -1) {
    source = title.substring(lastDashIndex + 3).trim();
    title = title.substring(0, lastDashIndex).trim();
  }

  return {
    title,
    source,
    link: item.link,
    pubDate: item.pubDate,
    isoDate: item.isoDate || new Date(item.pubDate).toISOString(),
    guid: item.guid || item.link
  };
}

/**
 * Fetches and parses stock market news.
 * @param {object} options
 * @param {string} options.country - 'us' or 'ca'
 * @param {string} [options.query] - optional search/symbol query
 * @returns {Promise<Array<object>>}
 */
export async function fetchStockNews({ country, query }) {
  const url = buildFeedUrl(country, query);
  
  try {
    const feed = await parser.parseURL(url);
    if (!feed || !feed.items) {
      return [];
    }

    return feed.items.map(parseNewsItem);
  } catch (error) {
    throw new Error(`Failed to fetch or parse stock news from Google: ${error.message}`);
  }
}
