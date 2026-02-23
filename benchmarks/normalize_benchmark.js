import { performance } from 'perf_hooks';

// Mock data generator
function generateRawData(count) {
    const statuses = ['SCHEDULED', 'TIMED', 'POSTPONED', 'FINISHED', 'IN_PLAY', 'PAUSED', 'HALFTIME'];
    const matches = [];
    for (let i = 0; i < count; i++) {
        matches.push({
            id: i,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            homeTeam: { name: 'Home Team ' + i },
            awayTeam: { name: 'Away Team ' + i },
            utcDate: new Date().toISOString()
        });
    }
    return { matches };
}

// Mock dependencies
const normalizeMatch = (raw) => {
    // Simplified version of the actual function for benchmarking overhead
    if (!raw) return null;
    return {
        id: raw.id,
        status: raw.status,
        startTime: raw.utcDate
    };
};

// Original implementation
function originalNormalize(raw) {
    const data = { matches: {} };
    if (raw.matches && Array.isArray(raw.matches)) {
        // This is the problematic logic: map then filter 3 times
        const all = raw.matches.map(normalizeMatch).filter(Boolean);

        data.matches.upcoming = all.filter(m => ['SCHEDULED', 'TIMED', 'POSTPONED'].includes(m.status));
        data.matches.finished = all.filter(m => m.status === 'FINISHED');
        data.matches.live = all.filter(m => ['IN_PLAY', 'PAUSED', 'HALFTIME', 'first_half', 'second_half', 'half_time'].includes(m.status) || (m.status === 'LIVE'));
    }
    return data;
}

// Optimized implementation
function optimizedNormalize(raw) {
    const data = { matches: {} };
    if (raw.matches && Array.isArray(raw.matches)) {
        data.matches.upcoming = [];
        data.matches.finished = [];
        data.matches.live = [];

        // Pre-allocate Sets for faster lookups
        const upcomingStatuses = new Set(['SCHEDULED', 'TIMED', 'POSTPONED']);
        const liveStatuses = new Set(['IN_PLAY', 'PAUSED', 'HALFTIME', 'first_half', 'second_half', 'half_time', 'LIVE']);

        // Single pass
        for (const rawMatch of raw.matches) {
            const m = normalizeMatch(rawMatch);
            if (!m) continue;

            if (m.status === 'FINISHED') {
                data.matches.finished.push(m);
            } else if (upcomingStatuses.has(m.status)) {
                data.matches.upcoming.push(m);
            } else if (liveStatuses.has(m.status)) {
                data.matches.live.push(m);
            }
        }
    }
    return data;
}

// Benchmark
const iterations = 1000;
const dataSize = 1000; // 1000 matches
const rawData = generateRawData(dataSize);

console.log(`\n--- BENCHMARK: Normalize Data | N = ${dataSize} matches ---`);

// Warmup
originalNormalize(rawData);
optimizedNormalize(rawData);

let totalOriginal = 0;
for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    originalNormalize(rawData);
    const end = performance.now();
    totalOriginal += (end - start);
}
const avgOriginal = totalOriginal / iterations;
console.log(`Original:  ${avgOriginal.toFixed(4)} ms`);

let totalOptimized = 0;
for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    optimizedNormalize(rawData);
    const end = performance.now();
    totalOptimized += (end - start);
}
const avgOptimized = totalOptimized / iterations;
console.log(`Optimized: ${avgOptimized.toFixed(4)} ms`);

const improvement = ((avgOriginal - avgOptimized) / avgOriginal) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}% speedup 🚀`);
