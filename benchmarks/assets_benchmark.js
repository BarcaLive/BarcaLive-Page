import { performance } from 'perf_hooks';
import { getTeamCrestUrl, getChannelLogoUrl, getCompetitionLogoUrl } from '../assets/js/core/assets.js';

const ITERATIONS = 5000;
const TEAMS = [2017, 81, 86, 78, 92, 559, 264, 94, 95, 77]; // Common La Liga IDs
const CHANNELS = ["Canal+ Sport", "Eleven Sports 1", "DAZN", "Polsat Sport Premium 1"];
const COMPS = ["La Liga", "Champions League", "Copa del Rey"];

console.log(`\n--- BENCHMARK: Asset URL Generation | ${ITERATIONS} iterations ---`);
console.log(`Items per iteration: ${TEAMS.length + CHANNELS.length + COMPS.length}`);

// Warmup
getTeamCrestUrl(2017);
getChannelLogoUrl("Canal+ Sport");
getCompetitionLogoUrl("La Liga");

// Capture baseline for correctness check
const baseline = {
    team: getTeamCrestUrl(2017),
    channel: getChannelLogoUrl("Canal+ Sport"),
    comp: getCompetitionLogoUrl("La Liga")
};

const start = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
    // Simulate rendering a match list with teams
    for (const id of TEAMS) {
        getTeamCrestUrl(id);
    }
    // Simulate rendering TV channels
    for (const ch of CHANNELS) {
        getChannelLogoUrl(ch);
    }
    // Simulate rendering competition logos
    for (const comp of COMPS) {
        getCompetitionLogoUrl(comp);
    }
}

const end = performance.now();
const totalOps = ITERATIONS * (TEAMS.length + CHANNELS.length + COMPS.length);
const duration = end - start;

console.log(`Total time:   ${duration.toFixed(2)} ms`);
console.log(`Ops/sec:      ${(totalOps / (duration / 1000)).toFixed(0)}`);
console.log(`Avg per op:   ${(duration / totalOps).toFixed(4)} ms`);

// Verify correctness
const current = {
    team: getTeamCrestUrl(2017),
    channel: getChannelLogoUrl("Canal+ Sport"),
    comp: getCompetitionLogoUrl("La Liga")
};

if (JSON.stringify(baseline) === JSON.stringify(current)) {
    console.log("Correctness:  PASS ✅");
} else {
    console.error("Correctness:  FAIL ❌");
    console.error("Expected:", baseline);
    console.error("Got:", current);
}
