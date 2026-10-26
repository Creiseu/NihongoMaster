import { GrammarItem } from '../types/japanese';

export const GRAMMAR_DATA: GrammarItem[] = [
  {
    id: 'g-n5-1',
    title: '〜は〜です',
    structure: 'Noun A は Noun B です',
    meaning: 'A is B',
    level: 'N5',
    explanation: 'Basic identification and description sentence in polite Japanese. "は" (pronounced "wa") marks the topic.',
    examples: [
      { ja: '私は学生です。', romaji: 'Watashi wa gakusei desu.', en: 'I am a student.' },
      { ja: 'これは本です。', romaji: 'Kore wa hon desu.', en: 'This is a book.' },
    ],
  },
  {
    id: 'g-n5-2',
    title: '〜があります / います',
    structure: 'Noun が あります (inanimate) / います (animate)',
    meaning: 'There is / has',
    level: 'N5',
    explanation: 'Use あります for non-living objects and plants; use います for people and animals.',
    examples: [
      { ja: '机の上にペンがあります。', romaji: 'Tsukue no ue ni pen ga arimasu.', en: 'There is a pen on the desk.' },
      { ja: '公園に犬がいます。', romaji: 'Kouen ni inu ga imasu.', en: 'There is a dog in the park.' },
    ],
  },
  {
    id: 'g-n5-3',
    title: '〜たいです (Desire)',
    structure: 'Verb (stem) + たいです',
    meaning: 'Want to do [verb]',
    level: 'N5',
    explanation: 'Attach -tai to the masu-stem of verbs to express personal desire. Conjugates like an i-adjective.',
    examples: [
      { ja: '日本へ行きたいです。', romaji: 'Nihon e ikitai desu.', en: 'I want to go to Japan.' },
      { ja: 'ラーメンを食べたいです。', romaji: 'Raamen o tabetai desu.', en: 'I want to eat ramen.' },
    ],
  },
  {
    id: 'g-n4-1',
    title: '〜たことがある (Experience)',
    structure: 'Verb (ta-form) + ことがある',
    meaning: 'Have the experience of doing...',
    level: 'N4',
    explanation: 'Used to state past life experience (or lack thereof with ことがない).',
    examples: [
      { ja: '富士山に登ったことがあります。', romaji: 'Fujisan ni nobotta koto ga arimasu.', en: 'I have climbed Mount Fuji.' },
      { ja: '納豆を食べたことがありません。', romaji: 'Nattou o tabeta koto ga arimasen.', en: 'I have never eaten natto.' },
    ],
  },
  {
    id: 'g-n4-2',
    title: '〜ほうがいい (Advice)',
    structure: 'Verb (ta-form / nai-form) + ほうがいいです',
    meaning: 'It is better to... / You should...',
    level: 'N4',
    explanation: 'Used to give recommendations or advice to the listener.',
    examples: [
      { ja: '薬を飲んだほうがいいですよ。', romaji: 'Kusuri o nonda hou ga ii desu yo.', en: 'You had better take some medicine.' },
      { ja: '夜遅く食べないほうがいいです。', romaji: 'Yoru osoku tabenai hou ga ii desu.', en: 'It is better not to eat late at night.' },
    ],
  },
  {
    id: 'g-n4-3',
    title: '〜かもしれません (Possibility)',
    structure: 'Plain form + かもしれません',
    meaning: 'Might / maybe / perhaps',
    level: 'N4',
    explanation: 'Expresses uncertainty or conjecture (around 50% likelihood).',
    examples: [
      { ja: '明日は雨が降るかもしれません。', romaji: 'Ashita wa ame ga furu kamoshiremasen.', en: 'It might rain tomorrow.' },
    ],
  },
];
