/**
 * Налаштування гри (швидко корегувати тут).
 */
var CONFIG = {
  // Друк тексту
  CPS: 28,
  pauseAfterDotMs: 700,
  pauseAfterEllipsisMs: 1500,
  pauseAfterPunctuationMs: 350,
  punctuationChars: ',;:!?—–-()«»"\'',
  // Цикл слів (переписування: prefix → слово → стирання → наступне)
  cycleWordsDeleteCps: 25,
  cycleWordsPauseBetweenMs: 1400,
  // Аудіо
  audioPath: 'assets/audio/',
  audioExts: ['.wav', '.mp3', '.ogg'],
  ambientFadeInMs: 15000,
  ambientFadeOutMs: 5000,
  // Прокрутка
  scrollBottomThreshold: 80,
  // Екран кінцівки
  endingFadeMs: 1200,
  // Титульний екран
  title: {
    name: 'ОКЕАН ПАМ\'ЯТІ',
    cps: 28,
    creditCps: 22,
    creditOld: 'inspired by the book "Solaris" by Stanisław Lem',
    creditNew: 'Yevhenii Diachenko',
    creditPrefix: 'created by ',
    jam: 'for Ukrainian Micro Visual Novel Jam #2',
    jamCps: 22,
    deleteCps: 25,
    loadingSegments: 20,
    sequenceDurationMs: 8000,
    creditPauseBeforeDeleteMs: 2500
  }
};
