export type JLPTLevel = 'N5' | 'N4' | 'Kana';
export type CharacterCategory = 'hiragana' | 'katakana' | 'kanji' | 'vocab' | 'grammar';

export interface StrokePoint {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
}

export interface CharacterStroke {
  id: number;
  path: string; // SVG path command string normalized to 100x100 viewBox
  startPoint?: StrokePoint;
  endPoint?: StrokePoint;
  directionHint?: string; // e.g. "Left to right", "Top to bottom", "Hook upward"
}

export interface CharacterItem {
  id: string;
  character: string;
  romaji: string;
  meaning: string;
  level: JLPTLevel;
  category: 'hiragana' | 'katakana' | 'kanji';
  strokeCount: number;
  onyomi?: string[];
  kunyomi?: string[];
  radical?: string;
  mnemonic?: string;
  strokes?: CharacterStroke[];
  examples?: {
    word: string;
    reading: string;
    meaning: string;
  }[];
}

export interface VocabItem {
  id: string;
  kanji: string;
  kana: string;
  romaji: string;
  meaning: string;
  level: 'N5' | 'N4';
  partOfSpeech: string;
  exampleSentenceJa: string;
  exampleSentenceEn: string;
}

export interface GrammarItem {
  id: string;
  title: string;
  structure: string;
  meaning: string;
  level: 'N5' | 'N4';
  explanation: string;
  examples: {
    ja: string;
    romaji: string;
    en: string;
  }[];
}

export interface UserStats {
  streakDays: number;
  lastStudyDate: string; // YYYY-MM-DD
  cardsLearnedTotal: number;
  reviewsCompletedTotal: number;
  strokesDrawnTotal: number;
  accuracyRate: number; // 0 to 100
  historyDates: Record<string, number>; // dateStr -> count
}
