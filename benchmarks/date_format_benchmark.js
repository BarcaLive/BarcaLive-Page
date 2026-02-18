import { performance } from 'perf_hooks';

// Mock I18n structure for benchmark
const I18n = {
    currentLang: 'en',
    _dateTimeCache: new Map(),

    // Current implementation (simplified)
    formatDateNaive(date, options = {}) {
        return new Intl.DateTimeFormat(this.currentLang, options).format(date);
    },

    // Optimized implementation with caching
    formatDateCached(date, options = {}) {
        const key = `${this.currentLang}-${JSON.stringify(options)}`;
        let formatter = this._dateTimeCache.get(key);
        if (!formatter) {
            formatter = new Intl.DateTimeFormat(this.currentLang, options);
            this._dateTimeCache.set(key, formatter);
        }
        return formatter.format(date);
    }
};

const iterations = 10000;
const date = new Date();
const options = { year: 'numeric', month: 'long', day: 'numeric' };

console.log(`\n--- BENCHMARK: Intl.DateTimeFormat (Cached vs Naive) | N = ${iterations} ops ---`);

// Warmup
I18n.formatDateNaive(date, options);
I18n.formatDateCached(date, options);

// Test Naive
let start = performance.now();
for (let i = 0; i < iterations; i++) {
    I18n.formatDateNaive(date, options);
}
let end = performance.now();
const naiveTime = end - start;
console.log(`Naive (New Instance): ${naiveTime.toFixed(4)} ms`);

// Test Cached
start = performance.now();
for (let i = 0; i < iterations; i++) {
    I18n.formatDateCached(date, options);
}
end = performance.now();
const cachedTime = end - start;
console.log(`Cached (Reused):      ${cachedTime.toFixed(4)} ms`);

// Correctness Check
const resNaive = I18n.formatDateNaive(date, options);
const resCached = I18n.formatDateCached(date, options);
const isCorrect = resNaive === resCached;

console.log(`\nCorrectness Verified: ${isCorrect ? 'YES ✅' : 'NO ❌'}`);

if (isCorrect) {
    const improvement = ((naiveTime - cachedTime) / naiveTime) * 100;
    console.log(`\nPerformance Improvement: ${improvement.toFixed(2)}% speedup 🚀`);
    console.log(`Speedup Factor: ${(naiveTime / cachedTime).toFixed(2)}x`);
} else {
    console.error('ERROR: Results differ!');
}
