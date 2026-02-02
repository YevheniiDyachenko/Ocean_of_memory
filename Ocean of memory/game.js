/**
 * Ідеальна Похибка — рушій гри (стан, переходи, показ ліній).
 */
(function () {
  // --- Налаштування (швидко корегувати тут) ---
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
    ambientFadeInMs: 10000,
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
      creditNew: 'created by Yevhenii Diachenko ',
      creditPrefix: 'inspired by ',
      jam: 'for Ukrainian Micro Visual Novel Jam #2',
      jamCps: 22,
      deleteCps: 25,
      loadingSegments: 20,
      sequenceDurationMs: 8000,
      creditPauseBeforeDeleteMs: 2500
    }
  };

  // --- Глобальний стан гри ---
  let distortion = 0;           // нахил до «ілюзії» (позитив) чи «реальності» (негатив)
  let currentStepId = 'start';  // поточний крок історії (id з story.js)
  let typewriterTimer = null;   // таймер посимвольного друку
  /** Активні фонові шари: name -> { audio, fadeTimer }. Кілька можуть грати одночасно. */
  var ambientSounds = {};
  let typingAudio = null;       // звук друку (для зупинки при skip)
  let skipTypingCallback = null;// викликається при кліку для пропуску друку
  let choicesCount = 0;         // кількість зроблених виборів (для фіналу)
  let gameStartTime = null;     // час старту гри (для таймера проходження)
  let skipCount = 0;            // скільки разів пропустили друк (профіль)
  let hesitationTimes = [];     // затримки перед вибором у мс (профіль)
  let choiceAppearTime = null;  // коли з’явилися варіанти вибору
  let finalChoiceEasterEggTimer = null; // таймер пасхалки «ЧОМУ ТИ ВАГАЄШСЯ?»

  /** DOM-елементи (чати, думки, кнопки, оверлеї, титул, фінал, мінігри). */
  const el = {
    chatLog: document.getElementById('chat-log'),
    thoughtsLog: document.getElementById('thoughts-log'),
    thoughtsWrap: document.getElementById('thoughts-wrap'),
    choices: document.getElementById('choices'),
    nextBtn: document.getElementById('next-btn'),
    content: document.getElementById('content'),
    startOverlay: document.getElementById('start-overlay'),
    titleScreen: document.getElementById('title-screen'),
    titleText: document.getElementById('title-text'),
    titleCursor: document.getElementById('title-cursor'),
    titleCredit: document.getElementById('title-credit'),
    noiseBurst: document.getElementById('terminal-noise-burst'),
    horrorOverlay: document.getElementById('horror-overlay'),
    horrorText: document.getElementById('horror-text'),
    endingScreen: document.getElementById('ending-screen'),
    endingTitle: document.getElementById('ending-title'),
    endingStatName: document.getElementById('ending-stat-name'),
    endingStatDistortion: document.getElementById('ending-stat-distortion'),
    endingStatChoices: document.getElementById('ending-stat-choices'),
    endingStatTime: document.getElementById('ending-stat-time'),
    endingStatProfile: document.getElementById('ending-stat-profile'),
    endingRestartBtn: document.getElementById('ending-restart-btn'),
    endingFadeOverlay: document.getElementById('ending-fade-overlay'),
    minigameOverlay: document.getElementById('minigame-overlay'),
    minigamePrompt: document.getElementById('minigame-prompt'),
    minigameTimerWrap: document.getElementById('minigame-timer-wrap'),
    minigameTimerBar: document.getElementById('minigame-timer-bar'),
    minigameInputWrap: document.getElementById('minigame-input-wrap'),
    minigameInput: document.getElementById('minigame-input'),
    minigameHint: document.getElementById('minigame-hint')
  };

  // --- Стан мінігри ---
  var minigameTimeoutId = null;
  var minigameTimerIntervalId = null;
  var minigameKeydownHandler = null;
  var minigameInputHandler = null;
  var minigameInputKeydownHandler = null;
  var minigameSequenceIndex = 0;
  var minigameCurrentStep = null;

  /** Чи користувач прокрутив контейнер майже до кінця (щоб не скролити при новому повідомленні, якщо він читає вище). */
  function isNearBottom(container) {
    if (!container) return true;
    return container.scrollTop + container.clientHeight >= container.scrollHeight - CONFIG.scrollBottomThreshold;
  }

  /** Прокрутити лог чату вниз, якщо користувач уже біля низу. */
  function scrollChatToBottom() {
    if (el.chatLog && isNearBottom(el.chatLog)) {
      el.chatLog.scrollTop = el.chatLog.scrollHeight;
    }
  }

  /** Прокрутити лог думок вниз, якщо користувач уже біля низу. */
  function scrollThoughtsToBottom() {
    if (el.thoughtsLog && isNearBottom(el.thoughtsLog)) {
      el.thoughtsLog.scrollTop = el.thoughtsLog.scrollHeight;
    }
  }

  /** Прокрутити вниз ту панель, куди додається повідомлення (чат або думки). */
  function scrollToBottom(speaker) {
    if (speaker === null || speaker === undefined || speaker === '') scrollThoughtsToBottom();
    else scrollChatToBottom();
  }

  /** Контейнер для повідомлень: думки (speaker порожній) — thoughts-log, інакше — chat-log. */
  function getMessageContainer(speaker) {
    if (speaker === null || speaker === undefined || speaker === '') return el.thoughtsLog || el.chatLog;
    return el.chatLog;
  }

  /* Коліщатко миші скролить панель під курсором (body overflow: hidden). Якщо курсор над областю чату або думок — скролимо відповідний лог. */
  function setupWheelScroll() {
    try {
      var chatWrap = document.getElementById('chat-wrap');
      var thoughtsWrap = document.getElementById('thoughts-wrap');
      var chatLog = document.getElementById('chat-log');
      var thoughtsLog = document.getElementById('thoughts-log');
      if (!chatLog && !thoughtsLog) return;

      function getScrollContainer(node) {
        if (!node || node === document.body) return null;
        if (chatWrap && chatWrap.contains(node)) return chatLog;
        if (thoughtsWrap && thoughtsWrap.contains(node)) return thoughtsLog;
        return null;
      }

      document.addEventListener('wheel', function (e) {
        var container = getScrollContainer(e.target);
        if (!container) return;
        var maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll <= 0) return;
        var delta = e.deltaY;
        container.scrollTop = Math.max(0, Math.min(container.scrollTop + delta, maxScroll));
        e.preventDefault();
        e.stopPropagation();
      }, true);
    } catch (err) {
      console.warn('Wheel scroll setup:', err);
    }
  }

  /** Очистити лог «Мої думки». */
  function clearThoughts() {
    if (el.thoughtsLog) el.thoughtsLog.innerHTML = '';
  }

  /** Показати вікно «Мої думки» (прибрати клас, що ховає його). */
  function showThoughtsWindow() {
    if (el.thoughtsWrap) el.thoughtsWrap.classList.remove('thoughts-empty');
  }

  /** CSS-клас для імені автора (system, kai, me). */
  function getSpeakerClass(speaker) {
    if (speaker === 'СИСТЕМА' || speaker === '???') return 'system';
    if (speaker === 'Кай') {
      if (distortion > 0) return 'kai kai-illusion';
      if (distortion < 0) return 'kai kai-reality';
      return 'kai';
    }
    if (speaker === 'Я') return 'me';
    return '';
  }

  /** Додатковий клас для повідомлень Кая залежно від distortion (ілюзія/реальність). */
  function getMessageKaiClass(speaker) {
    if (speaker !== 'Кай') return '';
    if (distortion > 0) return ' message-kai-illusion';
    if (distortion < 0) return ' message-kai-reality';
    return '';
  }

  /** Клас вирівнювання повідомлення: вихідне (Я) — справа, вхідне — зліва. */
  function getMessageAlignClass(speaker) {
    if (speaker === null || speaker === undefined || speaker === '') return '';
    if (speaker === 'Я') return ' message-outgoing';
    return ' message-incoming';
  }

  /** Рядок часу для підписи повідомлення (ДД.ММ.РРРР ГГ:ХХ:СС). */
  function getMessageTimestamp() {
    var now = new Date();
    var pad = function (n) { return n.toString().length < 2 ? '0' + n : n; };
    return pad(now.getDate()) + '.' + pad(now.getMonth() + 1) + '.' + now.getFullYear() + ' ' +
      pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  }

  /** Відтворити одноразовий звук (спробувати .wav, .mp3, .ogg по черзі). */
  function playSound(name) {
    try {
      var a = new Audio();
      var base = CONFIG.audioPath + name;
      var idx = 0;
      function tryNext() {
        if (idx >= CONFIG.audioExts.length) return;
        a.src = base + CONFIG.audioExts[idx];
        idx++;
        a.play().catch(tryNext);
      }
      tryNext();
    } catch (_) {}
  }

  /** Увімкнути один або кілька фонових шарів (з наростанням гучності). Шари не вимикають один одного. volume 0–1 (за замовчуванням 1). */
  function playAmbient(nameOrNames, loop, volume) {
    if (loop === undefined) loop = true;
    var targetVol = (volume != null && volume >= 0 && volume <= 1) ? volume : 1;
    var names = Array.isArray(nameOrNames) ? nameOrNames : [nameOrNames];
    names.forEach(function (name) {
      if (!name || ambientSounds[name]) return;
      try {
        var base = CONFIG.audioPath + name;
        var extIdx = 0;
        var a = new Audio();
        a.loop = loop;
        a.volume = 0;
        ambientSounds[name] = { audio: a, fadeTimer: null };
        function tryNext() {
          if (extIdx >= CONFIG.audioExts.length) {
            delete ambientSounds[name];
            return;
          }
          a.src = base + CONFIG.audioExts[extIdx];
          extIdx++;
          a.play().then(function () {
            if (!ambientSounds[name]) return;
            var fadeInMs = CONFIG.ambientFadeInMs || 800;
            var stepMs = 50;
            var steps = Math.max(1, Math.floor(fadeInMs / stepMs));
            var stepVol = targetVol / steps;
            var current = 0;
            var t = setInterval(function () {
              current += stepVol;
              if (current >= targetVol) {
                clearInterval(t);
                a.volume = targetVol;
                if (ambientSounds[name]) ambientSounds[name].fadeTimer = null;
                return;
              }
              a.volume = current;
            }, stepMs);
            if (ambientSounds[name]) ambientSounds[name].fadeTimer = t;
          }).catch(tryNext);
        }
        tryNext();
      } catch (_) {}
    });
  }

  /** Затухання і зупинка одного шару за назвою. */
  function stopAmbientLayer(name) {
    var entry = ambientSounds[name];
    if (!entry) return;
    if (entry.fadeTimer) {
      clearInterval(entry.fadeTimer);
      entry.fadeTimer = null;
    }
    var a = entry.audio;
    delete ambientSounds[name];
    if (a.volume <= 0) {
      try { a.pause(); a.currentTime = 0; a.src = ''; } catch (_) {}
      return;
    }
    var fadeOutMs = CONFIG.ambientFadeOutMs || 500;
    var stepMs = 50;
    var steps = Math.max(1, Math.floor(fadeOutMs / stepMs));
    var stepVol = a.volume / steps;
    var t = setInterval(function () {
      a.volume = Math.max(0, a.volume - stepVol);
      if (a.volume <= 0) {
        clearInterval(t);
        try { a.pause(); a.currentTime = 0; a.src = ''; } catch (_) {}
      }
    }, stepMs);
  }

  /** Затухання і зупинка всіх фонових шарів. */
  function stopAmbientSound() {
    var names = Object.keys(ambientSounds);
    names.forEach(function (name) { stopAmbientLayer(name); });
  }

  /** Увімкнути звук друку (loop), попередній typing зупиняється. */
  function playTypingSound() {
    stopTypingSound();
    try {
      var a = new Audio();
      var base = CONFIG.audioPath + 'typing';
      var idx = 0;
      function tryNext() {
        if (idx >= CONFIG.audioExts.length) return;
        a.src = base + CONFIG.audioExts[idx];
        a.loop = true;
        a.muted = false;
        idx++;
        a.play().then(function () { typingAudio = a; }).catch(tryNext);
      }
      typingAudio = a;
      tryNext();
    } catch (_) {}
  }

  /** Зупинити звук друку. */
  function stopTypingSound() {
    var a = typingAudio;
    typingAudio = null;
    if (a) {
      try {
        a.pause();
        a.currentTime = 0;
        a.muted = true;
        a.src = '';
      } catch (_) {}
    }
  }

  /**
   * Callback звуку друку (аналог Ren'Py Character callback).
   * event: "show" — текст почав з'являтися → грати звук
   *        "slow_done" | "end" — текст закінчив друкуватися → зупинити звук
   */
  function typeSoundCallback(event) {
    if (event === 'show') {
      playTypingSound();
    } else if (event === 'slow_done' || event === 'end') {
      stopTypingSound();
    }
  }

  /**
   * Callback для horror/glitch ефекту (опційно).
   * Для використання: додай audio/static_glitch.ogg і викликай тут playTypingSound('static_glitch').
   */
  function glitchSoundCallback(event) {
    typeSoundCallback(event);
  }

  /**
   * Показати рядок з циклом слів: спочатку prefix, потім по черзі слова з масиву words
   * (друк → пауза → стирання до prefix → наступне слово). Для ефекту «вагання».
   */
  function showLineCycleWords(speaker, prefix, words, options) {
    options = options || {};
    el.choices.innerHTML = '';
    el.nextBtn.classList.add('hidden');
    el.content.classList.remove('hidden');
    el.endingScreen.classList.add('hidden');
    if (options.stopAmbient) stopAmbientSound();
    if (options.ambient) playAmbient(options.ambient, true, options.ambientVolume);
    if (options.sound) playSound(options.sound);

    var msg = document.createElement('div');
    msg.className = 'message message-enter' + getMessageAlignClass(speaker) + getMessageKaiClass(speaker);
    if (speaker === 'Кай') {
      var avatarImg = document.createElement('img');
      avatarImg.className = 'message-avatar message-avatar-kai';
      avatarImg.src = 'assets/images/ch_kai.png';
      avatarImg.alt = 'Кай';
      msg.appendChild(avatarImg);
    }
    if (speaker === 'СИСТЕМА' || speaker === '???') {
      var avatarSys = document.createElement('img');
      avatarSys.className = 'message-avatar message-avatar-system';
      avatarSys.src = 'assets/images/ch_system.png';
      avatarSys.alt = speaker === '???' ? '???' : 'СИСТЕМА';
      msg.appendChild(avatarSys);
    }
    if (speaker === null || speaker === undefined || speaker === '') {
      var avatarMain = document.createElement('img');
      avatarMain.className = 'message-avatar message-avatar-main';
      avatarMain.src = 'assets/images/ch_main.png';
      avatarMain.alt = '';
      msg.appendChild(avatarMain);
    }
    var body = document.createElement('div');
    body.className = 'message-body';
    var speakerSpan = document.createElement('div');
    speakerSpan.className = 'message-speaker ' + getSpeakerClass(speaker);
    speakerSpan.appendChild(document.createTextNode(speaker || ''));
    if (speaker !== null && speaker !== undefined && speaker !== '') {
      var timeSpan = document.createElement('span');
      timeSpan.className = 'message-time';
      timeSpan.textContent = ' · ' + getMessageTimestamp();
      speakerSpan.appendChild(timeSpan);
    }
    var textSpan = document.createElement('div');
    textSpan.className = 'message-text';
    var cursorSpan = document.createElement('span');
    cursorSpan.className = 'message-cursor';
    textSpan.appendChild(cursorSpan);
    body.appendChild(speakerSpan);
    body.appendChild(textSpan);
    msg.appendChild(body);
    if (speaker === 'Я') {
      var avatarMe = document.createElement('img');
      avatarMe.className = 'message-avatar message-avatar-main';
      avatarMe.src = 'assets/images/ch_main.png';
      avatarMe.alt = 'Я';
      msg.appendChild(avatarMe);
    }
    var container = getMessageContainer(speaker);
    if (container) {
      container.appendChild(msg);
      if (speaker === null || speaker === undefined || speaker === '') showThoughtsWindow();
    }

    var prefixChars = (prefix || '').split('');
    var prefixIdx = 0;
    var wordIndex = 0; /* порядок: words[0] (перший, невірний), words[1] (другий, невірний), words[2] (третій, залишається) */
    var phase = 'prefix';
    var deleteSpeed = 1000 / CONFIG.cycleWordsDeleteCps;
    var typeSpeed = 1000 / CONFIG.CPS;
    var pauseBetweenWords = CONFIG.cycleWordsPauseBetweenMs;
    var timer = null;

    function getTextBeforeCursor() {
      var s = '';
      for (var n = textSpan.firstChild; n && n !== cursorSpan; n = n.nextSibling)
        if (n.nodeType === 3) s += n.textContent;
      return s;
    }

    function run() {
      if (phase === 'prefix') {
        if (prefixIdx < prefixChars.length) {
          textSpan.insertBefore(document.createTextNode(prefixChars[prefixIdx]), cursorSpan);
          prefixIdx++;
          scrollToBottom(speaker);
          timer = setTimeout(run, typeSpeed);
        } else {
          phase = 'word';
          wordIndex = 0;
          if (words.length === 0) {
            finish();
            return;
          }
          timer = setTimeout(run, pauseBetweenWords);
        }
        return;
      }

      if (phase === 'word') {
        var word = words[wordIndex];
        var isLast = wordIndex === words.length - 1;
        var current = getTextBeforeCursor();
        var expected = prefix + word;
        if (current.length < expected.length) {
          var nextChar = word[current.length - (prefix || '').length];
          if (nextChar != null) {
            textSpan.insertBefore(document.createTextNode(nextChar), cursorSpan);
          }
          scrollToBottom(speaker);
          timer = setTimeout(run, typeSpeed);
        } else {
          if (isLast) {
            finish();
            return;
          }
          phase = 'delete';
          timer = setTimeout(run, pauseBetweenWords);
        }
        return;
      }

      if (phase === 'delete') {
        var cur = getTextBeforeCursor();
        var prefixLen = (prefix || '').length;
        if (cur.length <= prefixLen) {
          phase = 'word';
          wordIndex++;
          timer = setTimeout(run, pauseBetweenWords);
          return;
        }
        var toRemove = textSpan.childNodes;
        for (var i = toRemove.length - 1; i >= 0; i--) {
          if (toRemove[i] === cursorSpan) continue;
          textSpan.removeChild(toRemove[i]);
          break;
        }
        playSound('delete');
        scrollToBottom(speaker);
        timer = setTimeout(run, deleteSpeed);
      }
    }

    function finish() {
      skipTypingCallback = null;
      if (timer) clearTimeout(timer);
      typeSoundCallback('end');
      cursorSpan.classList.add('hidden');
      showThoughtsWindow();
      el.nextBtn.classList.remove('hidden');
      el.nextBtn.onclick = function () { if (options.next) goToStep(options.next); };
      scrollToBottom(speaker);
    }

    function skipToEnd() {
      if (timer) clearTimeout(timer);
      timer = null;
      while (prefixIdx < prefixChars.length) {
        textSpan.insertBefore(document.createTextNode(prefixChars[prefixIdx]), cursorSpan);
        prefixIdx++;
      }
      if (words.length > 0) {
        var lastWord = words[words.length - 1];
        for (var k = 0; k < lastWord.length; k++) {
          textSpan.insertBefore(document.createTextNode(lastWord[k]), cursorSpan);
        }
      }
      scrollToBottom(speaker);
      finish();
    }

    if (prefixChars.length > 0 || words.length > 0) {
      skipTypingCallback = skipToEnd;
      typeSoundCallback('show');
      run();
    } else {
      finish();
    }
  }

  /**
   * Показати одну лінію діалогу/думки: створити повідомлення, додати в чат або думки,
   * друкувати текст посимвольно (з паузою після «...»), опційно glitchText після друку.
   */
  function showLine(speaker, text, options) {
    options = options || {};
    el.choices.innerHTML = '';
    el.nextBtn.classList.add('hidden');
    el.content.classList.remove('hidden');
    el.endingScreen.classList.add('hidden');

    if (options.stopAmbient) stopAmbientSound();
    if (options.ambient) playAmbient(options.ambient, true, options.ambientVolume);
    if (options.sound) playSound(options.sound);

    var msg = document.createElement('div');
    msg.className = 'message message-enter' + getMessageAlignClass(speaker) + getMessageKaiClass(speaker);
    if (speaker === 'Кай') {
      var avatarImg = document.createElement('img');
      avatarImg.className = 'message-avatar message-avatar-kai';
      avatarImg.src = 'assets/images/ch_kai.png';
      avatarImg.alt = 'Кай';
      msg.appendChild(avatarImg);
    }
    if (speaker === 'СИСТЕМА' || speaker === '???') {
      var avatarSys = document.createElement('img');
      avatarSys.className = 'message-avatar message-avatar-system';
      avatarSys.src = 'assets/images/ch_system.png';
      avatarSys.alt = speaker === '???' ? '???' : 'СИСТЕМА';
      msg.appendChild(avatarSys);
    }
    if (speaker === null || speaker === undefined || speaker === '') {
      var avatarMain = document.createElement('img');
      avatarMain.className = 'message-avatar message-avatar-main';
      avatarMain.src = 'assets/images/ch_main.png';
      avatarMain.alt = '';
      msg.appendChild(avatarMain);
    }
    var body = document.createElement('div');
    body.className = 'message-body';
    var speakerSpan = document.createElement('div');
    speakerSpan.className = 'message-speaker ' + getSpeakerClass(speaker);
    speakerSpan.appendChild(document.createTextNode(speaker || ''));
    if (speaker !== null && speaker !== undefined && speaker !== '') {
      var timeSpan = document.createElement('span');
      timeSpan.className = 'message-time';
      timeSpan.textContent = ' · ' + getMessageTimestamp();
      speakerSpan.appendChild(timeSpan);
    }
    var textSpan = document.createElement('div');
    textSpan.className = 'message-text';
    var cursorSpan = document.createElement('span');
    cursorSpan.className = 'message-cursor';
    textSpan.appendChild(cursorSpan);
    body.appendChild(speakerSpan);
    body.appendChild(textSpan);
    msg.appendChild(body);
    if (speaker === 'Я') {
      var avatarMe = document.createElement('img');
      avatarMe.className = 'message-avatar message-avatar-main';
      avatarMe.src = 'assets/images/ch_main.png';
      avatarMe.alt = 'Я';
      msg.appendChild(avatarMe);
    }
    var container = getMessageContainer(speaker);
    if (container) {
      container.appendChild(msg);
      if (speaker === null || speaker === undefined || speaker === '') showThoughtsWindow();
    }
    scrollToBottom(speaker);

    if (!text || text.trim() === '') {
      cursorSpan.classList.add('hidden');
      showThoughtsWindow();
      el.nextBtn.classList.remove('hidden');
      el.nextBtn.onclick = function () { if (options.next) goToStep(options.next); };
      return;
    }

    var chars = text.split('');
    var i = 0;
    var interval = 1000 / CONFIG.CPS;
    var glitchText = options.glitchText;
    var lineCycleSuffix = options.lineCycleSuffix; // { prefix: '...', words: [...] } — цикл слів у тому ж повідомленні після тексту

    if (typewriterTimer) clearTimeout(typewriterTimer);
    if (options.typing !== false) typeSoundCallback('show');

    /** Цикл слів у тому ж повідомленні після основного тексту (prefix → слово → стирання → наступне). */
    var cycleTimer = null;
    function runLineCycleSuffixInPlace() {
      var suffixPrefix = (lineCycleSuffix && lineCycleSuffix.prefix) ? lineCycleSuffix.prefix : '';
      var suffixWords = (lineCycleSuffix && lineCycleSuffix.words) ? lineCycleSuffix.words : [];
      if (suffixWords.length === 0) {
        onLineDone();
        return;
      }
      typeSoundCallback('show');
      var baseLength = 0;
      function getTextLen() {
        var s = '';
        for (var n = textSpan.firstChild; n && n !== cursorSpan; n = n.nextSibling)
          if (n.nodeType === 3) s += n.textContent;
        return s.length;
      }
      baseLength = getTextLen();
      var typeSpeed = 1000 / CONFIG.CPS;
      var deleteSpeed = 1000 / CONFIG.cycleWordsDeleteCps;
      var pauseBetweenWords = CONFIG.cycleWordsPauseBetweenMs;
      var prefixChars = suffixPrefix.split('');
      var prefixIdx = 0;
      var wordIndex = 0;
      var phase = 'prefix';

      function cycleTick() {
        cycleTimer = null;
        if (phase === 'prefix') {
          if (prefixIdx < prefixChars.length) {
            textSpan.insertBefore(document.createTextNode(prefixChars[prefixIdx]), cursorSpan);
            prefixIdx++;
            scrollToBottom(speaker);
            cycleTimer = setTimeout(cycleTick, typeSpeed);
          } else {
            phase = 'word';
            wordIndex = 0;
            cycleTimer = setTimeout(cycleTick, pauseBetweenWords);
          }
          return;
        }
        if (phase === 'word') {
          var word = suffixWords[wordIndex];
          var isLast = wordIndex === suffixWords.length - 1;
          var curLen = getTextLen();
          var prefixLen = baseLength + suffixPrefix.length;
          var expectedLen = prefixLen + word.length;
          if (curLen < expectedLen) {
            var charIdx = curLen - prefixLen;
            if (charIdx >= 0 && charIdx < word.length) {
              textSpan.insertBefore(document.createTextNode(word[charIdx]), cursorSpan);
            }
            scrollToBottom(speaker);
            cycleTimer = setTimeout(cycleTick, typeSpeed);
          } else {
            if (isLast) {
              typeSoundCallback('end');
              cursorSpan.classList.add('hidden');
              showThoughtsWindow();
              if (options.next) {
                el.nextBtn.classList.remove('hidden');
                el.nextBtn.onclick = function () { goToStep(options.next); };
              }
              scrollToBottom(speaker);
              skipTypingCallback = null;
              return;
            }
            phase = 'delete';
            cycleTimer = setTimeout(cycleTick, pauseBetweenWords);
          }
          return;
        }
        if (phase === 'delete') {
          var curLen = getTextLen();
          var prefixLen = baseLength + suffixPrefix.length;
          if (curLen <= prefixLen) {
            phase = 'word';
            wordIndex++;
            cycleTimer = setTimeout(cycleTick, pauseBetweenWords);
            return;
          }
          var toRemove = textSpan.childNodes;
          for (var r = toRemove.length - 1; r >= 0; r--) {
            if (toRemove[r] === cursorSpan) continue;
            textSpan.removeChild(toRemove[r]);
            break;
          }
          playSound('delete');
          scrollToBottom(speaker);
          cycleTimer = setTimeout(cycleTick, deleteSpeed);
        }
      }

      skipTypingCallback = function () {
        if (cycleTimer) clearTimeout(cycleTimer);
        cycleTimer = null;
        while (prefixIdx < prefixChars.length) {
          textSpan.insertBefore(document.createTextNode(prefixChars[prefixIdx]), cursorSpan);
          prefixIdx++;
        }
        var lastWord = suffixWords[suffixWords.length - 1];
        for (var k = 0; k < lastWord.length; k++) {
          textSpan.insertBefore(document.createTextNode(lastWord[k]), cursorSpan);
        }
        scrollToBottom(speaker);
        typeSoundCallback('end');
        cursorSpan.classList.add('hidden');
        showThoughtsWindow();
        if (options.next) {
          el.nextBtn.classList.remove('hidden');
          el.nextBtn.onclick = function () { goToStep(options.next); };
        }
        scrollToBottom(speaker);
        skipTypingCallback = null;
      };
      cycleTick();
    }

    /** Після закінчення друку: або цикл слів (lineCycleSuffix), або glitch (glitchText), або кнопка «Далі». */
    function onLineDone() {
      skipTypingCallback = null;
      typeSoundCallback('end');
      if (typewriterTimer) clearTimeout(typewriterTimer);
      typewriterTimer = null;
      if (glitchText) {
        // Після друку: замінити текст на glitchText посимвольно з ефектом глітчу
        cursorSpan.classList.remove('hidden');
        setTimeout(function () {
          var originalStr = '';
          var n = textSpan.firstChild;
          while (n && n !== cursorSpan) {
            if (n.nodeType === 3) originalStr += n.textContent;
            n = n.nextSibling;
          }
          var originalChars = originalStr.split('');
          var glitchChars = glitchText.split('');
          var maxLen = Math.max(originalChars.length, glitchChars.length);

          while (textSpan.firstChild) textSpan.removeChild(textSpan.firstChild);
          for (var s = 0; s < maxLen; s++) {
            var span = document.createElement('span');
            span.className = 'message-char';
            span.textContent = s < originalChars.length ? originalChars[s] : '\u00A0';
            textSpan.appendChild(span);
          }
          textSpan.appendChild(cursorSpan);

          typeSoundCallback('show');
          var charIdx = 0;
          var glitchSpeed = 20;
          var glitchTimer = null;

          function runGlitch() {
            if (charIdx >= maxLen) {
              typeSoundCallback('end');
              cursorSpan.classList.add('hidden');
              scrollToBottom(speaker);
              showThoughtsWindow();
              if (options.next) {
                el.nextBtn.classList.remove('hidden');
                el.nextBtn.onclick = function () { goToStep(options.next); };
              }
              scrollToBottom(speaker);
              return;
            }
            var span = textSpan.children[charIdx];
            var newChar = charIdx < glitchChars.length ? glitchChars[charIdx] : '';
            span.textContent = newChar || '\u00A0';
            span.classList.add('message-char-glitch');
            setTimeout(function () { span.classList.remove('message-char-glitch'); }, 180);
            if (charIdx % 2 === 0) playSound('delete');
            charIdx++;
            scrollToBottom(speaker);
            glitchTimer = setTimeout(runGlitch, glitchSpeed);
          }

          runGlitch();
        }, 2000);
      } else {
        cursorSpan.classList.add('hidden');
        showThoughtsWindow();
        if (options.next) {
          el.nextBtn.classList.remove('hidden');
          el.nextBtn.onclick = function () { goToStep(options.next); };
        }
        scrollToBottom(speaker);
      }
    }

    /** Пропустити друк: вивести весь текст одразу; якщо є lineCycleSuffix — додати prefix + останнє слово і завершити. */
    skipTypingCallback = function () {
      if (typewriterTimer) clearTimeout(typewriterTimer);
      typewriterTimer = null;
      while (i < chars.length) {
        textSpan.insertBefore(document.createTextNode(chars[i]), cursorSpan);
        i++;
      }
      scrollToBottom(speaker);
      if (lineCycleSuffix && lineCycleSuffix.words && lineCycleSuffix.words.length > 0) {
        var p = (lineCycleSuffix.prefix || '') + lineCycleSuffix.words[lineCycleSuffix.words.length - 1];
        for (var si = 0; si < p.length; si++) {
          textSpan.insertBefore(document.createTextNode(p[si]), cursorSpan);
        }
        scrollToBottom(speaker);
      }
      onLineDone();
    };

    var typingPaused = false; // звук друку зупинено на паузі (крапка, пунктуація)
    /** Один крок друку: один символ, потім setTimeout на наступний (після «...» — пауза 1.5 с). */
    function runTypewriterTick() {
      typewriterTimer = null;
      if (typingPaused) {
        typingPaused = false;
        if (i < chars.length) typeSoundCallback('show');
        else typeSoundCallback('end');
      }
      if (i >= chars.length) {
        if (lineCycleSuffix && lineCycleSuffix.words && lineCycleSuffix.words.length > 0) {
          runLineCycleSuffixInPlace();
        } else {
          onLineDone();
        }
        return;
      }
      textSpan.insertBefore(document.createTextNode(chars[i]), cursorSpan);
      i++;
      scrollToBottom(speaker);
      if (i >= chars.length) typeSoundCallback('end');
      var nextDelay = interval;
      if (i >= 3 && chars[i - 1] === '.' && chars[i - 2] === '.' && chars[i - 3] === '.') {
        nextDelay = CONFIG.pauseAfterEllipsisMs;
      } else if (i >= 1 && chars[i - 1] === '.') {
        nextDelay = CONFIG.pauseAfterDotMs;
      } else if (i >= 1 && CONFIG.punctuationChars && CONFIG.punctuationChars.indexOf(chars[i - 1]) !== -1) {
        nextDelay = CONFIG.pauseAfterPunctuationMs;
      }
      if (nextDelay > interval) {
        typeSoundCallback('end');
        typingPaused = true;
      }
      typewriterTimer = setTimeout(runTypewriterTick, nextDelay);
    }
    typewriterTimer = setTimeout(runTypewriterTick, interval);
  }

  /** Перейти до кроку історії за id; викликає getStep з story.js і showStep. */
  function goToStep(stepId) {
    // #region agent log
    var step = getStep(stepId);
    fetch('http://127.0.0.1:7242/ingest/563d15b4-89e0-4836-8fd1-b648b6c6d8b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:goToStep',message:'goToStep',data:{stepId:stepId,stepNull:!step},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(function(){});
    if (!step) return;
    fetch('http://127.0.0.1:7242/ingest/563d15b4-89e0-4836-8fd1-b648b6c6d8b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:goToStep',message:'goToStep OK',data:{stepId:stepId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(function(){});
    // #endregion
    currentStepId = stepId;
    if (stepId === 'start' && !gameStartTime) gameStartTime = Date.now();
    showStep(step);
  }

  /** Зняти всі слухачі та таймери мінігри. */
  function clearMinigameListeners() {
    if (minigameTimeoutId) {
      clearTimeout(minigameTimeoutId);
      minigameTimeoutId = null;
    }
    if (minigameTimerIntervalId) {
      clearInterval(minigameTimerIntervalId);
      minigameTimerIntervalId = null;
    }
    if (minigameKeydownHandler) {
      document.removeEventListener('keydown', minigameKeydownHandler);
      minigameKeydownHandler = null;
    }
    if (minigameInputHandler && el.minigameInput) {
      el.minigameInput.removeEventListener('input', minigameInputHandler);
      minigameInputHandler = null;
    }
    if (minigameInputKeydownHandler && el.minigameInput) {
      el.minigameInput.removeEventListener('keydown', minigameInputKeydownHandler);
      minigameInputKeydownHandler = null;
    }
    minigameCurrentStep = null;
  }

  /** Мінігра пройдена: очистити слухачі, перейти на step.successNext. */
  function handleMinigameSuccess(step) {
    clearMinigameListeners();
    if (el.minigameOverlay) el.minigameOverlay.classList.add('hidden');
    if (el.content) el.content.classList.remove('hidden');
    if (step.successSound) playSound(step.successSound);
    goToStep(step.successNext);
  }

  /** Мінігра провалена: очистити слухачі, перейти на step.failNext. */
  function handleMinigameFail(step) {
    clearMinigameListeners();
    if (el.minigameOverlay) el.minigameOverlay.classList.add('hidden');
    if (el.content) el.content.classList.remove('hidden');
    if (step.failSound) playSound(step.failSound);
    goToStep(step.failNext);
  }

  /** Показати мінігру: оверлей, prompt, таймер (якщо є), тип (type_word / key_combo / key_sequence). */
  function showMinigame(step) {
    minigameCurrentStep = step;
    el.nextBtn.classList.add('hidden');
    el.choices.innerHTML = '';
    el.content.classList.add('hidden');
    el.endingScreen.classList.add('hidden');
    if (el.minigameOverlay) el.minigameOverlay.classList.remove('hidden');
    if (el.minigamePrompt) el.minigamePrompt.textContent = step.prompt || '';
    if (el.minigameInputWrap) el.minigameInputWrap.classList.add('hidden');
    if (el.minigameHint) el.minigameHint.classList.add('hidden');
    if (el.minigameInput) {
      el.minigameInput.value = '';
      el.minigameInput.blur();
    }

    var timeoutMs = step.timeoutMs || 0;
    if (timeoutMs > 0 && el.minigameTimerWrap && el.minigameTimerBar) {
      el.minigameTimerWrap.classList.remove('hidden');
      var startTime = Date.now();
      function updateBar() {
        if (!minigameCurrentStep || minigameCurrentStep.id !== step.id) return;
        var elapsed = Date.now() - startTime;
        var remaining = Math.max(0, 1 - elapsed / timeoutMs);
        el.minigameTimerBar.style.transform = 'scaleX(' + remaining + ')';
      }
      updateBar();
      minigameTimerIntervalId = setInterval(updateBar, 50);
      minigameTimeoutId = setTimeout(function () {
        minigameTimeoutId = null;
        if (minigameTimerIntervalId) {
          clearInterval(minigameTimerIntervalId);
          minigameTimerIntervalId = null;
        }
        handleMinigameFail(step);
      }, timeoutMs);
    } else if (el.minigameTimerWrap) {
      el.minigameTimerWrap.classList.add('hidden');
    }

    if (step.minigameType === 'type_word') {
      // Мінігра: ввести слово (step.expectedWord), Enter — успіх
      if (el.minigameInputWrap) el.minigameInputWrap.classList.remove('hidden');
      if (el.minigameInput) {
        el.minigameInput.focus();
        var expected = step.expectedWord || '';
        var caseSensitive = !!step.caseSensitive;
        minigameInputHandler = function () {
          var val = el.minigameInput.value;
          var match = caseSensitive ? val === expected : val.toUpperCase() === expected.toUpperCase();
          if (match) handleMinigameSuccess(step);
        };
        minigameInputKeydownHandler = function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            minigameInputHandler();
          }
        };
        el.minigameInput.addEventListener('input', minigameInputHandler);
        el.minigameInput.addEventListener('keydown', minigameInputKeydownHandler);
      }
      return;
    }

    if (step.minigameType === 'key_combo') {
      // Мінігра: натиснути комбінацію клавіш (Ctrl+Alt+Shift+Key)
      var parts = [];
      if (step.ctrlKey) parts.push('Ctrl');
      if (step.altKey) parts.push('Alt');
      if (step.shiftKey) parts.push('Shift');
      parts.push(step.key || '');
      if (el.minigameHint) {
        el.minigameHint.textContent = 'Натисніть: ' + parts.join('+');
        el.minigameHint.classList.remove('hidden');
      }
      minigameKeydownHandler = function (e) {
        var keyMatch = (e.key || '').toUpperCase() === (step.key || '').toUpperCase();
        var ctrl = !!step.ctrlKey === !!e.ctrlKey;
        var alt = !!step.altKey === !!e.altKey;
        var shift = !!step.shiftKey === !!e.shiftKey;
        if (keyMatch && ctrl && alt && shift) {
          e.preventDefault();
          handleMinigameSuccess(step);
        }
      };
      document.addEventListener('keydown', minigameKeydownHandler);
      return;
    }

    if (step.minigameType === 'key_sequence') {
      // Мінігра: натиснути послідовність клавіш (step.sequence)
      var seq = step.sequence || [];
      var keyToSymbol = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
      var hintParts = seq.map(function (k) { return keyToSymbol[k] || k; });
      if (el.minigameHint) {
        el.minigameHint.textContent = 'Послідовність: ' + hintParts.join(' ');
        el.minigameHint.classList.remove('hidden');
      }
      minigameSequenceIndex = 0;
      minigameKeydownHandler = function (e) {
        var expected = seq[minigameSequenceIndex];
        if (!expected) return;
        if ((e.key || '') === expected) {
          e.preventDefault();
          minigameSequenceIndex++;
          if (minigameSequenceIndex >= seq.length) handleMinigameSuccess(step);
        } else {
          minigameSequenceIndex = 0;
        }
      };
      document.addEventListener('keydown', minigameKeydownHandler);
    }
  }

  /**
   * При показі думки el_thoughts_jasmine: у останньому повідомленні Кая в чаті
   * замінити слово «калину» на «бузок» і відтворити глітч (тремтіння + звук).
   */
  function replaceKalynaWithBuzokInPreviousMessage() {
    if (!el.chatLog) return;
    var messages = el.chatLog.querySelectorAll('.message');
    for (var idx = messages.length - 1; idx >= 0; idx--) {
      var msgEl = messages[idx];
      var textEl = msgEl.querySelector('.message-text');
      if (!textEl) continue;
      var fullText = '';
      var cursorSpan = textEl.querySelector('.message-cursor');
      var n = textEl.firstChild;
      while (n) {
        if (n !== cursorSpan) fullText += n.nodeType === 3 ? n.textContent : (n.textContent || '');
        n = n.nextSibling;
      }
      if (fullText.indexOf('калину') === -1) continue;
      var newText = fullText.replace('калину', 'бузок');
      while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
      textEl.appendChild(document.createTextNode(newText));
      msgEl.classList.add('message-glitch');
      playSound('static_burst');
      setTimeout(function (el) { return function () { el.classList.remove('message-glitch'); }; }(msgEl), 550);
      return;
    }
  }

  /**
   * Показати крок історії: line (діалог/думка), lineCycleWords, pause, choice, branch,
   * ending, horror_shake, minigame. Для line перед показом el_thoughts_jasmine — заміна «калину»→«бузок».
   */
  function showStep(step) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/563d15b4-89e0-4836-8fd1-b648b6c6d8b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:showStep',message:'showStep',data:{stepId:step.id,stepType:step.type},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(function(){});
    // #endregion
    skipTypingCallback = null;
    typeSoundCallback('end');
    if (step.type === 'line') {
      if (step.id === 'el_thoughts_jasmine') {
        replaceKalynaWithBuzokInPreviousMessage();
      }
      showLine(step.speaker, step.text, {
        next: step.next,
        sound: step.sound,
        ambient: step.ambient,
        ambientVolume: step.ambientVolume,
        stopAmbient: step.stopAmbient,
        glitchText: step.glitchText,
        lineCycleSuffix: step.lineCycleSuffix
      });
    } else if (step.type === 'lineCycleWords') {
      showLineCycleWords(step.speaker, step.prefix, step.words || [], {
        next: step.next,
        sound: step.sound,
        ambient: step.ambient,
        ambientVolume: step.ambientVolume,
        stopAmbient: step.stopAmbient
      });
    } else if (step.type === 'pause') {
      // Затримка на step.duration мс, потім перехід на step.next
      setTimeout(function () { goToStep(step.next); }, step.duration || 1000);
    } else if (step.type === 'choice') {
      // Показати кнопки вибору; при кліку — distortion += c.distortionDelta, goToStep(c.next)
      if (finalChoiceEasterEggTimer) {
        clearTimeout(finalChoiceEasterEggTimer);
        finalChoiceEasterEggTimer = null;
      }
      el.nextBtn.classList.add('hidden');
      el.choices.innerHTML = '';
      el.content.classList.remove('hidden');
      el.endingScreen.classList.add('hidden');
      showThoughtsWindow();
      choiceAppearTime = Date.now();
      if (step.id === 'the_decision') {
        finalChoiceEasterEggTimer = setTimeout(function () {
          finalChoiceEasterEggTimer = null;
          var msg = 'СИСТЕМА ОЧІКУЄ РІШЕННЯ.\nРЕКОМЕНДАЦІЯ: ПРИЙНЯТИ ВИБІР. ПРОТОКОЛ НЕ ПРИЙМАЄ ВІДКЛАДЕНЬ.';
          showLine('СИСТЕМА', msg, { next: null });
        }, 10000);
      }
      step.choices.forEach(function (c) {
        var btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = c.label;
        if (c.tooltip) btn.title = c.tooltip; // підказка при наведенні
        btn.onclick = function () {
          if (finalChoiceEasterEggTimer) {
            clearTimeout(finalChoiceEasterEggTimer);
            finalChoiceEasterEggTimer = null;
          }
          if (choiceAppearTime) {
            hesitationTimes.push(Date.now() - choiceAppearTime);
            choiceAppearTime = null;
          }
          choicesCount++;
          distortion += c.distortionDelta;
          goToStep(c.next);
        };
        el.choices.appendChild(btn);
      });
    } else if (step.type === 'branch') {
      // Вибір фіналу за distortion: high (≥2), low (≤−2), mid
      var id = distortion >= 2 ? step.nextByDistortion.high : distortion <= -2 ? step.nextByDistortion.low : step.nextByDistortion.mid;
      goToStep(id);
    } else if (step.type === 'ending') {
      // Екран фіналу: затухання екрану, потім заголовок, статистика, кнопка «Перезапустити»
      el.content.classList.add('hidden');
      stopAmbientSound();
      if (el.endingFadeOverlay) el.endingFadeOverlay.classList.add('active');
      setTimeout(function () {
        if (el.endingFadeOverlay) el.endingFadeOverlay.classList.remove('active');
        el.endingTitle.textContent = step.title;
        if (el.endingStatName) el.endingStatName.textContent = step.title.replace(/^КІНЕЦЬ: /, '');
        if (el.endingStatDistortion) el.endingStatDistortion.textContent = distortion;
        if (el.endingStatChoices) el.endingStatChoices.textContent = choicesCount;
        if (el.endingStatTime) {
          var sec = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
          var m = Math.floor(sec / 60);
          var s = sec % 60;
          el.endingStatTime.textContent = (m > 0 ? m + ' хв ' : '') + s + ' с';
        }
        if (el.endingStatProfile) el.endingStatProfile.textContent = getPsychProfile();
        if (el.endingRestartBtn) el.endingRestartBtn.onclick = restartGame;
        el.endingScreen.classList.remove('hidden');
      }, CONFIG.endingFadeMs);
    } else if (step.type === 'horror_shake') {
      // Оверлей жаху: текст + звук, через 3 с — перехід на step.next
      el.content.classList.add('hidden');
      el.horrorText.textContent = step.text;
      el.horrorOverlay.classList.remove('hidden');
      playSound('alarm');
      setTimeout(function () {
        el.horrorOverlay.classList.add('hidden');
        goToStep(step.next);
      }, 3000);
    } else if (step.type === 'minigame') {
      showMinigame(step);
    }
  }

  /** Перезапуск гри: скинути стан, очистити чати/думки/вибори, перейти на start. */
  function restartGame() {
    if (finalChoiceEasterEggTimer) {
      clearTimeout(finalChoiceEasterEggTimer);
      finalChoiceEasterEggTimer = null;
    }
    clearMinigameListeners();
    if (el.minigameOverlay) el.minigameOverlay.classList.add('hidden');
    distortion = 0;
    choicesCount = 0;
    skipCount = 0;
    hesitationTimes = [];
    choiceAppearTime = null;
    gameStartTime = Date.now();
    currentStepId = 'start';
    skipTypingCallback = null;
    typeSoundCallback('end');
    stopAmbientSound();
    el.content.classList.remove('hidden');
    el.chatLog.innerHTML = '';
    el.thoughtsLog.innerHTML = '';
    el.choices.innerHTML = '';
    el.nextBtn.classList.add('hidden');
    el.endingScreen.classList.add('hidden');
    if (el.endingFadeOverlay) el.endingFadeOverlay.classList.remove('active');
    goToStep('start');
  }

  /** Клік по контенту: якщо йде друк і клік не по кнопці — пропустити друк. */
  function onContentClick(e) {
    if (skipTypingCallback && !e.target.closest('button')) {
      skipCount++;
      skipTypingCallback();
    }
  }

  /** Текст профілю для фінального екрану (за distortion, hesitationTimes, skipCount). */
  function getPsychProfile() {
    var avgHesitation = hesitationTimes.length > 0
      ? hesitationTimes.reduce(function (a, b) { return a + b; }, 0) / hesitationTimes.length
      : 0;
    var impatient = skipCount > 2;
    var decisive = avgHesitation < 2000;
    var illusion = distortion > 0;
    var reality = distortion < 0;
    if (illusion && impatient) return 'Втеча від реальності';
    if (illusion && !impatient) return 'Бажання ідеалу';
    if (reality && decisive) return 'Вирішена прийняти правду';
    if (reality && !decisive) return 'Важка чесність';
    if (impatient && !illusion && !reality) return 'Розчавлена тишею';
    if (!decisive && !illusion && !reality) return 'Застрягла між двома світами';
    return 'Баланс';
  }

  /** Запланувати періодичні спалахи шуму на екрані терміналу (ретро-ефект). */
  function scheduleNoiseBurst() {
    if (!el.noiseBurst) return;
    var delay = 2000 + Math.random() * 5000;
    var burstTimer = setTimeout(function () {
      el.noiseBurst.classList.add('active');
      setTimeout(function () {
        el.noiseBurst.classList.remove('active');
        scheduleNoiseBurst();
      }, 120 + Math.random() * 180);
    }, delay);
  }

  // --- Титульний екран (налаштування в CONFIG.title) ---

  /** Створити блок «ЗАВАНТАЖЕННЯ ТЕРМІНАЛУ» з сегментами та кнопкою «Увійти». */
  function createTitleProgressBar() {
    if (document.getElementById('title-progressbar')) {
      document.getElementById('title-progressbar').remove();
    }
    var wrap = document.createElement('div');
    wrap.id = 'title-progressbar';
    wrap.className = 'title-progressbar-wrap';

    var enterBtn = document.createElement('button');
    enterBtn.type = 'button';
    enterBtn.id = 'title-enter-btn';
    enterBtn.className = 'title-enter-btn hidden';
    enterBtn.textContent = 'Увійти';
    enterBtn.onclick = function () { startGameAfterTitle(); };
    wrap.appendChild(enterBtn);

    var row = document.createElement('div');
    row.className = 'title-progressbar-row';

    var label = document.createElement('span');
    label.className = 'title-progressbar-label';
    label.textContent = 'ЗАВАНТАЖЕННЯ ТЕРМІНАЛУ...';
    row.appendChild(label);

    var barOuter = document.createElement('div');
    barOuter.className = 'title-progressbar-bar';
    for (var i = 0; i < CONFIG.title.loadingSegments; i++) {
      var seg = document.createElement('div');
      seg.className = 'title-progressbar-segment';
      seg.dataset.segment = String(i);
      barOuter.appendChild(seg);
    }
    row.appendChild(barOuter);

    var pct = document.createElement('span');
    pct.id = 'title-progressbar-pct';
    pct.className = 'title-progressbar-pct';
    pct.textContent = '0%.';
    row.appendChild(pct);

    wrap.appendChild(row);

    if (el.titleScreen) {
      el.titleScreen.appendChild(wrap);
    }
  }

  /** Анімувати прогрес-бар завантаження за durationMs; в кінці показати кнопку «Увійти». */
  function startTitleProgressBarAnimation(durationMs) {
    var wrap = document.getElementById('title-progressbar');
    var pctEl = document.getElementById('title-progressbar-pct');
    if (!wrap || !pctEl) return;
    var segments = wrap.querySelectorAll('.title-progressbar-segment');
    var total = segments.length;
    var stepMs = durationMs / total;
    var filled = 0;
    pctEl.textContent = '0%.';
    var tick = function () {
      filled++;
      if (filled > total) {
        pctEl.textContent = '100%.';
        return;
      }
      segments[filled - 1].classList.add('filled');
      var p = Math.round((filled / total) * 100);
      pctEl.textContent = p + '%.';
      if (filled < total) {
        setTimeout(tick, stepMs);
      } else {
        pctEl.textContent = '100%.';
        var enterBtn = document.getElementById('title-enter-btn');
        if (enterBtn) enterBtn.classList.remove('hidden');
      }
    };
    setTimeout(tick, stepMs);
  }


  /** Титульна послідовність: назва → credit (старий) → стирання → новий автор → jam-рядок. */
  function runTitleSequence() {
    if (!el.titleScreen || !el.titleText || !el.titleCredit) {
      startGameAfterTitle();
      return;
    }
    createTitleProgressBar();
    startTitleProgressBarAnimation(CONFIG.title.sequenceDurationMs);
    el.titleText.textContent = '';
    el.titleCredit.textContent = '';
    if (el.titleCursor) el.titleCursor.classList.remove('hidden');
    var jamTextEl = document.getElementById('title-jam-text');
    var jamCursorEl = document.getElementById('title-jam-cursor');
    if (jamTextEl) jamTextEl.textContent = '';
    if (jamCursorEl) jamCursorEl.classList.add('hidden');
    var idx = 0;
    function typeTitle() {
      if (idx < CONFIG.title.name.length) {
        el.titleText.textContent += CONFIG.title.name[idx];
        idx++;
        setTimeout(typeTitle, 1000 / CONFIG.title.cps);
      } else {
        typeSoundCallback('end');
        if (el.titleCursor) el.titleCursor.classList.add('hidden');
        typeCreditOld();
      }
    }

    function typeCreditOld() {
      el.titleCredit.textContent = '';
      typeSoundCallback('show');
      var creditChars = CONFIG.title.creditOld.split('');
      var creditIdx = 0;
      function tick() {
        if (creditIdx < creditChars.length) {
          el.titleCredit.textContent += creditChars[creditIdx];
          creditIdx++;
          setTimeout(tick, 1000 / CONFIG.title.creditCps);
        } else {
          typeSoundCallback('end');
          setTimeout(function () {
            if (!el.titleCredit) {
              startGameAfterTitle();
              return;
            }
            var cur = CONFIG.title.creditOld;
            var prefixLen = CONFIG.title.creditPrefix.length;
            function runDelete() {
              if (cur.length <= prefixLen) {
                el.titleCredit.classList.add('title-credit-glitch');
                typeSoundCallback('show');
                var newName = 'Yevhenii Diachenko';
                var typeIdx = 0;
                function runType() {
                  if (typeIdx < newName.length) {
                    cur = CONFIG.title.creditPrefix + newName.substring(0, typeIdx + 1);
                    el.titleCredit.textContent = cur;
                    typeIdx++;
                    setTimeout(runType, 1000 / CONFIG.CPS);
                  } else {
                    typeSoundCallback('end');
                    if (el.titleCredit) el.titleCredit.classList.remove('title-credit-glitch');
                    typeJamText();
                  }
                }
                setTimeout(runType, 1000 / CONFIG.CPS);
                return;
              }
              cur = cur.slice(0, -1);
              el.titleCredit.textContent = cur;
              playSound('delete');
              setTimeout(runDelete, 1000 / CONFIG.title.deleteCps);
            }
            runDelete();
          }, CONFIG.title.creditPauseBeforeDeleteMs);
        }
      }
      setTimeout(tick, 1000 / CONFIG.title.creditCps);
    }

    setTimeout(typeTitle, 600);
  }

  /** Друкувати jam-рядок під титром автора. */
  function typeJamText() {
    var jamTextEl = document.getElementById('title-jam-text');
    var jamCursorEl = document.getElementById('title-jam-cursor');
    if (!jamTextEl) {
      return;
    }
    jamTextEl.textContent = '';
    if (jamCursorEl) jamCursorEl.classList.remove('hidden');
    var jamChars = CONFIG.title.jam.split('');
    var jamIdx = 0;
    var jamInterval = 1000 / CONFIG.title.jamCps;
    function tick() {
      if (jamIdx < jamChars.length) {
        if (jamIdx === 0) typeSoundCallback('show');
        jamTextEl.textContent += jamChars[jamIdx];
        jamIdx++;
        setTimeout(tick, jamInterval);
      } else {
        typeSoundCallback('end');
        if (jamCursorEl) jamCursorEl.classList.add('hidden');
      }
    }
    setTimeout(tick, jamInterval);
  }

  var titleGameStarted = false;
  /** Після титулу: затухання екрану (як у кінцівках), потім сховати титул, почати гру з кроку start, увімкнути шум. */
  function startGameAfterTitle() {
    if (titleGameStarted) return;
    titleGameStarted = true;
    if (el.endingFadeOverlay) el.endingFadeOverlay.classList.add('active');
    setTimeout(function () {
      if (el.endingFadeOverlay) el.endingFadeOverlay.classList.remove('active');
      el.titleScreen.classList.add('hidden');
      gameStartTime = Date.now();
      goToStep('start');
      scheduleNoiseBurst();
    }, CONFIG.endingFadeMs);
  }

  var titleSequenceShown = false;

  /** Запит повноекранного режиму (при натисканні «Увімкнути термінал»). */
  function requestFullscreen() {
    var el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  }

  /** Ініціалізація: скрол коліщатком, клік по контенту (skip), титул або start-overlay, кнопка старту. */
  function init() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/563d15b4-89e0-4836-8fd1-b648b6c6d8b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:init',message:'init',data:{hasSTORY_STEPS:typeof STORY_STEPS!=='undefined',hasGetStep:typeof getStep==='function',chatLog:!!el.chatLog,thoughtsLog:!!el.thoughtsLog},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(function(){});
    fetch('http://127.0.0.1:7242/ingest/563d15b4-89e0-4836-8fd1-b648b6c6d8b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:init',message:'DOM elements',data:{chatLog:!!el.chatLog,thoughtsLog:!!el.thoughtsLog},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(function(){});
    // #endregion
    setupWheelScroll();
    el.nextBtn.onclick = function () {};
    if (el.content) el.content.addEventListener('click', onContentClick);
    if (el.titleScreen) {
      el.titleScreen.classList.add('hidden');
      if (el.startOverlay) el.startOverlay.classList.remove('hidden');
    } else if (el.startOverlay) {
      el.startOverlay.classList.remove('hidden');
    }
    var startBtn = document.getElementById('start-terminal-btn');
    if (startBtn) {
      startBtn.onclick = function () {
        if (el.titleScreen && !titleSequenceShown) {
          titleSequenceShown = true;
          requestFullscreen();
          typeSoundCallback('show');
          setTimeout(function () {
            el.startOverlay.classList.add('hidden');
            el.titleScreen.classList.remove('hidden');
            runTitleSequence();
          }, 80);
        }
      };
    }
    if (el.startOverlay && !startBtn) {
      el.startOverlay.onclick = function () {
        el.startOverlay.classList.add('hidden');
        el.startOverlay.onclick = null;
        gameStartTime = Date.now();
        goToStep('start');
        scheduleNoiseBurst();
      };
    } else if (!el.titleScreen) {
      goToStep('start');
      scheduleNoiseBurst();
    }
  }

  // Запуск після завантаження DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
