import React, { useState, useMemo } from 'react';
import {
  Layers,
  PenTool,
  Grid,
  HelpCircle,
  BookOpen,
  BarChart3,
  Flame,
  Volume2,
  RefreshCw,
  Sparkles,
  Award,
  ChevronRight,
  Info,
} from 'lucide-react';
import { HIRAGANA_DATA, KATAKANA_DATA } from './data/kanaData';
import { KANJI_N5_DATA, KANJI_N4_DATA } from './data/kanjiData';
import { VOCAB_N5_DATA, VOCAB_N4_DATA } from './data/vocabData';
import { GRAMMAR_DATA } from './data/grammarData';
import { CharacterItem, VocabItem } from './types/japanese';
import { useJapaneseStudyStore } from './hooks/useJapaneseStudyStore';
import { FlashcardReview } from './components/FlashcardReview';
import { WritingCanvas } from './components/WritingCanvas';
import { CharacterMatrix } from './components/CharacterMatrix';
import { ProgressDashboard } from './components/ProgressDashboard';
import { QuizStudio } from './components/QuizStudio';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { speakJapanese } from './utils/audio';

type ActiveTab = 'dashboard' | 'flashcards' | 'writing' | 'matrix' | 'quiz' | 'grammar';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterItem>(HIRAGANA_DATA[0]);
  const [activeDeckFilter, setActiveDeckFilter] = useState<'due' | 'kana' | 'kanji-n5' | 'kanji-n4' | 'vocab-n5' | 'vocab-n4'>('due');
  const [writingCategory, setWritingCategory] = useState<'all' | 'hiragana' | 'katakana' | 'N5' | 'N4'>('all');

  const { srsMap, stats, recordCardReview, recordStrokePractice, resetAllProgress } =
    useJapaneseStudyStore();

  // Combine all characters
  const allCharacters = useMemo(
    () => [...HIRAGANA_DATA, ...KATAKANA_DATA, ...KANJI_N5_DATA, ...KANJI_N4_DATA],
    []
  );

  const writingCharacters = useMemo(() => {
    if (writingCategory === 'hiragana') return HIRAGANA_DATA;
    if (writingCategory === 'katakana') return KATAKANA_DATA;
    if (writingCategory === 'N5') return KANJI_N5_DATA;
    if (writingCategory === 'N4') return KANJI_N4_DATA;
    return allCharacters;
  }, [writingCategory, allCharacters]);

  // Combine all vocabularies
  const allVocab = useMemo(
    () => [...VOCAB_N5_DATA, ...VOCAB_N4_DATA],
    []
  );

  // Prepare active flashcard deck
  const activeDeck = useMemo(() => {
    const now = Date.now();
    if (activeDeckFilter === 'due') {
      const dueChars = allCharacters.filter((c) => {
        const s = srsMap[c.id];
        return !s || s.dueDate <= now;
      });
      const dueVocab = allVocab.filter((v) => {
        const s = srsMap[v.id];
        return !s || s.dueDate <= now;
      });

      const combined = [
        ...dueChars.map((c) => ({ type: 'character' as const, data: c })),
        ...dueVocab.map((v) => ({ type: 'vocab' as const, data: v })),
      ];

      return combined.length > 0
        ? combined
        : allCharacters.slice(0, 10).map((c) => ({ type: 'character' as const, data: c }));
    }

    if (activeDeckFilter === 'kana') {
      return [...HIRAGANA_DATA, ...KATAKANA_DATA].map((c) => ({
        type: 'character' as const,
        data: c,
      }));
    }

    if (activeDeckFilter === 'kanji-n5') {
      return KANJI_N5_DATA.map((c) => ({ type: 'character' as const, data: c }));
    }

    if (activeDeckFilter === 'kanji-n4') {
      return KANJI_N4_DATA.map((c) => ({ type: 'character' as const, data: c }));
    }

    if (activeDeckFilter === 'vocab-n5') {
      return VOCAB_N5_DATA.map((v) => ({ type: 'vocab' as const, data: v }));
    }

    if (activeDeckFilter === 'vocab-n4') {
      return VOCAB_N4_DATA.map((v) => ({ type: 'vocab' as const, data: v }));
    }

    return allCharacters.map((c) => ({ type: 'character' as const, data: c }));
  }, [activeDeckFilter, allCharacters, allVocab, srsMap]);

  // Handler to switch straight into writing canvas for a given character
  const handleOpenWritingPractice = (item: CharacterItem) => {
    setSelectedCharacter(item);
    setActiveTab('writing');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-pink-600 to-rose-500 p-0.5 shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-['Zen_Maru_Gothic'] font-black text-xl text-indigo-400">
                日
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-white tracking-tight">NihongoMaster</span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  N5 · N4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                SRS Flashcards & Character Writing
              </p>
            </div>
          </div>

          {/* Quick Header Stats & Install */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{stats.streakDays} Day Streak</span>
            </div>

            <PWAInstallButton />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-slate-800/60 py-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'flashcards', label: 'SRS Flashcards', icon: Layers },
            { id: 'writing', label: 'Stroke Canvas', icon: PenTool },
            { id: 'matrix', label: 'All Characters', icon: Grid },
            { id: 'quiz', label: 'Quiz & Challenge', icon: HelpCircle },
            { id: 'grammar', label: 'N5/N4 Grammar', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <ProgressDashboard
            stats={stats}
            srsMap={srsMap}
            characters={allCharacters}
            vocabularies={allVocab}
            onStartReview={() => {
              setActiveDeckFilter('due');
              setActiveTab('flashcards');
            }}
            onOpenWritingStudio={() => setActiveTab('writing')}
          />
        )}

        {/* Tab 2: SRS Flashcards */}
        {activeTab === 'flashcards' && (
          <div className="space-y-6">
            {/* Deck Selector Filter */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Deck:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'due', label: 'Due Reviews (SRS)' },
                  { id: 'kana', label: 'Hiragana & Katakana' },
                  { id: 'kanji-n5', label: 'JLPT N5 Kanji' },
                  { id: 'kanji-n4', label: 'JLPT N4 Kanji' },
                  { id: 'vocab-n5', label: 'JLPT N5 Vocab' },
                  { id: 'vocab-n4', label: 'JLPT N4 Vocab' },
                ].map((deck) => (
                  <button
                    key={deck.id}
                    onClick={() => setActiveDeckFilter(deck.id as typeof activeDeckFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeDeckFilter === deck.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {deck.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Flashcard Component */}
            <FlashcardReview
              deck={activeDeck}
              srsMap={srsMap}
              onCardReviewed={recordCardReview}
              onOpenWritingPractice={handleOpenWritingPractice}
              onFinishSession={() => setActiveTab('dashboard')}
            />
          </div>
        )}

        {/* Tab 3: Character Writing Canvas */}
        {activeTab === 'writing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Quick Character Selector */}
            <div className="lg:col-span-4 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-indigo-400" />
                  <span>Choose Character</span>
                </h3>
                <span className="text-xs text-indigo-400 font-semibold uppercase">{selectedCharacter.level}</span>
              </div>

              {/* Category selector pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'hiragana', label: 'Hiragana' },
                  { id: 'katakana', label: 'Katakana' },
                  { id: 'N5', label: 'N5 Kanji' },
                  { id: 'N4', label: 'N4 Kanji' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setWritingCategory(cat.id as typeof writingCategory)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                      writingCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Character quick grid */}
              <div className="grid grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                {writingCharacters.map((c) => {
                  const isCurrent = selectedCharacter.id === c.id;
                  const isStudied = srsMap[c.id];
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCharacter(c)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                        isCurrent
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-950/60 hover:bg-slate-800 text-slate-200 border-slate-800'
                      }`}
                    >
                      <span className="text-xl font-bold font-['Zen_Maru_Gothic']">{c.character}</span>
                      <span className="text-[10px] opacity-75">{c.romaji}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick overview of selected character */}
              <div className="pt-3 border-t border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Meaning:</span>
                  <span className="font-bold text-white capitalize">{selectedCharacter.meaning}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Strokes:</span>
                  <span className="font-bold text-indigo-400">{selectedCharacter.strokeCount}</span>
                </div>
                {selectedCharacter.onyomi && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Onyomi:</span>
                    <span className="text-amber-300 font-medium">{selectedCharacter.onyomi.join(', ')}</span>
                  </div>
                )}
                {selectedCharacter.kunyomi && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kunyomi:</span>
                    <span className="text-emerald-300 font-medium">{selectedCharacter.kunyomi.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Writing Canvas Studio */}
            <div className="lg:col-span-8 p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col items-center shadow-xl">
              <WritingCanvas
                item={selectedCharacter}
                onMasteredStroke={(acc) => recordStrokePractice(selectedCharacter, acc)}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Character Directory Matrix */}
        {activeTab === 'matrix' && (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <CharacterMatrix
              characters={allCharacters}
              srsMap={srsMap}
              onSelectCharacter={handleOpenWritingPractice}
              activeCharacterId={selectedCharacter.id}
            />
          </div>
        )}

        {/* Tab 5: Quiz & Challenge */}
        {activeTab === 'quiz' && (
          <QuizStudio
            characters={allCharacters}
            vocabularies={allVocab}
            grammars={GRAMMAR_DATA}
            onCorrectAnswer={() => {
              // Update stats on correct answer
              if (stats) {
                stats.reviewsCompletedTotal++;
              }
            }}
          />
        )}

        {/* Tab 6: N5/N4 Grammar Guide */}
        {activeTab === 'grammar' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Essential JLPT N5 & N4 Grammar</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Master sentence structures and patterns tested in the JLPT exams.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GRAMMAR_DATA.map((g) => (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {g.level}
                    </span>
                    <button
                      onClick={() => speakJapanese(g.examples[0]?.ja || g.title)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Pronounce example sentence"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-white font-['Zen_Maru_Gothic']">{g.title}</h3>
                    <div className="text-xs font-semibold text-indigo-400 mt-0.5">{g.meaning}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs text-slate-300">
                    {g.structure}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{g.explanation}</p>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400">Example Sentences:</div>
                    {g.examples.map((ex, i) => (
                      <div key={i} className="text-xs bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40">
                        <div className="font-semibold text-slate-200">{ex.ja}</div>
                        <div className="text-[11px] text-indigo-300">{ex.romaji}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{ex.en}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Persistent Offline Banner */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>NihongoMaster • Japanese N5 & N4 Spaced Repetition</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>100% Offline PWA Ready</span>
            <span>•</span>
            <button
              onClick={() => {
                if (window.confirm('Reset all SRS progress and local stats?')) {
                  resetAllProgress();
                }
              }}
              className="text-slate-500 hover:text-rose-400 transition"
            >
              Reset Study Data
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
