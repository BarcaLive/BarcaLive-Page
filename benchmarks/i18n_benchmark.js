import { performance } from 'perf_hooks';

const ITERATIONS = 10000;
const LOCALE = 'pl';
const OPTIONS = { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
const DATE = new Date();

// 1. Current Implementation (No Cache)
function formatNoCache(date, locale, options) {
    return new Intl.DateTimeFormat(locale, options).format(date);
}

// 2. Cached Implementation
const _cache = new Map();
function getFormatter(locale, options) {
    // Sort keys to ensure stable cache keys even if options order varies
    const key = `${locale}-${JSON.stringify(Object.entries(options).sort())}`;
    if (!_cache.has(key)) {
        _cache.set(key, new Intl.DateTimeFormat(locale, options));
    }
    return _cache.get(key);
}

function formatCached(date, locale, options) {
    return getFormatter(locale, options).format(date);
}

console.log(`\n--- BENCHMARK: Intl.DateTimeFormat Caching | N = ${ITERATIONS} ---`);

// Warmup
formatNoCache(DATE, LOCALE, OPTIONS);
formatCached(DATE, LOCALE, OPTIONS);

// Test No Cache
const startNoCache = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    formatNoCache(DATE, LOCALE, OPTIONS);
}
const endNoCache = performance.now();
const timeNoCache = endNoCache - startNoCache;
console.log(`No Cache: ${timeNoCache.toFixed(4)} ms`);

// Test Cached
const startCached = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    formatCached(DATE, LOCALE, OPTIONS);
}
const endCached = performance.now();
const timeCached = endCached - startCached;
console.log(`Cached:   ${timeCached.toFixed(4)} ms`);

// Results
const improvement = timeNoCache / timeCached;
console.log(`\nSpeedup: ${improvement.toFixed(2)}x 🚀`);
