/**
 * Solaris — модуль «Прометей», Олеся, Кай, СИСТЕМА, океан.
 * Версія 2.0: психологічна драма ізоляції та бажання.
 */

 // #region --- ОПИС ТИПІВ КРОКІВ І ПОЛІВ ---
 /**
 * Кожен крок має обов'язково: id (рядок), type (один із типів нижче).
 * Перехід між кроками: next (id наступного) або choices[].next / nextByDistortion / successNext / failNext.
 *
 * type: 'line'
 *   Діалог або думка: посимвольний друк тексту, потім кнопка «Далі».
 *   Поля: id, type, speaker, text, next.
 *   speaker — 'Я' | 'Кай' | 'СИСТЕМА' | '???' | null (думки без імені).
 *   Опційно: sound (короткий звук), ambient (фоновий звук або масив назв — кілька шарів грають разом, з наростанням/затуханням), ambientVolume (0–1, гучність ambient за замовчуванням 1), stopAmbient (true — вимкнути всі фони),
 *   glitchText (після друку замінити текст на цей рядок з ефектом глітчу),
 *   lineCycleSuffix — { prefix: '...', words: ['a','b','c'] } — у тому ж повідомленні після тексту
 *   друкує prefix, потім по черзі слова (друк → пауза → стирання → наступне), останнє залишається.
 *
 * type: 'lineCycleWords'
 *   Окреме повідомлення лише з циклом слів (prefix → слово₁ → стирання → слово₂ → …).
 *   Поля: id, type, speaker, prefix, words (масив рядків), next.
 *   Опційно: sound, ambient, stopAmbient.
 *
 * type: 'pause'
 *   Затримка без тексту, потім перехід.
 *   Поля: id, type, duration (мс), next.
 *
 * type: 'choice'
 *   Кнопки вибору. При кліку: distortion += distortionDelta, перехід на next обраного варіанту.
 *   Поля: id, type, choices — масив { label, distortionDelta, next, tooltip? }.
 *
 * type: 'branch'
 *   Вибір наступного кроку за рівнем distortion:
 *   Поля: id, type, nextByDistortion
 *
 * type: 'ending'
 *   Екран кінцівки: затухання, заголовок, статистика (distortion, вибори, час, профіль), кнопка «Перезапустити».
 *   Поля: id, type, title (наприклад "КІНЕЦЬ: ПАМ'ЯТЬ").
 *
 * avatar (опційно на будь-якому кроці): оновити стан аватара Олесі.
 *   Поля: image?, name?, heartbeatBpm? (частота серцебиття, удари/хв, за замовчуванням 40).
 */
 // #endregion

/** Стан аватара Олесі: image, name, heartbeatBpm (частота серцебиття, удари/хв). */
const AVATAR_DEFAULTS = {
  image: 'assets/images/ch_main/сh_idle_anim.webp',
  name: 'ОЛЕСЯ',
  heartbeatBpm: 40
};

const STORY_STEPS = {
  // #region --- АКТ I. ТИША ---
  start: {
    id: 'start',
    type: 'line',
    speaker: 'СИСТЕМА',
    dockingLabel: { text: '00:02', color: null },
    text: "ТЕРМІНАЛ: АКТИВНИЙ.\nМОДУЛЬ 'ПРОМЕТЕЙ': У ЗОНІ ДОСЯЖНОСТІ.\nСТИКУВАННЯ: 10 ХВ.\nПРОТОКОЛ ЕВАКУАЦІЇ: ЗАПУСК.",
    ambient: 'station_bg',
    heartbeatBpm: 240,

   // ambient: 'ocean_hum_low',
   sound: 'alert_beep',
    next: 'journal_entry_1'
  },

  journal_entry_1: {
    id: 'journal_entry_1',
    type: 'line',
    speaker: 'Я',
    text: "[БОРТЖУРНАЛ]. \nДень 312.\n'Прометей' на підході. \nНАРЕШТІ!",
    //ambient: 'ocean_hum_low',
    avatar: 'assets/images/ch_main/ch_print.png',
    heartbeatBpm: 1240,
    next: 'journal_entry_2'
  },

  journal_entry_2: {
    id: 'journal_entry_2',
    type: 'line',
    speaker: 'Я',
    text: "За вікном — океан. \n4°C. 1.2 г/см³. \nЗнову тимчасові геометрії: колони, мости, сфери. \nНавіщо? ",
    lineCycleSuffix: { prefix: 'Це  ', words: ['мова?', 'музика?', 'ікота космічної матерії? :)'] },
    next: 'station_description'
  },

  station_description: {
    id: 'station_description',
    type: 'line',
    speaker: 'Я',
    text: "Техвідсік станції давно заблоковано. \nТам залишилися речі Кая, інструменти, недочитана книга з загнутою сторінкою. \nСистеми в нормі, повітря стерильне. \nВід цього мертвого спокою стає",
    lineCycleSuffix: { prefix: '... ', words: ['страшно', 'самотньо', 'холодно.'] },
    avatar: 'assets/images/ch_main/ch_print.png',
    heartbeatBpm: 240,
    next: 'journal_entry_3'
  },

  journal_entry_3: {
    id: 'journal_entry_3',
    type: 'line',
    speaker: null,
    text: "Тиша... Як завжди. \nІноді ввижається голос Кая... \nЙого дотик... \nЧитала, що це називається 'тактильними галюцинаціями'. \nЦя тиша повільно забирає розум.",
    next: 'signal_detect'
  },

  signal_detect: {
    id: 'signal_detect',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "УВАГА! ВХІДНИЙ СИГНАЛ.\nДЖЕРЕЛО: ЗОВНІШНЯ ОБШИВКА, СЕКТОР А-7.",
    sound: 'static_chirp',
    next: 'el_reaction_1'
  },

  el_reaction_1: {
    id: 'el_reaction_1',
    type: 'line',
    speaker: null,
    text: "Неможливо.\nМетеорити не проходять щит. \nЗбої виключені — діагностика чиста \nОЙ! \n... щось торкнулося обшивки? \n... або хтось.",
    next: 'el_chat_cameras'
  },

  el_chat_cameras: {
    id: 'el_chat_cameras',
    type: 'line',
    speaker: 'Я',
    text: "СИСТЕМА, негайно перевір камери зовнішнього спостереження, сектор А-7.",
    avatar: 'assets/images/ch_main/ch_say.png',
    next: 'system_cameras_reply'
  },

  system_cameras_reply: {
    id: 'system_cameras_reply',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "СКАНУВАННЯ... ... ...\nКАМЕРИ: АКТИВНІ. ОБ'ЄКТІВ: 0.\nВІЗУАЛ: ПОВЕРХНЯ ОКЕАНУ.",
    next: 'el_chat_2'
  },

  el_chat_2: {
    id: 'el_chat_2',
    type: 'line',
    speaker: 'Я',
    text: "Системи в нормі. Пошкоджень немає.\nАле ж сигнал був!",
    avatar: 'assets/images/ch_main/ch_print.png',
    next: 'el_reaction_choice'
  },

  el_reaction_choice: {
    id: 'el_reaction_choice',
    type: 'choice',
    choices: [
      { label: 'Я знову втрачаю розум?', distortionDelta: +1, next: 'ai_analysis_cold'}, 
      { label: 'Можливо слід перевірити ще раз?', distortionDelta: -1, next: 'ai_analysis_doubt'}
    ]
  },

  ai_analysis_cold: { // ВИСОКИЙ distortionDelta - шлях емоційної реакції
    id: 'ai_analysis_cold',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "УВАГА: ЗАФІКСОВАНО СТРУКТУРУ З БІОМЕТРИЧНИМИ ОЗНАКАМИ. \nВІДПОВІДНІСТЬ ШАБЛОНУ ... 'КАЙ': 99.8%.\nДЖЕРЕЛО... НЕ ВИЗНАЧЕНО.",
    ambient: 'Error (Remix)',
    ambientVolume: 0.05,
    next: 'el_sensory_ignore' // Тепер цей шлях для ЕМОЦІЙНИХ гравців
  },
  el_sensory_ignore: {
    id: 'el_sensory_ignore',
    type: 'line',
    speaker: null,
    text: "Пальці завмерли над клавіатурою.\nКай... \nКай? \nЯ відчула запах його парфумів...\n Ні! Ні! Ні!\n Знову ці галюцінації !!!\n ПЕРЕСТАНЬТЕ!",
    sound: 'whispers',
    soundVolume: 0.6,
    avatar: 'assets/images/ch_main/ch_panic.png',
    next: 'el_sensory_ignore_2'
  },

  el_sensory_ignore_2: {
    id: 'el_sensory_ignore_2',
    type: 'line',
    speaker: null,
    text: "Цей звук кроків з техвідсіку? \nАле ж там нікого немає!",
    sound: 'footsteps_on_metal',
    soundVolume: 1,
    avatar: 'assets/images/ch_main/ch_eye_left.png',
    heartbeatBpm: 160,
    next: 'el_chat_3_1'
  },

  ai_analysis_doubt: { // НИЗЬКИЙ distortionDelta - шлях раціональної перевірки
    id: 'ai_analysis_doubt',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ГЛИБОКИЙ АНАЛІЗ СИГНАЛУ... 20%... 60%... 80%... 98%... 99%... ... \nДЖЕРЕЛО: ЗОВНІШНЕ (ОКЕАНІЧНА СУБСТАНЦІЯ).\nСИГНАЛ МІСТИТЬ НЕЙРОННІ ПАТЕРНИ.\nТЕМИ: ТУГА. ПРОВИНА. НЕЗАВЕРШЕНІСТЬ.",
    ambient: 'Error (Remix)',
    ambientVolume: 0.05,
    next: 'el_chat_3_1' // Тепер цей шлях для РАЦІОНАЛЬНИХ гравців
  },


  el_chat_3_1: {
    id: 'el_chat_3_1',
    type: 'line',
    speaker: 'Я',
    text: "СИСТЕМА, це неможливо! \nТут тільки Я. ",
    lineCycleSuffix: { prefix: '\nА Кай... ', words: ['зник 250 днів тому.', 'загинув 125 днів тому.'] }, 
    //ambient: 'Error (Remix)',
    // ambient: 'ocean_hum_low',
     ambientVolume: 0.1,
     avatar: 'assets/images/ch_main/ch_say.png',
     heartbeatBpm: 60,
    next: 'el_chat_3_2'
  },

  el_chat_3_2: {
    id: 'el_chat_3_2',
    type: 'line',
    speaker: 'Я',
    text: "Про це записано у бортжурналі.\nАле цей сигнал... Можливо, він живий?",
    next: 'memory_1_1'
  },

  memory_1_1: {
    id: 'memory_1_1',
    type: 'line',
    speaker: null,
    text: "Останній сеанс зв'язку. \nТривога вила, але голос його був спокійним.\n'Не хвилюйся, Олесю. Просто тиск трохи падає. \nЯ встигну повернутися до заходу сонця.'",
    lineCycleSuffix: { prefix: '\nПотім — тиша тривалістю ', words: ['у хвилини.', 'у години.', 'у вічність.'] },
    next: 'memory_1_2'
  },

  memory_1_2: {
    id: 'memory_1_2',
    type: 'line',
    speaker: null,
    text: "Я чекала... \nАле він не повернувся.",
    next: 'kai_msg_1'
  },
  // #endregion

  // #region --- АКТ II. КОНТАКТ ---

  kai_msg_1: {
    id: 'kai_msg_1',
    type: 'line',
    speaker: '???',
    text: "Олесю? Чуєш? \nТемно. Не вимикай світло.",
    lineCycleSuffix: { prefix: '\nТи знаєш,  ', words: ['як я...', 'як ми не любимо темряву тут.'] },
    sound: 'voice_filtered',
    next: 'el_internal_shock'
  },

  el_internal_shock: {
    id: 'el_internal_shock',
    type: 'line',
    speaker: null,
    text: "Його голос. Впевнена. \nТой самий тембр, ті ж паузи.",
    lineCycleSuffix: { prefix: '\nВін знає про ', words: ['мою фобію.', 'про нашу спільну фобію.'] },
    next: 'choice_contact'
  },

  choice_contact: {
    id: 'choice_contact',
    type: 'choice',
    choices: [
      { label: 'Каю, я чую тебе! \nЧому ти мовчав?', distortionDelta: +2, next: 'path_hope' },
      { label: 'Каю, це справді ти? \nЯк ти вижив?', distortionDelta: -2, next: 'path_stress' }
    ]
  },
    
// --- ШЛЯХ ЕМОЦІЙ (Гравець довірився -> Кай тисне на провину) ---
  path_hope: { // Високий distortionDelta - шлях емоційної реакції
    id: 'path_hope',
    type: 'line',
    speaker: 'Кай',
    text: "Я кликав... \nЧому ти мовчала? \nТи обіцяла ніколи не залишати мене в темряві. \nНевже я більше не важливий для тебе, Олесю?",
    avatar: 'assets/images/ch_main/ch_pain.png',
    sound: 'static_whisper',
    next: 'el_thoughts_promise'
  },

  el_thoughts_promise: {
    id: 'el_thoughts_promise',
    type: 'line',
    speaker: null,
    text: "Я не обіцяла цього вголос. \nАле думала щоночі. \nЩо покинула, не врятувала... \nВін озвучує те, у чому я боялася зізнатися навіть собі. \nАле він тут! Це шанс усе виправити. \nКаю!",
    avatar: 'assets/images/ch_main/ch_sad.png',
    next: 'el_chat_4'
  },

   // --- ШЛЯХ ЛОГІКИ (Гравець сумнівається -> Кай імітує ніжність і помиляється) ---
  path_stress: { // Низький distortionDelta - шлях раціональної перевірки
    id: 'path_stress',
    type: 'line',
    speaker: 'Кай',
    text: "Не пам'ятаю як... \nСкрізь був лише холод, темрява. \nІ твій голос, що кликав мене. \nТи чекала? \nПам'ятаєш калину, яку ми мріяли посадити біля дому? \nТи так цього хотіла.",
    avatar: 'assets/images/ch_main/ch_normal.png',
    sound: 'ocean_pulse_soft',
    next: 'el_thoughts_jasmine'
  },

  el_thoughts_jasmine: {
    id: 'el_thoughts_jasmine',
    type: 'line',
    speaker: null,
    text: "Він сказав «калина»... \nАле ми мріяли про бузок. \nБілий, запашний бузок. \nМоя пам'ять зраджує мене? А може... \nЩось змінилося?",
    next: 'el_chat_4'
  },

 // --- СПІЛЬНИЙ ВИХІД ДЛЯ ШЛЯХІВ ЕМОЦІЙНОЇ ТА РАЦІОНАЛЬНОЇ ПЕРЕВІРКИ ---
  el_chat_4: {
    id: 'el_chat_4',
    type: 'line',
    speaker: 'Я',
    text: "Каю... \nЯ все пам'ятаю. \nЯ слухала записи твоїх слів  сотні разів.\nТи говорив про тиск, а потім — тиша.\nА тепер ти тут, говориш зі мною. \nЯк це можливо?",
    next: 'kai_intimate_details'
  },

  kai_intimate_details: {
    id: 'kai_intimate_details',
    type: 'line',
    speaker: 'Кай',
    text: "Того ранку... \nТи зробила каву з корицею і від неї залишилась пляма на рукаві.\nА перед виходом — провела пальцем по подряпині на шоломі і сказала:\n'Це наш знак. Щоб не заблукав'.\nЦі спогади не вносять до звітів, Олесю. \nЦе неможливо підробити.\n Саме вони роблять мене твоїм Каєм.",
    ambient: 'ocean_echo',
    next: 'ai_warning_1'
  },

  ai_warning_1: {
    id: 'ai_warning_1',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ПОПЕРЕДЖЕННЯ: ДАНІ ПРОТИРІЧАТЬ ФІЗИЧНІЙ МОДЕЛІ. \nВІДСУТНЯ БІОМЕТРІЯ ОБ'ЄКТУ. \nАНАЛІЗ ОБМЕЖЕНИЙ.",
    next: 'el_internal_2'
  },

  el_internal_2: {
    id: 'el_internal_2',
    type: 'line',
    speaker: null,
    text: "Система не може помилятися. \n... 125 днів тиші... \nАле він знає.",
    lineCycleSuffix: { prefix: '\nХто ти?', words: ['\nЕхо, мого власного болю?', '\nГалюцинація моєї самотньої свідомості?', '\nДиво, що виявилося можливим?', '\n  ']},
    next: 'el_internal_2_2'
  },
  el_internal_2_2: {
    id: 'el_internal_2_2',
    type: 'line',
    speaker: null,
    text: "Раціональна частина мозку каже: 'це неможливо'. \nАле серце не шукає доказів. \nВоно просто впізнає.",
    next: 'system_analysis'
  },

  system_analysis: {
    id: 'system_analysis',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ВИЯВЛЕНО КРИТИЧНІ ЕМОЦІЙНІ КОЛИВАННЯ ОПЕРАТОРА. \nРЕКОМЕНДАЦІЯ: ІГНОРУВАТИ.",
    next: 'el_emotional_response'
  },
  
  el_emotional_response: {
    id: 'el_emotional_response',
    type: 'line',
    speaker: null,
    text: "Ігнорувати? Машині легко радити.\nАле як ігнорувати того, хто знає твої таємниці? \nГолос, слова, інтонації — усе як раніше.",
    next: 'kai_pressure'
  },

  kai_pressure: {
    id: 'kai_pressure',
    type: 'line',
    speaker: 'Кай',
    text: "Олесю, я тут! \nНе ігноруй... \nЯ більше не зникну. \nОдин шлюз. Одна ручка. \nМи будемо разом. \nЯк обіцяли. \nЗавжди.",
    next: 'el_chat_5'
  },

  el_chat_5: {
    id: 'el_chat_5',
    type: 'line',
    speaker: 'Я',
    text: "Не можу. Розумієш?",
    lineCycleSuffix: { prefix: '\nТи руйнуєш закони ', words: ['фізики', 'термодинаміки', 'логіки.'] },
    next: 'el_chat_5_2'
  },
  el_chat_5_2: {
    id: 'el_chat_5_2',
    type: 'line',
    speaker: 'Я',
    text: "Але... ти руйнуєш також мою самотність. \nІ це — єдиний закон, що має для мене значення.",
    next: 'memory_flashback'
  },

  memory_flashback: {
    id: 'memory_flashback',
    type: 'line',
    speaker: null,
    text: "Того ранку, стоячи на порозі шлюзу, він сказав не обертаючись.",
    next: 'memory_flashback_2'
  },

  memory_flashback_2: {
    id: 'memory_flashback_2',
    type: 'line',
    speaker: 'Кай (спогад)',
    text: "Олесю... Якщо... Якщо щось піде не так...",
    next: 'memory_flashback_3'
  },

  memory_flashback_3: {
    id: 'memory_flashback_3',
    type: 'line',
    speaker: 'Я',
    text: "Не говори такого.",
    next: 'memory_flashback_4'
  },

  memory_flashback_4: {
    id: 'memory_flashback_4',
    type: 'line',
    speaker: null,
    text: "Перебила його я. \nВін обернувся і посміхнувся.",
    next: 'memory_flashback_5'
  },

  memory_flashback_5: {
    id: 'memory_flashback_5',
    type: 'line',
    speaker: 'Кай (спогад)',
    text: "Я не про привидів, люба. \nПро спогади. \nЯ завжди буду в них. \nПоруч.",
    next: 'present_reflection'
  },

  present_reflection: {
    id: 'present_reflection',
    type: 'line',
    speaker: null,
    text: "Спогад.",
    lineCycleSuffix: { prefix: '\nСпогад, що набув ', words: ['ваги.', 'форми.', 'голосу.', 'ваги, форми, голосу.'] },
    next: 'kai_response'
  },

  kai_response: {
    id: 'kai_response',
    type: 'line',
    speaker: 'Кай',
    text:  "Ти чула... Я повернувся. Відчини. \nЯ все ще... кохаю тебе.",
    next: 'final_choice_setup'
  },
  // #endregion

  // #region --- АКТ III. ІНТЕРПРЕТАЦІЯ ---

  final_choice_setup: {
    id: 'final_choice_setup',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "МОДУЛЬ 'ПРОМЕТЕЙ': ГОТОВНІСТЬ ДО СТИКУВАННЯ. \nОЧІКУЮ КОМАНДУ. \nВІДКРИТТЯ ШЛЮЗУ: ЗАБОРОНЕНО ПРОТОКОЛОМ.",
    next: 'el_final_thoughts'
  },

  el_final_thoughts: {
    id: 'el_final_thoughts',
    type: 'line',
    speaker: null,
    text: "'Прометей' — це квиток у світ, де Кай залишиться лише архівним фото та рядком у звіті: \n«загинув при виконанні».\nА тут, за шлюзом...\nвін дихає.\nВін кличе мене.",
    avatar: 'assets/images/ch_main/ch_think.png',
    next: 'el_final_thoughts_2'
  },

  el_final_thoughts_2: {
    id: 'el_final_thoughts_2',
    type: 'line',
    speaker: null,
    text: "Якщо людина існує доти, доки її пам’ятають, \nто де проходить межа між живим і уявним?\nМіж тим, кого втратили,\nі тим, хто ніколи не зникав.",
    avatar: 'assets/images/ch_main/ch_sad.png',
    next: 'el_final_thoughts_3'
  },

  el_final_thoughts_3: {
    id: 'el_final_thoughts_3',
    type: 'line',
    speaker: null,
    text: "Мій Кай завжди жив у моїй свідомості.\nТой, хто говорить зараз...\nце той самий Кай.",
    lineCycleSuffix: { prefix: '\nЦе ', words: ['та ж інформація.', 'ті самі патерни.', 'та сама любов. \nЯ лише обираю між самотністю та коханням.'] }, 
    next: 'the_decision'
  },

  the_decision: {
    id: 'the_decision',
    type: 'choice',
    choices: [
      { label: '«Я впускаю тебе. Відкрити шлюз.»', distortionDelta: +4, next: 'resolve_ending' }, // Прийняти його, незалежно від природи.
      { label: '«Пробач. Я не можу. Заблокувати шлюз.»', distortionDelta: -4, next: 'resolve_ending' } // Залишитися в об'єктивній реальності
    ]
  },

  resolve_ending: {
    id: 'resolve_ending',
    type: 'branch',
    nextByDistortion: { high: 'ending_ocean', low: 'ending_memory' , high_alt: 'pre_ending_ocean', low_alt: 'pre_ending_memory'}
  },
  // #endregion

  // #region --- ФІНАЛИ ---

  // #region --- АЛЬТЕРНАТИВНІ ПЕРЕХОДИ (Mixed Distortion) ---

  // HIGH ALT: Раціональна Олеся вирішує здатися ілюзії
  pre_ending_ocean: {
    id: 'pre_ending_ocean',
    type: 'line',
    speaker: 'Я',
    text: "... 99.8%.\nРозумію, що це іллюзія.\nАле це тепла іллюзія у світі холодної правди.",
    lineCycleSuffix: { prefix: '\nЯ обираю ', words: ['не бути самотньою.', 'помилитися.', 'бути щасливою.'] },
    next: 'ending_ocean' // Перехід до стандартної кінцівки Океану
  },

  // LOW ALT: Емоційна Олеся в останню мить обирає реальність
  pre_ending_memory: {
    id: 'pre_ending_memory',
    type: 'line',
    speaker: 'Я',
    text: "Палець завмер над кнопкою.\nЙого слова — пастка.\nЯ буду пам'ятати тебе, Кай... Завжди.",
    avatar: 'assets/images/ch_main/ch_crying.png', // Тут варто додати сльози
    next: 'ending_memory' // Перехід до стандартної кінцівки Пам'яті
  },
    // #endregion

  // #region --- ФІНАЛ 1: ПАМ'ЯТЬ (Rational) ---
  ending_memory: {
    id: 'ending_memory',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ШЛЮЗ БЛОКОВАНО.\nПРОТОКОЛ БЕЗПЕКИ АКТИВОВАНО. \nЗВ'ЯЗОК ІЗ ЗОВНІШНІМ ОБ'ЄКТОМ ПЕРЕРВАНО.",
    sound: 'lock_hiss',
    next: 'ending_memory_2'
  },

  ending_memory_2: {
    id: 'ending_memory_2',
    type: 'line',
    speaker: 'Я',
    text: "[ОСТАННІЙ ЗАПИС БОРТОВОГО ЖУРНАЛУ]\nМодуль 'Прометей'... евакуація підтверджена. Станція вимикається.\nАномальний сигнал зник. Моніторинг припинено. Всі системи функціонують у межах норми.\nЕкіпаж... відсутній. Я готова до стикування.\nКінець зв'язку.",
    next: 'ending_memory_3'
  },

  ending_memory_3: {
    id: 'ending_memory_3',
    type: 'line',
    speaker: null,
    text: "Не дивлюся в ілюмінатор. \nСигнал зник.\nТиша повернулася, але тепер вона порожніша.\nЯ обрала факт. Холодну правду.\nАле правда не обіймає. Вона просто є.\nІ в ній дуже холодно.",
    avatar: 'assets/images/ch_main/ch_sad.png',
    next: 'title_memory'
  },

  title_memory: { id: 'title_memory', type: 'ending', title: 'КІНЕЦЬ: ПАМ\'ЯТЬ' },
  // #endregion

  // #region --- ФІНАЛ 2: ОКЕАН (Emotional) ---
  ending_ocean: {
    id: 'ending_ocean',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ПРОТОКОЛ ПЕРЕВИЗНАЧЕНО.\nШЛЮЗ ВІДЧИНЯЄТЬСЯ... \n3... 2...  1... ВІДКРИТО.",
    sound: 'door_hydraulics',
    next: 'ending_ocean_2'
  },

  ending_ocean_2: {
    id: 'ending_ocean_2',
    type: 'line',
    speaker: null,
    text: "Шлюз шипить. Він заходить... \nБез скафандра, у старій м’ятій одежі. Його руки теплі та шорсткі. \nВін справжній.",
    avatar: 'assets/images/ch_main/ch_surprised.png',
    next: 'ending_ocean_3'
  },

  ending_ocean_3: {
    id: 'ending_ocean_3',
    type: 'line',
    speaker: "СИСТЕМА",
    text: "УВАГА: АКТИВІЗАЦІЯ ОКЕАНУ.  \nВИЯВЛЕНО ФОРМУВАННЯ НОВИХ СПІРАЛЕВИДНИХ СТРУКТУР.",
    next: 'ending_ocean_4'
  },

  ending_ocean_4: {
    id: 'ending_ocean_4',
    type: 'line',
    speaker: null,
    text: "Станція ніби зітхнула. \nВін обіймає мене. \n Подих, серцебиття... Це реально. \nМусить бути реальним.",
    avatar: 'assets/images/ch_main/ch_normal.png',
    next: 'ending_ocean_5'
  },

  ending_ocean_5: {
    id: 'ending_ocean_5',
    type: 'line',
    speaker: 'Я',
    text: "'Прометей', скасувати евакуацію. \nКай повернувся. \nСитуація стабільна. Ми продовжуємо дослідження. \nЦе... наш вибір.",
    next: 'ending_ocean_6'
  },

  ending_ocean_6: {
    id: 'ending_ocean_6',
    type: 'line',
    speaker: null,
    text: "Більше ніякої тиші. \nВін сміється, торкається мого обличчя і каже, що кохає. \nЦе він... Точно він.",
    next: 'ending_ocean_epilogue'
  },

  ending_ocean_epilogue: {
    id: 'ending_ocean_epilogue',
    type: 'line',
    speaker: null,
    text: "'Прометей' іде порожнім. \nВимикаю зв'язок. \nНехай Земля думає, що станція загинула. \nНехай.",
    next: 'ending_ocean_epilogue_2'
  },

  ending_ocean_epilogue_2: {
    id: 'ending_ocean_epilogue_2',
    type: 'line',
    speaker: null,
    text: "Іноді вночі мені здається, що Океан за вікном спостерігає за нами. \nА Кай обіймає міцніше. Я вірю йому. \nБо це — мій вибір.",
    next: 'title_ocean'
  },
  title_ocean: { id: 'title_ocean', type: 'ending', title: 'КІНЕЦЬ: ОКЕАН' },
  // #endregion
  
  // #endregion
};

function getStep(id) {
  return STORY_STEPS[id] || null;
}
