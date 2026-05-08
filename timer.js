const focusDuration = 25 * 60;
const breakDuration = 5 * 60;
let remainingSeconds = focusDuration;
let currentMode = "focus"; // focus or break
let cycleCount = 0;
let timerId = null;
let audioContext = null;

const minuteEl = document.querySelector("[data-minute]");
const secondsEl = document.querySelector("[data-seconds]");
const modeEl = document.querySelector("[data-mode]");
const cycleEl = document.querySelector("[data-cycle]");
const nextEl = document.querySelector("[data-next]");
const startPauseBtn = document.getElementById("start-pause");
const resetBtn = document.getElementById("reset");

const modeLabels = {
  focus: "フォーカス",
  break: "ブレイク",
};

const nextLabels = {
  focus: `ブレイク：${formatTime(breakDuration)}`,
  break: `フォーカス：${formatTime(focusDuration)}`,
};

startPauseBtn.addEventListener("click", () => {
  if (timerId) {
    pauseTimer();
    startPauseBtn.textContent = "再開";
  } else {
    ensureAudioContext();
    startTimer();
    startPauseBtn.textContent = "停止";
  }
});

resetBtn.addEventListener("click", () => {
  pauseTimer();
  currentMode = "focus";
  remainingSeconds = focusDuration;
  cycleCount = 0;
  updateNextLabel();
  updateDisplay();
  startPauseBtn.textContent = "スタート";
});

function startTimer() {
  if (timerId) {
    return;
  }
  timerId = setInterval(tick, 1000);
}

function pauseTimer() {
  if (!timerId) {
    return;
  }
  clearInterval(timerId);
  timerId = null;
}

function tick() {
  if (remainingSeconds <= 0) {
    handleCompletion();
    return;
  }
  remainingSeconds -= 1;
  updateDisplay();
}

function handleCompletion() {
  if (currentMode === "focus") {
    cycleCount += 1;
  }
  const nextMode = currentMode === "focus" ? "break" : "focus";
  switchMode(nextMode);
  playSessionSound(nextMode);
}

function switchMode(nextMode) {
  currentMode = nextMode;
  remainingSeconds = nextMode === "focus" ? focusDuration : breakDuration;
  updateDisplay();
  updateNextLabel();
}

function updateDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  minuteEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = `:${String(seconds).padStart(2, "0")}`;
  modeEl.textContent = modeLabels[currentMode];
  cycleEl.textContent = String(cycleCount);
}

function updateNextLabel() {
  const label = currentMode === "focus" ? nextLabels.focus : nextLabels.break;
  nextEl.textContent = label;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ensureAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return null;
  }
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function playSessionSound(nextMode) {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }
  const frequencies = nextMode === "focus" ? [880, 1175] : [523, 392];
  const now = context.currentTime;

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = now + index * 0.16;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.18, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.18);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.2);
  });
}

updateDisplay();
updateNextLabel();
