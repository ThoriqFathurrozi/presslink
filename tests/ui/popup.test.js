import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ElementFixture, registerCleanup, setupDom, cleanupDom } from '../helpers/dom.js';
import createPopup from '../../src/ui/createPopup.js';

beforeEach(setupDom);
afterEach(cleanupDom);

function key(popup, value) {
    const event = new Event('keydown', { cancelable: true });
    event.key = value;
    popup.element.dispatchEvent(event);
    return event;
}

test('menu focuses items, skips disabled actions, and restores focus on Escape', () => {
    const anchor = document.body.appendChild(new ElementFixture());
    const items = [new ElementFixture(), new ElementFixture(), new ElementFixture()];
    items[1].disabled = true;
    const popup = createPopup({ id: 'menu', anchor, items });
    registerCleanup(() => popup.unmount());
    popup.mount();
    assert.equal(document.activeElement, items[0]);
    assert.equal(anchor.getAttribute('aria-expanded'), 'true');
    key(popup, 'ArrowDown');
    assert.equal(document.activeElement, items[2]);
    key(popup, 'ArrowDown');
    assert.equal(document.activeElement, items[0]);
    key(popup, 'ArrowUp');
    assert.equal(document.activeElement, items[2]);
    key(popup, 'Home');
    assert.equal(document.activeElement, items[0]);
    key(popup, 'End');
    assert.equal(document.activeElement, items[2]);
    assert.equal(key(popup, 'Escape').defaultPrevented, true);
    assert.equal(popup.element.isConnected, false);
    assert.equal(document.activeElement, anchor);
    assert.equal(anchor.getAttribute('aria-expanded'), 'false');
    assert.equal(anchor.getAttribute('aria-controls'), null);
});

test('Tab closes the menu and allows normal tab navigation', () => {
    const anchor = document.body.appendChild(new ElementFixture());
    const popup = createPopup({ id: 'menu', anchor, items: [new ElementFixture()] });
    registerCleanup(() => popup.unmount());
    popup.mount();
    assert.equal(key(popup, 'Tab').defaultPrevented, false);
    assert.equal(document.activeElement, anchor);
    assert.equal(popup.element.isConnected, false);
});

test('outside clicks close the menu without taking focus from the clicked control', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const anchor = document.body.appendChild(new ElementFixture());
    const outside = document.body.appendChild(new ElementFixture());
    const popup = createPopup({ id: 'menu', anchor, items: [new ElementFixture()] });
    registerCleanup(() => popup.unmount());
    popup.mount();
    t.mock.timers.tick(1);
    outside.focus();
    const click = new Event('click');
    Object.defineProperty(click, 'target', { value: outside });
    document.dispatchEvent(click);
    assert.equal(popup.element.isConnected, false);
    assert.equal(document.activeElement, outside);
});
