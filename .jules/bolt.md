## 2025-02-18 - Intl.DateTimeFormat Caching
**Learning:** `Intl.DateTimeFormat` instantiation is expensive (~100x slower than reuse). In this codebase, `js/i18n.js` was creating a new instance for every date format call, which is frequent in list renders (schedule, matches).
**Action:** Always cache `Intl` instances (DateTimeFormat, NumberFormat) by locale+options key in `js/i18n.js` or similar utilities.
