// ─────────────────────────────────────────────────────────────────────────
// BUILD MIND — completion source of truth + eligibility check
// src/lib/certificateEligibility.ts
//
// The canonical 21 lessons (the phantom "2-5" from the content generator is
// intentionally excluded — it is not a real, completable lesson).
//
// Activities are NOT hardcoded: we read the live id list from the `activities`
// table so adding an activity later automatically tightens the gate.
//
// Eligibility is computed from the real completion arrays, never from the
// derived `user_progress` percentage.
// ─────────────────────────────────────────────────────────────────────────

export const ALL_LESSON_IDS: string[] = [
  '1-1', '1-2', '1-3', '1-4',
  '2-1', '2-2', '2-3', '2-4',
  '3-1', '3-2', '3-3', '3-4',
  '4-1', '4-2', '4-3', '4-4',
  '5-1', '5-2', '5-3', '5-4', '5-5',
];

export type EligibilityResult = {
  eligible: boolean;
  missingLessons: string[];
  missingActivities: string[];
  totalLessons: number;
  totalActivities: number;
  doneLessons: number;
  doneActivities: number;
};

/**
 * Pure check: given the user's completed arrays and the full activity-id set,
 * decide eligibility. Kept pure so it is trivially testable and reused on
 * both server checks.
 */
export function computeEligibility(
  completedLessons: string[],
  completedActivities: string[],
  allActivityIds: string[],
): EligibilityResult {
  const lessonSet = new Set(completedLessons ?? []);
  const activitySet = new Set(completedActivities ?? []);

  const missingLessons = ALL_LESSON_IDS.filter((id) => !lessonSet.has(id));
  const missingActivities = allActivityIds.filter((id) => !activitySet.has(id));

  return {
    eligible: missingLessons.length === 0 && missingActivities.length === 0,
    missingLessons,
    missingActivities,
    totalLessons: ALL_LESSON_IDS.length,
    totalActivities: allActivityIds.length,
    doneLessons: ALL_LESSON_IDS.length - missingLessons.length,
    doneActivities: allActivityIds.length - missingActivities.length,
  };
}

/** Build a branded, readable certificate code from a UUID. e.g. MBM-7F3A2C */
export function makeCertificateCode(uuid: string): string {
  const hex = uuid.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `MBM-${hex}`;
}