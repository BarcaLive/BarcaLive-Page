
import { getTeamCrestUrl, getTeamLogoUrl, getCompetitionLogoUrl, getChannelLogoUrl } from '../assets/js/core/assets.js';
import assert from 'node:assert';

console.log('--- Testing Correctness ---');

// 1. Basic URL Generation
const url1 = getTeamCrestUrl(2017);
console.log('URL 1:', url1);
assert.ok(url1.includes('2017.webp'), 'URL should contain team ID');
assert.ok(url1.includes('width=96'), 'URL should contain width param');

// 2. Cache Hit Verification
const url2 = getTeamCrestUrl(2017);
assert.strictEqual(url1, url2, 'Repeated call should return identical string reference (or at least same value)');

// 3. Different Inputs
const url3 = getTeamCrestUrl(9999);
console.log('URL 3:', url3);
assert.notStrictEqual(url1, url3, 'Different team IDs should produce different URLs');
assert.ok(url3.includes('9999.webp'), 'URL should contain new team ID');

// 4. Competition Logo
const comp1 = getCompetitionLogoUrl('La Liga', 'dark');
const comp2 = getCompetitionLogoUrl('La Liga', 'dark');
const comp3 = getCompetitionLogoUrl('La Liga', 'light');

console.log('Comp 1:', comp1);
assert.strictEqual(comp1, comp2, 'Repeated competition call should match');
assert.notStrictEqual(comp1, comp3, 'Different theme should produce different URL');
assert.ok(comp1.includes('pd-dark.webp'), 'Dark theme URL correct');
assert.ok(comp3.includes('pd-light.webp'), 'Light theme URL correct');

// 5. Channel Logo
const chan1 = getChannelLogoUrl('Canal+ Sport');
const chan2 = getChannelLogoUrl('Canal+ Sport');
console.log('Channel 1:', chan1);
assert.strictEqual(chan1, chan2, 'Repeated channel call should match');
assert.ok(chan1.includes('canal-plus-sport-pl.webp'), 'Channel mapping correct');

// 6. Edge Cases
const emptyCrest = getTeamCrestUrl(null);
console.log('Empty Crest:', emptyCrest);
assert.strictEqual(emptyCrest, '', 'Null team ID should return empty string');

const emptyComp = getCompetitionLogoUrl(null);
assert.strictEqual(emptyComp, '', 'Null competition should return empty string');

console.log('✅ All tests passed!');
