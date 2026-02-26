import { strict as assert } from 'node:assert';
import { getTeamCrestUrl, getChannelLogoUrl, getCompetitionLogoUrl } from '../assets/js/core/assets.js';

// Test Cases
const tests = [
  {
    fn: getTeamCrestUrl,
    args: [2017],
    expected: 'https://bwmkvehxzcdzdxiqdqin.supabase.co/storage/v1/object/public/logos/teams/2017.webp?width=96&height=96&quality=70&format=webp'
  },
  {
    fn: getChannelLogoUrl,
    args: ['Canal+ Sport'],
    expected: 'https://bwmkvehxzcdzdxiqdqin.supabase.co/storage/v1/object/public/logos/channel/canal-plus-sport-pl.webp?width=100&height=100&quality=70&format=webp'
  },
  {
    fn: getCompetitionLogoUrl,
    args: ['La Liga', 'dark'],
    expected: 'https://bwmkvehxzcdzdxiqdqin.supabase.co/storage/v1/object/public/logos/competition/pd-dark.webp?width=96&height=96&quality=70&format=webp'
  },
  {
    fn: getCompetitionLogoUrl,
    args: ['Champions League', 'light'],
    expected: 'https://bwmkvehxzcdzdxiqdqin.supabase.co/storage/v1/object/public/logos/competition/cl-light.webp?width=96&height=96&quality=70&format=webp'
  }
];

console.log('Running asset verification tests...');
let passed = 0;
for (const test of tests) {
  try {
    const result = test.fn(...test.args);
    assert.equal(result, test.expected);
    passed++;
  } catch (e) {
    console.error(`FAILED: ${test.fn.name}(${test.args.join(', ')})`);
    console.error(`Expected: ${test.expected}`);
    console.error(`Received: ${test.fn(...test.args)}`);
    process.exit(1);
  }
}

console.log(`PASSED: ${passed}/${tests.length}`);
