## 2024-05-24 - [Avoid Multi-Pass Array Filtering with `.includes`]
**Learning:** Performing multiple `.filter` passes over the same array to categorize items using `.includes` on small arrays creates redundant O(n) iteration overhead. Benchmarks show a ~60% performance improvement (from ~1068ms to ~436ms for 10M matches) when replacing this pattern with a single-pass loop and `Set.has()` for O(1) lookups.
**Action:** When categorizing an array into multiple buckets based on properties, iterate over the array exactly once. Use `Set` instead of `Array.includes` for faster property matching.
