/**
 * Титульний екран: прогрес-бар, послідовність назва → credit → jam, startGameAfterTitle, requestFullscreen.
 */

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
  enterBtn.onclick = function () {
    fadeOutAudio(titleMusicAudio, 500);
    startGameAfterTitle();
  };
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
              var newName = CONFIG.title.creditNew;
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
    scheduleAvatarNoiseBurst();
  }, CONFIG.endingFadeMs);
}

var titleSequenceShown = false;

/** Запит повноекранного режиму (при натисканні «Увімкнути термінал»). */
function requestFullscreen() {
  var docEl = document.documentElement;
  if (docEl.requestFullscreen) docEl.requestFullscreen();
  else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
  else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
}
