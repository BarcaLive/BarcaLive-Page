
## 2024-05-19 - Intl.DateTimeFormat Instantiation Overhead
**Learning:** Instantiating `Intl.DateTimeFormat` dynamically within utility functions like `formatDate` introduces significant overhead (e.g., ~3600ms for 10k loops).
**Action:** Always cache `Intl.DateTimeFormat` objects. A simple dictionary using locale and stringified options as the cache key reduced execution time by ~98% (down to ~65ms).
