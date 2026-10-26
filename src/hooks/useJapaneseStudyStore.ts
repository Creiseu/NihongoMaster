import { useState, useEffect, useCallback } from 'react';
import { CardSRSData, createInitialCardSRS, calculateNextReview, SRSGrade } from '../utils/srs';
import { UserStats, CharacterItem } from '../types/japanese';

const SRS_STORAGE_KEY = 'nihongo_srs_records_v1';
const STATS_STORAGE_KEY = 'nihongo_user_stats_v1';

const defaultStats: UserStats = {
  streakDays: 1,
  lastStudyDate: new Date().toISOString().split('T')[0],
  cardsLearnedTotal: 0,
  reviewsCompletedTotal: 0,
  strokesDrawnTotal: 0,
  accuracyRate: 95,
  historyDates: {
    [new Date().toISOString().split('T')[0]]: 5,
  },
};

export function useJapaneseStudyStore() {
  const [srsMap, setSrsMap] = useState<Record<string, CardSRSData>>({});
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const storedSRS = localStorage.getItem(SRS_STORAGE_KEY);
      if (storedSRS) {
        setSrsMap(JSON.parse(storedSRS));
      }

      const storedStats = localStorage.getItem(STATS_STORAGE_KEY);
      if (storedStats) {
        const parsedStats: UserStats = JSON.parse(storedStats);
        // Calculate streak
        const todayStr = new Date().toISOString().split('T')[0];
        const lastDate = parsedStats.lastStudyDate;

        if (lastDate && lastDate !== todayStr) {
          const lastTime = new Date(lastDate).getTime();
          const todayTime = new Date(todayStr).getTime();
          const diffDays = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day
            parsedStats.streakDays = (parsedStats.streakDays || 0) + 1;
            parsedStats.lastStudyDate = todayStr;
          } else if (diffDays > 1) {
            // Streak broken
            parsedStats.streakDays = 1;
            parsedStats.lastStudyDate = todayStr;
          }
        }
        setStats(parsedStats);
      }
    } catch (e) {
      console.error('Failed to load local study data:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage
  const saveToStorage = useCallback((newSrs: Record<string, CardSRSData>, newStats: UserStats) => {
    try {
      localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(newSrs));
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, []);

  // Record a review result
  const recordCardReview = useCallback(
    (cardId: string, grade: SRSGrade, result: ReturnType<typeof calculateNextReview>) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const now = Date.now();

      setSrsMap((prev) => {
        const currentCard = prev[cardId] || createInitialCardSRS(cardId);
        const updatedCard: CardSRSData = {
          ...currentCard,
          repetitions: result.repetitions,
          interval: result.interval,
          easeFactor: result.easeFactor,
          dueDate: result.dueDate,
          stage: result.stage,
          lastReviewed: now,
          history: [...currentCard.history, { date: now, grade, interval: result.interval }],
        };

        const nextMap = { ...prev, [cardId]: updatedCard };

        setStats((prevStats) => {
          const totalReviews = prevStats.reviewsCompletedTotal + 1;
          const isGood = grade >= 4;
          const oldPasses = Math.round((prevStats.accuracyRate / 100) * prevStats.reviewsCompletedTotal);
          const newPasses = oldPasses + (isGood ? 1 : 0);
          const newAccuracy = Math.round((newPasses / totalReviews) * 100);

          const nextStats: UserStats = {
            ...prevStats,
            reviewsCompletedTotal: totalReviews,
            accuracyRate: newAccuracy,
            lastStudyDate: todayStr,
            historyDates: {
              ...prevStats.historyDates,
              [todayStr]: (prevStats.historyDates[todayStr] || 0) + 1,
            },
          };

          saveToStorage(nextMap, nextStats);
          return nextStats;
        });

        return nextMap;
      });
    },
    [saveToStorage]
  );

  // Record a stroke practice pass
  const recordStrokePractice = useCallback(
    (characterItem: CharacterItem, accuracy: number) => {
      const todayStr = new Date().toISOString().split('T')[0];
      setStats((prev) => {
        const nextStats: UserStats = {
          ...prev,
          strokesDrawnTotal: prev.strokesDrawnTotal + characterItem.strokeCount,
          lastStudyDate: todayStr,
          historyDates: {
            ...prev.historyDates,
            [todayStr]: (prev.historyDates[todayStr] || 0) + 1,
          },
        };

        // Also give a good review boost to the character in SRS if accuracy >= 75
        if (accuracy >= 75) {
          setSrsMap((prevSrs) => {
            const currentCard = prevSrs[characterItem.id] || createInitialCardSRS(characterItem.id);
            const reviewRes = calculateNextReview(currentCard, accuracy >= 90 ? 5 : 4);
            const updatedCard: CardSRSData = {
              ...currentCard,
              repetitions: reviewRes.repetitions,
              interval: reviewRes.interval,
              easeFactor: reviewRes.easeFactor,
              dueDate: reviewRes.dueDate,
              stage: reviewRes.stage,
              lastReviewed: Date.now(),
              history: [...currentCard.history, { date: Date.now(), grade: 4, interval: reviewRes.interval }],
            };
            const nextSrs = { ...prevSrs, [characterItem.id]: updatedCard };
            saveToStorage(nextSrs, nextStats);
            return nextSrs;
          });
        } else {
          saveToStorage(srsMap, nextStats);
        }

        return nextStats;
      });
    },
    [saveToStorage, srsMap]
  );

  const resetAllProgress = useCallback(() => {
    setSrsMap({});
    setStats({
      ...defaultStats,
      historyDates: {},
    });
    localStorage.removeItem(SRS_STORAGE_KEY);
    localStorage.removeItem(STATS_STORAGE_KEY);
  }, []);

  return {
    srsMap,
    stats,
    isLoaded,
    recordCardReview,
    recordStrokePractice,
    resetAllProgress,
  };
}
