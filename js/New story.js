const STORY_STEPS = {
  // #region --- АКТ I. ТИША (BPM: 60-70 -> 120) ---
  
  start: {
    id: 'start',
    dockingLabel: { text: 'T-10:00', color: '#00ff00' }, // Зелений: час ще є
    ambient: 'station_hum_stable',
    ambientVolume: 0.8,
    sound: 'sys_boot_sequence',
    heartbeatBpm: 60, // Спокійний пульс
    next: 'journal_entry_1'
  },

  journal_entry_1: {
    id: 'journal_entry_1',
    dockingLabel: { text: 'T-09:45', color: null },
    avatar: 'assets/images/ch_main/ch_print_calm.png',
    heartbeatBpm: 70, // Легке пожвавлення
    next: 'journal_entry_2'
  },

  journal_entry_2: {
    id: 'journal_entry_2',
    dockingLabel: { text: 'T-09:30', color: null },
    // Підсвідомість проривається через глітч
    glitchText: "ВОНО ДИВИТЬСЯ НА МЕНЕ.", 
    lineCycleSuffix: { prefix: 'Це  ', words: ['мова?', 'музика?', 'пухлина реальності?'] },
    ambient: ['station_hum_stable', 'underwater_pressure_low'], // Додаємо тиск води на фон
    next: 'station_description'
  },

  station_description: {
    id: 'station_description',
    avatar: 'assets/images/ch_main/ch_idle_sad.png',
    sound: 'ventilation_sigh',
    lineCycleSuffix: { prefix: '... ', words: ['страшно', 'самотньо', 'порожньо.'] },
    next: 'journal_entry_3'
  },

  journal_entry_3: {
    id: 'journal_entry_3',
    heartbeatBpm: 65, // Апатія
    glitchText: "ЦЯ ТИША ВЖЕ ЗАБРАЛА ЙОГО.",
    next: 'signal_detect'
  },

  // #region --- ПОВОРОТНИЙ МОМЕНТ (Сигнал) ---

  signal_detect: {
    id: 'signal_detect',
    dockingLabel: { text: 'T-08:50', color: 'orange' }, // Увага
    sound: 'alarm_short_hightone',
    heartbeatBpm: 120, // Різкий стрибок адреналіну
    avatar: 'assets/images/ch_main/ch_alert.png',
    next: 'el_reaction_1'
  },

  el_reaction_1: {
    id: 'el_reaction_1',
    sound: 'hull_creak_metal', // Звук фізичного контакту
    next: 'el_chat_cameras'
  },

  el_chat_cameras: {
    id: 'el_chat_cameras',
    avatar: 'assets/images/ch_main/ch_command.png',
    heartbeatBpm: 125,
    next: 'system_cameras_reply'
  },

  system_cameras_reply: {
    id: 'system_cameras_reply',
    sound: 'computer_processing',
    next: 'el_chat_2'
  },

  el_chat_2: {
    id: 'el_chat_2',
    avatar: 'assets/images/ch_main/ch_confused.png',
    glitchText: "Я ЧУЛА ЙОГО. Я НЕ БОЖЕВІЛЬНА.",
    next: 'el_reaction_choice'
  },

  el_reaction_choice: {
    id: 'el_reaction_choice',
    dockingLabel: { text: 'T-08:15', color: 'orange' },
    choices: [
      { distortionDelta: +1, next: 'ai_analysis_cold' }, 
      { distortionDelta: -1, next: 'ai_analysis_doubt' } // Залишив логіку розгалуження
    ]
  },

  // #region --- АКТ II. КОНТАКТ (BPM: 140 -> 90 -> 160) ---

  ai_analysis_cold: { 
    id: 'ai_analysis_cold',
    ambient: 'horror_drone_low', // Зміна атмосфери на жах
    ambientVolume: 0.4,
    sound: 'glitch_noise',
    glitchText: "ВІДПОВІДНІСТЬ: МЕРЕЦЬ.",
    heartbeatBpm: 140,
    next: 'el_sensory_ignore' 
  },

  el_sensory_ignore: {
    id: 'el_sensory_ignore',
    sound: 'whispers_binaural',
    soundVolume: 0.7,
    avatar: 'assets/images/ch_main/ch_panic_hands.png',
    heartbeatBpm: 155, // Паніка
    next: 'el_sensory_ignore_2'
  },

  kai_msg_1: {
    id: 'kai_msg_1',
    dockingLabel: { text: 'T-06:00', color: 'red' }, // Критичний час
    lineCycleSuffix: { prefix: '\nТи знаєш,  ', words: ['як я...', 'як ми не любимо темряву.'] },
    sound: 'voice_kai_distorted',
    glitchText: "НЕ ВИМИКАЙ МЕНЕ.",
    heartbeatBpm: 160,
    next: 'el_internal_shock'
  },

  kai_intimate_details: {
    id: 'kai_intimate_details',
    // Ефект гіпнозу: мікс мелодії та статики
    ambient: ['ocean_echo_melodic', 'static_interference'], 
    ambientVolume: 0.5,
    sound: 'heartbeat_skip', // Пропущений удар серця
    heartbeatBpm: 90, // Пульс падає (заспокоєння/транс)
    avatar: 'assets/images/ch_main/ch_hopeful.png',
    next: 'ai_warning_1'
  },

  ai_warning_1: {
    id: 'ai_warning_1',
    sound: 'alert_critical', // Різкий вихід із трансу
    glitchText: "ЦЕ НЕ ЛЮДИНА. ЦЕ ВІДБИТОК.",
    next: 'el_internal_2'
  },

  // #region --- АКТ III. ФІНАЛ (BPM: 140 -> 180 -> Фінал) ---

  final_choice_setup: {
    id: 'final_choice_setup',
    dockingLabel: { text: 'T-01:30', color: 'flashing_red' },
    sound: 'siren_loop',
    heartbeatBpm: 140,
    next: 'el_final_thoughts_3'
  },

  el_final_thoughts_3: {
    id: 'el_final_thoughts_3',
    lineCycleSuffix: { prefix: '\nЦе ', words: ['пастка?', 'шанс?', 'любов.'] }, 
    glitchText: "Я ХОЧУ ЩОБ ВІН БУВ РЕАЛЬНИМ.",
    next: 'the_decision'
  },

  the_decision: {
    id: 'the_decision',
    dockingLabel: { text: 'T-00:15', color: 'red' },
    // "Дзвінка тиша" перед вибором
    ambient: null, // Вимикаємо фон повністю
    sound: 'high_pitch_ear_ringing',
    heartbeatBpm: 180, // Максимальний стрес
    choices: [
      { distortionDelta: +4, next: 'resolve_ending' },
      { distortionDelta: -4, next: 'resolve_ending' }
    ]
  },

  // --- ФІНАЛИ ---

  ending_memory: {
    id: 'ending_memory',
    dockingLabel: { text: 'СТИКУВАННЯ...', color: 'green' },
    sound: 'door_lock_heavy',
    stopAmbient: true, // Повна тиша
    heartbeatBpm: 40, // Майже смерть / порожнеча
    glitchText: "ВІН ПОМЕР ЗНОВУ. ЧЕРЕЗ ТЕБЕ.",
    next: 'ending_memory_2'
  },

  ending_ocean: {
    id: 'ending_ocean',
    dockingLabel: { text: 'ПОМИЛКА', color: 'red' },
    sound: 'door_hydraulics_open',
    ambient: 'ocean_roar_surround', // Гучний звук
    ambientVolume: 1.0,
    heartbeatBpm: 100, // Живий ритм
    glitchText: "МИ ТЕПЕР ЄДИНІ.",
    next: 'ending_ocean_2'
  }
};