import pc from 'picocolors';
import open from 'open';

/**
 * Opens an article in the default browser if the URL starts with https://.
 * Prints an error otherwise.
 * @param {object} article - Article item with link and title
 * @param {object} [options] - Injected handlers for open, log, and error
 * @returns {Promise<boolean>} - True if opened, false if rejected due to invalid/insecure URL
 */
export async function openArticle(article, {
  openFn = open,
  logFn = console.log,
  errorFn = console.error
} = {}) {
  const link = article?.link;

  if (typeof link !== 'string' || !link.startsWith('https://')) {
    errorFn(pc.red(`Error: Cannot open link "${link}". Only secure HTTPS links can be opened.`));
    return false;
  }

  logFn(pc.green(`Opening "${article.title || 'article'}" in browser...`));
  await openFn(link);
  return true;
}
