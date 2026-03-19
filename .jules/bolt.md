
## 2024-05-24 - [Avoid Date Instantiation in Sorts]
**Learning:** Parsing ISO 8601 date strings into `Date` objects inside sorting callbacks (using the Schwartzian transform) creates massive allocation overhead. Direct lexicographical string comparison of ISO dates produces the exact same chronologically sorted output while avoiding thousands of `Date` allocations per render/request.
**Action:** When sorting arrays by ISO date strings (like `utcDate` or `startTime`), use direct string comparison (`a < b ? -1 : a > b ? 1 : 0`) instead of `.getTime()` on new `Date` objects.
