import React, { useState, useMemo } from 'react';
import { Search, PenTool, Sparkles, Filter, Check, Volume2 } from 'lucide-react';
import { CharacterItem, JLPTLevel } from '../types/japanese';
import { CardSRSData } from '../utils/srs';
import { speakJapanese } from '../utils/audio';

interface CharacterMatrixProps {
  characters: CharacterItem[];
  srsMap: Record<string, CardSRSData>;
  onSelectCharacter: (item: CharacterItem) => void;
  activeCharacterId?: string;
}

export const CharacterMatrix: React.FC<CharacterMatrixProps> = ({
  characters,
  srsMap,
  onSelectCharacter,
  activeCharacterId,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'hiragana' | 'katakana' | 'kanji-n5' | 'kanji-n4'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'mastered' | 'learning'>('all');

  const filteredCharacters = useMemo(() => {
    return characters.filter((c) => {
      // Category filter
      if (selectedCategory === 'hiragana' && c.category !== 'hiragana') return false;
      if (selectedCategory === 'katakana' && c.category !== 'katakana') return false;
      if (selectedCategory === 'kanji-n5' && (c.category !== 'kanji' || c.level !== 'N5')) return false;
      if (selectedCategory === 'kanji-n4' && (c.category !== 'kanji' || c.level !== 'N4')) return false;

      // Status filter
      const srs = srsMap[c.id];
      if (statusFilter === 'mastered') {
        if (!srs || srs.repetitions < 5) return false;
      } else if (statusFilter === 'learning') {
        if (!srs || srs.repetitions === 0) return false;
      } else if (statusFilter === 'due') {
        if (srs && srs.dueDate > Date.now()) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesChar = c.character.includes(q);
        const matchesRomaji = c.romaji.toLowerCase().includes(q);
        const matchesMeaning = c.meaning.toLowerCase().includes(q);
        const matchesOnyomi = c.onyomi?.some((o) => o.includes(q));
        const matchesKunyomi = c.kunyomi?.some((k) => k.includes(q));
        return matchesChar || matchesRomaji || matchesMeaning || matchesOnyomi || matchesKunyomi;
      }

      return true;
    });
  }, [characters, selectedCategory, statusFilter, search, srsMap]);

  return (
    <div className="flex flex-col w-full">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {[
          { id: 'all', label: 'All Characters' },
          { id: 'hiragana', label: 'Hiragana (あ)' },
          { id: 'katakana', label: 'Katakana (ア)' },
          { id: 'kanji-n5', label: 'JLPT N5 Kanji' },
          { id: 'kanji-n4', label: 'JLPT N4 Kanji' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as typeof selectedCategory)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search romaji, meaning, kanji..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', 'due', 'learning', 'mastered'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                statusFilter === filter
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[520px] overflow-y-auto p-1 pr-2 scrollbar-thin">
        {filteredCharacters.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No characters found matching your filters.
          </div>
        ) : (
          filteredCharacters.map((c) => {
            const srs = srsMap[c.id];
            const isMastered = srs && srs.repetitions >= 5;
            const isLearning = srs && srs.repetitions > 0 && !isMastered;
            const isDue = srs && srs.dueDate <= Date.now();
            const isSelected = activeCharacterId === c.id;

            return (
              <button
                key={c.id}
                onClick={() => onSelectCharacter(c)}
                className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* SRS Status dot indicator */}
                {isMastered && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                )}
                {isLearning && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-slate-900" />
                )}
                {isDue && (
                  <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-slate-900" />
                )}

                <div className="text-2xl font-black text-slate-100 group-hover:text-indigo-300 font-['Zen_Maru_Gothic'] transition">
                  {c.character}
                </div>
                <div className="text-[11px] font-semibold text-indigo-400 mt-1 truncate max-w-full">
                  {c.romaji}
                </div>
                <div className="text-[9px] text-slate-400 truncate max-w-full capitalize">
                  {c.meaning}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>Showing {filteredCharacters.length} characters</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Due
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> Learning
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Mastered
          </span>
        </div>
      </div>
    </div>
  );
};
