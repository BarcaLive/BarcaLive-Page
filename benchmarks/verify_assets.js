import { getTeamCrestUrl, getChannelLogoUrl, getCompetitionLogoUrl } from '../assets/js/core/assets.js';
import assert from 'node:assert';

console.log('Verifying assets output correctness...');

// 1. Verify getTeamCrestUrl
const crest1 = getTeamCrestUrl(2017);
assert.ok(crest1.includes('2017.webp'), 'Crest URL should contain ID');
assert.ok(crest1.includes('width=96'), 'Crest URL should have width param');

// Call again to hit cache
const crest2 = getTeamCrestUrl(2017);
assert.strictEqual(crest1, crest2, 'Cached crest URL should match first call');

const crestEmpty = getTeamCrestUrl(null);
assert.strictEqual(crestEmpty, '', 'Null ID should return empty string');

// 2. Verify getChannelLogoUrl
const channel1 = getChannelLogoUrl('Canal+ Sport');
assert.ok(channel1.includes('canal-plus-sport-pl.webp'), 'Channel URL should match map');
assert.ok(channel1.includes('width=100'), 'Channel URL should have width param');

// Call again to hit cache
const channel2 = getChannelLogoUrl('Canal+ Sport');
assert.strictEqual(channel1, channel2, 'Cached channel URL should match first call');

const channelUnknown = getChannelLogoUrl('Unknown Channel');
assert.strictEqual(channelUnknown, '', 'Unknown channel should return empty string');

// 3. Verify getCompetitionLogoUrl
const comp1 = getCompetitionLogoUrl('La Liga', 'dark');
assert.ok(comp1.includes('pd-dark.webp'), 'Competition URL should match map and theme');

const comp2 = getCompetitionLogoUrl('La Liga', 'light');
assert.ok(comp2.includes('pd-light.webp'), 'Competition URL should match map and theme');

// Call again to hit cache
const comp3 = getCompetitionLogoUrl('La Liga', 'dark');
assert.strictEqual(comp1, comp3, 'Cached competition URL should match first call');

// Fuzzy match
const compFuzzy = getCompetitionLogoUrl('Primera Division', 'dark');
assert.ok(compFuzzy.includes('pd-dark.webp'), 'Fuzzy match should work');

console.log('✅ All asset verification tests passed!');
