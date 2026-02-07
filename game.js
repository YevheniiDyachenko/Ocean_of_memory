/**
 * Ідеальна Похибка — оркестрація гри: goToStep, showStep, restartGame, init.
 * Залежить від js/config.js, js/story.js, js/state.js, js/avatar.js, js/audio.js, js/typewriter.js, js/title.js.
 */

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
  if (step.avatar) {
    var av = step.avatar;
    if (typeof av === 'string') currentAvatarState.image = av;
    else {
      if (av.image != null) currentAvatarState.image = av.image;
      if (av.name != null) currentAvatarState.name = av.name;
      if (av.heartbeatBpm != null) currentAvatarState.heartbeatBpm = av.heartbeatBpm;
    }
  }
  if (step.avatar || stepId === 'start') updateAvatarModule(currentAvatarState);
  showStep(step);
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
 * ending. Для line перед показом el_thoughts_jasmine — заміна «калину»→«бузок».
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
      soundVolume: step.soundVolume,
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
      soundVolume: step.soundVolume,
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
    if (el.nextBtn) el.nextBtn.classList.add('hidden');
    if (el.choices) el.choices.innerHTML = '';
    el.content.classList.remove('hidden');
    el.endingScreen.classList.add('hidden');
    showThoughtsWindow();
    choiceAppearTime = Date.now();
    if (step.id === 'the_decision') {
      finalChoiceEasterEggTimer = setTimeout(function () {
        finalChoiceEasterEggTimer = null;
        var msg = 'СИСТЕМА ОЧІКУЄ.\nРЕКОМЕНДАЦІЯ: ПРИЙНЯТИ РІШЕННЯ.';
        showLine('СИСТЕМА', msg, { next: 'the_decision' });
      }, 10000);
    }
    (step.choices || []).forEach(function (c) {
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
      if (el.choices) el.choices.appendChild(btn);
    });
  } else if (step.type === 'branch') {
    // Вибір фіналу за distortion: high (≥2), low (≤−2), mid
    var nd = step.nextByDistortion || {};
    var id = distortion >= 3 ? nd.high : distortion <= -3 ? nd.low : distortion == 1 ? nd.high_alt : distortion == -1 ? nd.low_alt : nd.mid;
    if (id) goToStep(id);
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
      if (el.endingScreen) el.endingScreen.classList.remove('hidden');
    }, CONFIG.endingFadeMs);
  } else if (step.next) {
    goToStep(step.next);
  }
}

/** Перезапуск гри: скинути стан, очистити чати/думки/вибори, перейти на start. */
function restartGame() {
  if (finalChoiceEasterEggTimer) {
    clearTimeout(finalChoiceEasterEggTimer);
    finalChoiceEasterEggTimer = null;
  }
  distortion = 0;
  choicesCount = 0;
  skipCount = 0;
  hesitationTimes = [];
  choiceAppearTime = null;
  gameStartTime = Date.now();
  currentStepId = 'start';
  skipTypingCallback = null;
  if (typeof AVATAR_DEFAULTS !== 'undefined') currentAvatarState = JSON.parse(JSON.stringify(AVATAR_DEFAULTS));
  typeSoundCallback('end');
  stopAmbientSound();
  if (el.content) el.content.classList.remove('hidden');
  if (el.chatLog) el.chatLog.innerHTML = '';
  if (el.thoughtsLog) el.thoughtsLog.innerHTML = '';
  if (el.choices) el.choices.innerHTML = '';
  if (el.nextBtn) el.nextBtn.classList.add('hidden');
  if (el.endingScreen) el.endingScreen.classList.add('hidden');
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

/** Запланувати періодичні спалахи білого шуму на аватарі Олесі. */
function scheduleAvatarNoiseBurst() {
  if (!el.avatarNoiseBurst) return;
  var delay = 3000 + Math.random() * 8000;
  setTimeout(function () {
    el.avatarNoiseBurst.classList.add('active');
    setTimeout(function () {
      el.avatarNoiseBurst.classList.remove('active');
      scheduleAvatarNoiseBurst();
    }, 80 + Math.random() * 120);
  }, delay);
}

/** Ініціалізація: скрол коліщатком, клік по контенту (skip), титул або start-overlay, кнопка старту. */

/** ����������� ������������� �����. */
function toggleFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
    var el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }
}
function init() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/563d15b4-89e0-4836-8fd1-b648b6c6d8b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:init',message:'init',data:{hasSTORY_STEPS:typeof STORY_STEPS!=='undefined',hasGetStep:typeof getStep==='function',chatLog:!!el.chatLog,thoughtsLog:!!el.thoughtsLog},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(function(){});
  fetch('http://127.0.0.1:7242/ingest/563d15b4-89e0-4836-8fd1-b648b6c6d8b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:init',message:'DOM elements',data:{chatLog:!!el.chatLog,thoughtsLog:!!el.thoughtsLog},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(function(){});
  // #endregion

  if (el.nextBtn) el.nextBtn.onclick = function () {};
  if (el.content) el.content.addEventListener('click', onContentClick);
  if (el.titleScreen) {
    el.titleScreen.classList.add('hidden');
    if (el.startOverlay) el.startOverlay.classList.remove('hidden');
  } else if (el.startOverlay) {
    el.startOverlay.classList.remove('hidden');
  }
  var startBtn = document.getElementById('start-terminal-btn');
  var fsBtn = document.getElementById('fullscreen-button');
  if (fsBtn) {
    var fsEnabled = document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;
    if (!fsEnabled) fsBtn.classList.add('hidden');
    fsBtn.onclick = toggleFullscreen;
  }
  if (startBtn) {
    startBtn.onclick = function () {
      if (el.titleScreen && !titleSequenceShown) {
        titleSequenceShown = true;
        requestFullscreen();
        titleMusicAudio = playSoundWithHandle('Title_music');
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
      scheduleAvatarNoiseBurst();
    };
  } else if (!el.titleScreen) {
    goToStep('start');
    scheduleNoiseBurst();
    scheduleAvatarNoiseBurst();
  }
}

// Запуск після завантаження DOM (скрипти підключаються з index.html у порядку: config → story → state → avatar → audio → typewriter → title → game)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

