import { normalizeData } from '../assets/js/core/normalize.js';

const mockData = {
    matches: [
        { id: 1, status: 'SCHEDULED' },
        { id: 2, status: 'TIMED' },
        { id: 3, status: 'POSTPONED' },
        { id: 4, status: 'FINISHED' },
        { id: 5, status: 'IN_PLAY' },
        { id: 6, status: 'PAUSED' },
        { id: 7, status: 'HALFTIME' },
        { id: 8, status: 'first_half' },
        { id: 9, status: 'second_half' },
        { id: 10, status: 'half_time' },
        { id: 11, status: 'LIVE' },
        { id: 12, status: 'UNKNOWN' }
    ]
};

const result = normalizeData(mockData);

let failed = false;

if (result.matches.upcoming.length !== 3) {
    console.error(`Expected 3 upcoming matches, got ${result.matches.upcoming.length}`);
    failed = true;
}

if (result.matches.finished.length !== 1) {
    console.error(`Expected 1 finished match, got ${result.matches.finished.length}`);
    failed = true;
}

if (result.matches.live.length !== 7) {
    console.error(`Expected 7 live matches, got ${result.matches.live.length}`);
    failed = true;
}

if (!failed) {
    console.log('SUCCESS: Array filtering in normalizeData works correctly.');
} else {
    process.exit(1);
}
