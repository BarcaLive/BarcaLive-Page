import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock window and document
const windowMock = {
    localStorage: { getItem: () => null, setItem: () => {} },
    navigator: { language: 'en-US' },
    dispatchEvent: () => {},
    document: { documentElement: { lang: 'en' }, querySelectorAll: () => [] }
};
windowMock.window = windowMock; // circular reference often expected

const context = {
    window: windowMock,
    document: windowMock.document,
    navigator: windowMock.navigator,
    localStorage: windowMock.localStorage,
    console: console
};
vm.createContext(context);

// Load i18n.js
const i18nPath = path.join(__dirname, '../js/i18n.js');
const i18nCode = fs.readFileSync(i18nPath, 'utf8');

vm.runInContext(i18nCode, context);

const I18n = context.window.I18n;
I18n.init();

const iterations = 10000;
const dateStr = "2023-10-27T10:00:00Z";
const options = { weekday: 'short', month: 'short', day: 'numeric' };

console.log(`Benchmarking I18n.formatDate with ${iterations} iterations...`);

const start = performance.now();
for (let i = 0; i < iterations; i++) {
    I18n.formatDate(dateStr, options);
}
const end = performance.now();

console.log(`Total time: ${(end - start).toFixed(2)}ms`);
console.log(`Average time per call: ${((end - start) / iterations).toFixed(4)}ms`);
