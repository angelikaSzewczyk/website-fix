/**
 * Canonical model names for the whole codebase.
 *
 * Split strategy:
 *  SCAN    – Haiku 4.5  → bulk structural checks, summaries, diagnosis text
 *             Cost: ~$0.80/MTok in, $4.00/MTok out
 *
 *  EXPERT  – Sonnet 4.6 → final expert analysis, before/after code fixes,
 *             monthly report executive summaries, Slack AI suggestions
 *             Cost: ~$3.00/MTok in, $15.00/MTok out
 *
 * Rule of thumb: if the output goes directly to the end-user as a premium
 * feature or requires real reasoning, use EXPERT.  For everything else: SCAN.
 */
export const MODELS = {
  SCAN:   "claude-haiku-4-5-20251001",
  EXPERT: "claude-sonnet-4-6",
} as const;
