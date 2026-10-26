import React, { useState, useMemo } from 'react';
import { HelpCircle, Check, X, RotateCcw, Volume2, Sparkles, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CharacterItem, VocabItem, GrammarItem } from '../types/japanese';
import { speakJapanese, playSuccessChime } from '../utils/audio';

interface QuizStudioProps {
  characters: CharacterItem[];
  vocabularies: VocabItem[];
  grammars: GrammarItem[];
  onCorrectAnswer?: () => void;
}

interface Question {
  id: string;
  type: 'character' | 'vocab' | 'grammar';
  prompt: string;
  subPrompt?: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  audioText?: string;
}

export const QuizStudio: React.FC<QuizStudioProps> = ({
  characters,
  vocabularies,
  grammars,
  onCorrectAnswer,
}) => {
  const [level, setLevel] = useState<'all' | 'N5' | 'N4'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  // Generate 10 randomized quiz questions based on selected level
  const questions: Question[] = useMemo(() => {
    const list: Question[] = [];

    // Filter by level
    const availChars = characters.filter((c) => level === 'all' || c.level === level);
    const availVocab = vocabularies.filter((v) => level === 'all' || v.level === level);
    const availGrammar = grammars.filter((g) => level === 'all' || g.level === level);

    // Character questions
    availChars.slice(0, 5).forEach((c) => {
      // Pick 3 random wrong options
      const otherMeanings = characters
        .filter((other) => other.id !== c.id)
        .map((other) => other.meaning);
      const shuffledOthers = otherMeanings.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [c.meaning, ...shuffledOthers].sort(() => 0.5 - Math.random());

      list.push({
        id: `q-char-${c.id}`,
        type: 'character',
        prompt: c.character,
        subPrompt: `Romaji: ${c.romaji}`,
        correctAnswer: c.meaning,
        options,
        explanation: `Kanji "${c.character}" (${c.romaji}) means "${c.meaning}". Onyomi: ${c.onyomi?.join(', ') || '-'}`,
        audioText: c.character,
      });
    });

    // Vocab questions
    availVocab.slice(0, 4).forEach((v) => {
      const otherMeanings = vocabularies
        .filter((o) => o.id !== v.id)
        .map((o) => o.meaning);
      const shuffledOthers = otherMeanings.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [v.meaning, ...shuffledOthers].sort(() => 0.5 - Math.random());

      list.push({
        id: `q-vocab-${v.id}`,
        type: 'vocab',
        prompt: v.kanji,
        subPrompt: `Reading: ${v.kana} (${v.romaji})`,
        correctAnswer: v.meaning,
        options,
        explanation: `"${v.kanji}" (${v.kana}) means "${v.meaning}". Example: ${v.exampleSentenceJa}`,
        audioText: v.kanji,
      });
    });

    // Grammar questions
    availGrammar.slice(0, 3).forEach((g) => {
      const otherMeanings = grammars
        .filter((o) => o.id !== g.id)
        .map((o) => o.meaning);
      const shuffledOthers = otherMeanings.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [g.meaning, ...shuffledOthers].sort(() => 0.5 - Math.random());

      list.push({
        id: `q-gram-${g.id}`,
        type: 'grammar',
        prompt: g.structure,
        subPrompt: g.title,
        correctAnswer: g.meaning,
        options,
        explanation: g.explanation,
        audioText: g.examples[0]?.ja,
      });
    });

    return list.sort(() => 0.5 - Math.random());
  }, [characters, vocabularies, grammars, level]);

  const currentQ = questions[currentIndex];

  const handleSelect = (option: string) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(option);
    setAnsweredCount((prev) => prev + 1);

    if (option === currentQ.correctAnswer) {
      setScore((prev) => prev + 1);
      playSuccessChime();
      if (onCorrectAnswer) onCorrectAnswer();
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      confetti({ particleCount: 100, spread: 70 });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setAnsweredCount(0);
  };

  if (!currentQ || currentIndex >= questions.length) {
    const accuracy = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/90 rounded-3xl border border-slate-800 text-center max-w-md mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Quiz Completed!</h2>
        <p className="text-sm text-slate-400 mb-6">
          You scored {score} out of {answeredCount} ({accuracy}%)
        </p>

        <button
          onClick={handleRestart}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Take Quiz Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Level filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          {(['all', 'N5', 'N4'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setLevel(lvl);
                handleRestart();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                level === lvl
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lvl === 'all' ? 'All Levels' : `JLPT ${lvl}`}
            </button>
          ))}
        </div>

        <div className="text-xs font-semibold text-slate-400">
          Question {currentIndex + 1} / {questions.length} • Score: {score}
        </div>
      </div>

      {/* Question Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {currentQ.type}
          </span>
          {currentQ.audioText && (
            <button
              onClick={() => speakJapanese(currentQ.audioText!)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Pronounce"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-center my-4">
          <div className="text-4xl font-extrabold text-white font-['Zen_Maru_Gothic']">
            {currentQ.prompt}
          </div>
          {currentQ.subPrompt && (
            <div className="text-xs text-indigo-400 font-semibold mt-2">
              {currentQ.subPrompt}
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium text-center mb-6">
          Choose the correct English meaning:
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQ.options.map((opt, i) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt === currentQ.correctAnswer;
            const hasAnswered = selectedOption !== null;

            let btnStyle = 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200';
            if (hasAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200';
              } else if (isSelected) {
                btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200';
              } else {
                btnStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-50';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                disabled={hasAnswered}
                className={`w-full p-3.5 rounded-2xl border text-xs font-semibold text-left transition flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt}</span>
                {hasAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                {hasAnswered && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next */}
        {selectedOption !== null && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-300 leading-relaxed mb-3">
              💡 <span className="font-semibold text-indigo-400">Explanation:</span> {currentQ.explanation}
            </div>
            <button
              onClick={handleNext}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
            >
              {currentIndex + 1 < questions.length ? 'Next Question' : 'View Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
