import { getTeamCrestUrl, getChannelLogoUrl, getCompetitionLogoUrl } from '../assets/js/core/assets.js';

const ITERATIONS = 10000;

console.log(`Running ${ITERATIONS} iterations...`);

const start = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
  getTeamCrestUrl(2017);
  getChannelLogoUrl('Canal+ Sport');
  getCompetitionLogoUrl('La Liga');
  getTeamCrestUrl(100);
  getCompetitionLogoUrl('Champions League');
}

const end = performance.now();
console.log(`Total time: ${(end - start).toFixed(2)}ms`);
console.log(`Avg time per call (5 calls/iter): ${((end - start) / (ITERATIONS * 5)).toFixed(4)}ms`);
