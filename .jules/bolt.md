## 2026-03-11 - [Optimize Match Sorting]
**Learning:** For ISO 8601 date strings like `startTime` and `utcDate`, using a native string comparison is ~60% faster than parsing using `new Date().getTime()` through a Schwartzian transform (Map-Sort-Map).
**Action:** Always prefer native string comparison for ISO 8601 string-based dates to avoid the overhead of repeated `Date` object instantiations when sorting.
