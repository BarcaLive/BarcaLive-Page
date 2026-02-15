## 2024-05-22 -intl-datetimeformat-performance
**Learning:** Instantiating `Intl.DateTimeFormat` is extremely expensive (approx 0.44ms/call in V8). For applications with heavy date formatting (like schedules or calendars), this creates a significant bottleneck.
**Action:** Always cache `Intl.DateTimeFormat` instances by locale and options using a simple Map or memoization pattern. This simple change yielded a ~40x performance improvement (0.44ms -> 0.01ms).
