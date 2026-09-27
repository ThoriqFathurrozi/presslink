import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ElementFixture, setupDom, cleanupDom } from '../helpers/dom.js';
import { setupEngine } from '../helpers/engine.js';
import { deferred } from '../helpers/async.js';

beforeEach(setupDom);
afterEach(cleanupDom);

test('rescans preserve one launcher and restore it after a card re-render', async () => {
    const { engine, card } = setupEngine();
    await engine.scan();
    const first = card.children[0];
    await engine.scan();
    assert.deepEqual(card.children, [first]);
    card.replaceChildren();
    await engine.scan();
    assert.equal(card.children.length, 1);
    assert.notEqual(card.children[0], first);
    assert.equal(engine.injectedLaunchers.size, 1);
    engine.destroy();
});

test('reused cards open their new URL and lose their launcher when ineligible', async () => {
    const { engine, card } = setupEngine();
    let clickedUrl;
    engine.openActions = ({ context }) => { clickedUrl = context.url; };
    await engine.scan();
    card.url = '/second';
    await engine.scan();
    assert.equal(card.children.length, 1);
    card.children[0].click();
    assert.equal(clickedUrl, 'https://www.nytimes.com/second');
    card.eligible = false;
    await engine.scan();
    assert.equal(card.children.length, 0);
    assert.equal(engine.processedCards.size, 0);
    engine.destroy();
});

test('detached cards and launchers are released on the next scan', async () => {
    const { engine, card } = setupEngine();
    await engine.scan();
    card.remove();
    await engine.scan();
    assert.equal(engine.processedCards.size, 0);
    assert.equal(engine.injectedLaunchers.size, 0);
    assert.equal(card.dataset.pageBreakdownProcessed, undefined);
    engine.destroy();
});

for (const stage of ['getCards', 'shouldProcessCard', 'getCardMountPoint', 'shouldProcessPage', 'getPageMountPoint']) {
    for (const cancel of ['destroy', 'navigate']) {
        test(`${cancel} prevents insertion while awaiting ${stage}`, async () => {
            const gate = deferred();
            const entered = deferred();
            const { engine, card, adapter } = setupEngine({
                isDetailPage: () => stage.includes('Page'),
                shouldProcessPage: () => true,
                getPageMountPoint: () => document.body
            });
            if (stage.includes('Page')) adapter.getCards = () => [];
            const original = adapter[stage];
            adapter[stage] = async (...args) => {
                entered.resolve();
                await gate.promise;
                return original(...args);
            };
            const pending = engine.scan();
            await entered.promise;
            if (cancel === 'destroy') engine.destroy();
            else engine.navigationObserver.onNavigate();
            gate.resolve();
            await pending;
            assert.equal(card.children.length, 0);
            assert.equal(engine.injectedLaunchers.size, 0);
            if (cancel === 'navigate') {
                await engine.scanner.runNow();
                assert.equal(engine.injectedLaunchers.size, 1, 'new navigation must still scan');
            }
            engine.destroy();
        });
    }
}

test('an old asynchronous action cannot close a newly opened menu', async () => {
    const gate = deferred();
    const { engine, card } = setupEngine();
    let execute;
    engine.actions = [{ key: 'ASYNC', execute: () => gate.promise }];
    engine.createActionItemComponent = ({ action, context, onExecute }) => {
        execute = () => onExecute(action, context);
        return new ElementFixture();
    };
    const first = card.appendChild(new ElementFixture());
    const second = card.appendChild(new ElementFixture());
    const context = { pageType: 'card', url: card.url };
    engine.openActions({ launcher: first, context });
    const pending = execute();
    engine.openActions({ launcher: second, context });
    const current = engine.activePopup;
    gate.resolve();
    await pending;
    assert.equal(engine.activePopup, current);
    assert.equal(current.element.isConnected, true);
    engine.destroy();
});
