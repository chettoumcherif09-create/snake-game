// ===== عناصر =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const startBtn = document.getElementById('startBtn');

const COLS = 20;
const ROWS = 20;
let CELL = 20;

let snake, dir, nextDir, food, score, best, speed;
let lastTime, acc, running, gameOver;
let growPending = 0;

best = parseInt(localStorage.getItem('snakeBest') || '0');
bestEl.textContent = best;

// ===== حجم =====
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const size = Math.min(w, h);
  CELL = Math.floor(size / COLS);
  const realSize = CELL * COLS;

  canvas.width = realSize;
  canvas.height = realSize;
  canvas.style.width = realSize + 'px';
  canvas.style.height = realSize + 'px';
  canvas.style.left = ((w - realSize) / 2) + 'px';
  canvas.style.top = ((h - realSize) / 2) + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ===== بدء =====
function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9,  y: 10 },
    { x: 8,  y: 10 }
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  speed = 140;
  gameOver = false;
  growPending = 0;
  scoreEl.textContent = '0';
  placeFood();
}

function placeFood() {
  while (true) {
    const fx = Math.floor(Math.random() * COLS);
    const fy = Math.floor(Math.random() * ROWS);
    if (!snake.some(s => s.x === fx && s.y === fy)) {
      food = { x: fx, y: fy };
      return;
    }
  }
}

// ===== رسم خلفية عشبية =====
function drawBackground() {
  // الأخضر الفاتح
  ctx.fillStyle = '#a8e060';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // مربعات شطرنجية خفيفة
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = 'rgba(120, 180, 60, 0.35)';
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }
}

// ===== رسم =====
function draw() {
  drawBackground();

  if (!snake || !food) return;

  // ---- التفاحة ----
  drawApple(food.x, food.y);

  // ---- الثعبان ----
  drawSnake();
}

function drawApple(gx, gy) {
  const cx = gx * CELL + CELL / 2;
  const cy = gy * CELL + CELL / 2;
  const r = CELL * 0.38;
  const pulse = 1 + Math.sin(Date.now() / 200) * 0.08;

  // ظل
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 1.05, r * 0.9, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // جسم التفاحة
  const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r*1.1);
  grad.addColorStop(0, '#ff5555');
  grad.addColorStop(1, '#cc0000');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
  ctx.fill();

  // الساق
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = Math.max(2, CELL * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.lineTo(cx + r * 0.15, cy - r * 1.35);
  ctx.stroke();

  // ورقة
  ctx.fillStyle = '#4aa82a';
  ctx.beginPath();
  ctx.ellipse(cx + r*0.45, cy - r*1.25, r*0.35, r*0.18, Math.PI/4, 0, Math.PI*2);
  ctx.fill();

  // لمعة
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(cx - r*0.35, cy - r*0.35, r*0.22, r*0.14, -Math.PI/4, 0, Math.PI*2);
  ctx.fill();
}

function drawSnake() {
  // ---- الظل تحت الجسم ----
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let i = 0; i < snake.length; i++) {
    const s = snake[i];
    ctx.beginPath();
    ctx.arc(s.x * CELL + CELL/2 + 2, s.y * CELL + CELL/2 + 3, CELL * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- جسم الثعبان (دائرة وراء دائرة) ----
  const bodyColor = '#1e88e5';
  const bodyColorDark = '#0d47a1';
  const bodyRadius = CELL * 0.48;

  for (let i = snake.length - 1; i >= 1; i--) {
    const s = snake[i];
    const cx = s.x * CELL + CELL / 2;
    const cy = s.y * CELL + CELL / 2;

    // تدرج لوني حسب الموقع
    const t = i / snake.length;
    const grad = ctx.createRadialGradient(cx - bodyRadius*0.3, cy - bodyRadius*0.3, bodyRadius*0.1, cx, cy, bodyRadius*1.1);
    grad.addColorStop(0, i === 1 ? '#42a5f5' : bodyColor);
    grad.addColorStop(1, bodyColorDark);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- الرأس ----
  const head = snake[0];
  const hx = head.x * CELL + CELL / 2;
  const hy = head.y * CELL + CELL / 2;
  const headRadius = CELL * 0.58;

  // جسم الرأس
  const headGrad = ctx.createRadialGradient(hx - headRadius*0.3, hy - headRadius*0.3, headRadius*0.1, hx, hy, headRadius*1.1);
  headGrad.addColorStop(0, '#42a5f5');
  headGrad.addColorStop(1, '#0d47a1');

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(hx, hy, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // ---- العيون ----
  // تحديد اتجاه النظر
  let lookX = dir.x;
  let lookY = dir.y;
  if (lookX === 0 && lookY === 0) { lookX = 1; }

  // عمودي على الاتجاه لتوزيع العينين
  const perpX = -lookY;
  const perpY = lookX;

  const eyeOffset = headRadius * 0.42;
  const eyeForward = headRadius * 0.28;
  const eyeR = headRadius * 0.28;
  const pupilR = eyeR * 0.5;

  const e1x = hx + perpX * eyeOffset + lookX * eyeForward;
  const e1y = hy + perpY * eyeOffset + lookY * eyeForward;
  const e2x = hx - perpX * eyeOffset + lookX * eyeForward;
  const e2y = hy - perpY * eyeOffset + lookY * eyeForward;

  // بياض العينين
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2); ctx.fill();

  // البؤبؤ
  ctx.fillStyle = '#000000';
  const p1x = e1x + lookX * eyeR * 0.35;
  const p1y = e1y + lookY * eyeR * 0.35;
  const p2x = e2x + lookX * eyeR * 0.35;
  const p2y = e2y + lookY * eyeR * 0.35;
  ctx.beginPath(); ctx.arc(p1x, p1y, pupilR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p2x, p2y, pupilR, 0, Math.PI * 2); ctx.fill();

  // ---- اللسان ----
  if (lookX !== 0 || lookY !== 0) {
    const tongueLen = headRadius * 0.9;
    const tx = hx + lookX * (headRadius + tongueLen * 0.5);
    const ty = hy + lookY * (headRadius + tongueLen * 0.5);
    ctx.strokeStyle = '#ff2244';
    ctx.lineWidth = Math.max(2, CELL * 0.07);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx + lookX * headRadius * 0.85, hy + lookY * headRadius * 0.85);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // شوكة اللسان
    const forkLen = tongueLen * 0.35;
    const fx1 = tx + lookX * forkLen * 0.7 - lookY * forkLen * 0.5;
    const fy1 = ty + lookY * forkLen * 0.7 + lookX * forkLen * 0.5;
    const fx2 = tx + lookX * forkLen * 0.7 + lookY * forkLen * 0.5;
    const fy2 = ty + lookY * forkLen * 0.7 - lookX * forkLen * 0.5;
    ctx.beginPath();
    ctx.moveTo(tx, ty); ctx.lineTo(fx1, fy1);
    ctx.moveTo(tx, ty); ctx.lineTo(fx2, fy2);
    ctx.stroke();
  }
}

// ===== تحديث =====
function update() {
  if (gameOver) return;
  dir = { x: nextDir.x, y: nextDir.y };

  const head = {
    x: snake[0].x + dir.x,
    y: snake[0].y + dir.y
  };

  // اصطدام بالحواجز
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return endGame();
  }

  // اصطدام بالجسم
  for (let i = 0; i < snake.length - 1; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      return endGame();
    }
  }

  snake.unshift(head);

  // أكل التفاحة → يزيد الطول
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      localStorage.setItem('snakeBest', best);
    }
    growPending += 1;     // نضيف نمو
    placeFood();
    if (speed > 70) speed -= 2;
  }

  // تطبيق النمو (بدون حذف الذيل)
  if (growPending > 0) {
    growPending--;
  } else {
    snake.pop();
  }
}

function endGame() {
  gameOver = true;
  running = false;
  overlayTitle.textContent = '💀 انتهت اللعبة';
  overlayMsg.textContent = 'نقاطك: ' + score + '  |  الأفضل: ' + best;
  startBtn.textContent = 'العب مرة أخرى';
  overlay.classList.remove('hidden');
}

// ===== الحلقة =====
function loop(time) {
  if (!running) return;
  if (!lastTime) lastTime = time;
  const dt = time - lastTime;
  lastTime = time;

  acc += dt;
  if (acc > speed) {
    acc = 0;
    update();
  }
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// ===== التحكم بالسحب =====
function setDir(nd) {
  if (nd.x === -dir.x && nd.y === -dir.y) return;
  if (nd.x === dir.x && nd.y === dir.y) return;
  nextDir = nd;
}

let tsX = 0, tsY = 0;
canvas.addEventListener('touchstart', function(e) {
  tsX = e.touches[0].clientX;
  tsY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', function(e) {
  const dx = e.changedTouches[0].clientX - tsX;
  const dy = e.changedTouches[0].clientY - tsY;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    setDir(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
  } else {
    setDir(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
  }
}, { passive: true });

// كيبورد (اختياري)
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowUp'    || e.key === 'w') setDir({ x: 0,  y: -1 });
  if (e.key === 'ArrowDown'  || e.key === 's') setDir({ x: 0,  y: 1 });
  if (e.key === 'ArrowLeft'  || e.key === 'a') setDir({ x: -1, y: 0 });
  if (e.key === 'ArrowRight' || e.key === 'd') setDir({ x: 1,  y: 0 });
});

// ===== زر البدء =====
startBtn.addEventListener('click', function() {
  overlay.classList.add('hidden');
  resetGame();
  resizeCanvas();
  running = true;
  lastTime = null;
  acc = 0;
  requestAnimationFrame(loop);
});

// ===== أولي =====
resetGame();
draw();