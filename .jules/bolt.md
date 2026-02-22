## 2024-05-22 - Intl.DateTimeFormat Instantiation Bottleneck
**Learning:** `Intl.DateTimeFormat` instantiation is extremely expensive in this environment. In tight render loops (like `renderScheduleList` or live tickers), re-instantiating it for every date caused a ~100x performance penalty.
**Action:** Always cache `Intl` instances (DateTimeFormat, NumberFormat, etc.) outside of render loops or use a memoized helper like `getDateTimeFormat`.
