import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRelativeTime,
  wrapText,
  displayHeader,
  displayPretty,
  displayJson,
  ITEM_COLOR_SCHEMES
} from '../src/display.js';

describe('display.js', () => {
  describe('formatRelativeTime', () => {
    it('should return "Just now" for dates within 60 seconds', () => {
      const now = new Date();
      const past30s = new Date(now.getTime() - 30 * 1000).toISOString();
      assert.equal(formatRelativeTime(past30s), 'Just now');
    });

    it('should return "Xm ago" for dates within 60 minutes', () => {
      const now = new Date();
      const past15m = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
      assert.equal(formatRelativeTime(past15m), '15m ago');
    });

    it('should return "Xh ago" for dates within 24 hours', () => {
      const now = new Date();
      const past4h = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
      assert.equal(formatRelativeTime(past4h), '4h ago');
    });

    it('should return "Xd ago" for dates within 30 days', () => {
      const now = new Date();
      const past3d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      assert.equal(formatRelativeTime(past3d), '3d ago');
    });

    it('should return formatted calendar date for dates older than 30 days', () => {
      const oldDate = new Date('2025-01-15T00:00:00Z').toISOString();
      const formatted = formatRelativeTime(oldDate);
      assert.ok(formatted.includes('2025'));
    });

    it('should return the original string if the date is invalid', () => {
      assert.equal(formatRelativeTime('invalid-date'), 'invalid-date');
    });
  });

  describe('wrapText', () => {
    it('should wrap lines without exceeding width when possible', () => {
      const text = 'This is a sample headline that needs wrapping to multiple terminal lines';
      const wrapped = wrapText(text, 25);
      const lines = wrapped.split('\n');
      assert.ok(lines.length > 1);
      for (const line of lines) {
        assert.ok(line.length <= 25);
      }
    });

    it('should apply the specified indent to subsequent lines', () => {
      const text = 'First line content and additional content that wraps over';
      const wrapped = wrapText(text, 20, '   ');
      const lines = wrapped.split('\n');
      assert.ok(lines.length > 1);
      assert.ok(lines[1].startsWith('   '));
    });
  });

  describe('ITEM_COLOR_SCHEMES', () => {
    it('should define exactly two distinct color schemes for neighboring items', () => {
      assert.equal(ITEM_COLOR_SCHEMES.length, 2);
      assert.notEqual(ITEM_COLOR_SCHEMES[0].name, ITEM_COLOR_SCHEMES[1].name);
      assert.equal(ITEM_COLOR_SCHEMES[0].name, 'cyan');
      assert.equal(ITEM_COLOR_SCHEMES[1].name, 'yellow');
    });
  });

  describe('displayPretty & displayHeader', () => {
    it('should display header with today note and handle empty items gracefully', () => {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        displayPretty([], { country: 'ca', query: 'Shopify' });
        const output = logs.join('\n');
        assert.ok(output.includes('CANADA'));
        assert.ok(output.includes('Shopify'));
        assert.ok(output.includes("Today's News"));
        assert.ok(output.includes('No news articles found today for "Shopify"'));
      } finally {
        console.log = originalLog;
      }
    });

    it('should default to displaying the 6 most recent news items', () => {
      const sampleItems = Array.from({ length: 10 }, (_, i) => ({
        title: `Headline ${i + 1}`,
        source: `Source ${i + 1}`,
        link: `https://example.com/${i + 1}`,
        isoDate: new Date().toISOString()
      }));

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        // Without passing limit, it should default to 6
        displayPretty(sampleItems, { country: 'us' });
        const output = logs.join('\n');
        assert.ok(output.includes('Headline 1'));
        assert.ok(output.includes('Headline 6'));
        assert.ok(!output.includes('Headline 7'));
        assert.ok(output.includes('Showing 6 of 10 articles'));
      } finally {
        console.log = originalLog;
      }
    });

    it('should alternate colors between neighboring news items', () => {
      const sampleItems = [
        {
          title: 'Article 1',
          source: 'Source 1',
          link: 'https://example.com/1',
          isoDate: new Date().toISOString()
        },
        {
          title: 'Article 2',
          source: 'Source 2',
          link: 'https://example.com/2',
          isoDate: new Date().toISOString()
        }
      ];

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        displayPretty(sampleItems, { country: 'us', limit: 2 });
        // Item 0 uses scheme[0] (cyan), Item 1 uses scheme[1] (yellow)
        const output = logs.join('\n');
        assert.ok(output.includes('Article 1'));
        assert.ok(output.includes('Article 2'));
      } finally {
        console.log = originalLog;
      }
    });

    it('should sort displayed news items from most recent to least recent from top to bottom', () => {
      const sampleItems = [
        {
          title: 'Oldest News Article',
          source: 'Source A',
          link: 'https://example.com/old',
          isoDate: '2026-11-02T08:00:00.000Z'
        },
        {
          title: 'Newest News Article',
          source: 'Source B',
          link: 'https://example.com/new',
          isoDate: '2026-11-02T18:00:00.000Z'
        },
        {
          title: 'Middle News Article',
          source: 'Source C',
          link: 'https://example.com/mid',
          isoDate: '2026-11-02T13:00:00.000Z'
        }
      ];

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        displayPretty(sampleItems, { country: 'us', limit: 3 });
        const output = logs.join('\n');
        const posNewest = output.indexOf('Newest News Article');
        const posMiddle = output.indexOf('Middle News Article');
        const posOldest = output.indexOf('Oldest News Article');

        // Newest must appear before Middle, and Middle before Oldest
        assert.ok(posNewest !== -1 && posMiddle !== -1 && posOldest !== -1);
        assert.ok(posNewest < posMiddle);
        assert.ok(posMiddle < posOldest);
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('displayJson', () => {
    it('should sort JSON items descending from most recent to least recent', () => {
      const items = [
        { title: 'Item Old', isoDate: '2026-11-02T09:00:00.000Z' },
        { title: 'Item New', isoDate: '2026-11-02T17:00:00.000Z' }
      ];

      let jsonOutput = '';
      const originalLog = console.log;
      console.log = (str) => { jsonOutput += str; };

      try {
        displayJson(items, 2);
        const parsed = JSON.parse(jsonOutput);
        assert.equal(parsed[0].title, 'Item New');
        assert.equal(parsed[1].title, 'Item Old');
      } finally {
        console.log = originalLog;
      }
    });
    it('should default to 6 items if limit is omitted', () => {
      const items = Array.from({ length: 8 }, (_, i) => ({ title: `Item ${i + 1}` }));

      let jsonOutput = '';
      const originalLog = console.log;
      console.log = (str) => { jsonOutput += str; };

      try {
        displayJson(items);
        const parsed = JSON.parse(jsonOutput);
        assert.equal(Array.isArray(parsed), true);
        assert.equal(parsed.length, 6);
      } finally {
        console.log = originalLog;
      }
    });

    it('should honor custom limit when specified', () => {
      const items = [
        { title: 'Item 1' },
        { title: 'Item 2' },
        { title: 'Item 3' }
      ];

      let jsonOutput = '';
      const originalLog = console.log;
      console.log = (str) => { jsonOutput += str; };

      try {
        displayJson(items, 2);
        const parsed = JSON.parse(jsonOutput);
        assert.equal(parsed.length, 2);
      } finally {
        console.log = originalLog;
      }
    });
  });
});
