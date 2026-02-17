import { performance } from 'perf_hooks';

// Mock window and I18n for the benchmark since we are running in Node
const window = {
    I18n: null
};

// Simplified version of the I18n object from js/i18n.js to test logic
const I18n = {
    currentLang: 'pl',
    t: (key) => key,

    // Original implementation (simulated)
    formatDateOriginal(dateStr, options = {}) {
        if (!dateStr) return 'TBD';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        // Relative date logic (simplified for benchmark)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

        let relative = "";
        if (diffDays === 0) relative = "Today";

        // THE EXPENSIVE PART: creating new Intl.DateTimeFormat
        const formattedDate = new Intl.DateTimeFormat(this.currentLang, options).format(date);

        if (relative) {
            return `${relative}, ${formattedDate}`;
        }
        return formattedDate;
    },

    // Cached implementation
    _dateTimeFormatCache: new Map(),

    // Helper to get key
    _getCacheKey(lang, options) {
        // Fast key generation for common options
        // Using JSON.stringify is safe but can be slow, however it is much faster than Intl constructor
        return `${lang}:${JSON.stringify(options)}`;
    },

    formatDateCached(dateStr, options = {}) {
        if (!dateStr) return 'TBD';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        // Relative date logic (simplified)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

        let relative = "";
        if (diffDays === 0) relative = "Today";

        // THE OPTIMIZATION: Caching Intl.DateTimeFormat
        const key = this._getCacheKey(this.currentLang, options);
        let formatter = this._dateTimeFormatCache.get(key);
        if (!formatter) {
            formatter = new Intl.DateTimeFormat(this.currentLang, options);
            this._dateTimeFormatCache.set(key, formatter);
        }

        const formattedDate = formatter.format(date);

        if (relative) {
            return `${relative}, ${formattedDate}`;
        }
        return formattedDate;
    }
};

// --- Benchmark Runner ---

const iterations = 5;
const count = 10000;
const dates = [];
const baseTime = new Date().getTime();

// Generate test dates
for (let i = 0; i < count; i++) {
    dates.push(new Date(baseTime + i * 86400000).toISOString());
}

const options = { weekday: 'long', month: 'short', day: 'numeric' };

console.log(`\n--- BENCHMARK: Date Formatting | N = ${count} items ---`);

// Warmup
for (let i = 0; i < 100; i++) {
    I18n.formatDateOriginal(dates[i], options);
    I18n.formatDateCached(dates[i], options);
}

// Test Original
let totalOriginal = 0;
for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    for (const d of dates) {
        I18n.formatDateOriginal(d, options);
    }
    const end = performance.now();
    totalOriginal += (end - start);
}
const avgOriginal = totalOriginal / iterations;
console.log(`Original (New Instance): ${avgOriginal.toFixed(4)} ms (avg of ${iterations} runs)`);

// Test Cached
let totalCached = 0;
for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    for (const d of dates) {
        I18n.formatDateCached(d, options);
    }
    const end = performance.now();
    totalCached += (end - start);
}
const avgCached = totalCached / iterations;
console.log(`Cached (Reuse Instance): ${avgCached.toFixed(4)} ms (avg of ${iterations} runs)`);

// Correctness Check
const resOriginal = I18n.formatDateOriginal(dates[0], options);
const resCached = I18n.formatDateCached(dates[0], options);
const isCorrect = resOriginal === resCached;

console.log(`\nCorrectness Verified: ${isCorrect ? 'YES ✅' : 'NO ❌'} (${resOriginal})`);

if (isCorrect) {
    const improvement = ((avgOriginal - avgCached) / avgOriginal) * 100;
    const speedup = avgOriginal / avgCached;
    console.log(`\nPerformance Improvement: ${improvement.toFixed(2)}% speedup 🚀 (${speedup.toFixed(1)}x faster)`);
} else {
    console.error('ERROR: Results differ!');
}
