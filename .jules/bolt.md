## 2026-03-07 - [Direct ISO String Comparison vs Date parsing for Match Sorting]
**Learning:** Using map-sort-map with `new Date(m.startTime).getTime()` in JS is surprisingly slow compared to direct string comparison of ISO-8601 date strings.
**Action:** When sorting arrays of objects by ISO-8601 string dates (e.g. `startTime`, `utcDate`), use direct string comparison (e.g. `a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0`) rather than parsing them to Date objects or using Schwartzian transforms.
