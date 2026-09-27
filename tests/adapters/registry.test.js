import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, cleanupDom } from '../helpers/dom.js';
import { readFileSync } from 'node:fs';
import { resolveAdapter } from '../../src/adapters/registry.js';

beforeEach(setupDom);
afterEach(cleanupDom);

test('every metadata match resolves an implemented adapter', async () => {
    const metadata = readFileSync('pressora.user.js', 'utf8');
    const matches = [...metadata.matchAll(/@match\s+(https:\/\/[^/]+)\//g)];
    assert.ok(matches.length > 0);
    for (const [, origin] of matches) {
        window.location = new URL(origin.replace('*.', 'www.'));
        assert.ok(await resolveAdapter(), `No adapter for ${origin}`);
    }
});
