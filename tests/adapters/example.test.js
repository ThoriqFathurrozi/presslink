import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ElementFixture, setupDom, cleanupDom } from '../helpers/dom.js';
import Example from '../../src/adapters/example.js';

beforeEach(setupDom);
afterEach(cleanupDom);

test('Example inherits the unchanged card mount without adding styles', () => {
    const card = new ElementFixture();
    assert.equal(Example.getCardMountPoint(card), card);
    assert.deepEqual(card.style, {});
});
