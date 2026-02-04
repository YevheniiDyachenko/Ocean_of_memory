/**
 * Осцилограф пульсу та оновлення модуля аватара (зображення, ім'я, BPM).
 */

var oscilloscopeAnimationId = null;
var oscilloscopeStartTime = 0;

/** Форма хвилі серцебиття (ECG-подібна): phase 0..1, повертає -1..1. */
function heartbeatWave(phase) {
  if (phase < 0.1) return 0;
  if (phase < 0.18) return (phase - 0.1) / 0.08 * 0.3;
  if (phase < 0.22) return 0.3 - (phase - 0.18) / 0.04 * 0.5;
  if (phase < 0.26) return -0.2 + (phase - 0.22) / 0.04 * 1.2;
  if (phase < 0.32) return 1 - (phase - 0.26) / 0.06 * 1.2;
  if (phase < 0.42) return -0.2 + (phase - 0.32) / 0.1 * 0.5;
  if (phase < 0.55) return 0.3 - (phase - 0.42) / 0.13 * 0.3;
  return 0;
}

/** Малювати осцилограф з ефектом серцебиття. */
function drawOscilloscope(canvas, bpm) {
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var periodMs = 60000 / (bpm || 72);
  var now = Date.now();
  if (!oscilloscopeStartTime) oscilloscopeStartTime = now;
  var phase = ((now - oscilloscopeStartTime) % periodMs) / periodMs;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#39ff14';
  ctx.lineWidth = 2;
  ctx.beginPath();

  var points = 120;
  var history = [];
  for (var i = 0; i <= points; i++) {
    var p = (phase + i / points) % 1;
    var y = heartbeatWave(p);
    var x = (i / points) * w;
    var yPx = h / 2 - y * (h * 0.35);
    history.push({ x: x, y: yPx });
  }
  for (var j = 0; j < history.length; j++) {
    if (j === 0) ctx.moveTo(history[j].x, history[j].y);
    else ctx.lineTo(history[j].x, history[j].y);
  }
  ctx.stroke();
}

/** Запустити анімацію осцилографа. */
function startOscilloscope(bpm) {
  if (oscilloscopeAnimationId) cancelAnimationFrame(oscilloscopeAnimationId);
  oscilloscopeStartTime = 0;
  function tick() {
    drawOscilloscope(el.avatarOscilloscope, bpm);
    oscilloscopeAnimationId = requestAnimationFrame(tick);
  }
  tick();
}

/** Оновити модуль аватара та осцилограф за станом з story.js. */
function updateAvatarModule(state) {
  if (!state) return;
  if (el.avatarImage && state.image) el.avatarImage.src = state.image;
  if (el.avatarName && state.name != null) el.avatarName.textContent = state.name;
  var bpm = state.heartbeatBpm != null ? state.heartbeatBpm : 60;
  startOscilloscope(bpm);
}
