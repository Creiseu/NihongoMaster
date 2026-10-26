import React from 'react';
import { Flame, CheckCircle, TrendingUp, Calendar, PenTool, Sparkles, Award, ArrowUpRight } from 'lucide-react';
import { CardSRSData, getSRSStage } from '../utils/srs';
import { UserStats, CharacterItem, VocabItem } from '../types/japanese';

interface ProgressDashboardProps {
  stats: UserStats;
  srsMap: Record<string, CardSRSData>;
  characters: CharacterItem[];
  vocabularies: VocabItem[];
  onStartReview: () => void;
  onOpenWritingStudio: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  stats,
  srsMap,
  characters,
  vocabularies,
  onStartReview,
  onOpenWritingStudio,
}) => {
  const now = Date.now();
  const allCardIds = [
    ...characters.map((c) => c.id),
    ...vocabularies.map((v) => v.id),
  ];

  // Cards due
  const dueCount = allCardIds.filter((id) => {
    const srs = srsMap[id];
    return !srs || srs.dueDate <= now;
  }).length;

  // Levels mastery breakdown
  const kanaChars = characters.filter((c) => c.level === 'Kana');
  const n5Chars = characters.filter((c) => c.level === 'N5');
  const n4Chars = characters.filter((c) => c.level === 'N4');

  const getMastery = (items: { id: string }[]) => {
    if (items.length === 0) return 0;
    const mastered = items.filter((it) => {
      const s = srsMap[it.id];
      return s && s.repetitions >= 5;
    }).length;
    return Math.round((mastered / items.length) * 100);
  };

  const kanaMastery = getMastery(kanaChars);
  const n5Mastery = getMastery(n5Chars);
  const n4Mastery = getMastery(n4Chars);

  // SRS Stages breakdown
  const stagesCount = {
    Apprentice: 0,
    Guru: 0,
    Master: 0,
    Enlightened: 0,
    Burned: 0,
  };

  Object.values(srsMap).forEach((card) => {
    if (card.stage in stagesCount) {
      stagesCount[card.stage as keyof typeof stagesCount]++;
    }
  });

  // Last 7 days activity mock or tracked dates
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const count = stats.historyDates[key] || 0;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    return { date: key, count, dayName };
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Hero Banner with Streak & Due Cards */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/80 via-slate-900 to-slate-950 p-6 md:p-8 border border-indigo-500/30 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spaced Repetition System (SRS) Active</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Ready for Daily Practice?
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-lg">
              You have <span className="font-bold text-amber-400">{dueCount} cards</span> due for review.
              Review regularly to solidify Japanese characters into long-term memory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onStartReview}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/30 transition hover:scale-105 active:scale-95"
            >
              <span>Start Review ({dueCount})</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenWritingStudio}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition"
            >
              <PenTool className="w-4 h-4 text-indigo-400" />
              <span>Writing Canvas</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Daily Streak</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {stats.streakDays} <span className="text-xs text-amber-400 font-semibold">days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Keep studying daily</div>
        </div>

        {/* Cards Learned */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Cards Learned</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {Object.keys(srsMap).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">In your active SRS system</div>
        </div>

        {/* Total Reviews */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Reviews</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {stats.reviewsCompletedTotal}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.accuracyRate}% retention accuracy
          </div>
        </div>

        {/* Stroke Practice */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Strokes Written</span>
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
              <PenTool className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {stats.strokesDrawnTotal}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Interactive canvas practice</div>
        </div>
      </div>

      {/* JLPT Levels Mastery Section */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800">
        <h2 className="text-base font-extrabold text-white mb-4">JLPT Level Mastery</h2>

        <div className="space-y-4">
          {/* Kana Mastery */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">Hiragana & Katakana (46 + 46 Characters)</span>
              <span className="text-indigo-400">{kanaMastery}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${kanaMastery}%` }}
              />
            </div>
          </div>

          {/* JLPT N5 Mastery */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">JLPT N5 Core Kanji & Vocabulary</span>
              <span className="text-pink-400">{n5Mastery}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500"
                style={{ width: `${n5Mastery}%` }}
              />
            </div>
          </div>

          {/* JLPT N4 Mastery */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">JLPT N4 Intermediate Kanji & Expressions</span>
              <span className="text-emerald-400">{n4Mastery}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${n4Mastery}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SRS Stages & Weekly Heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SRS Stage Distribution */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">SRS Memory Stages</h3>
          <div className="space-y-3">
            {[
              { stage: 'Apprentice', count: stagesCount.Apprentice, color: 'bg-rose-500', desc: 'Initial learning phase' },
              { stage: 'Guru', count: stagesCount.Guru, color: 'bg-indigo-500', desc: 'Consistent recall (1-2 weeks)' },
              { stage: 'Master', count: stagesCount.Master, color: 'bg-purple-500', desc: 'Intermediate retention (1 month)' },
              { stage: 'Enlightened', count: stagesCount.Enlightened, color: 'bg-blue-500', desc: 'Long-term memory (4 months)' },
              { stage: 'Burned', count: stagesCount.Burned, color: 'bg-amber-400', desc: 'Permanently memorized' },
            ].map((s) => (
              <div key={s.stage} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${s.color}`} />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{s.stage}</div>
                    <div className="text-[10px] text-slate-500">{s.desc}</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-300">{s.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Activity Heatmap */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Study Activity</h3>
              <span className="text-xs text-slate-400">Past 7 days</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-full h-16 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                      d.count > 10
                        ? 'bg-indigo-600 text-white'
                        : d.count > 0
                        ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                        : 'bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    {d.count > 0 ? d.count : '-'}
                  </div>
                  <span className="text-[10px] text-slate-400">{d.dayName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Offline storage synced</span>
            <span className="text-indigo-400 font-semibold">100% Client-Side</span>
          </div>
        </div>
      </div>
    </div>
  );
};
