/**
 * Типограф: showLineCycleWords (цикл слів), showLine (посимвольний друк, glitch, lineCycleSuffix).
 */

function resetAvatarAfterTyping() {
  if (typeof currentAvatarState === 'undefined' || typeof AVATAR_DEFAULTS === 'undefined') return;
  currentAvatarState.image = AVATAR_DEFAULTS.image;
  currentAvatarState.name = AVATAR_DEFAULTS.name;
  currentAvatarState.heartbeatBpm = AVATAR_DEFAULTS.heartbeatBpm;
  updateAvatarModule(currentAvatarState);
}

function createMessageAvatar(src, className, alt) {
  var img = document.createElement('img');
  img.className = className;
  img.src = src;
  img.alt = alt || '';
  img.onerror = function () {
    if (img && img.parentNode) img.parentNode.removeChild(img);
  };
  return img;
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
  if (options.sound) playSound(options.sound, options.soundVolume);

  var msg = document.createElement('div');
  msg.className = 'message message-enter' + getMessageAlignClass(speaker) + getMessageKaiClass(speaker);
  var speakerClass = getSpeakerClass(speaker);
  if (speakerClass.indexOf('kai') === 0) {
    msg.appendChild(createMessageAvatar('assets/images/ch_kai.png', 'message-avatar message-avatar-kai', 'Кай'));
  }
  if (speakerClass === 'system') {
    msg.appendChild(createMessageAvatar('assets/images/ch_system.png', 'message-avatar message-avatar-system', speaker === '???' ? '???' : 'СИСТЕМА'));
  }
  if (speaker === null || speaker === undefined || speaker === '') {
    msg.appendChild(createMessageAvatar('assets/images/ch_main.png', 'message-avatar message-avatar-main', ''));
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
  if (speakerClass === 'me') {
    msg.appendChild(createMessageAvatar('assets/images/ch_main.png', 'message-avatar message-avatar-main', 'Я'));
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
    resetAvatarAfterTyping();
    showThoughtsWindow();
    showNextButton(options.next);
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
    showSkipButton();
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
  if (options.sound) playSound(options.sound, options.soundVolume);

  var msg = document.createElement('div');
  msg.className = 'message message-enter' + getMessageAlignClass(speaker) + getMessageKaiClass(speaker);
  var speakerClass = getSpeakerClass(speaker);
  if (speakerClass.indexOf('kai') === 0) {
    msg.appendChild(createMessageAvatar('assets/images/ch_kai.png', 'message-avatar message-avatar-kai', 'Кай'));
  }
  if (speakerClass === 'system') {
    msg.appendChild(createMessageAvatar('assets/images/ch_system.png', 'message-avatar message-avatar-system', speaker === '???' ? '???' : 'СИСТЕМА'));
  }
  if (speaker === null || speaker === undefined || speaker === '') {
    msg.appendChild(createMessageAvatar('assets/images/ch_main.png', 'message-avatar message-avatar-main', ''));
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
  if (speakerClass === 'me') {
    msg.appendChild(createMessageAvatar('assets/images/ch_main.png', 'message-avatar message-avatar-main', 'Я'));
  }
  var container = getMessageContainer(speaker);
  if (container) {
    container.appendChild(msg);
    if (speaker === null || speaker === undefined || speaker === '') showThoughtsWindow();
  }
  scrollToBottom(speaker);

  if (!text || text.trim() === '') {
    cursorSpan.classList.add('hidden');
    resetAvatarAfterTyping();
    showThoughtsWindow();
    showNextButton(options.next);
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
    resetAvatarAfterTyping();
            showThoughtsWindow();
            showNextButton(options.next);
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
    resetAvatarAfterTyping();
      showThoughtsWindow();
      showNextButton(options.next);
      scrollToBottom(speaker);
      skipTypingCallback = null;
    };
    showSkipButton();
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

        skipTypingCallback = function () {
          if (glitchTimer) clearTimeout(glitchTimer);
          glitchTimer = null;
          for (var gi = 0; gi < maxLen; gi++) {
            var sp = textSpan.children[gi];
            if (sp && sp !== cursorSpan) sp.textContent = gi < glitchChars.length ? glitchChars[gi] : '\u00A0';
          }
          typeSoundCallback('end');
          cursorSpan.classList.add('hidden');
    resetAvatarAfterTyping();
          scrollToBottom(speaker);
          showThoughtsWindow();
          showNextButton(options.next);
          skipTypingCallback = null;
        };
        showSkipButton();

        function runGlitch() {
          if (charIdx >= maxLen) {
            typeSoundCallback('end');
            cursorSpan.classList.add('hidden');
    resetAvatarAfterTyping();
            scrollToBottom(speaker);
            showThoughtsWindow();
            showNextButton(options.next);
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
    resetAvatarAfterTyping();
      showThoughtsWindow();
      showNextButton(options.next);
      scrollToBottom(speaker);
    }
  }

  /** Пропустити друк: вивести весь текст одразу; якщо є lineCycleSuffix — додати prefix + останнє слово і завершити. */
  showSkipButton();
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












