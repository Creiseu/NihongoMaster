import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextReview,
  getSRSStage,
  createInitialCardSRS,
  formatInterval,
  getDueCards,
  INITIAL_EASE_FACTOR,
  MIN_EASE_FACTOR,
} from './srs';

test('createInitialCardSRS creates standard new card record', () => {
  const card = createInitialCardSRS('kanji-n5-1');
  assert.equal(card.id, 'kanji-n5-1');
  assert.equal(card.repetitions, 0);
  assert.equal(card.easeFactor, INITIAL_EASE_FACTOR);
  assert.equal(card.stage, 'Apprentice');
});

test('calculateNextReview handles "Again" (grade 1) properly by resetting repetitions', () => {
  const current = { repetitions: 3, interval: 15, easeFactor: 2.5 };
  const fixedNow = 10000000;
  const result = calculateNextReview(current, 1, fixedNow);

  assert.equal(result.repetitions, 0);
  assert.equal(result.interval, 1);
  assert.equal(result.stage, 'Apprentice');
  assert.ok(result.easeFactor < 2.5, 'Ease factor should drop on failure');
  assert.equal(result.dueDate, fixedNow + 24 * 60 * 60 * 1000);
});

test('calculateNextReview increments intervals for successful "Good" (grade 4)', () => {
  const step0 = { repetitions: 0, interval: 0, easeFactor: 2.5 };
  const r1 = calculateNextReview(step0, 4);
  assert.equal(r1.repetitions, 1);
  assert.equal(r1.interval, 1);

  const r2 = calculateNextReview(r1, 4);
  assert.equal(r2.repetitions, 2);
  assert.equal(r2.interval, 6);

  const r3 = calculateNextReview(r2, 4);
  assert.equal(r3.repetitions, 3);
  assert.ok(r3.interval >= 14, 'Interval should compound with easeFactor');
});

test('calculateNextReview gives bonus for "Easy" (grade 5)', () => {
  const current = { repetitions: 2, interval: 6, easeFactor: 2.5 };
  const result = calculateNextReview(current, 5);

  assert.equal(result.repetitions, 3);
  assert.ok(result.interval > 6 * 2.5, 'Easy rating should give multiplier bonus');
  assert.ok(result.easeFactor > 2.5, 'Easy rating should increase ease factor');
});

test('easeFactor never drops below MIN_EASE_FACTOR (1.3)', () => {
  let current = { repetitions: 0, interval: 1, easeFactor: 1.35 };
  // Fail repeatedly
  for (let i = 0; i < 5; i++) {
    current = calculateNextReview(current, 1);
  }
  assert.ok(current.easeFactor >= MIN_EASE_FACTOR);
});

test('getSRSStage accurately maps repetitions to WaniKani-style stages', () => {
  assert.equal(getSRSStage(0), 'Apprentice');
  assert.equal(getSRSStage(1), 'Apprentice');
  assert.equal(getSRSStage(2), 'Apprentice');
  assert.equal(getSRSStage(3), 'Guru');
  assert.equal(getSRSStage(5), 'Master');
  assert.equal(getSRSStage(7), 'Enlightened');
  assert.equal(getSRSStage(9), 'Burned');
});

test('formatInterval outputs clean duration strings', () => {
  assert.equal(formatInterval(0), '< 1d');
  assert.equal(formatInterval(1), '1d');
  assert.equal(formatInterval(14), '14d');
  assert.equal(formatInterval(60), '2mo');
  assert.equal(formatInterval(365), '1.0y');
});

test('getDueCards filters items correctly based on dueDate timestamp', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const now = 1000000;
  const srsMap = {
    a: { ...createInitialCardSRS('a'), dueDate: now - 5000 }, // past due
    b: { ...createInitialCardSRS('b'), dueDate: now + 50000 }, // future
    // c is not in map, so it's a new card (due now)
  };
  const due = getDueCards(items, srsMap, now);
  assert.equal(due.length, 2);
  assert.deepEqual(due.map(d => d.id), ['a', 'c']);
});
