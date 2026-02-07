/**
 * Oscilloscope pulse rendering (ECG-like).
 */

var oscilloscopeAnimationId = null;
var oscilloscopeStartTime = 0;
var oscilloscopeCurrentBpm = null;
var oscilloscopeTargetBpm = null;
var oscilloscopeLastTick = 0;
var oscilloscopeSpikeUntil = 0;

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

function clampBpm(bpm) {
  if (bpm == null || isNaN(bpm)) return 60;
  if (bpm < 20) return 20;
  if (bpm > 240) return 240;
  return bpm;
}

function drawOscilloscope(canvas, bpm) {
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var safeBpm = bpm || 72;
  var periodMs = 60000 / safeBpm;
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
  var bpmNorm = Math.max(0, Math.min(1, (safeBpm - 40) / 160));
  var ampScale = 0.7 + bpmNorm * 0.6; // amplitude grows with BPM
  var noiseScale = 0.02 + bpmNorm * 0.08; // noise grows with BPM

  var spikeActive = now < oscilloscopeSpikeUntil;
  var spikeScale = spikeActive ? 1.6 : 1.0;

  for (var i = 0; i <= points; i++) {
    var p = (phase + i / points) % 1;
    var y = heartbeatWave(p) * ampScale * spikeScale;
    var t = now / 60;
    var noise = (Math.sin(t + i * 0.35) + Math.sin(t * 0.7 + i * 0.12)) * 0.5;
    y += noise * noiseScale;
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

function startOscilloscope(bpm) {
  if (oscilloscopeAnimationId) cancelAnimationFrame(oscilloscopeAnimationId);
  oscilloscopeStartTime = 0;
  oscilloscopeTargetBpm = clampBpm(bpm || 72);
  if (oscilloscopeCurrentBpm == null) oscilloscopeCurrentBpm = oscilloscopeTargetBpm;
  oscilloscopeLastTick = 0;
  function tick() {
    var now = Date.now();
    var dt = oscilloscopeLastTick ? (now - oscilloscopeLastTick) : 16;
    oscilloscopeLastTick = now;
    var smoothing = 1 - Math.exp(-dt / 250); // smooth BPM
    oscilloscopeCurrentBpm = oscilloscopeCurrentBpm + (oscilloscopeTargetBpm - oscilloscopeCurrentBpm) * smoothing;

    var chance = 0.002 + Math.max(0, oscilloscopeCurrentBpm - 80) / 20000;
    if (now > oscilloscopeSpikeUntil && Math.random() < Math.min(chance, 0.02)) {
      oscilloscopeSpikeUntil = now + 120;
    }

    drawOscilloscope(el.avatarOscilloscope, oscilloscopeCurrentBpm);
    oscilloscopeAnimationId = requestAnimationFrame(tick);
  }
  tick();
}

function updatePulseGraph(state) {
  if (!state) return;
  var bpm = state.heartbeatBpm != null ? state.heartbeatBpm : 60;
  startOscilloscope(bpm);
}

function updateAvatarModule(state) {
  if (!state || typeof el === 'undefined') return;
  if (el.avatarImage && state.image) el.avatarImage.src = state.image;
  if (el.avatarName) el.avatarName.textContent = state.name || '';
  updatePulseGraph(state);
}
