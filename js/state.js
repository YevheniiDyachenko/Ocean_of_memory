/**
 * Глобальний стан гри та DOM-референси, допоміжні функції для UI (scroll, кнопки, класи повідомлень).
 */

// --- Глобальний стан гри ---
var distortion = 0;           // нахил до «ілюзії» (позитив) чи «реальності» (негатив)
var currentStepId = 'start';  // поточний крок історії (id з story.js)
var typewriterTimer = null;   // таймер посимвольного друку
/** Активні фонові шари: name -> { audio, fadeTimer }. Кілька можуть грати одночасно. */
var ambientSounds = {};
var typingAudio = null;       // звук друку (для зупинки при skip)
var titleMusicAudio = null;   // одноразова Title_music (для fade-out)
var skipTypingCallback = null;// викликається при кліку для пропуску друку
var choicesCount = 0;         // кількість зроблених виборів (для фіналу)
var gameStartTime = null;     // час старту гри (для таймера проходження)
var skipCount = 0;            // скільки разів пропустили друк (профіль)
var hesitationTimes = [];     // затримки перед вибором у мс (профіль)
var choiceAppearTime = null;  // коли з'явилися варіанти вибору
var finalChoiceEasterEggTimer = null; // таймер пасхалки «ЧОМУ ТИ ВАГАЄШСЯ?»

// --- Стан лейбла "ДО СТИКУВАННЯ" (можна змінювати зі story.js) ---
var dockingLabelState = {
  text: '00:10',
  color: null
};

function parseDockingTimeToSeconds(text) {
  if (!text) return null;
  var t = ('' + text).trim();
  if (t.indexOf(':') !== -1) {
    var parts = t.split(':').map(function (p) { return p.trim(); });
    if (parts.length === 2 || parts.length === 3) {
      var nums = parts.map(function (p) { return p === '' ? NaN : Number(p); });
      if (nums.some(function (n) { return isNaN(n); })) return null;
      if (parts.length === 2) return nums[0] * 60 + nums[1];
      return nums[0] * 3600 + nums[1] * 60 + nums[2];
    }
  }
  return null;
}

function getDockingColorByTime(text) {
  var sec = parseDockingTimeToSeconds(text);
  if (sec === null) return dockingLabelState.color || null;
  if (sec >= 9) return rgba(57, 255, 20, 0.8); // >= 00:09 
  if (sec >= 6) return '#ffffff'; // 00:08 - 00:06 
  if (sec > 3) return '#ffcc00'; // 00:05 - 00:03
  return '#ff5555';  // <= 00:03 
}

function updateDockingLabel() {
  var label = document.getElementById('datetime-label');
  if (!label) return;
  var spacing = '\u00A0\u00A0\u00A0\u00A0';
  var valueColor = getDockingColorByTime(dockingLabelState.text);
  var baseColor = 'rgba(57, 255, 20, 0.8)';
  var valueStyle = valueColor ? 'color:' + valueColor + ';' : '';
  label.innerHTML = '<span class="dock-label" style="color:' + baseColor + ';">ДО СТИКУВАННЯ: </span>' +
    '<span class="dock-value" style="' + valueStyle + '">' + dockingLabelState.text + spacing + '</span>';
}

function setDockingLabel(text, color) {
  if (text != null) dockingLabelState.text = text;
  if (color != null) dockingLabelState.color = color;
  updateDockingLabel();
}

/** DOM-елементи (чати, думки, кнопки, оверлеї, титул, фінал). */
var el = {
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
  avatarNoiseBurst: document.getElementById('avatar-noise-burst'),
  endingScreen: document.getElementById('ending-screen'),
  endingTitle: document.getElementById('ending-title'),
  endingStatName: document.getElementById('ending-stat-name'),
  endingStatDistortion: document.getElementById('ending-stat-distortion'),
  endingStatChoices: document.getElementById('ending-stat-choices'),
  endingStatTime: document.getElementById('ending-stat-time'),
  endingStatProfile: document.getElementById('ending-stat-profile'),
  endingRestartBtn: document.getElementById('ending-restart-btn'),
  endingFadeOverlay: document.getElementById('ending-fade-overlay'),
  avatarImage: document.getElementById('avatar-image'),
  avatarName: document.getElementById('avatar-name'),
  avatarOscilloscope: document.getElementById('avatar-oscilloscope')
};

/** Поточний стан аватара Олесі (з story.js AVATAR_DEFAULTS, оновлюється кроками з avatar). */
var currentAvatarState = typeof AVATAR_DEFAULTS !== 'undefined'
  ? JSON.parse(JSON.stringify(AVATAR_DEFAULTS))
  : { image: 'assets/images/ch_main.png', name: 'ОЛЕСЯ', heartbeatBpm: 60 };

/** Чи користувач прокрутив контейнер майже до кінця (щоб не скролити при новому повідомленні, якщо він читає вище). */
function isNearBottom(container) {
  if (!container) return true;
  return container.scrollTop + container.clientHeight >= container.scrollHeight - CONFIG.scrollBottomThreshold;
}

/** Прокрутити лог чату вниз до повідомлення, що друкується. */
function scrollChatToBottom() {
  if (el.chatLog) {
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
  }
}

/** Прокрутити лог думок вниз до повідомлення, що друкується. */
function scrollThoughtsToBottom() {
  if (el.thoughtsLog) {
    el.thoughtsLog.scrollTop = el.thoughtsLog.scrollHeight;
  }
}

/** Прокрутити вниз ту панель, куди додається повідомлення (чат або думки). */
function scrollToBottom(speaker) {
  if (speaker === null || speaker === undefined || speaker === '') scrollThoughtsToBottom();
  else scrollChatToBottom();
}

/** Показати кнопку «Пропустити» під час друку (викликає skipTypingCallback при кліку). */
function showSkipButton() {
  if (el.nextBtn) {
    el.nextBtn.textContent = 'Пропустити';
    el.nextBtn.classList.remove('hidden');
    el.nextBtn.onclick = function () {
      if (skipTypingCallback) skipTypingCallback();
    };
  }
}

/** Показати кнопку «Далі» після закінчення друку (перехід на nextId). */
function showNextButton(nextId) {
  if (el.nextBtn) {
    el.nextBtn.textContent = 'Далі';
    el.nextBtn.classList.remove('hidden');
    el.nextBtn.onclick = function () { if (nextId) goToStep(nextId); };
  }
}

/** Контейнер для повідомлень: думки (speaker порожній) — thoughts-log, інакше — chat-log. */
function getMessageContainer(speaker) {
  if (speaker === null || speaker === undefined || speaker === '') return el.thoughtsLog || el.chatLog;
  return el.chatLog;
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

updateDockingLabel();
