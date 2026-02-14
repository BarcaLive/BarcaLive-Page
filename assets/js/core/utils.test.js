import test from 'node:test';
import assert from 'node:assert';

// Mock global objects needed for utils.js to load in Node.js
// We do this before dynamic import to ensure they are available during module evaluation
if (typeof global.window === 'undefined') {
  global.window = {
    I18n: null
  };
}
if (typeof global.document === 'undefined') {
  global.document = {
    getElementById: () => null
  };
}

const { formatMatchTime } = await import('./utils.js');

test('formatMatchTime - edge cases', async (t) => {
  await t.test('returns empty string for empty input', () => {
    assert.strictEqual(formatMatchTime(''), '');
    assert.strictEqual(formatMatchTime(null), '');
    assert.strictEqual(formatMatchTime(undefined), '');
  });

  await t.test('returns original string for invalid date', () => {
    const invalidDate = 'invalid-date';
    assert.strictEqual(formatMatchTime(invalidDate), invalidDate);
  });
});

test('formatMatchTime - live status logic', async (t) => {
  const now = new Date('2025-02-15T15:00:00Z');

  await t.test('returns formatted time for future matches', () => {
    const futureDate = '2025-02-15T16:00:00Z'; // 1 hour in future
    // To be timezone independent in tests, we should check the format HH:mm
    const result = formatMatchTime(futureDate, now);
    assert.match(result, /^\d{2}:\d{2}$/);

    const date = new Date(futureDate);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    assert.strictEqual(result, `${hours}:${minutes}`);
  });

  await t.test('returns 0\' for match just started', () => {
    const matchStart = '2025-02-15T15:00:00Z';
    assert.strictEqual(formatMatchTime(matchStart, now), "0'");
  });

  await t.test('returns 45\' for match 45 mins in', () => {
    const matchStart = '2025-02-15T14:15:00Z';
    assert.strictEqual(formatMatchTime(matchStart, now), "45'");
  });

  await t.test('returns HT for match 46 mins in', () => {
    const matchStart = '2025-02-15T14:14:00Z';
    assert.strictEqual(formatMatchTime(matchStart, now), "HT");
  });

  await t.test('returns HT for match 60 mins in', () => {
    const matchStart = '2025-02-15T14:00:00Z';
    assert.strictEqual(formatMatchTime(matchStart, now), "HT");
  });

  await t.test('returns 46\' for match 61 mins in (second half starts)', () => {
    const matchStart = '2025-02-15T13:59:00Z';
    assert.strictEqual(formatMatchTime(matchStart, now), "46'");
  });

  await t.test('returns 120\' for match 135 mins in', () => {
    const matchStart = '2025-02-15T12:45:00Z';
    assert.strictEqual(formatMatchTime(matchStart, now), "120'");
  });

  await t.test('returns formatted time for finished matches (> 135 mins ago)', () => {
    const matchStart = '2025-02-15T12:44:00Z'; // 136 mins ago
    const result = formatMatchTime(matchStart, now);
    assert.match(result, /^\d{2}:\d{2}$/);
  });
});
