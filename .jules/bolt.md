## 2024-03-21 - String Comparison for ISO 8601 Date Sorting
**Learning:** In V8, sorting ISO 8601 date strings via direct string comparison (`a < b ? -1 : a > b ? 1 : 0`) is significantly faster (~36% faster, ~90% faster vs naive Date parsing) and uses less memory than the Schwartzian transform (`map-sort-map` with `new Date(d).getTime()`) for large arrays.
**Action:** Use direct string comparison for array sorting when sorting valid ISO 8601 date strings.
