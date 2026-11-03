/* ===================================================================
   光之城 · 核心引擎 core.js
   卡通绘制工具 / 输入 / 音效 / 粒子 / 存档 / 瓦片地图
   =================================================================== */
'use strict';

const CE = { W: 960, H: 600 };

/* ---------------- 配色 ---------------- */
CE.C = {
  line: '#3B3550',
  sky: '#8FD8F7', sky2: '#B9EBFF',
  grass: '#8BD96B', grass2: '#6FC85A',
  road: '#E3D8C6', road2: '#CCBFA9',
  floor: '#F3E8D6',
  water: '#7EC8E3', water2: '#5FB3D4',
  wall: '#C9A882', wall2: '#A98C6B', roof: '#FF8C6B',
  white: '#FFFFFF', cream: '#FFFDF4',
  yellow: '#FFD93D', orange: '#FF8C42', orange2: '#E8632A',
  pink: '#FFB4C8', purple: '#B9A0E3', green: '#7BD389',
  blue: '#5FB3D4', red: '#FF6B6B', gray: '#B8B8C8', dark: '#2B2740',
  skin: '#FFD9B3', hair: '#6B4A3A', jeans: '#3F5BD6'
};

/* ---------------- 数学 / 工具 ---------------- */
CE.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
CE.lerp = (a, b, t) => a + (b - a) * t;
CE.rand = (a, b) => a + Math.random() * (b - a);
CE.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
CE.pick = arr => arr[Math.floor(Math.random() * arr.length)];
CE.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
CE.aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
CE.easeOut = t => 1 - Math.pow(1 - t, 3);
CE.font = (size, weight) => `${weight || 800} ${size}px "PingFang SC","Microsoft YaHei","Fredoka",sans-serif`;

/* 可复现随机数（迷宫生成用） */
CE.seeded = function (seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
};

/* ---------------- 输入 ---------------- */
CE.input = { keys: {}, pressed: {}, mx: 0, my: 0, clicked: false, down: false, touch: false };
CE.keyDown = k => !!CE.input.keys[k];
CE.keyHit = k => !!CE.input.pressed[k];
CE.pointerHit = () => CE.input.clicked;
CE.endFrame = () => { CE.input.pressed = {}; CE.input.clicked = false; };

/* ---------------- 音效（WebAudio 合成） ---------------- */
CE.audio = {
  ac: null, master: null, sfxOn: true, bgmOn: true, _timer: null, _step: 0,
  init() {
    if (this.ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ac.destination);
  },
  tone(f, d, type, v, delay) {
    if (!this.ac || !this.sfxOn) return;
    const t0 = this.ac.currentTime + (delay || 0);
    const o = this.ac.createOscillator();
    const g = this.ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(v === undefined ? 0.22 : v, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + d);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + d + 0.03);
  },
  sfx(name) {
    if (!this.sfxOn) return;
    switch (name) {
      case 'click': this.tone(620, 0.09, 'square', 0.14); break;
      case 'hover': this.tone(880, 0.05, 'sine', 0.07); break;
      case 'ok':    this.tone(660, 0.1, 'triangle', 0.2); this.tone(990, 0.16, 'triangle', 0.16, 0.08); break;
      case 'coin':  this.tone(1046, 0.07, 'square', 0.14); this.tone(1568, 0.14, 'square', 0.12, 0.06); break;
      case 'jump':  this.tone(520, 0.12, 'square', 0.13); this.tone(780, 0.1, 'square', 0.1, 0.06); break;
      case 'step':  this.tone(180, 0.05, 'sine', 0.05); break;
      case 'error': this.tone(240, 0.16, 'sawtooth', 0.14); this.tone(160, 0.2, 'sawtooth', 0.12, 0.1); break;
      case 'hit':   this.tone(150, 0.18, 'square', 0.16); break;
      case 'win':   [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.24, 'triangle', 0.2, i * 0.1)); break;
      case 'lose':  [440, 370, 294, 220].forEach((f, i) => this.tone(f, 0.26, 'sine', 0.18, i * 0.11)); break;
      case 'open':  this.tone(420, 0.1, 'triangle', 0.14); this.tone(620, 0.12, 'triangle', 0.12, 0.07); break;
      case 'meow':  this.tone(760, 0.1, 'sine', 0.16); this.tone(560, 0.16, 'sine', 0.14, 0.08); break;
      case 'bell':  this.tone(1046, 0.5, 'sine', 0.2); this.tone(1568, 0.4, 'sine', 0.1, 0.01); break;
      case 'flow':  this.tone(392, 0.12, 'sine', 0.1); this.tone(587, 0.18, 'sine', 0.09, 0.08); break;
    }
  },
  /* 轻量背景旋律 */
  melody: [523, 587, 659, 784, 659, 587, 523, 392, 440, 523, 587, 523, 440, 392, 330, 392],
  startBgm() {
    if (!this.ac || !this.bgmOn || this._timer) return;
    this._step = 0;
    this._timer = setInterval(() => {
      if (!this.bgmOn || !this.ac) return;
      const n = this.melody[this._step % this.melody.length];
      this.tone(n, 0.34, 'triangle', 0.045);
      if (this._step % 4 === 0) this.tone(n / 2, 0.5, 'sine', 0.05);
      this._step++;
    }, 380);
  },
  stopBgm() { if (this._timer) { clearInterval(this._timer); this._timer = null; } }
};

/* ---------------- 卡通绘制工具 ---------------- */
CE.rr = function (ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
};

/** 圆角矩形 + 描边 */
CE.card = function (ctx, x, y, w, h, r, fill, lw) {
  CE.rr(ctx, x, y, w, h, r === undefined ? 10 : r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw !== 0) { ctx.lineWidth = lw || 3; ctx.strokeStyle = CE.C.line; ctx.stroke(); }
};
CE.circle = function (ctx, x, y, r, fill, lw) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw !== 0) { ctx.lineWidth = lw || 3; ctx.strokeStyle = CE.C.line; ctx.stroke(); }
};
CE.ellipse = function (ctx, x, y, rx, ry, fill, lw) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw !== 0) { ctx.lineWidth = lw || 3; ctx.strokeStyle = CE.C.line; ctx.stroke(); }
};
CE.shadow = function (ctx, x, y, rx, ry, a) {
  ctx.fillStyle = `rgba(43,39,64,${a || 0.16})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
};
CE.capsule = function (ctx, x1, y1, x2, y2, r, fill) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = CE.C.line; ctx.lineWidth = r * 2 + 3.2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = fill; ctx.lineWidth = r * 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.lineCap = 'butt';
};
CE.text = function (ctx, str, x, y, size, color, align, weight) {
  ctx.font = CE.font(size, weight);
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color || CE.C.line;
  ctx.fillText(str, x, y);
};
CE.textO = function (ctx, str, x, y, size, color, align, lw) {
  ctx.font = CE.font(size, 900);
  ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = lw || 5; ctx.strokeStyle = CE.C.line; ctx.lineJoin = 'round';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color || '#fff'; ctx.fillText(str, x, y);
};

/* ---------------- 角色绘制 ---------------- */
/**
 * 主角小悠。原点 = 脚底中心
 * opts: {dir:1|-1, walk:number, scale, mood:'happy'|'wink'|'sad'|'surprise', hat:bool}
 */
CE.drawHero = function (ctx, x, y, opts) {
  const o = opts || {};
  const s = o.scale || 1, dir = o.dir === -1 ? -1 : 1, t = o.walk || 0;
  const bob = Math.abs(Math.sin(t)) * 2.2, sw = Math.sin(t) * 5;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s * dir, s);
  CE.shadow(ctx, 0, 0, 16, 5.5);
  // 腿
  CE.capsule(ctx, -6, -13, -6 + sw * 0.9, -1, 4.6, CE.C.jeans);
  CE.capsule(ctx, 6, -13, 6 - sw * 0.9, -1, 4.6, '#2F49B8');
  // 鞋
  CE.card(ctx, -11 + sw * 0.9, -5, 11, 6, 3, '#3B3550', 0);
  CE.card(ctx, 0 - sw * 0.9, -5, 11, 6, 3, '#3B3550', 0);
  // 身体（橙色卫衣）
  CE.card(ctx, -13, -40 - bob, 26, 28, 11, CE.C.orange);
  // 卫衣口袋
  ctx.beginPath(); ctx.moveTo(-8, -24 - bob); ctx.lineTo(8, -24 - bob);
  ctx.strokeStyle = 'rgba(59,53,80,.35)'; ctx.lineWidth = 2; ctx.stroke();
  // 背包
  CE.card(ctx, -19, -37 - bob, 9, 20, 4, '#7BD389');
  // 手臂
  CE.capsule(ctx, -12, -34 - bob, -15 - sw * 0.7, -22 - bob, 4.4, CE.C.orange);
  CE.capsule(ctx, 12, -34 - bob, 15 + sw * 0.7, -22 - bob, 4.4, CE.C.orange);
  // 头
  ctx.beginPath(); ctx.arc(0, -50 - bob, 14.5, 0, Math.PI * 2);
  ctx.fillStyle = CE.C.skin; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = CE.C.line; ctx.stroke();
  // 头发
  ctx.beginPath();
  ctx.arc(0, -50 - bob, 14.6, Math.PI * 1.02, Math.PI * 2.02);
  ctx.lineTo(14, -54 - bob); ctx.closePath();
  ctx.fillStyle = CE.C.hair; ctx.fill(); ctx.stroke();
  // 呆毛
  ctx.beginPath(); ctx.moveTo(2, -63 - bob);
  ctx.quadraticCurveTo(10, -74 - bob, 4, -70 - bob);
  ctx.lineWidth = 3.4; ctx.strokeStyle = CE.C.hair; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
  // 眼睛
  const mood = o.mood || 'happy';
  const ex = dir > 0 ? 3 : 3;
  if (mood === 'happy') {
    CE.circle(ctx, -3.5, -50 - bob, 2.2, CE.C.line, 0);
    CE.circle(ctx, 5.5, -50 - bob, 2.2, CE.C.line, 0);
  } else if (mood === 'wink') {
    ctx.beginPath(); ctx.moveTo(-6, -51 - bob); ctx.lineTo(-1.5, -51 - bob);
    ctx.lineWidth = 2.2; ctx.strokeStyle = CE.C.line; ctx.stroke();
    CE.circle(ctx, 5.5, -50 - bob, 2.2, CE.C.line, 0);
  } else if (mood === 'sad') {
    ctx.beginPath(); ctx.arc(-3.5, -52 - bob, 2.4, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(5.5, -52 - bob, 2.4, 0.2, Math.PI - 0.2); ctx.stroke();
  } else if (mood === 'surprise') {
    CE.circle(ctx, -3.5, -50 - bob, 3, CE.C.line, 0);
    CE.circle(ctx, 5.5, -50 - bob, 3, CE.C.line, 0);
  }
  // 腮红
  ctx.fillStyle = 'rgba(255,140,140,.55)';
  ctx.beginPath(); ctx.ellipse(-8, -44 - bob, 3.2, 2, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9, -44 - bob, 3.2, 2, 0, 0, 7); ctx.fill();
  // 嘴
  ctx.beginPath();
  if (mood === 'surprise') { ctx.arc(1, -43 - bob, 2.4, 0, Math.PI * 2); ctx.fillStyle = CE.C.line; ctx.fill(); }
  else { ctx.arc(1, -45 - bob, 3.4, 0.25, Math.PI - 0.25); ctx.lineWidth = 2; ctx.strokeStyle = CE.C.line; ctx.stroke(); }
  ctx.restore();
};

/** 通用 NPC：圆头小人，可指定颜色，emoji 表情可选 */
CE.drawNPC = function (ctx, x, y, bodyColor, opts) {
  const o = opts || {};
  const s = o.scale || 1, dir = o.dir === -1 ? -1 : 1, t = o.walk || 0;
  const bob = Math.abs(Math.sin(t)) * 1.8, sw = Math.sin(t) * 4;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s * dir, s);
  CE.shadow(ctx, 0, 0, 15, 5);
  CE.capsule(ctx, -5, -12, -5 + sw, -1, 4.2, '#6D6883');
  CE.capsule(ctx, 5, -12, 5 - sw, -1, 4.2, '#575270');
  CE.card(ctx, -12, -37 - bob, 24, 26, 10, bodyColor);
  CE.capsule(ctx, -11, -32 - bob, -14, -21 - bob, 4, bodyColor);
  CE.capsule(ctx, 11, -32 - bob, 14, -21 - bob, 4, bodyColor);
  ctx.beginPath(); ctx.arc(0, -47 - bob, 13.5, 0, Math.PI * 2);
  ctx.fillStyle = CE.C.skin; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = CE.C.line; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -47 - bob, 13.6, Math.PI * 1.04, Math.PI * 2.04);
  ctx.fillStyle = o.hairColor || CE.C.hair; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -47 - bob, 13.6, Math.PI * 1.04, Math.PI * 2.04);
  ctx.lineWidth = 3; ctx.strokeStyle = CE.C.line; ctx.stroke();
  CE.circle(ctx, -3.5, -47 - bob, 2, CE.C.line, 0);
  CE.circle(ctx, 5, -47 - bob, 2, CE.C.line, 0);
  ctx.beginPath(); ctx.arc(1, -42 - bob, 3, 0.3, Math.PI - 0.3);
  ctx.lineWidth = 1.8; ctx.strokeStyle = CE.C.line; ctx.stroke();
  ctx.restore();
};

/** 猫 */
CE.drawCat = function (ctx, x, y, color, t) {
  const bob = Math.sin((t || 0) * 2.2) * 1.4;
  ctx.save(); ctx.translate(x, y);
  CE.shadow(ctx, 0, 0, 16, 5);
  // 尾巴
  ctx.beginPath(); ctx.moveTo(11, -12);
  ctx.quadraticCurveTo(24, -18 + bob * 2, 18, -28 + bob * 2);
  ctx.lineWidth = 7; ctx.strokeStyle = CE.C.line; ctx.lineCap = 'round'; ctx.stroke();
  ctx.lineWidth = 4.5; ctx.strokeStyle = color; ctx.stroke(); ctx.lineCap = 'butt';
  // 身体
  CE.ellipse(ctx, 0, -13 + bob, 15, 12, color);
  // 头
  ctx.beginPath(); ctx.arc(0, -28 + bob, 12.5, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = CE.C.line; ctx.stroke();
  // 耳朵
  ctx.beginPath(); ctx.moveTo(-11, -36 + bob); ctx.lineTo(-6, -45 + bob); ctx.lineTo(-2, -36 + bob); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = CE.C.line; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(11, -36 + bob); ctx.lineTo(6, -45 + bob); ctx.lineTo(2, -36 + bob); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.stroke();
  // 眼睛
  ctx.fillStyle = CE.C.line;
  ctx.beginPath(); ctx.ellipse(-4.5, -28 + bob, 1.8, 2.6, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4.5, -28 + bob, 1.8, 2.6, 0, 0, 7); ctx.fill();
  // 鼻子
  ctx.beginPath(); ctx.moveTo(0, -24 + bob); ctx.lineTo(-2, -22 + bob); ctx.lineTo(2, -22 + bob);
  ctx.closePath(); ctx.fillStyle = CE.C.pink; ctx.fill();
  // 胡须
  ctx.strokeStyle = 'rgba(59,53,80,.55)'; ctx.lineWidth = 1.3;
  [-4, 0, 4].forEach(dy => {
    ctx.beginPath(); ctx.moveTo(-8, -23 + bob + dy * 0.5); ctx.lineTo(-19, -24 + bob + dy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -23 + bob + dy * 0.5); ctx.lineTo(19, -24 + bob + dy); ctx.stroke();
  });
  ctx.restore();
};

/** 巡检机器人 */
CE.drawRobot = function (ctx, x, y, t, alert) {
  ctx.save(); ctx.translate(x, y);
  CE.shadow(ctx, 0, 0, 15, 5);
  const bob = Math.sin(t * 3) * 1.6;
  CE.card(ctx, -12, -34 + bob, 24, 24, 8, alert ? '#FF9D9D' : '#C4CBD8');
  CE.card(ctx, -15, -18 + bob, 30, 8, 4, '#8E96A8');
  CE.circle(ctx, 0, -46 + bob, 12, alert ? '#FFD0D0' : '#E8EDF5');
  // 眼睛
  ctx.fillStyle = alert ? '#FF3B3B' : '#5FD1F5';
  CE.circle(ctx, -4, -46 + bob, 3, alert ? '#FF3B3B' : '#5FD1F5', 0);
  CE.circle(ctx, 4.5, -46 + bob, 3, alert ? '#FF3B3B' : '#5FD1F5', 0);
  // 天线
  ctx.beginPath(); ctx.moveTo(0, -58 + bob); ctx.lineTo(0, -66 + bob);
  ctx.lineWidth = 3; ctx.strokeStyle = CE.C.line; ctx.stroke();
  CE.circle(ctx, 0, -68 + bob, 3.4, alert ? '#FF3B3B' : '#FFD93D', 2.5);
  ctx.restore();
};

/** 树 */
CE.drawTree = function (ctx, x, y, s, t) {
  s = s || 1;
  const sway = Math.sin((t || 0) * 1.2 + x * 0.01) * 2.5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  CE.shadow(ctx, 0, 0, 20, 6);
  CE.card(ctx, -5, -34, 10, 34, 4, '#9A7150');
  CE.circle(ctx, 0 + sway * 0.4, -50, 19, '#5FBF63');
  CE.circle(ctx, -14 + sway, -40, 13, '#7BD389');
  CE.circle(ctx, 14 + sway, -40, 13, '#7BD389');
  CE.circle(ctx, 0 + sway, -58, 14, '#8FE39B');
  ctx.restore();
};

/** 云 */
CE.drawCloud = function (ctx, x, y, s, a) {
  ctx.save(); ctx.globalAlpha = a === undefined ? 0.95 : a;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 18 * s, 0, 7);
  ctx.arc(x + 20 * s, y - 8 * s, 24 * s, 0, 7);
  ctx.arc(x + 46 * s, y, 16 * s, 0, 7);
  ctx.rect(x, y - 2 * s, 46 * s, 18 * s);
  ctx.fill();
  ctx.restore();
};

/** 卡通房屋 */
CE.drawHouse = function (ctx, x, y, w, h, color, roofColor, opts) {
  const o = opts || {};
  const top = y - h;
  CE.card(ctx, x, top, w, h, 6, color);
  // 屋顶
  ctx.beginPath();
  ctx.moveTo(x - 8, top + 2);
  ctx.lineTo(x + w / 2, top - w * 0.32);
  ctx.lineTo(x + w + 8, top + 2);
  ctx.closePath();
  ctx.fillStyle = roofColor || CE.C.roof; ctx.fill();
  ctx.lineWidth = 3.5; ctx.strokeStyle = CE.C.line; ctx.stroke();
  // 窗户
  const cols = o.cols || Math.max(1, Math.floor(w / 46));
  const rows = o.rows || Math.max(1, Math.floor(h / 56));
  const ww = 20, wh = 20;
  const gx = (w - cols * ww) / (cols + 1), gy = (h - rows * wh) / (rows + 1);
  ctx.fillStyle = o.lit ? '#FFE98A' : '#BEE3F5';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + gx + c * (ww + gx), wy = top + gy + r * (wh + gy);
      CE.card(ctx, wx, wy, ww, wh, 4, o.lit ? '#FFE98A' : '#BEE3F5', 2.4);
      ctx.beginPath();
      ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh);
      ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2);
      ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(59,53,80,.45)'; ctx.stroke();
    }
  }
  return { top: top };
};

/** 路灯 */
CE.drawLamp = function (ctx, x, y) {
  CE.shadow(ctx, x, y, 12, 4);
  CE.card(ctx, x - 3.5, y - 52, 7, 52, 3, '#6D6883');
  CE.circle(ctx, x, y - 58, 8, '#FFE98A', 3);
  ctx.save(); ctx.globalAlpha = 0.25;
  CE.circle(ctx, x, y - 58, 16, '#FFF3B0', 0);
  ctx.restore();
};

/** 长椅 */
CE.drawBench = function (ctx, x, y, w) {
  CE.shadow(ctx, x + w / 2, y, w * 0.5, 4);
  CE.card(ctx, x, y - 16, w, 7, 3, '#C08552', 2.6);
  CE.card(ctx, x, y - 30, w, 7, 3, '#C08552', 2.6);
  CE.card(ctx, x + 5, y - 9, 5, 9, 2, '#6D6883', 2.4);
  CE.card(ctx, x + w - 10, y - 9, 5, 9, 2, '#6D6883', 2.4);
};

/** 星星 */
CE.drawStar = function (ctx, x, y, r, fill, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * rr, Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = fill || CE.C.yellow; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = CE.C.line; ctx.stroke();
  ctx.restore();
};

/** 光之碎片 */
CE.drawOrb = function (ctx, x, y, r, t) {
  const p = 1 + Math.sin(t * 3) * 0.12;
  ctx.save();
  ctx.globalAlpha = 0.3;
  CE.circle(ctx, x, y, r * 2.1 * p, '#FFE98A', 0);
  ctx.globalAlpha = 0.55;
  CE.circle(ctx, x, y, r * 1.5 * p, '#FFF3B0', 0);
  ctx.globalAlpha = 1;
  CE.drawStar(ctx, x, y, r * p, '#FFD93D', t * 0.6);
  ctx.restore();
};

/* ---------------- 粒子 / 飘字 ---------------- */
CE.fx = {
  list: [],
  burst(x, y, opt) {
    const o = opt || {};
    const n = o.count || 12;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = CE.rand(1, 4.5) * (o.power || 1);
      this.list.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1,
        life: 1, max: CE.rand(0.5, 1.1), size: CE.rand(2, 5),
        color: o.color || '#FFD93D', star: o.star || false, g: 0.08
      });
    }
  },
  text(x, y, str, color) {
    this.list.push({ x, y, vx: 0, vy: -1.1, life: 1, max: 1.2, txt: str, color: color || '#3B3550' });
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x += p.vx * dt * 60; p.y += p.vy * dt * 60;
      p.vy += (p.g || 0) * dt * 60;
      p.vx *= 0.985;
      p.life -= dt / p.max;
      if (p.life <= 0) this.list.splice(i, 1);
    }
  },
  draw(ctx) {
    this.list.forEach(p => {
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      if (p.txt) {
        CE.textO(ctx, p.txt, p.x, p.y, 18, p.color, 'center', 4);
      } else if (p.star) {
        CE.drawStar(ctx, p.x, p.y, p.size * 1.6, p.color, p.life * 3);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, 7); ctx.fill();
      }
      ctx.restore();
    });
  },
  clear() { this.list.length = 0; }
};

/* ---------------- 存档 ---------------- */
CE.save = {
  key: 'city_of_light_save_v1',
  data: { cleared: {}, stars: {}, frags: 0, intro: false, ending: false, maxUnlock: 1 },
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) {
        const d = JSON.parse(raw);
        this.data = Object.assign(this.data, d);
      }
    } catch (e) { /* 忽略 */ }
    return this.data;
  },
  flush() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* 忽略 */ }
  },
  reset() {
    this.data = { cleared: {}, stars: {}, frags: 0, intro: false, ending: false, maxUnlock: 1 };
    this.flush();
  },
  clearedCount() { return Object.keys(this.data.cleared).length; }
};

/* ---------------- 瓦片地图 ---------------- */
CE.TileMap = function (rows, tw, th) {
  this.tw = tw || 40; this.th = th || 40;
  const w = Math.max.apply(null, rows.map(r => r.length));
  this.rows = rows.map(r => r.padEnd(w, '#'));
  this.w = w; this.h = this.rows.length;
  this.pw = this.w * this.tw; this.ph = this.h * this.th;
  this.solidChars = '#=oWx';
};
CE.TileMap.prototype.at = function (cx, cy) {
  if (cx < 0 || cy < 0 || cy >= this.h || cx >= this.w) return '#';
  return this.rows[cy][cx];
};
CE.TileMap.prototype.isSolidCell = function (cx, cy) {
  return this.solidChars.indexOf(this.at(cx, cy)) >= 0;
};
CE.TileMap.prototype.solidAt = function (px, py) {
  return this.isSolidCell(Math.floor(px / this.tw), Math.floor(py / this.th));
};
CE.TileMap.prototype.rectSolid = function (x, y, w, h) {
  const c0 = Math.floor(x / this.tw), c1 = Math.floor((x + w - 1) / this.tw);
  const r0 = Math.floor(y / this.th), r1 = Math.floor((y + h - 1) / this.th);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (this.isSolidCell(c, r)) return true;
  return false;
};
/** 分轴移动的圆形角色（用包围盒近似） */
CE.TileMap.prototype.moveActor = function (a, dx, dy) {
  const hw = a.r || 12, hh = a.hh || 12;
  let hit = false;
  if (dx) {
    const nx = a.x + dx;
    if (!this.rectSolid(nx - hw, a.y - hh * 2, hw * 2, hh * 2)) a.x = nx; else hit = true;
  }
  if (dy) {
    const ny = a.y + dy;
    if (!this.rectSolid(a.x - hw, ny - hh * 2, hw * 2, hh * 2)) a.y = ny; else hit = true;
  }
  return hit;
};
/** 默认瓦片绘制（风格由 palette 决定） */
CE.TileMap.prototype.drawBase = function (ctx, palette, t) {
  const p = palette || {};
  for (let r = 0; r < this.h; r++) {
    for (let c = 0; c < this.w; c++) {
      const ch = this.rows[r][c];
      const x = c * this.tw, y = r * this.th;
      let fill = p['.'] || CE.C.road;
      if (ch === '#') fill = p['#'] || CE.C.wall;
      else if (ch === ',') fill = p[','] || CE.C.grass;
      else if (ch === 'w') fill = p['w'] || CE.C.water;
      else if (ch === '=' || ch === 'o') fill = p['.'] || CE.C.road;
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, this.tw + 0.5, this.th + 0.5);
      if (ch === '.') {
        ctx.fillStyle = 'rgba(255,255,255,.10)';
        ctx.fillRect(x + 3, y + 3, this.tw - 6, this.th - 6);
      }
    }
  }
};
CE.TileMap.prototype.drawWalls = function (ctx, color, topColor) {
  for (let r = 0; r < this.h; r++) {
    for (let c = 0; c < this.w; c++) {
      if (this.rows[r][c] !== '#') continue;
      const x = c * this.tw, y = r * this.th;
      CE.card(ctx, x + 1, y + 1, this.tw - 2, this.th - 2, 6, color || CE.C.wall, 2.6);
      CE.card(ctx, x + 4, y + 3, this.tw - 8, 7, 3, topColor || 'rgba(255,255,255,.35)', 0);
    }
  }
};

/* ---------------- 简易手势按键（虚拟方向盘） ---------------- */
CE.touchInput = { dir: { x: 0, y: 0 }, jump: false, act: false };
