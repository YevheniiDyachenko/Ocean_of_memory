/**
 * Аудіо: одноразові звуки, фонові шари, звук друку, callbacks для типографа.
 */

/** Відтворити одноразовий звук (спробувати .wav, .mp3, .ogg по черзі). volume 0–1 (за замовчуванням 1). */
function playSound(name, volume) {
  try {
    var a = new Audio();
    a.volume = (volume != null && volume >= 0 && volume <= 1) ? volume : 1;
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

/** Р’С–РґС‚РІРѕСЂРёС‚Рё РѕРґРЅРѕСЂР°Р·РѕРІРёР№ Р·РІСѓРє С– РїРѕРІРµСЂРЅСѓС‚Рё Audio-РѕР±'С”РєС‚ (РґР»СЏ fade-out). */
function playSoundWithHandle(name, volume) {
  try {
    var a = new Audio();
    a.volume = (volume != null && volume >= 0 && volume <= 1) ? volume : 1;
    var base = CONFIG.audioPath + name;
    var idx = 0;
    function tryNext() {
      if (idx >= CONFIG.audioExts.length) return;
      a.src = base + CONFIG.audioExts[idx];
      idx++;
      a.play().catch(tryNext);
    }
    tryNext();
    return a;
  } catch (_) {
    return null;
  }
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

/** Р—Р°С‚СѓС…Р°РЅРЅСЏ С– Р·СѓРїРёРЅРєР° РѕРґРЅРѕСЂР°Р·РѕРІРѕРіРѕ Р·РІСѓРєСѓ (Audio). */
function fadeOutAudio(audio, fadeOutMs) {
  if (!audio) return;
  var ms = fadeOutMs != null ? fadeOutMs : 800;
  if (ms <= 0) {
    try { audio.pause(); audio.currentTime = 0; audio.src = ''; } catch (_) {}
    return;
  }
  var stepMs = 50;
  var steps = Math.max(1, Math.floor(ms / stepMs));
  var stepVol = (audio.volume || 0) / steps;
  var t = setInterval(function () {
    audio.volume = Math.max(0, (audio.volume || 0) - stepVol);
    if (audio.volume <= 0) {
      clearInterval(t);
      try { audio.pause(); audio.currentTime = 0; audio.src = ''; } catch (_) {}
    }
  }, stepMs);
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
 * Callback для glitch ефекту (опційно).
 * Для використання: додай audio/static_glitch.ogg і викликай тут playTypingSound('static_glitch').
 */
function glitchSoundCallback(event) {
  typeSoundCallback(event);
}
