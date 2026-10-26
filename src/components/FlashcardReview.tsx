import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, RotateCw, Check, ArrowRight, PenTool, Sparkles, BookOpen, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CharacterItem, VocabItem } from '../types/japanese';
import { CardSRSData, calculateNextReview, formatInterval, SRSGrade, getSRSStage } from '../utils/srs';
import { speakJapanese, playFlipSound, playSuccessChime } from '../utils/audio';

type FlashcardItem =
  | { type: 'character'; data: CharacterItem }
  | { type: 'vocab'; data: VocabItem };

interface FlashcardReviewProps {
  deck: FlashcardItem[];
  srsMap: Record<string, CardSRSData>;
  onCardReviewed: (id: string, grade: SRSGrade, result: ReturnType<typeof calculateNextReview>) => void;
  onOpenWritingPractice?: (item: CharacterItem) => void;
  onFinishSession?: () => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({
  deck,
  srsMap,
  onCardReviewed,
  onOpenWritingPractice,
  onFinishSession,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ id: string; grade: SRSGrade }[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const currentItem = deck[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
    playFlipSound();
  }, []);

  const handleRating = useCallback((grade: SRSGrade) => {
    if (!currentItem) return;
    const id = currentItem.data.id;
    const currentSRS = srsMap[id] || { repetitions: 0, interval: 0, easeFactor: 2.5 };
    const nextResult = calculateNextReview(currentSRS, grade);

    onCardReviewed(id, grade, nextResult);
    setSessionResults((prev) => [...prev, { id, grade }]);

    if (grade >= 4) {
      playSuccessChime();
    }

    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsSessionComplete(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [currentItem, currentIndex, deck.length, onCardReviewed, srsMap]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSessionComplete) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === '1' && isFlipped) {
        handleRating(1);
      } else if (e.key === '2' && isFlipped) {
        handleRating(2);
      } else if (e.key === '3' && isFlipped) {
        handleRating(4);
      } else if (e.key === '4' && isFlipped) {
        handleRating(5);
      } else if (e.key === 'r' || e.key === 'R') {
        if (currentItem) {
          const text = currentItem.type === 'character' ? currentItem.data.character : currentItem.data.kanji;
          speakJapanese(text);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleRating, isFlipped, isSessionComplete, currentItem]);

  // Auto-pronounce on card presentation
  useEffect(() => {
    if (currentItem) {
      const text = currentItem.type === 'character' ? currentItem.data.character : currentItem.data.kanji;
      speakJapanese(text);
    }
  }, [currentIndex, currentItem]);

  if (!currentItem || isSessionComplete) {
    const totalReviews = sessionResults.length;
    const goodReviews = sessionResults.filter((r) => r.grade >= 4).length;
    const accuracy = totalReviews > 0 ? Math.round((goodReviews / totalReviews) * 100) : 0;

    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/90 rounded-3xl border border-slate-800 text-center max-w-md mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-1">Session Complete!</h2>
        <p className="text-sm text-slate-400 mb-6">You reviewed {totalReviews} cards with spaced repetition.</p>

        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Retention Accuracy</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{accuracy}%</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Cards Mastered</div>
            <div className="text-2xl font-black text-indigo-400 mt-1">{goodReviews} / {totalReviews}</div>
          </div>
        </div>

        <button
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
            setSessionResults([]);
            setIsSessionComplete(false);
            if (onFinishSession) onFinishSession();
          }}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold transition shadow-lg shadow-indigo-500/25"
        >
          <span>Continue Learning</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const cardSRS = srsMap[currentItem.data.id];
  const srsStage = cardSRS ? cardSRS.stage : 'Apprentice';
  const repetitions = cardSRS ? cardSRS.repetitions : 0;

  // Approximate next intervals for rating buttons
  const currentInterval = cardSRS ? cardSRS.interval : 0;
  const againInterval = '< 10m';
  const hardInterval = formatInterval(Math.max(1, Math.round(currentInterval * 1.2)));
  const goodInterval = formatInterval(Math.max(1, Math.round(currentInterval * 2.5 || 3)));
  const easyInterval = formatInterval(Math.max(4, Math.round((currentInterval * 2.5 || 5) * 1.3)));

  const isCharacter = currentItem.type === 'character';
  const charData = isCharacter ? (currentItem.data as CharacterItem) : null;
  const vocabData = !isCharacter ? (currentItem.data as VocabItem) : null;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {currentItem.data.level}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {srsStage} (Lvl {repetitions})
          </span>
        </div>
        <div className="text-xs font-bold text-slate-400">
          {currentIndex + 1} / {deck.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
        />
      </div>

      {/* 3D Flashcard */}
      <div
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label="Flashcard - click or press space to flip"
        className="relative w-full h-[360px] rounded-3xl cursor-pointer perspective-1000 select-none group"
      >
        <div
          className={`relative w-full h-full rounded-3xl transition-transform duration-500 transform-style-3d shadow-2xl border ${
            isFlipped
              ? 'rotate-y-180 bg-slate-900 border-indigo-500/40 shadow-indigo-500/10'
              : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Card Front */}
          <div className="absolute inset-0 backface-hidden p-6 flex flex-col justify-between items-center">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                {isCharacter ? charData?.category : vocabData?.partOfSpeech}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakJapanese(isCharacter ? charData!.character : vocabData!.kanji);
                }}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                title="Pronounce"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center my-auto">
              <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-200 font-['Zen_Maru_Gothic']">
                {isCharacter ? charData?.character : vocabData?.kanji}
              </div>
              {vocabData && (
                <div className="text-lg text-indigo-400 font-medium mt-2">
                  {vocabData.kana}
                </div>
              )}
              {isCharacter && (
                <div className="text-sm font-semibold text-slate-400 mt-2">
                  {charData?.strokeCount} strokes
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Click or press Space to reveal answer</span>
            </div>
          </div>

          {/* Card Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Answer</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakJapanese(isCharacter ? charData!.character : vocabData!.kanji);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Pronounce"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Main reading & meaning */}
              <div className="mb-3">
                <div className="text-2xl font-black text-white capitalize">
                  {isCharacter ? charData?.meaning : vocabData?.meaning}
                </div>
                <div className="text-sm text-indigo-300 font-semibold mt-0.5">
                  Romaji: {isCharacter ? charData?.romaji : vocabData?.romaji}
                </div>
              </div>

              {/* Character Details: Onyomi, Kunyomi, Radical or Mnemonic */}
              {isCharacter && charData && (
                <div className="space-y-2 mb-3 text-xs bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
                  {charData.onyomi && charData.onyomi.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-semibold">Onyomi (音読み): </span>
                      <span className="text-amber-300 font-bold">{charData.onyomi.join(', ')}</span>
                    </div>
                  )}
                  {charData.kunyomi && charData.kunyomi.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-semibold">Kunyomi (訓読み): </span>
                      <span className="text-emerald-300 font-bold">{charData.kunyomi.join(', ')}</span>
                    </div>
                  )}
                  {charData.radical && (
                    <div>
                      <span className="text-slate-400 font-semibold">Radical: </span>
                      <span className="text-slate-200">{charData.radical}</span>
                    </div>
                  )}
                  {charData.mnemonic && (
                    <div>
                      <span className="text-slate-400 font-semibold">💡 Mnemonic: </span>
                      <span className="text-indigo-200">{charData.mnemonic}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 font-semibold">Stroke Count: </span>
                    <span className="text-slate-200 font-bold">{charData.strokeCount} strokes</span>
                  </div>
                </div>
              )}

              {/* Vocabulary example sentences */}
              {vocabData && (
                <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 text-xs mb-3">
                  <div className="font-medium text-slate-200">{vocabData.exampleSentenceJa}</div>
                  <div className="text-slate-400 mt-1">{vocabData.exampleSentenceEn}</div>
                </div>
              )}

              {/* Sample words for Kanji */}
              {isCharacter && charData?.examples && charData.examples.length > 0 && (
                <div className="text-xs space-y-1 mb-2">
                  <div className="text-slate-400 font-semibold">Common Words:</div>
                  {charData.examples.slice(0, 2).map((ex, i) => (
                    <div key={i} className="flex justify-between text-slate-300">
                      <span>{ex.word} ({ex.reading})</span>
                      <span className="text-slate-400">{ex.meaning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Practice button */}
            {isCharacter && onOpenWritingPractice && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenWritingPractice(charData!);
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Practice Writing This Stroke</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SRS Rating Action Buttons */}
      {isFlipped ? (
        <div className="grid grid-cols-4 gap-2 w-full mt-4">
          <button
            onClick={() => handleRating(1)}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/50 text-rose-200 transition"
          >
            <span className="text-xs font-extrabold">Again [1]</span>
            <span className="text-[10px] text-rose-400 font-medium mt-0.5">{againInterval}</span>
          </button>
          <button
            onClick={() => handleRating(2)}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/50 text-amber-200 transition"
          >
            <span className="text-xs font-extrabold">Hard [2]</span>
            <span className="text-[10px] text-amber-400 font-medium mt-0.5">{hardInterval}</span>
          </button>
          <button
            onClick={() => handleRating(4)}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/50 text-indigo-200 transition"
          >
            <span className="text-xs font-extrabold">Good [3]</span>
            <span className="text-[10px] text-indigo-400 font-medium mt-0.5">{goodInterval}</span>
          </button>
          <button
            onClick={() => handleRating(5)}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 transition"
          >
            <span className="text-xs font-extrabold">Easy [4]</span>
            <span className="text-[10px] text-emerald-400 font-medium mt-0.5">{easyInterval}</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleFlip}
          className="w-full mt-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
        >
          <span>Show Answer</span>
          <RotateCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
