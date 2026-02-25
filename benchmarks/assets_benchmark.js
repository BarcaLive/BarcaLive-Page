import { performance } from 'node:perf_hooks';
import { getTeamCrestUrl, getChannelLogoUrl, getCompetitionLogoUrl } from '../assets/js/core/assets.js';

const ITERATIONS = 5000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

// Warmup
getTeamCrestUrl(2017);
getChannelLogoUrl("Canal+ Sport");
getCompetitionLogoUrl("La Liga");

const startCrest = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    getTeamCrestUrl(2017); // Repeated call
    getTeamCrestUrl(100 + (i % 20)); // Repeated set of IDs
}
const endCrest = performance.now();
console.log(`getTeamCrestUrl: ${(endCrest - startCrest).toFixed(2)}ms`);

const startChannel = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    getChannelLogoUrl("Canal+ Sport");
    getChannelLogoUrl("Eleven Sports");
}
const endChannel = performance.now();
console.log(`getChannelLogoUrl: ${(endChannel - startChannel).toFixed(2)}ms`);

const startComp = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    getCompetitionLogoUrl("La Liga");
    getCompetitionLogoUrl("Champions League");
}
const endComp = performance.now();
console.log(`getCompetitionLogoUrl: ${(endComp - startComp).toFixed(2)}ms`);
