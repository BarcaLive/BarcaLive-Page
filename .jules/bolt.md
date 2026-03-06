## 2025-03-06 - [Avoid new URL() instantiation inside tight render loops]
**Learning:** Instantiating `new URL(url)` repeatedly is computationally expensive. During performance profiling, we found that doing this repeatedly in `withSupabaseImageTransform` for images (like team crests and channel logos) caused significant CPU overhead.
**Action:** Always employ caching (e.g., using an in-memory `Map`) for string manipulations and URL generations that execute frequently (such as on every application render tick), mapping concatenated argument keys directly to the final resulting string.
