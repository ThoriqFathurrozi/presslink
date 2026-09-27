import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ElementFixture, setupDom, cleanupDom } from '../helpers/dom.js';
import { siteCases } from '../helpers/adapters.js';

beforeEach(setupDom);
afterEach(cleanupDom);

for (const { adapter, domain, zIndex } of siteCases) {
    test(`${adapter.name}: site matching preserves domains, subdomains, and metadata fallback`, async () => {
        let metadataQueries = 0;
        document.querySelector = () => { metadataQueries += 1; return null; };
        for (const host of [domain, `www.${domain}`, `publication.${domain}`]) {
            window.location = new URL(`https://${host}/`);
            assert.equal(await adapter.match(), true);
        }
        assert.equal(metadataQueries, 0, 'Domain matches must skip metadata lookup');
        document.querySelector = () => null;
        for (const host of [`not${domain}`, `${domain}.example.org`]) {
            window.location = new URL(`https://${host}/`);
            assert.equal(await adapter.match(), false);
        }
        document.querySelector = (selector) => selector === adapter.selectors.siteIdentifier ? {} : null;
        assert.equal(await adapter.match(), true);
    });

    test(`${adapter.name}: launcher options preserve classes, placement styles, and stacking order`, () => {
        for (const pageType of ['card', 'page']) {
            assert.deepEqual(adapter.getLauncherOptions({ pageType }), {
                className: `pressora-${adapter.name}-launcher pressora-${adapter.name}-launcher--${pageType}`,
                style: zIndex === undefined ? pageType : { name: pageType, zIndex }
            });
        }
    });
}

for (const { adapter } of siteCases) {
    test(`${adapter.name}: URL normalization preserves queries and invalid input while removing fragments`, () => {
        window.location = new URL('https://example.com/section/current');
        assert.equal(adapter.normalizeUrl('../article?source=feed#heading'), 'https://example.com/article?source=feed');
        assert.equal(adapter.normalizeUrl('https://other.example/story?q=1#part'), 'https://other.example/story?q=1');
        assert.equal(adapter.normalizeUrl('http://['), 'http://[');
        assert.equal(adapter.normalizeUrl(''), 'https://example.com/section/current');
    });

    test(`${adapter.name}: mount preparation preserves the selected element and unrelated styles`, async () => {
        const card = new ElementFixture();
        card.style = { position: 'absolute', color: 'red' };
        assert.equal(adapter.getCardMountPoint(card), card);
        assert.deepEqual(card.style, { position: 'relative', color: 'red' });
        document.querySelector = () => null;
        assert.equal(await adapter.getPageMountPoint(), null);
        document.querySelector = (selector) => selector === adapter.selectors.pageMount ? card : null;
        assert.equal(await adapter.getPageMountPoint(), card);
        assert.equal(card.style.position, 'relative');
    });
}
