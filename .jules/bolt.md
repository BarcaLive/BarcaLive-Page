## 2024-05-24 - Replace Date parsing with string comparison for ISO dates
**Learning:** ISO 8601 strings can be sorted lexicographically without parsing. Parsing them into `Date` objects inside a Schwartzian transform (`map-sort-map`) is significantly slower than direct string comparison due to object allocation and instantiation overhead.
**Action:** When sorting data by ISO 8601 date fields (like `startTime` or `utcDate`), always use direct string comparison instead of `new Date()`.
