import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ElementFixture, setupDom, cleanupDom } from '../helpers/dom.js';
import Medium from '../../src/adapters/medium.js';

beforeEach(setupDom);
afterEach(cleanupDom);

test('Medium preserves headline, story ID, text length, and first-link ranking', () => {
    window.location = new URL('https://medium.com/');
    const link = (href, textContent = '', heading = false) => ({
        href, textContent, querySelector: () => heading ? {} : null
    });
    const first = link('/author/short');
    const long = link('/author/long', 'A much longer headline with more than twenty characters');
    const story = link('/author/story-abcdef123456');
    const headline = link('/author/headline', '', true);
    for (const [links, expected] of [
        [[first, long, story, headline], headline],
        [[first, long, story], story],
        [[first, long], long],
        [[first], first]
    ]) {
        assert.equal(Medium.getCardUrl({ querySelectorAll: () => links }), expected.href);
    }
});

test('Medium prefers the heading parent as its page mount', async () => {
    const parent = new ElementFixture();
    const fallback = new ElementFixture();
    document.querySelector = (selector) => selector === Medium.selectors.heading ? { parentElement: parent } : fallback;
    assert.equal(await Medium.getPageMountPoint(), parent);
    assert.equal(parent.style.position, 'relative');
    assert.equal(fallback.style.position, undefined);
});
