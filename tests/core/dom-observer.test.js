import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerCleanup, setupDom, cleanupDom } from '../helpers/dom.js';
import DomObserver from '../../src/core/DomObserver.js';

beforeEach(setupDom);
afterEach(cleanupDom);

test('DOM observer watches reused link attributes without observing its own markers', () => {
    let options;
    globalThis.MutationObserver = class {
        observe(target, config) { options = config; }
        disconnect() {}
    };
    const observer = new DomObserver({ onMutation() {}, logger: { debug() {} } });
    registerCleanup(() => observer.destroy());
    observer.start();
    assert.equal(options.attributes, true);
    assert.ok(options.attributeFilter.includes('href'));
    assert.ok(!options.attributeFilter.includes('data-page-breakdown-processed'));
    observer.destroy();
});
