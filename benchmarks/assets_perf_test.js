import { getTeamCrestUrl, getChannelLogoUrl, getCompetitionLogoUrl } from '../assets/js/core/assets.js';
import { performance } from 'perf_hooks';

const ITERATIONS = 50000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

function benchmark(name, fn) {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        fn();
    }
    const end = performance.now();
    console.log(`${name}: ${(end - start).toFixed(4)}ms`);
}

// Benchmark getTeamCrestUrl
benchmark('getTeamCrestUrl', () => {
    getTeamCrestUrl(2017); // FC Barcelona ID
    getTeamCrestUrl(1234); // Random ID
});

// Benchmark getChannelLogoUrl
benchmark('getChannelLogoUrl', () => {
    getChannelLogoUrl('Canal+ Sport');
    getChannelLogoUrl('Unknown Channel');
});

// Benchmark getCompetitionLogoUrl
benchmark('getCompetitionLogoUrl', () => {
    getCompetitionLogoUrl('La Liga', 'dark');
    getCompetitionLogoUrl('Champions League', 'light');
});
