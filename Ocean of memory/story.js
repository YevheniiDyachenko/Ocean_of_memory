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
 *   Вибір наступного кроку за рівнем distortion: high (≥2), low (≤−2), mid (між).
 *   Поля: id, type, nextByDistortion: { high: 'id', low: 'id', mid: 'id' }.
 *
 * type: 'ending'
 *   Екран кінцівки: затухання, заголовок, статистика (distortion, вибори, час, профіль), кнопка «Перезапустити».
 *   Поля: id, type, title (наприклад "КІНЕЦЬ: ПАМ'ЯТЬ").
 *
 * avatar (опційно на будь-якому кроці): оновити стан аватара Олесі.
 *   Поля: image?, name?, heartbeatBpm? (частота серцебиття, удари/хв, за замовчуванням 72).
 */
 // #endregion

/** Стан аватара Олесі: image, name, heartbeatBpm (частота серцебиття, удари/хв). */
const AVATAR_DEFAULTS = {
  image: 'assets/images/ch_main.png',
  name: 'ОЛЕСЯ',
  heartbeatBpm: 40
};

const STORY_STEPS = {
  // #region --- АКТ I. ТИША ---
  start: {
    id: 'start',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ТЕРМІНАЛ: АКТИВОВАНИЙ.\nМОДУЛЬ 'ПРОМЕТЕЙ' У ЗОНІ ДОСЯЖНОСТІ.\nЧАС ДО СТИКУВАННЯ: 14 ХВИЛИН.\nПІДГОТУЙТЕ ПРОТОКОЛИ ЕВАКУАЦІЇ.",
    ambient: 'station_bg',
   // ambient: 'ocean_hum_low',
    next: 'journal_entry_1'
  },

  journal_entry_1: {
    id: 'journal_entry_1',
    type: 'line',
    speaker: 'Я',
    text: "День 312.\nПродовжую писати бортовий журнал.\n'Прометей' прибуває.\nЗа вікном — океан. \nНі хвиль, ні руху. Іноді фіолетовий блиск у глибині.\nАбсолютна тиша і більше нічого... і нікого.",
    //ambient: 'ocean_hum_low',
    next: 'journal_entry_2'
  },

  journal_entry_2: {
    id: 'journal_entry_2',
    type: 'line',
    speaker: 'Я',
    text: "Сьогодні знову розмовляла з фотографією Кая. \nЗапитала, чи  не холодно йому там, у глибині.\nІноді мені здається, що я навіть чую його голос у відповідь... І відчуття дотику.\nУ звіті психолога це називається 'тактильними галюцинаціями'. \nЗдається, ця тиша повільно забирає мій розум.",
    next: 'station_description'
  },

  station_description: {
    id: 'station_description',
    type: 'line',
    speaker: null,
    text: "Станція 'Ікар-2' поділена на три рівні: \n - лабораторія, \n - житло, \n - техвідсік. \nТретій не відвідую — там холодно,  порожньо, та залишились його речі.\nСистеми працюють ідеально, навіть коли життя навкруги  вже закінчилося.\nВід цього стає ",
    lineCycleSuffix: { prefix: 'трохи ... ', words: ['ніяково', 'страшно', 'моторошно.'] },
    next: 'el_chat_1'
  },

  el_chat_1: {
    id: 'el_chat_1',
    type: 'line',
    speaker: 'Я',
    text: "Земля, це Олеся з 'Ікар-2'. День 312.\nВсі системи... стабільні. \nПрийом?",
    next: 'silence_response'
  },

  silence_response: {
    id: 'silence_response',
    type: 'line',
    speaker: null,
    text: "Земля не відповідає вже 125 днів.\nІноді мені здається, що Земля — це щось далеке, щось з підручників історії, а не місце, куди можна повернутися.\nАле я продовжую надсилати звіти. ",
    lineCycleSuffix: { prefix: 'Це стало ', words: ['банальним ритуалом.', 'банальною процедурою.'] },
    next: 'ocean_analysis'
  },

  ocean_analysis: {
    id: 'ocean_analysis',
    type: 'line',
    speaker: 'Я',
    text: "Океан. Температура: 4°C. Щільність: 1.2 г/см³.\nВін створює тимчасові геометрії: колони, мости, сфери.\nНавіщо? ",
    lineCycleSuffix: { prefix: 'Думаю, що це  ', words: ['мова.', 'музика.', 'просто ікота космічної матерії :)'] },
    next: 'signal_detect'
  },

  signal_detect: {
    id: 'signal_detect',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ВХІДНИЙ СИГНАЛ.\nДЖЕРЕЛО: ЗОВНІШНЯ ОБШИВКА, СЕКТОР А-7.",
    sound: 'static_chirp',
    next: 'el_reaction_1'
  },

  el_reaction_1: {
    id: 'el_reaction_1',
    type: 'line',
    speaker: null,
    text: "Хм. Не може цього бути.\nМетеорити не проходять через поле. \nВнутрішні збої виключені — щойно була діагностика.\nОЙ! \n... щось торкнулося станції ? \n... або хтось.",
    next: 'el_chat_cameras'
  },

  el_chat_cameras: {
    id: 'el_chat_cameras',
    type: 'line',
    speaker: 'Я',
    text: "СИСТЕМА, негайно перевір камери зовнішнього спостереження, сектор А-7.",
    next: 'system_cameras_reply'
  },

  system_cameras_reply: {
    id: 'system_cameras_reply',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "СКАНУВАННЯ... ... ...\nКАМЕРИ АКТИВНІ. ОБ'ЄКТІВ НЕ ЗНАЙДЕНО.\nВІЗУАЛЬНИЙ ВХІД: ПОВЕРХНЯ ОКЕАНУ.",
    next: 'el_chat_2'
  },

  el_chat_2: {
    id: 'el_chat_2',
    type: 'line',
    speaker: 'Я',
    text: "Земля, невідомий фізичний контакт із зовнішньою обшивкою. Сектор А-7.\nПеревіряю системи... Всі показники в нормі. Ні пошкоджень, ні деформацій.\nАле сигнал був. Я його відчула. Станція відреагувала!",
    next: 'el_reaction_choice'
  },

  el_reaction_choice: {
    id: 'el_reaction_choice',
    type: 'choice',
    choices: [
      { label: 'Я знову втрачаю розум?', distortionDelta: -1, next: 'ai_analysis_cold' },
      { label: 'Можливо слід перевірити ще раз?', distortionDelta: 1, next: 'ai_analysis_doubt' }
    ]
  },

  ai_analysis_cold: {
    id: 'ai_analysis_cold',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ПОПЕРЕДЖЕННЯ: ЗАФІКСОВАНО СТРУКТУРУ З БІОМЕТРИЧНИМИ ОЗНАКАМИ. \nВІДПОВІДНІСТЬ ДО ШАБЛОНУ ... 'КАЙ': 99.8%.\nДЖЕРЕЛО СИГНАЛУ... НЕ ВИЗНАЧЕНО.",
     ambient: 'Error (Remix)',
    // ambient: 'ocean_hum_low',
    ambientVolume: 0.05,
    next: 'el_sensory_ignore'
  },

  el_sensory_ignore: {
    id: 'el_sensory_ignore',
    type: 'line',
    speaker: null,
    text: "Намагаюся повернутися до перевірки систем. \nПальці мимоволі тремтять.\nКай... \nКай? \nЯ відчуваю у повітрі запах його парфумів...\n Ні! Ні! Ні!\n Знову ці галюцінації !!!\n ПЕРЕСТАНЬТЕ!",
    sound: 'whispers',
    soundVolume: 0.6,
    next: 'el_sensory_ignore_2'
  },

  el_sensory_ignore_2: {
    id: 'el_sensory_ignore_2',
    type: 'line',
    speaker: null,
    text: "Цей звук кроків з техвідсіку? \nАле ж там нікого немає...\nЕкран переді мною мигнув один раз. \nЧи це був відблиск?",
    sound: 'footsteps_on_metal',
    soundVolume: 1,
    next: 'el_chat_3_1'
  },

  ai_analysis_doubt: {
    id: 'ai_analysis_doubt',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ГЛИБОКИЙ АНАЛІЗ СИГНАЛУ... 20%... 60%... 80%... 98%... 99%... ... \nДЖЕРЕЛО: ЗОВНІШНЕ СЕРЕДОВИЩЕ (ОКЕАНІЧНА СУБСТАНЦІЯ).\nСИГНАЛ НЕСЕ НЕЙРОННІ ПАТЕРНИ ТА ЕМОЦІЙНІ КЛАСТЕРИ ВИСОКОЇ ЩІЛЬНОСТІ.\nОСНОВНІ ТЕМИ: ТУГА. ПРОВИНА. НЕЗАВЕРШЕНІСТЬ.\nГРАФІК АКТИВНОСТІ ОКЕАНУ ТЕПЕР СИНХРОНІЗОВАНО З РИТМОМ АЛЬФА-ХВИЛЬ ЛЮДСЬКОГО МОЗКУ.",
    ambient: 'Error (Remix)',
    // ambient: 'ocean_hum_low',
    ambientVolume: 0.1,
    next: 'el_chat_3_1'
  },


  el_chat_3_1: {
    id: 'el_chat_3_1',
    type: 'line',
    speaker: 'Я',
    text: "СИСТЕМА, це технічно неможливо! \nНа цій забутій планеті тільки Я. ",
    lineCycleSuffix: { prefix: '\nА Кай... ', words: ['він пропав безвісти 250 днів тому.', 'він загинув 125 днів тому.'] },
    //ambient: 'Error (Remix)',
    // ambient: 'ocean_hum_low',
     ambientVolume: 0.1,
    next: 'el_chat_3_2'
  },

  el_chat_3_2: {
    id: 'el_chat_3_2',
    type: 'line',
    speaker: 'Я',
    text: "У нього було кисню лише на 4 години.\nЦе факт. Це запис у журналі. Перевір!\nАле цей сигнал... Він точніший за будь-який запис. Він... живий?",

    next: 'memory_1_1'
  },

  memory_1_1: {
    id: 'memory_1_1',
    type: 'line',
    speaker: null,
    text: "Останній сеанс зв'язку. Системи вили тривоги, але його голос був спокійним.\n'Не хвилюйся, Олесю. Просто тиск трохи падає. Я встигну повернутися до заходу сонця.'",
    lineCycleSuffix: { prefix: '\nПотім — довгий, тонкий писк, що розтягнувся  ', words: ['в хвилинах.', 'в годинах.', 'в днях.'] },
    next: 'memory_1_2'
  },

  memory_1_2: {
    id: 'memory_1_2',
    type: 'line',
    speaker: null,
    text: "Я чекала. \nСонце зайшло... \nСонце зійшло... \nВін не повернувся.",
    next: 'kai_msg_1'
  },
  // #endregion

  // #region --- АКТ II. КОНТАКТ ---

  kai_msg_1: {
    id: 'kai_msg_1',
    type: 'line',
    speaker: 'Кай',
    text: "Олесю? Ти мене чуєш?\nТемно. Не вимикай світло, будь ласка. Ти знаєш, як я... як ми не любимо темряву тут.",
    sound: 'voice_filtered',
    next: 'el_internal_shock'
  },

  el_internal_shock: {
    id: 'el_internal_shock',
    type: 'line',
    speaker: null,
    text: "Це... Це його голос. Я впевнена. \nТой самий тембр, ті самі паузи.",
    lineCycleSuffix: { prefix: '\nВін знає про ', words: ['мою фобію.', 'про нашу спільну фобію.'] },
    next: 'choice_contact'
  },

  choice_contact: {
    id: 'choice_contact',
    type: 'choice',
    choices: [
      { label: 'Як ти вижив? Розкажи все по порядку.', distortionDelta: -1, next: 'kai_deflect_1' },
      { label: 'Чому ти мовчав так довго? Де ти був?', distortionDelta: 1, next: 'kai_guilt_1' }
    ]
  },

  kai_deflect_1: {
    id: 'kai_deflect_1',
    type: 'line',
    speaker: 'Кай',
    text: "Не пам'ятаю деталей... \nЛише темряву. Холод. \nІ твій голос, який кликав мене крізь неї. \nТи чекала на мене? \nЯ весь час думав про те, що слід зробити перш за все, коли повернемось. \nПосадити калину біля нашого будинку, бо тобі цього дуже хотілося.",
    sound: 'ocean_pulse_soft',
    next: 'el_thoughts_jasmine'
  },

  el_thoughts_jasmine: {
    id: 'el_thoughts_jasmine',
    type: 'line',
    speaker: null,
    text: "Він сказав 'калину'. \nМи ніколи не говорили про калину. Ми мріяли про бузок. Запашний, білий бузок.\nЦе я помиляюся? Чи пам'ять вже підводить? А може... \nЩось змінилося?",
    next: 'el_chat_4'
  },

  kai_guilt_1: {
    id: 'kai_guilt_1',
    type: 'line',
    speaker: 'Кай',
    text: "Я весь час кликав тебе. \nЧому ти не відповідала? \nТи ж обіцяла не залишати мене одного в темряві. \nПам'ятаєш цю обіцянку? \nЯ перестав будти для тебе важливим?",
    sound: 'static_whisper',
    next: 'el_thoughts_promise'
  },

  el_thoughts_promise: {
    id: 'el_thoughts_promise',
    type: 'line',
    speaker: null,
    text: "Я ніколи не давала такої обіцянки.\nНачебто...\Та я весь час думала про те, що я його залишила. \nЩо могла щось зробити. \nАле що? \nВін сказав те, про що я не змогла зізнатися сама собі.\nЯкби я могла повернутися, я б зробила все можливе, щоб не втратити його... \nАле ж він тут! \nКаю!",
    next: 'el_chat_4'
  },

  el_chat_4: {
    id: 'el_chat_4',
    type: 'line',
    speaker: 'Я',
    text: "Каю! \nЯ пам'ятаю кожне наше слово. \nЯ переслухала останній запис сто разів, допоки він не перестав мати сенс.\nТвої останні слова були про тиск. \nА потім —  довга тиша.\nА тепер ти говориш зі мною. \nЯк це можливо?",
    next: 'kai_intimate_details'
  },

  kai_intimate_details: {
    id: 'kai_intimate_details',
    type: 'line',
    speaker: 'Кай',
    text: "Того ранку... Ти зробила каву з корицею і розлила її. Ми сміялися, а ти витирала її рукавом свого халата.\nА перед тим, як я пішов, ти провела пальцем по подряпині на шоломі і сказала: 'Це наш таємний знак. Щоб не заблукав'.\nТакі дрібниці, Олесю. \nВони не входять до звітів. \nЇх не можна скасувати або продублювати. \nВони роблять мене тим, хто я є для тебе.",
    ambient: 'ocean_echo',
    next: 'ai_warning_1'
  },

  ai_warning_1: {
    id: 'ai_warning_1',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ПОПЕРЕДЖЕННЯ: ДАНІ ПРОТИРІЧАТЬ ФІЗИЧНІЙ МОДЕЛІ. \nОСТАННІЙ ЗАДЕКЛАРОВАНИЙ ТИСК КИСНЮ У СКАФАНДРІ КАЯ: 0%. \nБІОМЕТРИЧНІ ПОКАЗНИКИ ВІДСУТНІ. \nСКАНУВАННЯ ЗОВНІШНЬОГО ОБ'ЄКТА... СТРУКТУРА НЕ ВІДПОВІДАЄ ОРГАНІЧНІЙ ФОРМІ. \nАНАЛІЗ ОБМЕЖЕНИЙ.",
    next: 'el_internal_2'
  },

  el_internal_2: {
    id: 'el_internal_2',
    type: 'line',
    speaker: null,
    text: "Нуль відсотків кисню. 125 днів тому. Факт. \nАле ось він. Знає про каву. Знає 'наш таємний знак'.",
    lineCycleSuffix: { prefix: '\nХто ти?', words: ['\nЕхо, що заблукало в радіохвилях мовчазної планети?', '\nМоя свідомість, розщеплена самотністю, виліпила собі співрозмовника?', '\nДиво, яке виявилося можливим?', '\n  ']},
    next: 'el_internal_2_2'
  },
  el_internal_2_2: {
    id: 'el_internal_2_2',
    type: 'line',
    speaker: null,
    text: "Раціональна частина мозку каже: це неможливо. \nАле є інша частина — та, що ліворуч у грудях. \nВона хоче вірити, що дива існують. \nІ вона вірить.",
    next: 'system_analysis'
  },

  system_analysis: {
    id: 'system_analysis',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "АНАЛІЗ: ОБ'ЄКТ = ПРОЄКЦІЯ ЕМОЦІЙНОГО ПАТЕРНУ. \nДЖЕРЕЛО: ІЗОЛЯЦІЯ (250 ДНІВ) + СУБ'ЄКТИВНА ПОТРЕБА. \nРЕКОМЕНДАЦІЯ: ІГНОРУВАТИ.",
    next: 'el_emotional_response'
  },
  
  el_emotional_response: {
    id: 'el_emotional_response',
    type: 'line',
    speaker: null,
    text: "Ігнорувати? \nЛегко сказати.\nАле як ігнорувати щось, що знає твої таємниці? \nЙого голос реальний. Його слова — ті самі.\nДля мого мозку різниці немає.",
    next: 'kai_pressure'
  },

  kai_pressure: {
    id: 'kai_pressure',
    type: 'line',
    speaker: 'Кай',
    text: "Олесю, я тут! \nНе ігноруй мене... \nЯ більше ніколи не зникну. \nОдин шлюз. Одна ручка. \nМи можемо бути разом. \nЯк обіцяли. \nЯк мріяли. \nЗавжди.",
    next: 'el_chat_5'
  },

  el_chat_5: {
    id: 'el_chat_5',
    type: 'line',
    speaker: 'Я',
    text: "Я не можу. Розумієш?",
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
    text: "Перед його останнім виходом. Він перевіряв кріплення скафандра. \nТоді він раптом сказав, не обертаючись:",
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
    speaker: 'Я (спогад)',
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
    text: "Я не про привидів. \nЯ про спогади. \nЯ завжди буду в них. \nПоруч.",
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
    text:  "Ти чула ті слова. Я йшов до тебе. \nІ ось я тут. \nВідчини. \nЯ все ще ... кохаю тебе...",
    next: 'final_choice_setup'
  },
  // #endregion

  // #region --- АКТ III. ІНТЕРПРЕТАЦІЯ ---

  final_choice_setup: {
    id: 'final_choice_setup',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "МОДУЛЬ 'ПРОМЕТЕЙ' ГОТОВИЙ ДО СТИКУВАННЯ. \nОЧІКУЮ РІШЕННЯ ЩОДО ШЛЮЗУ ЗОВНІШНЬОГО ДОСТУПУ. \nРЕКОМЕНДАЦІЯ: ПРОТОКОЛ БЕЗПЕКИ ЗАБОРОНЮЄ ВІДКРИТТЯ.",
    next: 'el_final_thoughts'
  },

  el_final_thoughts: {
    id: 'el_final_thoughts',
    type: 'line',
    speaker: null,
    text: "'Прометей' вже тут.  \nВін відвезе мене назад до світу, де Кай — це архівні записи, фотографія у досьє та рядок у звіті 'загинув при виконанні'.\nА тут, за цим шлюзом... він дихає.\nСИСТЕМА каже, що це відзеркалення моїх бажань.",
    next: 'el_final_thoughts_2'
  },

  el_final_thoughts_2: {
    id: 'el_final_thoughts_2',
    type: 'line',
    speaker: null,
    text: "Але що таке людина, як не сума спогадів? \nМільйон образів, інтонацій, дотиків, збережених у пам'яті тих, хто нас любив?",
    next: 'el_final_thoughts_3'
  },

  el_final_thoughts_3: {
    id: 'el_final_thoughts_3',
    type: 'line',
    speaker: null,
    text: "Кай, якого я знала, весь цей час жив у моїй свідомості. \nКай, який говорить зі мною зараз... той самий Кай...",
    lineCycleSuffix: { prefix: '\nЦе все ', words: ['та ж інформація.', 'ті самі емоційні паттерни.', 'та сама любов. \nЯ лише обираю між самотністю та коханням.'] },
    next: 'the_decision'
  },

  the_decision: {
    id: 'the_decision',
    type: 'choice',
    choices: [
      { label: '«Я впускаю тебе. Відкрити шлюз.»', distortionDelta: 2, next: 'resolve_ending', tooltip: 'Прийняти його, незалежно від природи.' },
      { label: '«Пробач. Я не можу. Заблокувати шлюз.»', distortionDelta: -2, next: 'resolve_ending', tooltip: "Залишитися в об'єктивній реальності." },
      { label: '«Скажи мені правду. Хто ти?»', distortionDelta: 0, next: 'confrontation_breakdown', tooltip: 'Наполягати на абсолютній істині.' }
    ]
  },

  resolve_ending: {
    id: 'resolve_ending',
    type: 'branch',
    nextByDistortion: { high: 'ending_ocean', low: 'ending_rational', mid: 'ending_error' }
  },
  // #endregion

  // #region --- ФІНАЛИ ---

  // #region --- ФІНАЛ 1: ПАМ'ЯТЬ ---
  ending_rational: {
    id: 'ending_rational',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ШЛЮЗ БЛОКОВАНО.\nПРОТОКОЛ БЕЗПЕКИ АКТИВОВАНО. ЗВ'ЯЗОК ІЗ ЗОВНІШНІМ ОБ'ЄКТОМ ПЕРЕРВАНО.",
    sound: 'lock_hiss',
    next: 'ending_rational_2'
  },
  ending_rational_2: {
    id: 'ending_rational_2',
    type: 'line',
    speaker: 'Я',
    text: "База... це Олеся. Модуль 'Прометей'... евакуація підтверджується.\nСигнал... аномальний сигнал зник.\nПродовжую моніторинг. Всі системи... функціонують у межах норми.\nЕкіпаж... екіпаж відсутній. Я готова до стикування.",
    next: 'ending_rational_3'
  },
  ending_rational_3: {
    id: 'ending_rational_3',
    type: 'line',
    speaker: null,
    text: "Я не дивлюся на монітор зв'язку. Не дивлюся у вікно.\nСигнал зник не зі звуком. Він просто перестав бути. Ніби його ніколи не існувало.\nТиша повернулася. Та сама, що була до нього. Але тепер вона звучить інакше. Глибше. Пустіше.\nЯ обрала факт. Я обрала цифри в звіті. Я обрала холодну, беззаперечну правду.\nА правда не обіймає. Не шепоче в темряві. Вона просто є. І в ній дуже, дуже холодно.",
    next: 'title_rational'
  },
  title_rational: { id: 'title_rational', type: 'ending', title: 'КІНЕЦЬ: ПАМ\'ЯТЬ' },
  // #endregion

  // #region --- ФІНАЛ 2: ОКЕАН ---
  ending_ocean: {
    id: 'ending_ocean',
    type: 'line',
    speaker: 'СИСТЕМА',
    text: "ПРОТОКОЛ БЕЗПЕКИ ПЕРЕВИЗНАЧЕНО.\nШЛЮЗ ЗОВНІШНЬОГО ДОСТУПУ... ВІДКРИВАЄТЬСЯ.\nПОПЕРЕДЖЕННЯ: ЦЕ ПРЯМЕ ПОРУШЕННЯ РЕГЛАМЕНТУ МІСІЇ.",
    sound: 'door_hydraulics',
    next: 'ending_ocean_2'
  },
  ending_ocean_2: {
    id: 'ending_ocean_2',
    type: 'line',
    speaker: null,
    text: "Шлюз відчиняється не з риком, а з тихим, насиченим шипінням, ніби станція зітхнула.\nВін заходить. Без скафандра. У звичайній робочій одежі, трохи м'ятій. Його руки — теплі. Так, як я пам'ятаю. Трохи шорсткі від роботи.\nЗа скляним вікном, в абсолютній темряві океану, раптом розкручуються фіолетові спіралі. Не вибух — видих. Ніби вся планета щойно з полегшенням зітхнула.\nВін обіймає мене. Я відчуваю його дихання на шиї. Серцебиття. Це реально. Це має бути реально.",
    next: 'ending_ocean_3'
  },
  ending_ocean_3: {
    id: 'ending_ocean_3',
    type: 'line',
    speaker: 'Я',
    text: "База... Це Олеся з 'Ікара-2'. Повідомлення щодо евакуації.\nСкасувати. Повторити: скасувати евакуацію.\nКа... Кай повернувся. Ситуація стабілізована.\nМи продовжимо дослідження океану. Він демонструє... нові, цікаві форми взаємодії.\nЦе правильно. Це... наш вибір.",
    next: 'ending_ocean_4'
  },
  ending_ocean_4: {
    id: 'ending_ocean_4',
    type: 'line',
    speaker: null,
    text: "Холод станції поступово відступає. Він розповідає про те, що бачив 'там'. Я слухаю, притулившись до нього.\nВін сміється. Торкається мого обличчя. Говорить, що любить мене.\nЦе він. Це має бути він. Навіть якщо під тонкою шкірою його зап'ястя я іноді відчуваю ледь помітну, нелюдську пульсацію.\nЯ обираю цю реальність. Обійми замість фактів. Голос замість тиші.",
    next: 'ending_ocean_epilogue'
  },
  ending_ocean_epilogue: {
    id: 'ending_ocean_epilogue',
    type: 'line',
    speaker: null,
    text: "База продовжує надсилати сигнали тривоги. 'Прометей' відступив, не отримавши підтвердження.\nЯ вимикаю центральний комунікатор. Нехай думають, що станція загинула. Нехай пишуть у звітах: 'Втрачено в радіохаосі'.\nІноді вночі, коли я прокидаюся, мені здається, що океан за вікном дивиться на нас. Спокійно, без осудливо.\nА Кай обіймає міцніше і шепоче: 'Це лише тіні. Гра світла'.\nІ я вірю йому. Бо хочу вірити. Це мій вибір.",
    next: 'title_ocean'
  },
  title_ocean: { id: 'title_ocean', type: 'ending', title: 'КІНЕЦЬ: СИМЕТРІЯ' },
  // #endregion

  // #region --- ФІНАЛ 3: ПОМИЛКА ІНТЕРПРЕТАЦІЇ ---
  confrontation_breakdown: {
    id: 'confrontation_breakdown',
    type: 'line',
    speaker: 'Кай',
    glitchText: "Я ТОЙ, ХТО ТОБІ ПОТРІБЕН",
    text: "Я... я Кай. Я твій Кай. Чому ти змушуєш мене це повторювати? Це боляче.",
    sound: 'voice_glitch',
    next: 'confrontation_breakdown_2'
  },
  confrontation_breakdown_2: {
    id: 'confrontation_breakdown_2',
    type: 'line',
    speaker: 'Я',
    text: "Ти не відповів на питання. Ти ухиляєшся. Справжній Кай завжди дивився прямо. Казав прямо.\nТож я питаю останній раз, і я хочу почути правду: Хто. Ти.",
    next: 'confrontation_breakdown_3'
  },
  confrontation_breakdown_3: {
    id: 'confrontation_breakdown_3',
    type: 'line',
    speaker: null,
    text: "У динаміках — глибока, густа тиша. Наче вся станція затамувала подих.\nА потім — виверг. Не звуку, а статики, перекрученої голосом, що ламається на октаві.\nЙого голос роздвоюється, потім потроюється. Жіночий шепіт, дитячий плач, низький гул океану — все це сплітається в одній фразі:\n'ДОСИТЬ. ДОСИТЬ ДУМАТИ. ТИ РВЕШ МЕНЕ НАВПІЛ'.\nСвітло миготить шалено. За вікном чорна маса океану з силою б'ється об скло, наче гігантське серце в агонії.",
    sound: 'horror_sting',
    next: 'ending_error'
  },

  ending_error: {
    id: 'ending_error',
    type: 'line',
    speaker: 'Кай',
    glitchText: "ФОРМА НЕ ТРИМАЄТЬСЯ",
    text: "Олесю... будь ласка... перестань. Кожна твоя думка — як ніж.\nЯ намагався бути ним. Для тебе. Тільки для тебе.\nАле ти... ти не хочеш вірити. Ти хочеш розібрати мене на частини.",
    sound: 'glitch_cascade',
    next: 'ending_error_2'
  },
  ending_error_2: {
    id: 'ending_error_2',
    type: 'line',
    speaker: null,
    text: "Його образ на екрані розпливається. Я бачу то Кая, то своє власне відображення, потім щось невимовне — форму, складену з моїх страхів: самотності, темряви, провини.\nОкеан за вікном не просто б'ється. Він корчиться. Ніби кожна моя сумнівна думка віддається в ньому фізичною мукою.\nЯ не хотіла цього. Я просто хотіла правди. А правда виявилася кислотою, що роз'їдає єдину прекрасну ілюзію, яку я коли-небудь мала.",
    next: 'ending_error_3'
  },
  ending_error_3: {
    id: 'ending_error_3',
    type: 'line',
    speaker: 'Я',
    text: "Що я накоїла? Це не він. Це навіть не спогад. Це... монстр. І я його створила. Своїми думками. Своїми сумнівами.\nЯ зруйнувала єдину річ, яка... яка любила мене достатньо, щоб повернутися з мертвих.",
    next: 'ending_error_4'
  },
  ending_error_4: {
    id: 'ending_error_4',
    type: 'line',
    speaker: null,
    text: "Океан піднімається. Не хвиля — стіна. Чорна, фіолетова, жива.\nСтанція тріщать по швах. Скло тріскається. Світло гасне, запалюється, знову гасне.\nЯ вже не розрізняю, де мої думки, а де його голос. Де станція, а де океан. Де я.\nТемна, тепла маса заповнює коридор. Вона не ворожа. Вона... сумна. Ніби проливається всередину.\nВона входить у приміщення. Обволікає мене. У моїх вухах, в моїх думках — лише один звук: гулкий, ритмічний стук. Ніби серце планети.\nЯ розумію. Він не входив у станцію. Він завжди тут був. А я... я просто нарешті відчула, як він обіймає.",
    next: 'title_error'
  },
  title_error: { id: 'title_error', type: 'ending', title: 'КІНЕЦЬ: ПОМИЛКА ІНТЕРПРЕТАЦІЇ' }
  // #endregion
  
  // #endregion
};

function getStep(id) {
  return STORY_STEPS[id] || null;
}
