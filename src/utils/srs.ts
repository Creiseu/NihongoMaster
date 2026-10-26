/**
 * Spaced Repetition Algorithm (SuperMemo SM-2 adaptation)
 * for JLPT Japanese Kanji and Vocabulary learning.
 */

export type SRSGrade = 1 | 2 | 3 | 4 | 5;
// 1 = Again (complete blackout)
// 2 = Hard (incorrect, remembered upon seeing)
// 3 = Hard (correct with significant hesitation)
// 4 = Good (correct with slight hesitation)
// 5 = Easy (instant recall)

export type SRSStage = 'Apprentice' | 'Guru' | 'Master' | 'Enlightened' | 'Burned';

export interface CardSRSData {
  id: string;
  repetitions: number;
  interval: number; // in days
  easeFactor: number;
  dueDate: number; // Unix timestamp ms
  lastReviewed: number | null;
  history: { date: number; grade: SRSGrade; interval: number }[];
  stage: SRSStage;
}

export const INITIAL_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;

export function getSRSStage(repetitions: number): SRSStage {
  if (repetitions <= 0) return 'Apprentice';
  if (repetitions <= 2) return 'Apprentice';
  if (repetitions <= 4) return 'Guru';
  if (repetitions <= 6) return 'Master';
  if (repetitions <= 8) return 'Enlightened';
  return 'Burned';
}

export function createInitialCardSRS(id: string): CardSRSData {
  return {
    id,
    repetitions: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    dueDate: Date.now(), // due immediately
    lastReviewed: null,
    history: [],
    stage: 'Apprentice',
  };
}

export interface ReviewResult {
  repetitions: number;
  interval: number;
  easeFactor: number;
  dueDate: number;
  stage: SRSStage;
}

/**
 * Calculates new interval, ease factor and next due date based on rating
 */
export function calculateNextReview(
  current: Pick<CardSRSData, 'repetitions' | 'interval' | 'easeFactor'>,
  grade: SRSGrade,
  nowMs: number = Date.now()
): ReviewResult {
  let { repetitions, interval, easeFactor } = current;

  // SM-2 Ease Factor calculation
  // EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  const deltaEF = 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor + deltaEF);
  easeFactor = Math.round(easeFactor * 100) / 100;

  if (grade < 3) {
    // Failure / "Again" or heavy struggle: reset repetitions
    repetitions = 0;
    interval = 1; // repeat tomorrow or next session
  } else {
    // Success (Good / Easy)
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = grade === 5 ? 8 : 6;
    } else {
      const bonus = grade === 5 ? 1.3 : 1.0;
      interval = Math.round(interval * easeFactor * bonus);
    }
    repetitions += 1;
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const dueDate = nowMs + interval * oneDayMs;
  const stage = getSRSStage(repetitions);

  return {
    repetitions,
    interval,
    easeFactor,
    dueDate,
    stage,
  };
}

/**
 * Format interval into human readable label (e.g. "1d", "6d", "2mo")
 */
export function formatInterval(days: number): string {
  if (days <= 0) return '< 1d';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo`;
  const years = (days / 365).toFixed(1);
  return `${years}y`;
}

/**
 * Filter cards that are due for review
 */
export function getDueCards<T extends { id: string }>(
  items: T[],
  srsMap: Record<string, CardSRSData>,
  nowMs: number = Date.now()
): T[] {
  return items.filter((item) => {
    const srs = srsMap[item.id];
    if (!srs) return true; // not yet studied, due as new card
    return srs.dueDate <= nowMs;
  });
}
