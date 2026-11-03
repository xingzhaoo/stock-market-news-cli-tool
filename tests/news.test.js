import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFeedUrl, parseNewsItem, fetchStockNews, isToday } from '../src/news.js';

describe('news.js', () => {
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
    const fixedToday = new Date('2026-11-02T12:00:00Z');

    it('should return true for a date on the same day', () => {
      const sameDay = '2026-11-02T16:30:00Z';
      assert.equal(isToday(sameDay, fixedToday), true);
    });

    it('should return false for yesterday date', () => {
      const yesterday = '2026-11-01T23:59:00Z';
      assert.equal(isToday(yesterday, fixedToday), false);
    });

    it('should return false for older dates', () => {
      const oldDate = '2026-10-15T10:00:00Z';
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
  });

  describe('fetchStockNews', () => {
    const referenceDate = new Date('2026-11-02T14:00:00Z');

    const mockItems = [
      {
        title: 'Yesterday Article - Source A',
        link: 'https://example.com/1',
        pubDate: 'Sun, 01 Nov 2026 20:00:00 GMT',
        isoDate: '2026-11-01T20:00:00.000Z'
      },
      {
        title: 'Today Later Article - Source B',
        link: 'https://example.com/2',
        pubDate: 'Mon, 02 Nov 2026 13:00:00 GMT',
        isoDate: '2026-11-02T13:00:00.000Z'
      },
      {
        title: 'Today Morning Article - Source C',
        link: 'https://example.com/3',
        pubDate: 'Mon, 02 Nov 2026 09:00:00 GMT',
        isoDate: '2026-11-02T09:00:00.000Z'
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
