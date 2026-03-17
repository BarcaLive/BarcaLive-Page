const { performance } = require('perf_hooks');

// Helper to generate test data
function generateData(count) {
    const data = [];
    const baseDate = new Date().getTime();
    for (let i = 0; i < count; i++) {
        // Random date within +/- 30 days
        const date = new Date(baseDate + (Math.random() - 0.5) * 60 * 60 * 24 * 30 * 1000);
        data.push({
            id: i,
            utcDate: date.toISOString(),
            status: 'SCHEDULED'
        });
    }
    return data;
}

// 1. Naive Sort (Current Implementation)
function naiveSort(data) {
    return [...data].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
}

// 2. Optimized Sort (Schwartzian Transform / Map-Sort-Map)
function optimizedSort(data) {
    return data
        .map((item) => ({ item, time: new Date(item.utcDate).getTime() }))
        .sort((a, b) => a.time - b.time)
        .map(({ item }) => item);
}

// 3. Alternative Optimized Sort (Direct timestamp parsing if date string format is reliable ISO8601)
// ISO8601 strings sort naturally, but let's stick to numerical comparison for safety across environments
// If we trust ISO format:
function isoStringSort(data) {
    return [...data].sort((a, b) => (a.utcDate > b.utcDate ? 1 : -1));
}


// --- Benchmark Runner ---

const iterations = 5;
const dataSize = 10000;
const data = generateData(dataSize);

console.log(`\n--- BENCHMARK: Sort (Ascending) | N = ${dataSize} items ---`);

// Warmup
naiveSort(data.slice(0, 100));
optimizedSort(data.slice(0, 100));

// Test Naive
let totalNaive = 0;
for (let i = 0; i < iterations; i++) {
    const input = [...data]; // Copy to avoid side effects
    const start = performance.now();
    naiveSort(input);
    const end = performance.now();
    totalNaive += (end - start);
}
const avgNaive = totalNaive / iterations;
console.log(`Naive Sort:     ${avgNaive.toFixed(4)} ms (avg of ${iterations} runs)`);

// Test Optimized
let totalOpt = 0;
for (let i = 0; i < iterations; i++) {
    const input = [...data]; // Copy to avoid side effects
    const start = performance.now();
    optimizedSort(input);
    const end = performance.now();
    totalOpt += (end - start);
}
const avgOpt = totalOpt / iterations;
console.log(`Optimized Sort: ${avgOpt.toFixed(4)} ms (avg of ${iterations} runs)`);

// Correctness Check
const resNaive = naiveSort(data);
const resOpt = optimizedSort(data);
const isCorrect = JSON.stringify(resNaive) === JSON.stringify(resOpt);

console.log(`\nCorrectness Verified: ${isCorrect ? 'YES ✅' : 'NO ❌'}`);

if (isCorrect) {
    const improvement = ((avgNaive - avgOpt) / avgNaive) * 100;
    console.log(`\nPerformance Improvement: ${improvement.toFixed(2)}% speedup 🚀`);
} else {
    console.error('ERROR: Sort results differ!');
}
