## 2024-05-18 - Caching Intl.DateTimeFormat
**Learning:** Instantiating `Intl.DateTimeFormat` is an expensive operation and can cause performance bottlenecks when formatting many dates in loops (like rendering lists of matches).
**Action:** Cache the `Intl.DateTimeFormat` instances (e.g., in a dictionary keyed by locale and options) and reuse them via their `.format()` method to significantly speed up date formatting operations.
