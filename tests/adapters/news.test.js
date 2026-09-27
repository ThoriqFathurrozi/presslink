import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ElementFixture, setupDom, cleanupDom } from '../helpers/dom.js';
import { newsCases, articleCases } from '../helpers/adapters.js';

beforeEach(setupDom);
afterEach(cleanupDom);

for (const { adapter, article } of newsCases) {
    test(`${adapter.name}: excluded paths retain prefix matching even on dated article paths`, () => {
        for (const prefix of ['/about', '/account', '/subscription', '/lists']) {
            for (const suffix of ['/2026/09/23/story-2026-09-23/', 'more/2026/09/23/story-2026-09-23/']) {
                window.location = new URL(prefix + suffix, article);
                assert.equal(adapter.isDetailPage(), false);
            }
        }
    });
}

for (const { adapter, article: first, otherArticle: second } of newsCases) {
    test(`${adapter.name}: link selection keeps the first valid article regardless of headline length`, () => {
        window.location = new URL(first);
        const link = (href, textContent = '') => ({ href, textContent });
        const invalid = [link('http://['), link('/about'), link('javascript:alert(1)')];
        const links = [...invalid, link(first, 'A'), link(second, 'A much longer article headline that must not win')];
        assert.equal(adapter.getCardUrl({ querySelectorAll: () => links }), first);
        assert.equal(adapter.getCardUrl({ querySelectorAll: () => invalid }), null);
        assert.equal(adapter.getCardUrl({ querySelectorAll: () => [link(new URL(second).pathname)] }), new URL(second).pathname);
    });

    test(`${adapter.name}: page eligibility still requires an article path and heading`, async () => {
        window.location = new URL(first);
        document.querySelector = () => null;
        assert.equal(await adapter.shouldProcessPage(), false);
        document.querySelector = () => new ElementFixture();
        assert.equal(await adapter.shouldProcessPage(), true);
        window.location = new URL('/about', first);
        assert.equal(await adapter.shouldProcessPage(), false);
    });

    test(`${adapter.name}: card discovery preserves ordering and duplicates on index and detail pages`, async () => {
        const cards = [new ElementFixture(), new ElementFixture()];
        for (const card of cards) card.closest = () => null;
        document.querySelectorAll = () => [cards[0], null, cards[1], cards[0]].map((card) => ({ closest: () => card }));
        for (const url of [new URL('/', first), new URL(first)]) {
            window.location = url;
            assert.deepEqual(await adapter.getCards(), [cards[0], cards[1], cards[0]]);
        }
    });
}

for (const { adapter, article: current, otherArticle: other } of articleCases) {
    test(`${adapter.name}: distinct same-date articles remain eligible`, async () => {
        window.location = new URL(current);
        const card = (href) => ({ querySelectorAll: () => [{ href, textContent: 'Article headline' }] });
        assert.equal(await adapter.shouldProcessCard(card(other)), true);
        assert.equal(await adapter.shouldProcessCard(card(current + '?source=feed#section')), false);
        assert.equal(await adapter.shouldProcessCard(card(current.replace(/\/$/, '') + '/')), false);
        assert.equal(await adapter.shouldProcessCard({ querySelectorAll: () => [] }), false);
    });
}
