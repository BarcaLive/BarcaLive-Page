const { performance } = require('node:perf_hooks');

// Simulated query latency (e.g., 200ms)
const QUERY_LATENCY = 200;

// Mock Supabase Client
const mockSupabase = {
    from: (table) => ({
        select: (cols) => ({
            order: (col, opts) => new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        data: [{ id: 1, table }], // dummy data
                        error: null
                    });
                }, QUERY_LATENCY);
            })
        })
    })
};

async function runSequential() {
    const start = performance.now();

    // Mimic current code structure
    // 1. Fetch matches
    const { data: matchesData, error: matchesError } = await mockSupabase
        .from('barca_matches')
        .select('*')
        .order('utc_date', { ascending: true });

    // 2. Fetch standings
    const { data: standingsData, error: standingsError } = await mockSupabase
        .from('barca_standings')
        .select('*')
        .order('id', { ascending: false });

    const end = performance.now();
    return end - start;
}

async function runParallel() {
    const start = performance.now();

    // Mimic optimized code structure
    const [matchesResult, standingsResult] = await Promise.all([
        mockSupabase
            .from('barca_matches')
            .select('*')
            .order('utc_date', { ascending: true }),
        mockSupabase
            .from('barca_standings')
            .select('*')
            .order('id', { ascending: false })
    ]);

    const { data: matchesData, error: matchesError } = matchesResult;
    const { data: standingsData, error: standingsError } = standingsResult;

    const end = performance.now();
    return end - start;
}

(async () => {
    console.log(`Running benchmark with ${QUERY_LATENCY}ms simulated latency...`);

    console.log('--- Sequential ---');
    const seqTime = await runSequential();
    console.log(`Time: ${seqTime.toFixed(2)}ms`);

    console.log('--- Parallel ---');
    const parTime = await runParallel();
    console.log(`Time: ${parTime.toFixed(2)}ms`);

    const improvement = seqTime - parTime;
    const improvementPercent = (improvement / seqTime) * 100;

    console.log(`\nImprovement: ${improvement.toFixed(2)}ms (${improvementPercent.toFixed(1)}%)`);

    if (improvement > 0) {
        console.log('SUCCESS: Parallel execution is faster.');
    } else {
        console.error('FAILURE: Parallel execution is not faster.');
        process.exit(1);
    }
})();
