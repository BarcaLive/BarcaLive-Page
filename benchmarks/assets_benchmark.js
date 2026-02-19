/**
 * Benchmark for getTeamCrestUrl performance.
 * Run with: node benchmarks/assets_benchmark.js
 */

import { getTeamCrestUrl } from '../assets/js/core/assets.js';

const ITERATIONS = 10000;
const TEAM_IDS = [2017, 100, 50, 2, 3, 4, 5, 6, 7, 8];

console.log('Running benchmark for getTeamCrestUrl...');
const start = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
  for (const id of TEAM_IDS) {
    getTeamCrestUrl(id);
  }
}

const end = performance.now();
const totalCalls = ITERATIONS * TEAM_IDS.length;
const totalTime = end - start;

console.log(`Total time for ${totalCalls} calls: ${totalTime.toFixed(2)}ms`);
console.log(`Average time per call: ${(totalTime / totalCalls).toFixed(6)}ms`);
