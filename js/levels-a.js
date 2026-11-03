/* ===================================================================
   光之城 · 关卡 1-5  levels-a.js
   1 中央车站（探索收集） 2 老城巷弄（迷雾迷宫） 3 河滨市场（记忆翻牌）
   4 城市图书馆（问答） 5 钟楼广场（节奏敲钟）
   =================================================================== */
'use strict';

/* 由 main.js 覆盖的真实回调（占位，避免加载顺序问题） */
if (!CE.win) CE.win = function () {};
if (!CE.lose) CE.lose = function () {};
if (!CE.setGoal) CE.setGoal = function () {};
if (!CE.toast) CE.toast = function () {};
if (!CE.setHint) CE.setHint = function () {};

/* ---------------- 通用输入辅助 ---------------- */
CE.dir4 = function () {
  let x = 0, y = 0;
  if (CE.keyDown('a') || CE.keyDown('arrowleft')) x--;
  if (CE.keyDown('d') || CE.keyDown('arrowright')) x++;
  if (CE.keyDown('w') || CE.keyDown('arrowup')) y--;
  if (CE.keyDown('s') || CE.keyDown('arrowdown')) y++;
  if (CE.touchInput.dir) { x += CE.touchInput.dir.x; y += CE.touchInput.dir.y; }
  return { x: CE.clamp(x, -1, 1), y: CE.clamp(y, -1, 1) };
};
CE.actHit = function () {
  return CE.keyHit('e') || CE.keyHit(' ') || CE.keyHit('enter') || CE.touchInput.act === true;
};

CE.levels = [];

/* ===================================================================
   关卡 1 · 中央车站
   =================================================================== */
CE.levels.push({
  id: 1, name: '中央车站', icon: '🚉',
  desc: '光之城的入口。一阵穿堂风把三张旧车票吹散在候车大厅，找齐它们就能换到第一块光之碎片。',
  goal: '找回 3 张散落的旧车票',
  hint: 'WASD / 方向键 移动 · 走近物品自动拾取 · 集齐后走向右上角发光的出站口 · 靠近装置按 E / 点按互动',
  create() {
    const rows = [
      '########################',
      '#......................#',
      '#.==..#........#..==...#',
      '#.....#...##...#.......#',
      '#..o..#........#...o...#',
      '#.....#........#.......#',
      '#.....####..####.......#',
      '#......................#',
      '#..o..............o....#',
      '#......................#',
      '#....###......###......#',
      '#....#........#........#',
      '#==..#........#...==...#',
      '#......................#',
      '########################'
    ];
    const map = new CE.TileMap(rows, 40, 40); map.artTheme = "station";
    const me = { x: 100, y: 552, r: 12, hh: 12, dir: 1, walk: 0 };
    const tickets = [
      { x: 180, y: 100, got: false },
      { x: 500, y: 180, got: false },
      { x: 660, y: 460, got: false }
    ];
    const gate = { x: 860, y: 90 };
    let t = 0, time = 0, got = 0, finished = false, opened = false;
    const chief = { x: 460, y: 280 };
    const extras = CE.createWalkExtras(1,map,me);

    return {
      hint: this.hint,
      update(dt) {
        t += dt;
        if (finished) return;
        time += dt;
        const d = CE.dir4();
        let vx = d.x, vy = d.y;
        if (vx && vy) { vx *= 0.707; vy *= 0.707; }
        const sp = 200 * dt;
        if (vx || vy) me.walk += dt * 12; else me.walk *= 0.86;
        map.moveActor(me, vx * sp, vy * sp);
        if (vx) me.dir = vx > 0 ? 1 : -1;
        extras.update(dt);

        tickets.forEach(tk => {
          if (tk.got) return;
          if (CE.dist(tk.x, tk.y - 24, me.x, me.y - 18) < 34) {
            tk.got = true; got++;
            CE.audio.sfx('coin');
            CE.fx.burst(tk.x, tk.y - 24, { count: 14, color: '#f4cf7d', star: true });
            CE.fx.text(tk.x, tk.y - 50, '车票 ' + got + '/3', '#E8632A');
            if (got === 3) {
              opened = true;
              CE.setGoal('车票齐了！走向右上角的出站口');
              CE.toast('✦ 出站口亮起来了');
              CE.audio.sfx('ok');
            }
          }
        });

        if (got === 3 && CE.dist(gate.x, gate.y, me.x, me.y - 20) < 46) {
          finished = true;
          const stars = 3; // Exploration is not penalized for time spent on optional interactions.
          CE.win(stars, { time: time.toFixed(1) + ' 秒' });
        }
      },
      draw(ctx) {
        // 背景墙
        ctx.fillStyle = '#294963';
        ctx.fillRect(0, 0, CE.W, CE.H);
        map.drawBase(ctx, { '.': '#7c8799', '#': '#69768b' });
        map.drawWalls(ctx, '#69768b', 'rgba(255,255,255,.45)');

        // 长椅与柱子
        for (let r = 0; r < map.h; r++) for (let c = 0; c < map.w; c++) {
          const ch = map.at(c, r);
          if (ch === '=') CE.drawBench(ctx, c * 40 + 3, r * 40 + 36, 34);
          if (ch === 'o') {
            CE.shadow(ctx, c * 40 + 20, r * 40 + 36, 14, 5);
            CE.card(ctx, c * 40 + 12, r * 40 - 24, 16, 60, 6, '#C4BBA8');
            CE.card(ctx, c * 40 + 8, r * 40 - 30, 24, 10, 4, '#E8DFC9');
          }
        }

        // 顶部站牌
        CE.card(ctx, 240, 72, 360, 58, 14, '#3B3550');
        CE.text(ctx, '中 央 车 站', 420, 94, 20, '#f4cf7d');
        CE.text(ctx, 'CENTRAL  STATION', 420, 115, 10, '#bdcdd8');

        // 时刻表
        CE.card(ctx, 620, 78, 150, 84, 8, '#e2d9bf', 2.6);
        CE.text(ctx, '13:20 → 城市之心', 695, 100, 12, '#3B3550');
        CE.text(ctx, '13:45 → 彩虹天桥', 695, 118, 12, '#3B3550');
        CE.text(ctx, '14:10 → 电视塔', 695, 136, 12, '#3B3550');

        // 出站口
        const gcol = got === 3 ? '#f4cf7d' : '#A9A3B8';
        if (got === 3 && !finished) {
          ctx.save(); ctx.globalAlpha = 0.28 + Math.sin(t * 4) * 0.12;
          CE.circle(ctx, gate.x, gate.y, 46, '#f4cf7d', 0); ctx.restore();
        }
        CE.card(ctx, gate.x - 40, gate.y - 46, 80, 92, 8, gcol, 3.4);
        CE.text(ctx, '出站口', gate.x, gate.y + 30, 13, '#3B3550');
        CE.card(ctx, gate.x - 16, gate.y - 8, 32, 8, 3, got === 3 ? '#c99363' : '#8C879C', 0);
        if (got === 3) CE.textO(ctx, '→', gate.x, gate.y - 20, 26, '#c99363');

        // 站长爷爷
        CE.drawNPC(ctx, chief.x, chief.y, '#6f9981', { walk: Math.sin(t * 1.6) * 0.4, dir: -1 });
        if (CE.dist(chief.x, chief.y, me.x, me.y) < 70) {
          CE.card(ctx, chief.x - 62, chief.y - 118, 124, 34, 12, '#e2d9bf', 2.8);
          ctx.beginPath(); ctx.moveTo(chief.x - 6, chief.y - 86); ctx.lineTo(chief.x + 6, chief.y - 86); ctx.lineTo(chief.x, chief.y - 76);
          ctx.fillStyle = '#e2d9bf'; ctx.fill();
          CE.text(ctx, got < 3 ? '车票…三张…' : '去吧，孩子！', chief.x, chief.y - 101, 13, '#3B3550');
        }

        // 车票
        tickets.forEach((tk, i) => {
          if (tk.got) return;
          const fy = Math.sin(t * 2.4 + i) * 5;
          CE.shadow(ctx, tk.x, tk.y, 12, 4, 0.12);
          ctx.save();
          ctx.translate(tk.x, tk.y - 24 + fy);
          ctx.rotate(Math.sin(t * 1.4 + i) * 0.14);
          CE.card(ctx, -16, -12, 32, 24, 4, '#FFF3C4', 2.8);
          ctx.strokeStyle = 'rgba(59,53,80,.4)'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(-16, -2); ctx.lineTo(16, -2); ctx.stroke();
          CE.text(ctx, '票', 0, 5, 11, '#E8632A');
          ctx.restore();
          CE.drawStar(ctx, tk.x + 20, tk.y - 40 + fy, 5, '#f4cf7d', t * 2);
        });

        extras.draw(ctx);
        // 玩家
        CE.drawHero(ctx, me.x, me.y, { dir: me.dir, walk: me.walk });

        // 底部进度
        CE.card(ctx, 24, 536, 168, 44, 14, 'rgba(255,253,244,.92)', 2.6);
        CE.text(ctx, '🚉 车票 ' + got + ' / 3', 108, 558, 16, '#3B3550');
      }
    };
  }
});

/* ===================================================================
   关卡 2 · 老城巷弄（迷雾迷宫）
   =================================================================== */
CE.levels.push({
  id: 2, name: '老城巷弄', icon: '🏘️',
  desc: '砖墙挤出的窄巷像一团毛线。三只小猫在雾里迷了路，找到它们，巷子尽头的路才会显现。',
  goal: '找到 3 只迷路的小猫，走到巷子尽头',
  hint: 'WASD / 方向键 移动 · 视野有限，跟着猫叫的方向走 · 找到的小猫会跟随 · 停下片刻或按 E 让小猫指路',
  create() {
    const COLS = 11, ROWS = 7;
    const g = [];
    for (let y = 0; y < ROWS * 2 + 1; y++) g.push(new Array(COLS * 2 + 1).fill('#'));
    const vis = [];
    for (let y = 0; y < ROWS; y++) vis.push(new Array(COLS).fill(false));
    const stack = [[0, 0]];
    vis[0][0] = true; g[1][1] = '.';
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const cx = cur[0], cy = cur[1];
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (d) {
        const nx = cx + d[0], ny = cy + d[1];
        return nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !vis[ny][nx];
      });
      if (!dirs.length) { stack.pop(); continue; }
      const d = CE.pick(dirs);
      const nx = cx + d[0], ny = cy + d[1];
      vis[ny][nx] = true;
      g[cy * 2 + 1 + d[1]][cx * 2 + 1 + d[0]] = '.';
      g[ny * 2 + 1][nx * 2 + 1] = '.';
      stack.push([nx, ny]);
    }
    const rows = g.map(r => r.join(''));
    const OX = 20, OY = 0, TW = 40;
    const map = new CE.TileMap(rows, TW, TW); map.artTheme = "oldtown";
    /* 所有玩法坐标使用「地图坐标系」，绘制时统一平移 OX（碰撞检测才不会错位） */
    const cellToPx = (cx, cy) => ({ x: (cx * 2 + 1.5) * TW, y: (cy * 2 + 1.5) * TW + 16 });

    const start = cellToPx(0, 0);
    const me = { x: start.x, y: start.y, r: 11, hh: 11, dir: 1, walk: 0 };
    const exitP = cellToPx(COLS - 1, ROWS - 1);

    // 猫咪：随机挑距离起点较远的格子
    const cats = [];
    let guard = 0;
    while (cats.length < 3 && guard++ < 400) {
      const cx = CE.randInt(0, COLS - 1), cy = CE.randInt(0, ROWS - 1);
      if (Math.abs(cx) + Math.abs(cy) < 5) continue;
      const p = cellToPx(cx, cy);
      if (cats.some(c => CE.dist(c.x, c.y, p.x, p.y) < 180)) continue;
      if (CE.dist(p.x, p.y, exitP.x, exitP.y) < 100) continue;
      cats.push({ x: p.x, y: p.y, found: false, meowT: CE.rand(0, 1.5) });
    }
    while (cats.length < 3) {
      const p = cellToPx(CE.randInt(2, COLS - 1), CE.randInt(2, ROWS - 1));
      cats.push({ x: p.x, y: p.y, found: false, meowT: 0 });
    }

    let t = 0, found = 0, finished = false, time = 0;
    const companions = CE.createCatCompanions(map,me,cats,exitP);

    return {
      hint: this.hint,
      update(dt) {
        t += dt;
        if (finished) return;
        time += dt;
        const d = CE.dir4();
        let vx = d.x, vy = d.y;
        if (vx && vy) { vx *= 0.707; vy *= 0.707; }
        const sp = 175 * dt;
        if (vx || vy) me.walk += dt * 12; else me.walk *= 0.86;
        map.moveActor(me, vx * sp, vy * sp);
        me.x = CE.clamp(me.x, 12, map.pw - 12);
        if (vx) me.dir = vx > 0 ? 1 : -1;

        cats.forEach(c => {
          if (c.found) return;
          const dd = CE.dist(c.x, c.y - 10, me.x, me.y - 14);
          if (dd < 120) {
            c.meowT -= dt;
            if (c.meowT <= 0) { CE.audio.sfx('meow'); c.meowT = 1.4 + dd / 200; }
          }
          if (dd < 34) {
            c.found = true; found++;
            CE.audio.sfx('meow');
            CE.fx.burst(c.x, c.y - 20, { count: 16, color: '#c78d9f', star: true });
            CE.fx.text(c.x, c.y - 66, '找到了！', '#E8632A');
            CE.setGoal(found < 3 ? '找到迷路的小猫（' + found + '/3）' : '快走到巷子尽头！');
          }
        });

        companions.update(dt);
        if (found === 3 && CE.dist(exitP.x, exitP.y - 10, me.x, me.y - 14) < 42) {
          finished = true;
          const stars = 3;
          CE.win(stars, { cat: '3 / 3' });
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#2B2740';
        ctx.fillRect(0, 0, CE.W, CE.H);
        ctx.save(); ctx.translate(OX, OY);
        map.drawBase(ctx, { '.': '#C9BCA6', '#': '#8A7A66' });
        map.drawWalls(ctx, '#A99A85', 'rgba(255,255,255,.22)');

        // 出口
        const pulse = 0.35 + Math.sin(t * 3) * 0.15;
        ctx.save(); ctx.globalAlpha = pulse;
        CE.circle(ctx, exitP.x, exitP.y - 10, 40, '#6f9981', 0); ctx.restore();
        CE.card(ctx, exitP.x - 18, exitP.y - 46, 36, 50, 8, found === 3 ? '#6f9981' : '#6E6880', 3);
        CE.text(ctx, '出口', exitP.x, exitP.y + 14, 11, '#3B3550');

        // 猫
        cats.forEach((c, i) => {
          if (c.found) return;
          const inRange = CE.dist(c.x, c.y, me.x, me.y) < 150;
          ctx.save();
          if (!inRange) ctx.globalAlpha = 0.0; else ctx.globalAlpha = CE.clamp(1 - CE.dist(c.x, c.y, me.x, me.y) / 160, 0.15, 1);
          if (ctx.globalAlpha > 0.05) CE.drawCat(ctx, c.x, c.y, i % 2 ? '#c78d9f' : '#F7C88A', t + i);
          ctx.restore();
        });

        companions.draw(ctx,t);
        // 玩家
        CE.drawHero(ctx, me.x, me.y, { dir: me.dir, walk: me.walk });
        ctx.restore();

        // 迷雾
        const px = me.x + OX, py = me.y - 20;
        const grd = ctx.createRadialGradient(px, py, 40, px, py, 170);
        grd.addColorStop(0, 'rgba(20,16,40,0)');
        grd.addColorStop(0.62, 'rgba(20,16,40,.55)');
        grd.addColorStop(1, 'rgba(14,10,28,.94)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, CE.W, CE.H);

        // 光源
        ctx.save(); ctx.globalAlpha = 0.18;
        CE.circle(ctx, px, py, 56, '#FFE98A', 0); ctx.restore();

        // 进度
        CE.card(ctx, 24, 536, 176, 44, 14, 'rgba(255,253,244,.94)', 2.6);
        CE.text(ctx, '🐱 小猫 ' + found + ' / 3', 112, 558, 16, '#3B3550');
      }
    };
  }
});

/* ===================================================================
   关卡 3 · 河滨市场（记忆翻牌）
   =================================================================== */
CE.levels.push({
  id: 3, name: '河滨市场', icon: '🐟',
  desc: '雨把摊位的招牌全浇花了。把十六张招牌翻过来，让相同的图案配对，市场才能重新开张。',
  goal: '找出全部 8 组相同图案',
  hint: '点击 / 触摸 翻牌 · 相同的两张会留在正面 · 步数越少星星越多',
  create() {
    const SYMS = ['🍎', '🐟', '🥖', '🌻', '📖', '🎩', '☕', '🌂'];
    let deck = [];
    SYMS.forEach(s => { deck.push({ s, k: s }); deck.push({ s, k: s }); });
    for (let i = deck.length - 1; i > 0; i--) { const j = CE.randInt(0, i); const tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp; }
    const cards = deck.map((d, i) => ({ s: d.s, i, open: false, matched: false, flip: 0 }));

    const CW = 92, GAP = 14, N = 4;
    const startX = (960 - (N * CW + (N - 1) * GAP)) / 2;
    const startY = 156;
    let openA = null, openB = null, waitT = 0, moves = 0, matchedCount = 0;
    let t = 0, timeLeft = 80, finished = false;

    function pos(i) {
      const c = i % N, r = Math.floor(i / N);
      return { x: startX + c * (CW + GAP), y: startY + r * (CW + GAP) };
    }

    return {
      hint: this.hint,
      update(dt) {
        t += dt;
        if (finished) return;
        timeLeft -= dt;
        if (timeLeft <= 0) {
          finished = true;
          CE.audio.sfx('lose');
          CE.lose('时间到了，招牌又暗下去了一半……再试一次吧！');
          return;
        }
        // 翻转动画
        cards.forEach(c => {
          const target = (c.open || c.matched) ? 1 : 0;
          c.flip += (target - c.flip) * Math.min(1, dt * 12);
        });

        if (waitT > 0) {
          waitT -= dt;
          if (waitT <= 0 && openA !== null && openB !== null) {
            if (cards[openA].s !== cards[openB].s) {
              cards[openA].open = false; cards[openB].open = false;
              CE.audio.sfx('error');
            }
            openA = openB = null;
          }
        }

        if (CE.input.clicked) {
          const mx = CE.input.mx, my = CE.input.my;
          for (let i = 0; i < cards.length; i++) {
            const p = pos(i);
            if (mx > p.x && mx < p.x + CW && my > p.y && my < p.y + CW) {
              const c = cards[i];
              if (c.matched || c.open || waitT > 0) break;
              c.open = true;
              CE.audio.sfx('click');
              if (openA === null) { openA = i; }
              else if (openB === null && i !== openA) {
                openB = i; moves++;
                if (cards[openA].s === cards[openB].s) {
                  cards[openA].matched = cards[openB].matched = true;
                  matchedCount++;
                  CE.audio.sfx('coin');
                  CE.fx.burst(p.x + CW / 2, p.y + CW / 2, { count: 12, color: '#f4cf7d', star: true });
                  openA = openB = null;
                  CE.setGoal('找出全部 8 组相同图案（' + matchedCount + '/8）');
                  if (matchedCount === 8) {
                    finished = true;
                    const stars = moves <= 10 ? 3 : moves <= 16 ? 2 : 1;
                    setTimeout(() => CE.win(stars, { move: moves + ' 步' }), 380);
                  }
                } else {
                  waitT = 0.62;
                }
              }
              break;
            }
          }
        }
      },
      draw(ctx) {
        CE.scenery(ctx, 0);
        // 招牌标题
        CE.card(ctx, 330, 44, 300, 44, 14, 'rgba(255,253,244,.94)', 3);
        CE.text(ctx, '河 滨 市 场 · 招 牌 配 对', 480, 66, 18, '#3B3550');

        // 卡片
        cards.forEach((c, i) => {
          const p = pos(i);
          const k = Math.abs(Math.cos(Math.PI * c.flip));
          const w = CW * (0.12 + 0.88 * k);
          ctx.save();
          ctx.translate(p.x + CW / 2, p.y + CW / 2);
          if (c.matched) {
            ctx.save(); ctx.globalAlpha = 0.35;
            CE.card(ctx, -CW / 2 - 4, -CW / 2 - 4, CW + 8, CW + 8, 16, '#6f9981', 0);
            ctx.restore();
          }
          CE.shadow(ctx, 0, CW / 2 - 4, CW * 0.4, 6, 0.12);
          const back = !c.open && !c.matched;
          CE.card(ctx, -w / 2, -CW / 2, w, CW, 14, back ? '#30475c' : '#e2d9bf', 3.2);
          if (back) {
            CE.text(ctx, '?', 0, 2, 34, 'rgba(255,255,255,.95)');
            ctx.save(); ctx.globalAlpha = .3;
            CE.text(ctx, '✦', 0, -CW / 2 + 18, 14, '#fff'); ctx.restore();
          } else if (k > 0.45) {
            ctx.save(); ctx.scale(0.6 + k * 0.4, 1);
            CE.text(ctx, c.s, 0, 4, 42, '#3B3550');
            ctx.restore();
          }
          ctx.restore();
        });

        // 计时条
        const pct = CE.clamp(timeLeft / 80, 0, 1);
        CE.card(ctx, 300, 552, 360, 26, 13, '#e2d9bf', 3);
        CE.card(ctx, 304, 556, 352 * pct, 18, 9, pct > 0.35 ? '#6f9981' : '#FF6B6B', 0);
        CE.text(ctx, '⏱ ' + Math.ceil(timeLeft) + 's　·　步数 ' + moves, 480, 565, 13, '#3B3550');

        // 已配对
        CE.card(ctx, 24, 536, 176, 44, 14, 'rgba(255,253,244,.94)', 2.6);
        CE.text(ctx, '🧩 已配对 ' + matchedCount + ' / 8', 112, 558, 15, '#3B3550');
      }
    };
  }
});

/* ===================================================================
   关卡 4 · 城市图书馆（知识问答）
   =================================================================== */
CE.levels.push({
  id: 4, name: '城市图书馆', icon: '📚',
  desc: '管理员说，记住一座城市比拍下它更重要。回答五个关于城市与影像的小问题。',
  goal: '答对至少 3 道问题',
  hint: '点击 / 触摸 选择答案 · 答对 4 题以上可得三星',
  create() {
    const QS = [
      {
        q: '在色彩学里，橙色（Orange）的互补色是？',
        o: ['蓝色', '紫色', '绿色', '黄色'], a: 0,
        tip: '色轮上正对的一组颜色互为补色，橙与蓝并置时最鲜活。'
      },
      {
        q: '视频里 "24 帧 / 秒" 之所以看起来流畅，主要因为？',
        o: ['文件更小', '人眼的视觉暂留', '声音更好听', '屏幕刷新率高'], a: 1,
        tip: '连续静态画面在人眼留下短暂残像，形成运动错觉，这就是电影感的基础。'
      },
      {
        q: '一座城市最先让人记住的，通常是它的？',
        o: ['人口数量', '天际线与街道尺度', '车牌号码', '邮政编码'], a: 1,
        tip: '建筑的轮廓和街道的宽窄，决定了人走在城市里的身体感受。'
      },
      {
        q: '公共导视系统的第一原则是？',
        o: ['颜色越多越好', '字体越花越好', '一眼就能看懂', '尽量写得长'], a: 2,
        tip: '好的设计是隐形的：让人不需要思考就知道往哪走。'
      },
      {
        q: '小悠手上那张旧地图，一共标了几个光点？',
        o: ['七个', '八个', '十个', '十二个'], a: 2,
        tip: '地图上有十个光点，连起来正好绕城一圈。'
      },
      {
        q: '在 RGB 色彩模式中，R 代表？',
        o: ['Red 红', 'Round 圆', 'Rate 比率', 'Render 渲染'], a: 0,
        tip: 'RGB 是加色模式，红、绿、蓝三种光叠加出屏幕上的所有颜色。'
      }
    ];
    // 随机抽 5 题
    const pool = QS.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = CE.randInt(0, i); const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
    const quiz = pool.slice(0, 5);

    let idx = 0, correct = 0, picked = -1, feedT = 0, t = 0, finished = false;
    const optRects = [];

    return {
      hint: this.hint,
      update(dt) {
        t += dt;
        if (finished) return;
        if (feedT > 0) {
          feedT -= dt;
          if (feedT <= 0) {
            picked = -1;
            if (idx >= quiz.length) {
              finished = true;
              if (correct >= 3) {
                const stars = correct >= 5 ? 3 : correct >= 4 ? 2 : 1;
                CE.win(stars, { score: correct + ' / 5' });
              } else {
                CE.lose('只答对了 ' + correct + ' 题……城市的历史还没记牢呢，再来一次吧。');
              }
            }
          }
          return;
        }
        if (CE.input.clicked) {
          for (let i = 0; i < optRects.length; i++) {
            const r = optRects[i];
            if (CE.input.mx > r.x && CE.input.mx < r.x + r.w && CE.input.my > r.y && CE.input.my < r.y + r.h) {
              if (picked >= 0) break;
              picked = i;
              if (i === quiz[idx].a) { correct++; CE.audio.sfx('ok'); CE.fx.burst(CE.input.mx, CE.input.my, { count: 14, star: true, color: '#6f9981' }); }
              else { CE.audio.sfx('error'); }
              CE.setGoal('答对 ' + correct + ' / 5　（第 ' + Math.min(idx + 1, 5) + ' 题）');
              feedT = 1.5;
              setTimeout(() => { idx++; }, 700);
              break;
            }
          }
        }
      },
      draw(ctx) {
        CE.scenery(ctx, 1);
        // 题目面板
        CE.card(ctx, 246, 96, 468, 470, 22, '#e2d9bf', 4);
        CE.card(ctx, 300, 58, 360, 44, 14, '#3B3550');
        CE.text(ctx, '第 ' + Math.min(idx + 1, 5) + ' / 5 题　·　答对 ' + correct, 480, 80, 15, '#f4cf7d');

        optRects.length = 0;
        const q = quiz[Math.min(idx, quiz.length - 1)];
        // 自动换行
        ctx.font = CE.font(19, 800);
        const maxW = 400;
        const lines = [];
        let line = '';
        for (const ch of q.q) {
          if (ctx.measureText(line + ch).width > maxW) { lines.push(line); line = ch; }
          else line += ch;
        }
        lines.push(line);
        lines.forEach((ln, i) => CE.text(ctx, ln, 480, 140 + i * 30, 19, '#3B3550'));

        const baseY = 140 + lines.length * 30 + 26;
        q.o.forEach((op, i) => {
          const y = baseY + i * 62;
          const r = { x: 276, y, w: 408, h: 50 };
          optRects.push(r);
          let fill = '#fff';
          let txtCol = '#3B3550';
          if (picked >= 0) {
            if (i === q.a) { fill = '#C8F0CC'; }
            else if (i === picked) { fill = '#FFD3D3'; }
          }
          const hover = CE.input.mx > r.x && CE.input.mx < r.x + r.w && CE.input.my > r.y && CE.input.my < r.y + r.h;
          CE.card(ctx, r.x, r.y, r.w, r.h, 13, fill, 3);
          if (hover && picked < 0) {
            ctx.save(); ctx.globalAlpha = .18; CE.card(ctx, r.x, r.y, r.w, r.h, 13, '#f4cf7d', 0); ctx.restore();
          }
          CE.circle(ctx, r.x + 30, y + 25, 15, picked >= 0 && i === q.a ? '#6f9981' : '#f4cf7d', 2.8);
          CE.text(ctx, 'ABCD'[i], r.x + 30, y + 26, 15, '#3B3550');
          CE.text(ctx, op, r.x + 56, y + 26, 16, txtCol, 'left');
        });

        if (picked >= 0) {
          CE.card(ctx, 276, 520, 408, 40, 12, '#FFF1BF', 2.6);
          CE.text(ctx, '💡 ' + q.tip, 480, 540, 12.5, '#3B3550');
        }
        // 分数点
        for (let i = 0; i < 5; i++) {
          CE.circle(ctx, 440 + i * 22, 552, 7, i < correct ? '#6f9981' : '#D8D4E0', 2.4);
        }
      }
    };
  }
});

/* ===================================================================
   关卡 5 · 钟楼广场（节奏敲钟）
   =================================================================== */
CE.levels.push({
  id: 5, name: '钟楼广场', icon: '🕰️',
  desc: '钟声停了三个月。当指针经过正中、光影最亮的瞬间敲下去，钟就会重新响起。',
  goal: '准确敲响钟声 8 次',
  hint: '指针进入中央金色区域时按 空格 / 点击屏幕 敲钟 · 失误 6 次需要重来',
  create() {
    const X0 = 250, X1 = 710, TARGET = 480;
    const PERFECT = 18, GOOD = 52;
    let nx = X0, dir = 1, speed = 330;
    let hits = 0, miss = 0, t = 0, finished = false;
    let bellSwing = 0, flash = 0, judge = '', judgeT = 0, rings = [];

    return {
      hint: this.hint,
      update(dt) {
        t += dt;
        if (finished) return;
        nx += dir * speed * dt;
        if (nx > X1) { nx = X1; dir = -1; }
        if (nx < X0) { nx = X0; dir = 1; }
        bellSwing *= 0.9;
        flash = Math.max(0, flash - dt * 2.4);
        judgeT = Math.max(0, judgeT - dt);
        rings.forEach(r => { r.r += dt * 260; r.a -= dt * 1.4; });
        rings = rings.filter(r => r.a > 0);

        const strike = CE.keyHit(' ') || CE.keyHit('enter') || CE.input.clicked || CE.touchInput.act === true;

        if (strike) {
          const d = Math.abs(nx - TARGET);
          if (d <= PERFECT) { hits++; judge = 'PERFECT!'; judgeT = 0.7; CE.audio.sfx('bell'); flash = 1; }
          else if (d <= GOOD) { hits++; judge = 'GOOD'; judgeT = 0.7; CE.audio.sfx('ok'); flash = 0.6; }
          else { miss++; judge = 'MISS…'; judgeT = 0.7; CE.audio.sfx('error'); }
          bellSwing = 0.35;
          speed = Math.min(620, speed + 26);
          rings.push({ x: TARGET, y: 250, r: 20, a: 1 });
          CE.setGoal('敲响钟声（' + hits + ' / 8）· 失误 ' + miss + ' / 6');
          if (hits >= 8) {
            finished = true;
            const stars = miss <= 1 ? 3 : miss <= 3 ? 2 : 1;
            setTimeout(() => CE.win(stars, { ring: hits + ' 次钟声' }), 500);
          } else if (miss >= 6) {
            finished = true;
            CE.audio.sfx('lose');
            setTimeout(() => CE.lose('钟声又断掉了……别急，跟着指针的节奏来。'), 400);
          }
        }
      },
      draw(ctx) {
        CE.scenery(ctx, 3);
        // 钟楼
        CE.card(ctx, 380, 96, 200, 404, 14, '#E8DCC4', 4);
        ctx.beginPath();
        ctx.moveTo(360, 100); ctx.lineTo(480, 20); ctx.lineTo(600, 100); ctx.closePath();
        ctx.fillStyle = '#FF8C6B'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = CE.C.line; ctx.stroke();
        // 钟面
        CE.circle(ctx, 480, 200, 68, '#e2d9bf', 4);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          CE.circle(ctx, 480 + Math.cos(a) * 54, 200 + Math.sin(a) * 54, i % 3 === 0 ? 4 : 2.4, i % 3 === 0 ? '#3B3550' : '#A8A2B8', 0);
        }
        // 钟摆（视觉）
        const swingA = Math.sin(t * 1.6) * 0.18 + bellSwing * Math.sin(t * 8) * 0.6;
        ctx.save(); ctx.translate(480, 214); ctx.rotate(swingA);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 150); ctx.lineWidth = 5; ctx.strokeStyle = '#3B3550'; ctx.stroke();
        CE.circle(ctx, 0, 156, 14, '#f4cf7d', 3.4);
        ctx.restore();
        // 钟体
        ctx.save(); ctx.translate(480, 300); ctx.rotate(swingA * 0.5);
        ctx.beginPath();
        ctx.moveTo(-34, 46); ctx.quadraticCurveTo(-40, -14, 0, -26);
        ctx.quadraticCurveTo(40, -14, 34, 46); ctx.closePath();
        ctx.fillStyle = flash > 0.3 ? '#f4cf7d' : '#E0A93C'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = CE.C.line; ctx.stroke();
        CE.card(ctx, -40, 44, 80, 12, 6, '#C08F2E', 3);
        ctx.restore();
        // 钟声涟漪
        rings.forEach(r => {
          ctx.save(); ctx.globalAlpha = Math.max(0, r.a) * 0.7;
          CE.circle(ctx, r.x, r.y, r.r, null, 3); ctx.restore();
        });
        // 闪光
        if (flash > 0.02) {
          ctx.save(); ctx.globalAlpha = flash * 0.5;
          CE.circle(ctx, 480, 300, 80 + flash * 60, '#FFF3B0', 0); ctx.restore();
        }

        // 节奏条
        CE.card(ctx, X0 - 30, 430, X1 - X0 + 60, 76, 18, 'rgba(59,53,80,.72)', 3);
        // 目标区
        CE.card(ctx, TARGET - GOOD, 442, GOOD * 2, 52, 12, 'rgba(255,217,61,.35)', 0);
        CE.card(ctx, TARGET - PERFECT, 442, PERFECT * 2, 52, 8, 'rgba(255,217,61,.95)', 0);
        ctx.beginPath(); ctx.moveTo(TARGET, 434); ctx.lineTo(TARGET, 502);
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
        // 指针
        CE.card(ctx, nx - 5, 426, 10, 84, 5, '#FF6B6B', 3);
        CE.circle(ctx, nx, 424, 9, '#FF6B6B', 3);
        CE.text(ctx, '敲！', TARGET, 414, 15, '#f4cf7d');

        // 判定文字
        if (judgeT > 0) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, judgeT * 2);
          const col = judge === 'MISS…' ? '#FF6B6B' : judge === 'GOOD' ? '#f4cf7d' : '#6f9981';
          CE.textO(ctx, judge, 480, 372 - (0.7 - judgeT) * 30, 30, col, 'center', 6);
          ctx.restore();
        }

        // 进度
        CE.card(ctx, 24, 536, 210, 44, 14, 'rgba(255,253,244,.94)', 2.6);
        CE.text(ctx, '🔔 ' + hits + ' / 8　失误 ' + miss + ' / 6', 129, 558, 14, '#3B3550');
        for (let i = 0; i < 8; i++) {
          CE.circle(ctx, 690 + i * 30, 556, 10, i < hits ? '#f4cf7d' : 'rgba(255,255,255,.3)', 2.6);
        }
      }
    };
  }
});
