import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.resolve(__dirname, '../index.js');

describe('CLI Integration', () => {
  it('should print help message with --help', async () => {
    const { stdout } = await execFileAsync(process.execPath, [cliPath, '--help']);
    assert.ok(stdout.includes('google-stock-news'));
    assert.ok(stdout.includes('--country'));
    assert.ok(stdout.includes('--search'));
    assert.ok(stdout.includes('--limit'));
    assert.ok(stdout.includes('(default: 6)'));
  });

  it('should print version with --version', async () => {
    const { stdout } = await execFileAsync(process.execPath, [cliPath, '--version']);
    assert.equal(stdout.trim(), '1.0.0');
  });

  it('should exit with error on invalid country', async () => {
    try {
      await execFileAsync(process.execPath, [cliPath, '--country', 'uk']);
      assert.fail('CLI should have exited with error code 1');
    } catch (err) {
      assert.equal(err.code, 1);
      assert.ok(err.stderr.includes('Error: Invalid country "uk"'));
    }
  });

  it('should exit with error on invalid limit', async () => {
    try {
      await execFileAsync(process.execPath, [cliPath, '--limit', '0']);
      assert.fail('CLI should have exited with error code 1');
    } catch (err) {
      assert.equal(err.code, 1);
      assert.ok(err.stderr.includes('Error: Invalid limit "0"'));
    }
  });

  it('should handle fetch request or gracefully report network error', async () => {
    try {
      const { stdout } = await execFileAsync(process.execPath, [cliPath, '--json', '--limit', '1']);
      const parsed = JSON.parse(stdout);
      assert.ok(Array.isArray(parsed));
    } catch (err) {
      assert.equal(err.code, 1);
      assert.ok(err.stderr.includes('Error: Failed to fetch or parse stock news from Google'));
    }
  });

  it('should not contain unused open import in index.js', async () => {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile(cliPath, 'utf8');
    assert.equal(/import\s+open\s+from\s+['"]open['"]/.test(content), false);
  });
});
