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
 * Checks if a given date represents "today" relative to a reference date.
 * Compares against local calendar day and UTC calendar day to handle timezone boundaries.
 * @param {string|Date} dateInput 
 * @param {Date} [referenceDate] 
 * @returns {boolean}
 */
export function isToday(dateInput, referenceDate = new Date()) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return false;
  }

  const isLocalSameDay = (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  );

  const isUtcSameDay = (
    date.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    date.getUTCMonth() === referenceDate.getUTCMonth() &&
    date.getUTCDate() === referenceDate.getUTCDate()
  );

  return isLocalSameDay || isUtcSameDay;
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

  let isoDate;
  if (item.isoDate) {
    isoDate = item.isoDate;
  } else if (item.pubDate) {
    const parsed = new Date(item.pubDate);
    isoDate = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  } else {
    isoDate = new Date().toISOString();
  }

  return {
    title,
    source,
    link: item.link,
    pubDate: item.pubDate,
    isoDate,
    guid: item.guid || item.link
  };
}

/**
 * Fetches and parses stock market news.
 * @param {object} options
 * @param {string} options.country - 'us' or 'ca'
 * @param {string} [options.query] - optional search/symbol query
 * @param {object} [options.customParser] - optional parser instance (useful for testing)
 * @param {boolean} [options.todayOnly] - whether to only return today's news (defaults to true if query is provided)
 * @param {Date} [options.referenceDate] - reference date for today filter (defaults to current date)
 * @returns {Promise<Array<object>>}
 */
export async function fetchStockNews({
  country,
  query,
  customParser = parser,
  todayOnly = Boolean(query),
  referenceDate = new Date()
}) {
  const url = buildFeedUrl(country, query);
  
  try {
    const feed = await customParser.parseURL(url);
    if (!feed || !feed.items) {
      return [];
    }

    let parsedItems = feed.items.map(parseNewsItem);

    // Filter to only today's news when searching for a ticker or when requested
    if (todayOnly) {
      parsedItems = parsedItems.filter((item) => isToday(item.isoDate, referenceDate));
    }

    // Sort descending by date (most recent first)
    return parsedItems.sort((a, b) => {
      const dateA = new Date(a.isoDate || a.pubDate).getTime() || 0;
      const dateB = new Date(b.isoDate || b.pubDate).getTime() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    throw new Error(`Failed to fetch or parse stock news from Google: ${error.message}`);
  }
}
