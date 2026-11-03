process.env.TZ = 'America/Toronto';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFeedUrl, parseNewsItem, fetchStockNews, isToday } from '../src/news.js';

describe('news.js', () => {
  it('should have TZ environment variable set to America/Toronto', () => {
    assert.equal(process.env.TZ, 'America/Toronto');
  });
  describe('buildFeedUrl', () => {
    it('should build US feed URL with default query', () => {
      const url = buildFeedUrl('us');
      assert.ok(url.includes('news.google.com/rss/search'));
      assert.ok(url.includes('q=US%20stock%20market'));
      assert.ok(url.includes('hl=en-US'));
      assert.ok(url.includes('gl=US'));
      assert.ok(url.includes('ceid=US:en'));
    });

    it('should build Canada feed URL with default query', () => {
      const url = buildFeedUrl('ca');
      assert.ok(url.includes('q=Canada%20stock%20market'));
      assert.ok(url.includes('hl=en-CA'));
      assert.ok(url.includes('gl=CA'));
      assert.ok(url.includes('ceid=CA:en'));
    });

    it('should handle custom search query and trim spaces', () => {
      const url = buildFeedUrl('us', '  AAPL  ');
      assert.ok(url.includes('q=AAPL'));
      assert.ok(!url.includes('US%20stock%20market'));
    });

    it('should be case-insensitive for country code', () => {
      const urlUpper = buildFeedUrl('CA');
      assert.ok(urlUpper.includes('hl=en-CA'));
      assert.ok(urlUpper.includes('q=Canada%20stock%20market'));
    });
  });

  describe('isToday', () => {
    // Reference date: Nov 2, 2026 at 12:00 PM local time
    const fixedToday = new Date(2026, 10, 2, 12, 0, 0);

    it('should return true for a date on the same local day', () => {
      const sameDay = new Date(2026, 10, 2, 16, 30, 0);
      assert.equal(isToday(sameDay, fixedToday), true);
      assert.equal(isToday(sameDay.toISOString(), fixedToday), true);
    });

    it('should return false for yesterday date', () => {
      const yesterday = new Date(2026, 10, 1, 23, 59, 0);
      assert.equal(isToday(yesterday, fixedToday), false);
      assert.equal(isToday(yesterday.toISOString(), fixedToday), false);
    });

    it('should not count yesterday 9 PM local time (which is today 2 AM UTC in Toronto) as today when comparing local dates', () => {
      // Local reference time: Nov 2 at 9:00 AM
      const todayMorning = new Date(2026, 10, 2, 9, 0, 0);
      // Article from 9:00 PM yesterday local time (which is 2:00 AM UTC today in Toronto UTC-5)
      const yesterdayEvening = new Date(2026, 10, 1, 21, 0, 0);

      assert.equal(isToday(yesterdayEvening, todayMorning), false);
      assert.equal(isToday(yesterdayEvening.toISOString(), todayMorning), false);
    });

    it('should return false for older dates', () => {
      const oldDate = new Date(2026, 9, 15, 10, 0, 0);
      assert.equal(isToday(oldDate, fixedToday), false);
    });

    it('should return false for invalid date string', () => {
      assert.equal(isToday('not-a-date', fixedToday), false);
    });
  });

  describe('parseNewsItem', () => {
    it('should split title and source when dash separator is present', () => {
      const rawItem = {
        title: 'Tech Stocks Rally on Strong Earnings - Financial Post',
        link: 'https://news.google.com/sample-article',
        pubDate: 'Mon, 02 Nov 2026 12:00:00 GMT',
        guid: 'article-guid-1'
      };

      const parsed = parseNewsItem(rawItem);
      assert.equal(parsed.title, 'Tech Stocks Rally on Strong Earnings');
      assert.equal(parsed.source, 'Financial Post');
      assert.equal(parsed.link, rawItem.link);
      assert.equal(parsed.pubDate, rawItem.pubDate);
      assert.equal(parsed.isoDate, '2026-11-02T12:00:00.000Z');
      assert.equal(parsed.guid, 'article-guid-1');
    });

    it('should handle title with no dash separator and set Unknown Source', () => {
      const rawItem = {
        title: 'Market Overview for Monday',
        link: 'https://news.google.com/sample-2',
        pubDate: 'Mon, 02 Nov 2026 14:00:00 GMT'
      };

      const parsed = parseNewsItem(rawItem);
      assert.equal(parsed.title, 'Market Overview for Monday');
      assert.equal(parsed.source, 'Unknown Source');
      assert.equal(parsed.guid, rawItem.link);
    });

    it('should handle multiple dashes in title by splitting on the last one', () => {
      const rawItem = {
        title: 'Fed Rate Decision - Live Updates - Reuters',
        link: 'https://news.google.com/sample-3',
        pubDate: 'Mon, 02 Nov 2026 15:00:00 GMT'
      };

      const parsed = parseNewsItem(rawItem);
      assert.equal(parsed.title, 'Fed Rate Decision - Live Updates');
      assert.equal(parsed.source, 'Reuters');
    });

    it('should strip ANSI escape codes from title and source', () => {
      const rawItem = {
        title: '\x1b[31mHot Stock Surge\x1b[0m - \x1b[1m\x1b[34mFinancial Times\x1b[0m',
        link: 'https://news.google.com/sample-ansi',
        pubDate: 'Mon, 02 Nov 2026 12:00:00 GMT'
      };

      const parsed = parseNewsItem(rawItem);
      assert.equal(parsed.title, 'Hot Stock Surge');
      assert.equal(parsed.source, 'Financial Times');
    });

    it('should strip ASCII control characters (0x00-0x1F and 0x7F) from title and source', () => {
      const rawItem = {
        title: 'Market\x00 Watch\x07 Update\x1F - \x08Bloomberg\x7F',
        link: 'https://news.google.com/sample-control',
        pubDate: 'Mon, 02 Nov 2026 12:00:00 GMT'
      };

      const parsed = parseNewsItem(rawItem);
      assert.equal(parsed.title, 'Market Watch Update');
      assert.equal(parsed.source, 'Bloomberg');
    });

    it('should fallback to Unknown Source if source only consists of control characters', () => {
      const rawItem = {
        title: 'Clean Headline - \x1b[0m\x00\x07',
        link: 'https://news.google.com/sample-empty-source',
        pubDate: 'Mon, 02 Nov 2026 12:00:00 GMT'
      };

      const parsed = parseNewsItem(rawItem);
      assert.equal(parsed.title, 'Clean Headline');
      assert.equal(parsed.source, 'Unknown Source');
    });
  });

  describe('fetchStockNews', () => {
    const referenceDate = new Date(2026, 10, 2, 14, 0, 0);

    const mockItems = [
      {
        title: 'Yesterday Article - Source A',
        link: 'https://example.com/1',
        pubDate: 'Sun, 01 Nov 2026 20:00:00 GMT',
        isoDate: new Date(2026, 10, 1, 20, 0, 0).toISOString()
      },
      {
        title: 'Today Later Article - Source B',
        link: 'https://example.com/2',
        pubDate: 'Mon, 02 Nov 2026 13:00:00 GMT',
        isoDate: new Date(2026, 10, 2, 13, 0, 0).toISOString()
      },
      {
        title: 'Today Morning Article - Source C',
        link: 'https://example.com/3',
        pubDate: 'Mon, 02 Nov 2026 09:00:00 GMT',
        isoDate: new Date(2026, 10, 2, 9, 0, 0).toISOString()
      }
    ];

    it('should only retrieve today news when searching for a ticker', async () => {
      const mockParser = {
        parseURL: async () => ({ items: mockItems })
      };

      const results = await fetchStockNews({
        country: 'us',
        query: 'AAPL',
        customParser: mockParser,
        referenceDate
      });

      // Yesterday's article should be excluded
      assert.equal(results.length, 2);
      assert.equal(results[0].title, 'Today Later Article');
      assert.equal(results[1].title, 'Today Morning Article');
    });

    it('should sort articles descending from most recent to least recent', async () => {
      const mockParser = {
        parseURL: async () => ({ items: mockItems })
      };

      const results = await fetchStockNews({
        country: 'us',
        customParser: mockParser,
        todayOnly: false
      });

      assert.equal(results.length, 3);
      assert.equal(results[0].title, 'Today Later Article');
      assert.equal(results[1].title, 'Today Morning Article');
      assert.equal(results[2].title, 'Yesterday Article');
    });

    it('should return empty array if feed contains no items', async () => {
      const mockParser = {
        parseURL: async () => ({ items: [] })
      };

      const results = await fetchStockNews({ country: 'us', customParser: mockParser });
      assert.deepEqual(results, []);
    });

    it('should throw descriptive error when feed parsing fails', async () => {
      const mockParser = {
        parseURL: async () => {
          throw new Error('Network timeout');
        }
      };

      await assert.rejects(
        () => fetchStockNews({ country: 'us', customParser: mockParser }),
        /Failed to fetch or parse stock news from Google: Network timeout/
      );
    });
  });
});
