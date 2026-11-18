/**
 * Seeded traces from four sample readers live in this library, which nobody can join. Each new
 * personal library gets a copy, so a fresh reader sees how other people's traces look.
 */
export const SAMPLE_LIBRARY_ID = "sample";
/** The seed writes sample dates relative to this moment; copies shift them to "now". */
export const SAMPLE_BASE_TIME = Date.parse("2026-10-01T09:00:00.000Z");
