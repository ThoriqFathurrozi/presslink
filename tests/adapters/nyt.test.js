import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, cleanupDom } from '../helpers/dom.js';
import NYT from '../../src/adapters/nyt.js';

beforeEach(setupDom);
afterEach(cleanupDom);

test('NYT still excludes always-free packages', async () => {
    const free = { closest: () => ({ dataset: { pers: JSON.stringify({ surface: 'home-packages-always-free' }) } }) };
    const paid = { closest: () => null };
    document.querySelectorAll = () => [free, paid].map((card) => ({ closest: () => card }));
    assert.deepEqual(await NYT.getCards(), [paid]);
});
