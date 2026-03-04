## 2024-XX-XX - [URL parsing bottleneck in image transforms]
**Learning:** `new URL()` and `URLSearchParams` instantiation is computationally expensive when repeated for many logos and images during rendering cycles. Memory suggests an in-memory caching layer was implemented, but the current `assets/js/core/assets.js` file is missing it.
**Action:** Re-introduce the `Map` based string-concatenated caching strategy for `withSupabaseImageTransform` in `assets/js/core/assets.js` to avoid redundant allocations.

## 2024-XX-XX - [Date parsing in utils]
**Learning:** `new Date(isoString)` in `formatMatchTime` (which is potentially called frequently) is less efficient than using `Date.parse(isoString)` to get the timestamp for duration math before allocating a `Date` object only if string formatting is needed.
**Action:** Optimize `formatMatchTime` in `assets/js/core/utils.js` to avoid `new Date` if we only need to calculate time difference.
