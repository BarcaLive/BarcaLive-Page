
import { getTeamCrestUrl, getTeamLogoUrl, getCompetitionLogoUrl } from '../assets/js/core/assets.js';

// Benchmark function
function benchmark(name, fn, iterations = 100000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(i);
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(4)}ms for ${iterations} calls`);
}

console.log('--- Warming up ---');
getTeamCrestUrl(2017);
getTeamLogoUrl('https://example.com/logo.png');
getCompetitionLogoUrl('La Liga');

console.log('--- Benchmarking ---');

// Test Repeated identical inputs (simulating lists with repeated teams)
benchmark('getTeamCrestUrl (repeated 2017)', () => getTeamCrestUrl(2017));
benchmark('getTeamLogoUrl (repeated url)', () => getTeamLogoUrl('https://example.com/logo.png'));
benchmark('getCompetitionLogoUrl (repeated La Liga)', () => getCompetitionLogoUrl('La Liga'));

// Test varied inputs
benchmark('getTeamCrestUrl (varied)', (i) => getTeamCrestUrl(i));
