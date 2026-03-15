## 2024-05-20 - Caching Intl.DateTimeFormat

**Learning:** Instantiating `Intl.DateTimeFormat` (or relying on `toLocaleTimeString`/`toLocaleDateString` which instantiate it under the hood) is extremely expensive in tight loops, like rendering match schedules.

**Action:** Always cache and reuse `Intl.DateTimeFormat` instances (e.g., using a singleton or memoization keyed by locale and options) instead of creating them repeatedly.
