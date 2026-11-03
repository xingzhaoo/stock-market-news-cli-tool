import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { openArticle } from '../src/interactive.js';

describe('interactive.js', () => {
  it('should call openFn when link starts with https://', async () => {
    let openedUrl = null;
    let loggedMsg = null;
    let errorMsg = null;

    const mockOpen = async (url) => {
      openedUrl = url;
    };
    const mockLog = (msg) => {
      loggedMsg = msg;
    };
    const mockError = (msg) => {
      errorMsg = msg;
    };

    const article = {
      title: 'Valid Article',
      link: 'https://news.google.com/articles/123'
    };

    const result = await openArticle(article, {
      openFn: mockOpen,
      logFn: mockLog,
      errorFn: mockError
    });

    assert.equal(result, true);
    assert.equal(openedUrl, 'https://news.google.com/articles/123');
    assert.ok(loggedMsg && loggedMsg.includes('Valid Article'));
    assert.equal(errorMsg, null);
  });

  it('should not call openFn and should print an error when link starts with http://', async () => {
    let openedUrl = null;
    let errorMsg = null;

    const mockOpen = async (url) => {
      openedUrl = url;
    };
    const mockError = (msg) => {
      errorMsg = msg;
    };

    const article = {
      title: 'Insecure Article',
      link: 'http://example.com/insecure'
    };

    const result = await openArticle(article, {
      openFn: mockOpen,
      errorFn: mockError
    });

    assert.equal(result, false);
    assert.equal(openedUrl, null);
    assert.ok(errorMsg && errorMsg.includes('Error:'));
    assert.ok(errorMsg.includes('http://example.com/insecure'));
  });

  it('should not call openFn and should print an error when link is javascript: or non-https', async () => {
    let openedUrl = null;
    let errorMsg = null;

    const mockOpen = async (url) => {
      openedUrl = url;
    };
    const mockError = (msg) => {
      errorMsg = msg;
    };

    const article = {
      title: 'Malicious Link',
      link: 'javascript:alert(1)'
    };

    const result = await openArticle(article, {
      openFn: mockOpen,
      errorFn: mockError
    });

    assert.equal(result, false);
    assert.equal(openedUrl, null);
    assert.ok(errorMsg && errorMsg.includes('Error:'));
  });

  it('should not call openFn and should print an error when link is missing or empty', async () => {
    let openedUrl = null;
    let errorMsg = null;

    const mockOpen = async (url) => {
      openedUrl = url;
    };
    const mockError = (msg) => {
      errorMsg = msg;
    };

    const result = await openArticle({ title: 'No link' }, {
      openFn: mockOpen,
      errorFn: mockError
    });

    assert.equal(result, false);
    assert.equal(openedUrl, null);
    assert.ok(errorMsg && errorMsg.includes('Error:'));
  });
});
