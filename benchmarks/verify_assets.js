import { getTeamCrestUrl, getChannelLogoUrl, getCompetitionLogoUrl } from '../assets/js/core/assets.js';
import { strict as assert } from 'node:assert';

console.log('Running verification for assets caching...');

// 1. Verify getTeamCrestUrl
{
    const id = 2017;
    const url1 = getTeamCrestUrl(id);
    const url2 = getTeamCrestUrl(id);

    assert.ok(url1.includes('2017.webp'), 'URL should contain team ID');
    assert.strictEqual(url1, url2, 'Subsequent calls should return identical string');
    console.log('✅ getTeamCrestUrl passed');
}

// 2. Verify getChannelLogoUrl
{
    const channel = "Canal+ Sport";
    const url1 = getChannelLogoUrl(channel);
    const url2 = getChannelLogoUrl(channel);

    assert.ok(url1.includes('canal-plus-sport-pl.webp'), 'URL should contain correct filename');
    assert.strictEqual(url1, url2, 'Subsequent calls should return identical string');
    console.log('✅ getChannelLogoUrl passed');
}

// 3. Verify getCompetitionLogoUrl
{
    const comp = "La Liga";
    const url1 = getCompetitionLogoUrl(comp, 'dark');
    const url2 = getCompetitionLogoUrl(comp, 'dark');
    const url3 = getCompetitionLogoUrl(comp, 'light');

    assert.ok(url1.includes('pd-dark.webp'), 'URL should contain correct code and theme');
    assert.strictEqual(url1, url2, 'Subsequent calls should return identical string');
    assert.notStrictEqual(url1, url3, 'Different themes should return different URLs');
    console.log('✅ getCompetitionLogoUrl passed');
}

console.log('🎉 All verifications passed!');
