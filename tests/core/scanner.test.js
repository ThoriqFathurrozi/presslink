import { test } from 'node:test';
import assert from 'node:assert/strict';
import Scanner from '../../src/core/Scanner.js';
import { deferred } from '../helpers/async.js';

test('continuous mutations do not postpone a scheduled scan', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let scans = 0;
    const scanner = new Scanner({ delay: 150, onScan: () => { scans += 1; } });
    t.after(() => scanner.destroy());
    scanner.schedule();
    for (let i = 0; i < 10; i += 1) {
        t.mock.timers.tick(20);
        scanner.schedule();
    }
    assert.equal(scans, 1);
    scanner.destroy();
    await Promise.resolve();
});

test('mutations during a scan cause one serialized follow-up', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const gate = deferred();
    let scans = 0;
    const scanner = new Scanner({ delay: 150, onScan: async () => {
        scans += 1;
        if (scans === 1) await gate.promise;
    } });
    t.after(() => scanner.destroy());
    const first = scanner.runNow();
    for (let i = 0; i < 10; i += 1) scanner.schedule();
    t.mock.timers.tick(500);
    assert.equal(scans, 1);
    gate.resolve();
    await first;
    t.mock.timers.tick(150);
    assert.equal(scans, 2);
    scanner.destroy();
    await Promise.resolve();
});
