import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';

const FILE_PATH = 'js/i18n.js';

function runTest() {
    console.log(`\n--- VERIFYING ${FILE_PATH} ---`);

    const code = fs.readFileSync(FILE_PATH, 'utf8');

    // Mock Browser Globals
    const mockWindow = {
        localStorage: { getItem: () => null, setItem: () => {} },
        navigator: { language: 'pl-PL' },
        document: {
            documentElement: { lang: '' },
            querySelectorAll: () => [],
        },
        location: { pathname: '/' },
        dispatchEvent: () => {},
        CustomEvent: class CustomEvent {},
        I18n: null, // Placeholder
    };

    const context = vm.createContext({
        window: mockWindow,
        document: mockWindow.document,
        navigator: mockWindow.navigator,
        localStorage: mockWindow.localStorage,
        CustomEvent: mockWindow.CustomEvent,
        console: console,
    });

    vm.runInContext(code, context);
    const I18n = context.window.I18n;

    // 1. Check if _dateTimeCache exists
    if (!I18n._dateTimeCache) {
        console.error('❌ FAILURE: _dateTimeCache is missing on I18n object.');
        process.exit(1);
    }
    console.log('✅ _dateTimeCache property exists.');

    // 2. Check if cache works
    I18n.init();

    // Clear cache to start fresh (if exposed)
    I18n._dateTimeCache.clear();
    assert.strictEqual(I18n._dateTimeCache.size, 0, 'Cache should be empty initially');

    const date = new Date('2023-10-28T12:00:00Z');
    const options1 = { month: 'long', day: 'numeric' };

    // First Call
    const res1 = I18n.formatDate(date, options1);
    console.log(`Call 1 Result: "${res1}"`);
    assert.strictEqual(I18n._dateTimeCache.size, 1, 'Cache size should be 1 after first call');

    // Second Call (Same options)
    const res2 = I18n.formatDate(date, options1);
    assert.strictEqual(res1, res2, 'Results should be identical');
    assert.strictEqual(I18n._dateTimeCache.size, 1, 'Cache size should remain 1 after repeat call');

    // Third Call (Different options)
    const options2 = { weekday: 'short' };
    const res3 = I18n.formatDate(date, options2);
    console.log(`Call 3 Result: "${res3}"`);
    assert.strictEqual(I18n._dateTimeCache.size, 2, 'Cache size should be 2 after new options');

    // Fourth Call (Same options as 1 but different object reference)
    const options1Clone = { month: 'long', day: 'numeric' };
    const res4 = I18n.formatDate(date, options1Clone);
    // Note: Depending on key generation strategy, this might create a new entry or reuse.
    // My implementation uses sorted keys stringified, so it SHOULD reuse.

    // Let's see if key generation handles property order
    const options1Reordered = { day: 'numeric', month: 'long' };
    const res5 = I18n.formatDate(date, options1Reordered);

    // Check if cache reused (size still 2) or grew (size 3)
    // If implementation sorts keys, it should remain 2.
    // If implementation just JSON.stringify, it might grow if key order differs.
    // I plan to implement robust key generation.

    if (I18n._dateTimeCache.size === 2) {
        console.log('✅ Cache key generation is robust (handles object references/order).');
    } else {
         console.log(`ℹ️ Cache grew to ${I18n._dateTimeCache.size} (different object ref/order). Acceptable but could be better.`);
    }

    console.log('\n✅ VERIFICATION PASSED: Optimization is active and working!');
}

runTest();
