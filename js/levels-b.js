/* ===================================================================
   光之城 · 关卡 6-10  levels-b.js
   6 地下铁（潜行躲避） 7 彩虹天桥（平台跳跃） 8 中央公园（滑块拼图）
   9 电视塔（旋转光路） 10 城市之心（终章）
   =================================================================== */
'use strict';

/* ===================================================================
   关卡 6 · 地下铁（潜行）
   =================================================================== */
CE.levels.push({
  id: 6, name: '地下铁', icon: '🚇',
  desc: '末班车之后的站台，只有巡检机器人的光在移动。避开它们的视线，走到最里面的站台尽头。',
  goal: '避开巡逻光，抵达右上角站台尽头',
  hint: 'WASD / 方向键 移动 · 白色扇形是机器人的视线 · 被照到会被送回起点',
  create() {
    const raw = [
      '########################',
      '#......................#',
      '#......................#',
      '#.######....######.....#',
      '#.#....#....#....#.....#',
      '#.#....#....#....#.....#',
      '#.##.###....##.###.....#',
      '#......................#',
      '#......................#',
      '#....##.###....##.###..#',
      '#....#....#....#....#..#',
      '#....#....#....#....#..#',
      '#....######....######..#',
      '#......................#',
      '########################'
    ];
    const T = 40;
    const rows = raw.map(r => (r + '#'.repeat(40)).slice(0, 24));
    const map = new CE.TileMap(rows, T, T); map.artTheme = "metro";
    const start = { x: 100, y: 13 * T + 36 };
    const me = { x: start.x, y: start.y, r: 11, hh: 11, dir: 1, walk: 0 };
    const exitP = { x: 880, y: 1 * T + 36 };

    const robots = [
      { x: 300, y: 2 * T + 36, dir: 1, sp: 105, minX: 90, maxX: 860, a: 1 },
      { x: 700, y: 8 * T + 36, dir: -1, sp: 130, minX: 90, maxX: 860, a: -1 },
      { x: 500, y: 13 * T + 36, dir: 1, sp: 88, minX: 300, maxX: 860, a: 1 }
    ];
    const RANGE = 165, HALF = 0.46;

    const extras = CE.createWalkExtras(6,map,me);
    let t = 0, caught = 0, finished = false, hitCD = 0, shake = 0;

    return {
      hint: this.hint,
      update(dt) {
        t += dt;
        if (finished) return;
        shake = Math.max(0, shake - dt * 3);
        hitCD = Math.max(0, hitCD - dt);

        const d = CE.dir4();
        let vx = d.x, vy = d.y;
        if (vx && vy) { vx *= 0.707; vy *= 0.707; }
        const sp = 185 * dt;
        if (vx || vy) me.walk += dt * 12; else me.walk *= 0.86;
        map.moveActor(me, vx * sp, vy * sp);
        if (vx) me.dir = vx > 0 ? 1 : -1;
        extras.update(dt);

        let seen = false;
        robots.forEach(rb => {
          rb.x += rb.dir * rb.sp * dt;
          if (rb.x > rb.maxX) { rb.x = rb.maxX; rb.dir = -1; }
          if (rb.x < rb.minX) { rb.x = rb.minX; rb.dir = 1; }
          rb.a = rb.dir;
          // 判定是否在视线内
          const dx = me.x - rb.x, dy = (me.y - 18) - (rb.y - 40);
          const dd = Math.hypot(dx, dy);
          const ang = Math.atan2(dy, dx);
          const facing = rb.dir > 0 ? 0 : Math.PI;
          let diff = Math.abs(ang - facing);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (dd < RANGE && diff < HALF && hitCD <= 0) seen = true;
        });

        if (seen) {
          caught++;
          hitCD = 1.8;
          shake = 1;
          CE.audio.sfx('hit');
          CE.fx.burst(me.x, me.y - 20, { count: 16, color: '#FF6B6B' });
          CE.fx.text(me.x, me.y - 60, '被发现了！', '#FF6B6B');
          me.x = start.x; me.y = start.y;
          CE.toast('被巡逻光照到了，回到起点');
        }

        if (CE.dist(exitP.x, exitP.y - 10, me.x, me.y - 14) < 42) {
          finished = true;
          const stars = caught === 0 ? 3 : caught <= 2 ? 2 : 1;
          CE.win(stars, { caught: caught + ' 次' });
        }
      },
      draw(ctx) {
        ctx.save();
        if (shake > 0) ctx.translate(CE.rand(-1, 1) * shake * 8, CE.rand(-1, 1) * shake * 8);
        // 背景
        ctx.fillStyle = '#232038';
        ctx.fillRect(-20, -20, 1000, 640);
        map.drawBase(ctx, { '.': '#4A4663', '#': '#33304A' });
        // 地砖
        ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
        for (let x = 0; x <= 960; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
        for (let y = 0; y <= 600; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
        map.drawWalls(ctx, '#3B3752', 'rgba(255,255,255,.10)');

        // 站台黄线
        [2, 8, 13].forEach(r => {
          ctx.strokeStyle = 'rgba(255,217,61,.55)'; ctx.lineWidth = 4;
          ctx.setLineDash([16, 12]);
          ctx.beginPath(); ctx.moveTo(40, r * 40 + 34); ctx.lineTo(920, r * 40 + 34); ctx.stroke();
          ctx.setLineDash([]);
        });

        // 出口
        ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.12;
        CE.circle(ctx, exitP.x, exitP.y - 20, 44, '#6f9981', 0); ctx.restore();
        CE.card(ctx, exitP.x - 22, exitP.y - 54, 44, 58, 8, '#6f9981', 3);
        CE.text(ctx, '出口', exitP.x, exitP.y + 20, 11, '#6f9981');

        // 视线扇形
        robots.forEach(rb => {
          const facing = rb.dir > 0 ? 0 : Math.PI;
          const gx = rb.x, gy = rb.y - 40;
          const grd = ctx.createRadialGradient(gx, gy, 6, gx, gy, RANGE);
          grd.addColorStop(0, 'rgba(255,255,255,.42)');
          grd.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.arc(gx, gy, RANGE, facing - HALF, facing + HALF);
          ctx.closePath();
          ctx.fillStyle = grd; ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
        });

        // 机器人
        robots.forEach(rb => CE.drawRobot(ctx, rb.x, rb.y, t, hitCD > 1.4));

        extras.draw(ctx);
        // 玩家
        CE.drawHero(ctx, me.x, me.y, { dir: me.dir, walk: me.walk });

        // 暗角
        const vg = ctx.createRadialGradient(480, 300, 260, 480, 300, 620);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, 960, 600);
        ctx.restore();

        CE.card(ctx, 22, 540, 178, 42, 14, 'rgba(255,253,244,.94)', 2.6);
        CE.text(ctx, '👣 被发现 ' + caught + ' 次', 111, 561, 14, '#3B3550');
      }
    };
  }
});

/* ===================================================================
   关卡 7 · 彩虹天桥（平台跳跃）
   =================================================================== */
CE.levels.push({
  id: 7, name: '彩虹天桥', icon: '🌈',
  desc: '天桥曾经是彩虹色的。踩着旧灯泡一路向上，点亮整座桥。',
  goal: '收集 5 颗星星，抵达桥的尽头',
  hint: 'A / D 或 ← → 左右移动 · 空格 / W / ↑ 跳跃（可二段跳）· 掉下去会回到检查点',
  create() {
    const WORLD = 2680;
    const plats = [
      { x: 0, y: 520, w: 420, h: 90 },
      { x: 500, y: 520, w: 320, h: 90 },
      { x: 900, y: 520, w: 240, h: 90 },
      { x: 1220, y: 520, w: 260, h: 90 },
      { x: 1560, y: 520, w: 340, h: 90 },
      { x: 1980, y: 520, w: 700, h: 90 },
      { x: 600, y: 408, w: 116, h: 22 },
      { x: 770, y: 322, w: 108, h: 22 },
      { x: 980, y: 424, w: 120, h: 22 },
      { x: 1180, y: 342, w: 112, h: 22 },
      { x: 1360, y: 258, w: 112, h: 22 },
      { x: 1600, y: 384, w: 120, h: 22 },
      { x: 1770, y: 300, w: 110, h: 22 },
      { x: 2060, y: 402, w: 122, h: 22 },
      { x: 2230, y: 318, w: 122, h: 22 },
      { x: 2390, y: 232, w: 140, h: 22 }
    ];
    const stars = [
      { x: 660, y: 372 }, { x: 824, y: 286 }, { x: 1236, y: 306 },
      { x: 1416, y: 222 }, { x: 2290, y: 282 }
    ].map(s => ({ x: s.x, y: s.y, got: false }));

    const me = { x: 60, y: 500, vx: 0, vy: 0, onGround: false, jumps: 0, dir: 1, walk: 0, stun: 0 };
    const cam = { x: 0 };
    const checkpoints = [60, 520, 940, 1600, 2000];
    let lastCP = 0, lives = 3, got = 0, t = 0, finished = false, time = 0, camY = 0;

    function solidAt(x, y) {
      for (const p of plats) {
        if (x > p.x && x < p.x + p.w && y > p.y && y < p.y + p.h) return true;
      }
      return false;
    }

    return {
      hint: this.hint,
      update(dt) {
        t += dt;
        if (finished) return;
        time += dt;
        const d = CE.dir4();
        const targetVx = d.x * 265;
        me.vx = CE.lerp(me.vx, targetVx, d.x ? 0.32 : 0.22);
        if (d.x) me.dir = d.x > 0 ? 1 : -1;

        // 跳跃
        const jump = CE.keyHit(' ') || CE.keyHit('w') || CE.keyHit('arrowup') || CE.touchInput.act === true;
        if (jump) {
          if (me.onGround) { me.vy = -545; me.jumps = 1; me.onGround = false; CE.audio.sfx('jump'); }
          else if (me.jumps < 2) { me.vy = -470; me.jumps = 2; CE.audio.sfx('jump'); CE.fx.burst(me.x, me.y, { count: 6, color: '#bdcdd8' }); }
        }

        me.vy += 1560 * dt;
        me.vy = Math.min(me.vy, 900);

        // 水平
        const nx = me.x + me.vx * dt;
        if (!solidAt(nx, me.y - 6) && !solidAt(nx, me.y - 26)) me.x = nx;
        else me.vx = 0;
        me.x = CE.clamp(me.x, 16, WORLD - 16);

        // 垂直
        const prevBottom = me.y;
        me.y += me.vy * dt;
        me.onGround = false;
        for (const p of plats) {
          if (me.x > p.x - 8 && me.x < p.x + p.w + 8) {
            if (prevBottom <= p.y + 6 && me.y >= p.y) {
              me.y = p.y; me.vy = 0; me.onGround = true; me.jumps = 0;
            }
          }
        }
        if (me.x > 0 && me.y >= 520 && me.x < 420) { me.y = 520; me.vy = 0; me.onGround = true; me.jumps = 0; }

        if (me.onGround) me.walk += Math.abs(me.vx) * dt * 0.05; else me.walk += dt * 3;

        // 星星
        stars.forEach(s => {
          if (s.got) return;
          if (CE.dist(s.x, s.y, me.x, me.y - 22) < 34) {
            s.got = true; got++;
            CE.audio.sfx('coin');
            CE.fx.burst(s.x, s.y, { count: 14, star: true, color: '#f4cf7d' });
            CE.setGoal('收集星星（' + got + ' / 5）并抵达终点');
          }
        });

        // 检查点
        checkpoints.forEach((cx, i) => { if (me.x > cx && i > lastCP) lastCP = i; });

        // 掉落
        if (me.y > 660) {
          lives--;
          CE.audio.sfx('lose');
          if (lives <= 0) {
            finished = true;
            CE.lose('掉下去太多次了……别担心，天桥还在等你。');
            return;
          }
          me.x = checkpoints[lastCP]; me.y = 480; me.vx = 0; me.vy = 0;
          CE.fx.burst(me.x, me.y, { count: 12, color: '#FF6B6B' });
        }

        // 相机
        const targetCam = CE.clamp(me.x - 420, 0, WORLD - 960);
        cam.x = CE.lerp(cam.x, targetCam, Math.min(1, dt * 6));

        // 终点
        if (me.x > 2560) {
          finished = true;
          const stars3 = got >= 5 ? 3 : got >= 3 ? 2 : 1;
          CE.win(stars3, { star: got + ' / 5' });
        }
      },
      draw(ctx) {
        CE.scenery(ctx, 3);

        ctx.save();
        ctx.translate(-cam.x, 0);

        // 彩虹带
        ctx.save();
        ctx.globalAlpha = 0.5;
        const rb = ['#FF6B6B', '#FFA94D', '#f4cf7d', '#6f9981', '#5FB3D4', '#B9A0E3'];
        rb.forEach((col, i) => {
          ctx.strokeStyle = col; ctx.lineWidth = 13;
          ctx.beginPath();
          ctx.moveTo(-100, 470 - i * 12);
          ctx.quadraticCurveTo(1300, 40 - i * 12, 2780, 430 - i * 12);
          ctx.stroke();
        });
        ctx.restore();

        // 平台
        plats.forEach(p => {
          const isFloat = p.h < 40;
          if (isFloat) {
            CE.shadow(ctx, p.x + p.w / 2, p.y + 14, p.w * 0.42, 6, 0.1);
            CE.card(ctx, p.x, p.y, p.w, p.h, 10, '#FFE9A8', 3.2);
            CE.card(ctx, p.x + 6, p.y + 4, p.w - 12, 7, 4, 'rgba(255,255,255,.65)', 0);
            // 灯泡
            for (let i = 0; i < Math.floor(p.w / 34); i++) {
              const lx = p.x + 22 + i * 34;
              CE.circle(ctx, lx, p.y + 15, 4.6, '#f4cf7d', 2);
              ctx.save(); ctx.globalAlpha = 0.22;
              CE.circle(ctx, lx, p.y + 15, 11, '#FFF3B0', 0); ctx.restore();
            }
          } else {
            CE.card(ctx, p.x, p.y, p.w, p.h, 8, '#B98F62', 3);
            CE.card(ctx, p.x, p.y, p.w, 12, 6, '#426c57', 3);
            for (let i = 0; i < p.w / 40; i++) {
              const gx = p.x + 16 + i * 40;
              ctx.fillStyle = 'rgba(90,160,90,.5)';
              ctx.fillRect(gx, p.y + 30, 14, 4);
            }
          }
        });

        // 星星
        stars.forEach((s, i) => {
          if (s.got) return;
          const fy = Math.sin(t * 2.6 + i) * 6;
          ctx.save(); ctx.globalAlpha = 0.25;
          CE.circle(ctx, s.x, s.y + fy, 20, '#f4cf7d', 0); ctx.restore();
          CE.drawStar(ctx, s.x, s.y + fy, 14, '#f4cf7d', t * 1.2 + i);
        });

        // 终点旗
        const fx = 2580;
        CE.shadow(ctx, fx, 520, 22, 6);
        CE.card(ctx, fx - 4, 400, 8, 120, 4, '#6D6883');
        ctx.beginPath();
        ctx.moveTo(fx + 4, 404); ctx.lineTo(fx + 76, 428); ctx.lineTo(fx + 4, 452);
        ctx.closePath();
        ctx.fillStyle = '#c99363'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = CE.C.line; ctx.stroke();
        CE.text(ctx, '终点', fx + 30, 428, 13, '#fff');

        // 玩家
        CE.drawHero(ctx, me.x, me.y, { dir: me.dir, walk: me.walk, mood: me.onGround ? 'happy' : 'surprise' });
        ctx.restore();

        // HUD
        CE.card(ctx, 20, 534, 190, 46, 14, 'rgba(255,253,244,.94)', 2.6);
        CE.text(ctx, '⭐ ' + got + ' / 5', 74, 557, 16, '#3B3550');
        CE.text(ctx, '❤ ' + lives, 158, 557, 16, '#FF6B6B');

        // 进度条
        const pct = CE.clamp(me.x / 2560, 0, 1);
        CE.card(ctx, 300, 552, 560, 20, 10, 'rgba(255,255,255,.75)', 2.6);
        CE.card(ctx, 303, 555, 554 * pct, 14, 7, '#6f9981', 0);
        CE.circle(ctx, 303 + 554 * pct, 562, 9, '#c99363', 2.6);
      }
    };
  }
});

/* ===================================================================
   关卡 8 · 中央公园（滑块拼图）
   =================================================================== */
CE.levels.push({
  id: 8, name: '中央公园', icon: '🖼️',
  desc: '街头画家的壁画被颜色退回灰里，碎成了九块。把它拼回原来的样子。',
  goal: '把 9 块碎片拼回壁画',
  hint: '点击 / 触摸 空格旁边的碎片进行移动（也可用方向键）· 步数越少星星越多',
  create() {
    let fountainOn = false;
    const N = 3, TS = 118, GAP = 6;
    const BW = N * TS + (N - 1) * GAP;
    const OX = 480 - BW / 2, OY = 118;

    // 生成壁画
    const mc = document.createElement('canvas');
    mc.width = N * TS; mc.height = N * TS;
    (function paintMural(c) {
      const g = c.getContext('2d');
      const sky = g.createLinearGradient(0, 0, 0, 354);
      sky.addColorStop(0, '#294963'); sky.addColorStop(0.6, '#FFE9C9'); sky.addColorStop(1, '#FFD6A5');
      g.fillStyle = sky; g.fillRect(0, 0, 354, 354);
      // 太阳
      g.fillStyle = '#f4cf7d'; g.beginPath(); g.arc(280, 70, 42, 0, 7); g.fill();
      g.strokeStyle = '#3B3550'; g.lineWidth = 4; g.stroke();
      // 云
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(80, 80, 22, 0, 7); g.arc(108, 72, 30, 0, 7); g.arc(140, 82, 20, 0, 7); g.fill();
      // 远山
      g.fillStyle = '#B9E0A8'; g.beginPath();
      g.moveTo(-20, 250); g.quadraticCurveTo(90, 130, 200, 250); g.lineTo(-20, 250); g.fill();
      g.fillStyle = '#9BD48A'; g.beginPath();
      g.moveTo(150, 260); g.quadraticCurveTo(260, 150, 380, 260); g.lineTo(150, 260); g.fill();
      // 草地
      g.fillStyle = '#426c57'; g.fillRect(0, 236, 354, 118);
      g.strokeStyle = '#3B3550'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, 236); g.lineTo(354, 236); g.stroke();
      // 小路
      g.fillStyle = '#E3D8C6';
      g.beginPath(); g.moveTo(60, 354); g.quadraticCurveTo(130, 290, 190, 250);
      g.lineTo(240, 250); g.quadraticCurveTo(190, 300, 170, 354); g.closePath(); g.fill();
      // 树
      g.fillStyle = '#9A7150'; g.fillRect(52, 196, 18, 44);
      g.strokeStyle = '#3B3550'; g.lineWidth = 3.5; g.strokeRect(52, 196, 18, 44);
      g.fillStyle = '#5FBF63';
      g.beginPath(); g.arc(61, 180, 40, 0, 7); g.fill();
      g.beginPath(); g.arc(30, 200, 26, 0, 7); g.fill();
      g.beginPath(); g.arc(92, 200, 26, 0, 7); g.fill();
      g.fillStyle = '#8FE39B'; g.beginPath(); g.arc(48, 166, 22, 0, 7); g.fill();
      g.strokeStyle = '#3B3550'; g.lineWidth = 3.5;
      g.beginPath(); g.arc(61, 180, 40, 0, 7); g.stroke();
      // 长椅
      g.fillStyle = '#C08552'; g.fillRect(230, 292, 92, 12);
      g.strokeStyle = '#3B3550'; g.lineWidth = 3.5; g.strokeRect(230, 292, 92, 12);
      g.fillRect(230, 274, 92, 10); g.strokeRect(230, 274, 92, 10);
      g.fillStyle = '#6D6883'; g.fillRect(238, 304, 8, 26); g.fillRect(306, 304, 8, 26);
      g.strokeRect(238, 304, 8, 26); g.strokeRect(306, 304, 8, 26);
      // 坐着的小人
      g.fillStyle = '#c99363'; g.beginPath(); g.arc(276, 258, 14, 0, 7); g.fill();
      g.strokeStyle = '#3B3550'; g.lineWidth = 3.5; g.stroke();
      g.fillStyle = '#FFD9B3'; g.beginPath(); g.arc(276, 250, 9, 0, 7); g.fill(); g.stroke();
      // 小鸟
      g.strokeStyle = '#3B3550'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(190, 100); g.quadraticCurveTo(200, 90, 210, 100); g.stroke();
      g.beginPath(); g.moveTo(216, 88); g.quadraticCurveTo(224, 80, 232, 88); g.stroke();
      // 边框
      g.strokeStyle = '#3B3550'; g.lineWidth = 8; g.strokeRect(4, 4, 346, 346);
      CE.scenery(g, 2, 354, 354);
    })(mc);

    // 拼图状态
    let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    let moves = 0, t = 0, finished = false, winT = 0;
    // 随机合法走法打乱
    let empty = 8;
    for (let i = 0; i < 90; i++) {
      const cand = [];
      const ex = empty % N, ey = Math.floor(empty / N);
      if (ex > 0) cand.push(empty - 1);
      if (ex < N - 1) cand.push(empty + 1);
      if (ey > 0) cand.push(empty - N);
      if (ey < N - 1) cand.push(empty + N);
      const pickI = CE.pick(cand);
      arr[empty] = arr[pickI]; arr[pickI] = 8; empty = pickI;
    }
    // 避免开局已完成
    if (arr.every((v, i) => v === i)) { arr = [8, 0, 1, 3, 4, 2, 6, 7, 5]; empty = 0; }

    function tryMove(pos) {
      if (finished) return;
      const ex = empty % N, ey = Math.floor(empty / N);
      const px = pos % N, py = Math.floor(pos / N);
      if (Math.abs(px - ex) + Math.abs(py - ey) === 1) {
        arr[empty] = arr[pos]; arr[pos] = 8; empty = pos; moves++;
        CE.audio.sfx('click');
        if (arr.every((v, i) => v === i)) {
          finished = true; winT = 0;
          const stars = moves <= 40 ? 3 : moves <= 90 ? 2 : 1;
          setTimeout(() => CE.win(stars, { move: moves + ' 步' }), 500);
        }
      } else {
        CE.audio.sfx('error');
      }
    }

    return {
      hint: this.hint,
      update(dt) {
        t += dt;
        if (finished) { winT += dt; return; }
        if (CE.keyHit('e') || (CE.input.clicked && CE.input.mx>=50 && CE.input.mx<=240 && CE.input.my>=420 && CE.input.my<=465)) {
          fountainOn=!fountainOn; CE.audio.sfx('flow');
          if(fountainOn) { CE.rememberDiscovery('park-fountain'); CE.toast('喷泉亮起了！慢慢拼，花园会陪着你。'); }
        }
        if (CE.input.clicked) {
          const mx = CE.input.mx, my = CE.input.my;
          for (let i = 0; i < 9; i++) {
            const cx = OX + (i % N) * (TS + GAP), cy = OY + Math.floor(i / N) * (TS + GAP);
            if (mx > cx && mx < cx + TS && my > cy && my < cy + TS) { tryMove(i); break; }
          }
        }
        // 方向键：把相邻块移进空格
        const ex = empty % N, ey = Math.floor(empty / N);
        if (CE.keyHit('arrowleft') || CE.keyHit('a')) { if (ex < N - 1) tryMove(empty + 1); }
        if (CE.keyHit('arrowright') || CE.keyHit('d')) { if (ex > 0) tryMove(empty - 1); }
        if (CE.keyHit('arrowup') || CE.keyHit('w')) { if (ey < N - 1) tryMove(empty + N); }
        if (CE.keyHit('arrowdown') || CE.keyHit('s')) { if (ey > 0) tryMove(empty - N); }
      },
      draw(ctx) {
        CE.scenery(ctx, 2);
        CE.card(ctx,50,420,190,45,2,fountainOn?'#537b72':'#1c344a',2);
        CE.text(ctx,fountainOn?'E / 点按 · 关闭灯光':'E / 点按 · 点亮喷泉',145,443,12,'#ffe5b2');
        if(fountainOn){ctx.save();ctx.globalAlpha=.35;for(let i=0;i<18;i++){const x=140+Math.sin(i*2.3+t)*80,y=335-Math.abs(Math.sin(t*1.2+i*.4))*80;CE.circle(ctx,x,y,2,'#ffe2a1',0);}ctx.restore();}
        // 画架
        CE.shadow(ctx, 480, 566, 210, 14, 0.16);
        ctx.beginPath();
        ctx.moveTo(OX - 26, 566); ctx.lineTo(OX + 40, OY + 20);
        ctx.moveTo(OX + BW + 26, 566); ctx.lineTo(OX + BW - 40, OY + 20);
        ctx.lineWidth = 9; ctx.strokeStyle = '#A97B4F'; ctx.stroke();
        ctx.lineWidth = 5; ctx.strokeStyle = '#3B3550';
        ctx.beginPath();
        ctx.moveTo(OX - 26, 566); ctx.lineTo(OX + 40, OY + 20);
        ctx.moveTo(OX + BW + 26, 566); ctx.lineTo(OX + BW - 40, OY + 20);
        ctx.stroke();

        // 边框
        CE.card(ctx, OX - 14, OY - 14, BW + 28, BW + 28, 12, '#e2d9bf', 4);

        // 拼图块
        for (let i = 0; i < 9; i++) {
          const cx = OX + (i % N) * (TS + GAP), cy = OY + Math.floor(i / N) * (TS + GAP);
          const v = arr[i];
          if (v === 8) {
            ctx.save();
            ctx.setLineDash([8, 7]);
            ctx.strokeStyle = 'rgba(59,53,80,.32)'; ctx.lineWidth = 3;
            ctx.strokeRect(cx + 2, cy + 2, TS - 4, TS - 4);
            ctx.restore();
            continue;
          }
          const sx = (v % N) * TS, sy = Math.floor(v / N) * TS;
          ctx.drawImage(mc, sx, sy, TS, TS, cx, cy, TS, TS);
          ctx.strokeStyle = CE.C.line; ctx.lineWidth = 2.6;
          ctx.strokeRect(cx, cy, TS, TS);
          // 正确提示
          if (v === i && finished) {
            ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 6) * 0.15;
            ctx.fillStyle = '#f4cf7d'; ctx.fillRect(cx, cy, TS, TS); ctx.restore();
          }
        }

        if (finished) {
          ctx.save();
          ctx.globalAlpha = 0.25 + Math.sin(winT * 5) * 0.1;
          CE.card(ctx, OX - 14, OY - 14, BW + 28, BW + 28, 12, '#f4cf7d', 0);
          ctx.restore();
          CE.textO(ctx, '壁画复原！', 480, OY + BW / 2, 34, '#c99363', 'center', 7);
        }

        // 标题
        CE.card(ctx, 330, 34, 300, 46, 14, 'rgba(255,253,244,.95)', 3);
        CE.text(ctx, '中 央 公 园 · 壁 画 复 原', 480, 57, 17, '#3B3550');

        // 拼图缩略图
        CE.card(ctx, 766, 118, 132, 132, 10, '#e2d9bf', 3);
        ctx.save(); ctx.globalAlpha = 0.92;
        ctx.drawImage(mc, 0, 0, 354, 354, 772, 124, 120, 120);
        ctx.restore();
        CE.text(ctx, '原图参考', 832, 260, 12, '#3B3550');

        CE.card(ctx, 24, 540, 172, 44, 14, 'rgba(255,253,244,.94)', 2.6);
        CE.text(ctx, '🧩 步数 ' + moves, 110, 562, 15, '#3B3550');
      }
    };
  }
});

/* ===================================================================
   关卡 9 · 电视塔（旋转光路）
   =================================================================== */
CE.levels.push({
  id: 9, name: '电视塔', icon: '📡',
  desc: '塔里的信号管道被震歪了。旋转它们，把光从塔底一路接到塔顶的出水口。',
  goal: '把光路从入口接通到出水口',
  hint: '点击 / 触摸 格子旋转管道 90° · 按 R 或点击「重排」可以把管道全部再打乱一次',
  create() {
    const N = 4, CELL = 92, OX = 480 - (N * CELL) / 2 + 20, OY = 128;
    const DIRS = [
      { m: 1, dx: 0, dy: -1 }, { m: 2, dx: 1, dy: 0 },
      { m: 4, dx: 0, dy: 1 }, { m: 8, dx: -1, dy: 0 }
    ];
    const rot = m => ((m << 1) | (m >> 3)) & 15;
    const opp = m => ((m << 2) | (m >> 2)) & 15;
    const pop = m => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);

    let cells, moves, t, finished, energized, shake;

    function buildPath() {
      for (let attempt = 0; attempt < 400; attempt++) {
        const path = [[0, 0]], seen = { '0,0': 1 };
        let cur = [0, 0];
        while (!(cur[0] === N - 1 && cur[1] === N - 1)) {
          const opts = [[1, 0], [0, 1], [-1, 0], [0, -1]]
            .map(d => [cur[0] + d[0], cur[1] + d[1]])
            .filter(p => p[0] >= 0 && p[1] >= 0 && p[0] < N && p[1] < N && !seen[p.join(',')]);
          if (!opts.length) break;
          const nx = CE.pick(opts);
          seen[nx.join(',')] = 1; path.push(nx); cur = nx;
        }
        if (cur[0] === N - 1 && cur[1] === N - 1) return path;
      }
      return [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3]];
    }

    function init() {
      cells = [];
      for (let y = 0; y < N; y++) {
        const row = [];
        for (let x = 0; x < N; x++) row.push({ mask: 0, sol: 0, fixed: false });
        cells.push(row);
      }
      const path = buildPath();
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        let ma = 0, mb = 0;
        if (dx === 1) { ma = 2; mb = 8; }
        if (dx === -1) { ma = 8; mb = 2; }
        if (dy === 1) { ma = 4; mb = 1; }
        if (dy === -1) { ma = 1; mb = 4; }
        cells[a[1]][a[0]].mask |= ma;
        cells[b[1]][b[0]].mask |= mb;
      }
      // 入口（左）与出口（右）
      cells[0][0].mask |= 8; cells[0][0].fixed = true;
      cells[N - 1][N - 1].mask |= 2; cells[N - 1][N - 1].fixed = true;

      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const c = cells[y][x];
          if (c.mask === 0) {
            const kinds = [5, 10, 3, 6, 12, 9, 7, 14, 13, 11];
            c.mask = CE.pick(kinds);
          }
          c.sol = c.mask;
          if (!c.fixed) {
            const times = CE.randInt(1, 3);
            for (let i = 0; i < times; i++) c.mask = rot(c.mask);
          }
        }
      }
      moves = 0;
      finishCheck(true);
    }

    function finishCheck(silent) {
      const seen = { '0,0': 1 }, q = [[0, 0]];
      while (q.length) {
        const p = q.pop();
        const m = cells[p[1]][p[0]].mask;
        DIRS.forEach(d => {
          if (!(m & d.m)) return;
          const nx = p[0] + d.dx, ny = p[1] + d.dy;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
          if (cells[ny][nx].mask & opp(d.m) && !seen[nx + ',' + ny]) { seen[nx + ',' + ny] = 1; q.push([nx, ny]); }
        });
      }
      energized = seen;
      if (!silent && seen['3,3'] && !finished) {
        finished = true;
        const stars = moves <= 10 ? 3 : moves <= 18 ? 2 : 1;
        setTimeout(() => CE.win(stars, { move: moves + ' 次旋转' }), 600);
      }
    }

    init();
    t = 0; finished = false; shake = 0;

    return {
      hint: this.hint,
      update(dt) {
        t += dt;
        shake = Math.max(0, shake - dt * 3);
        if (finished) return;
        if (CE.keyHit('r')) { init(); CE.audio.sfx('open'); }
        if (CE.input.clicked) {
          const mx = CE.input.mx, my = CE.input.my;
          for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
              const cx = OX + x * CELL, cy = OY + y * CELL;
              if (mx > cx && mx < cx + CELL && my > cy && my < cy + CELL) {
                const c = cells[y][x];
                if (c.fixed) { CE.audio.sfx('error'); break; }
                c.mask = rot(c.mask);
                moves++; shake = 0.5;
                CE.audio.sfx('flow');
                CE.fx.burst(cx + CELL / 2, cy + CELL / 2, { count: 5, color: '#5FB3D4' });
                finishCheck(false);
              }
            }
          }
        }
      },
      draw(ctx) {
        CE.scenery(ctx, 3);
        ctx.fillStyle = "rgba(8,20,40,.58)"; ctx.fillRect(0,0,960,600);

        ctx.save();
        if (shake > 0) ctx.translate(CE.rand(-1, 1) * shake * 3, CE.rand(-1, 1) * shake * 3);

        // 面板底
        CE.card(ctx, OX - 16, OY - 16, N * CELL + 32, N * CELL + 32, 18, 'rgba(35,32,58,.55)', 3.4);

        for (let y = 0; y < N; y++) {
          for (let x = 0; x < N; x++) {
            const c = cells[y][x];
            const cx = OX + x * CELL, cy = OY + y * CELL;
            const mid = { x: cx + CELL / 2, y: cy + CELL / 2 };
            const on = !!energized[x + ',' + y];
            CE.card(ctx, cx + 4, cy + 4, CELL - 8, CELL - 8, 12, on ? 'rgba(95,179,212,.22)' : 'rgba(255,255,255,.06)', 2.2);
            // 管道
            const pw = 15;
            DIRS.forEach(d => {
              if (!(c.mask & d.m)) return;
              const ex = mid.x + d.dx * CELL / 2, ey = mid.y + d.dy * CELL / 2;
              const col = on ? '#5FD1F5' : '#93A0C9';
              ctx.lineCap = 'round';
              ctx.strokeStyle = 'rgba(20,18,35,.85)'; ctx.lineWidth = pw + 6;
              ctx.beginPath(); ctx.moveTo(mid.x, mid.y); ctx.lineTo(ex, ey); ctx.stroke();
              ctx.strokeStyle = col; ctx.lineWidth = pw;
              ctx.beginPath(); ctx.moveTo(mid.x, mid.y); ctx.lineTo(ex, ey); ctx.stroke();
              ctx.lineCap = 'butt';
            });
            CE.circle(ctx, mid.x, mid.y, pw / 2 + 3, on ? '#5FD1F5' : '#93A0C9', 2.4);
            if (on) {
              // 流光
              const ph = (t * 1.6 + (x + y) * 0.3) % 1;
              DIRS.forEach(d => {
                if (!(c.mask & d.m)) return;
                const px = mid.x + d.dx * CELL / 2 * ph, py = mid.y + d.dy * CELL / 2 * ph;
                ctx.save(); ctx.globalAlpha = 0.85;
                CE.circle(ctx, px, py, 4, '#FFF3B0', 0); ctx.restore();
              });
            }
            if (c.fixed) {
              CE.text(ctx, x === 0 ? '◀' : '▶', mid.x, mid.y - CELL / 2 + 14, 15, '#f4cf7d');
            }
          }
        }

        // 入口 / 出口标识
        CE.text(ctx, '光 源', OX - 42, OY + CELL / 2, 13, '#f4cf7d');
        CE.text(ctx, '出 水', OX + N * CELL + 40, OY + N * CELL - CELL / 2, 13, '#f4cf7d');
        // 输入光
        const inY = OY + CELL / 2;
        ctx.save(); ctx.globalAlpha = 0.55 + Math.sin(t * 5) * 0.2;
        CE.circle(ctx, OX - 8, inY, 12, '#FFF3B0', 0); ctx.restore();
        // 输出光柱
        if (energized['3,3']) {
          const ox = OX + N * CELL, oy = OY + N * CELL - CELL / 2;
          const grd = ctx.createLinearGradient(ox, 0, 960, 0);
          grd.addColorStop(0, 'rgba(255,243,176,.85)'); grd.addColorStop(1, 'rgba(255,243,176,0)');
          ctx.fillStyle = grd;
          ctx.fillRect(ox, oy - 16, 960 - ox, 32);
          CE.textO(ctx, '通 了 ！', 860, oy - 40, 18, '#f4cf7d', 'center', 4);
        }
        ctx.restore();

        // 标题 & 信息
        CE.card(ctx, 340, 34, 280, 44, 14, 'rgba(255,253,244,.95)', 3);
        CE.text(ctx, '电 视 塔 · 光 路 接 通', 480, 56, 16, '#3B3550');
        CE.card(ctx, 24, 540, 160, 42, 13, 'rgba(255,253,244,.94)', 2.6);
        CE.text(ctx, '🔧 旋转 ' + moves + ' 次', 104, 561, 14, '#3B3550');
        CE.card(ctx, 800, 540, 136, 42, 13, 'rgba(255,253,244,.94)', 2.6);
        CE.text(ctx, 'R 重排', 868, 561, 14, '#3B3550');
      }
    };
  }
});

/* ===================================================================
   关卡 10 · 城市之心（终章）
   =================================================================== */
CE.levels.push({
  id: 10, name: '城市之心', icon: '✨',
  desc: '灯塔脚下的大广场。最后一块碎片，散落在广场的光里——把它们都接住，然后抬头看。',
  goal: '接住 12 团光，完成光之汇聚',
  hint: 'WASD / 方向键 移动 · 避开黑色的影子，被碰到会丢掉 2 团光 · 越快完成星星越多',
  create() {
    const rows = [
      '########################',
      '#......................#',
      '#..oo..............oo..#',
      '#......................#',
      '#......................#',
      '#......###..###........#',
      '#......#......#........#',
      '#......#......#........#',
      '#......########........#',
      '#......................#',
      '#..oo..............oo..#',
      '#......................#',
      '#......................#',
      '#......................#',
      '########################'
    ];
    const T = 40;
    const map = new CE.TileMap(rows, T, T); map.artTheme = "garden";
    const me = { x: 480, y: 560, r: 12, hh: 12, dir: 1, walk: 0 };

    const lights = [];
    let guard = 0;
    while (lights.length < 12 && guard++ < 800) {
      const cx = CE.randInt(1, 22), cy = CE.randInt(1, 13);
      if (map.isSolidCell(cx, cy)) continue;
      const x = cx * T + 20, y = cy * T + 32;
      if (CE.dist(x, y, me.x, me.y) < 120) continue;
      if (lights.some(l => CE.dist(l.x, l.y, x, y) < 70)) continue;
      lights.push({ x, y, got: false, ph: CE.rand(0, 6.28), bob: CE.rand(3, 7) });
    }

    // 影子出生点分散到远离玩家（出生点 480,560）的开阔区域，避免开局瞬间被围
    const shadows = [];
    const spts = [[160, 100], [760, 100], [480, 100]];
    for (let i = 0; i < 3; i++) {
      shadows.push({
        x: spts[i][0], y: spts[i][1],
        r: 20, vx: 0, vy: 0, ph: CE.rand(0, 6.28)
      });
    }

    let t = 0, got = 0, time = 0, finished = false, hitCD = 0, shake = 0;
    let burstT = 0;

    return {
      hint: this.hint,
      update(dt) {
        t += dt;
        if (finished) return;
        time += dt;
        shake = Math.max(0, shake - dt * 3);
        hitCD = Math.max(0, hitCD - dt);

        const d = CE.dir4();
        let vx = d.x, vy = d.y;
        if (vx && vy) { vx *= 0.707; vy *= 0.707; }
        const sp = 205 * dt;
        if (vx || vy) me.walk += dt * 12; else me.walk *= 0.86;
        map.moveActor(me, vx * sp, vy * sp);
        if (vx) me.dir = vx > 0 ? 1 : -1;

        // 光团
        lights.forEach((l, i) => {
          if (l.got) return;
          const ly = l.y + Math.sin(t * 2 + l.ph) * l.bob;
          if (CE.dist(l.x, ly - 10, me.x, me.y - 20) < 34) {
            l.got = true; got++;
            CE.audio.sfx('coin');
            CE.fx.burst(l.x, ly, { count: 16, star: true, color: '#f4cf7d' });
            CE.setGoal('接住光团（' + got + ' / 12）');
            if (got >= 12) {
              finished = true;
              const stars = time < 45 ? 3 : time < 75 ? 2 : 1;
              CE.audio.sfx('win');
              for (let k = 0; k < 5; k++) {
                setTimeout(() => CE.fx.burst(480 + CE.rand(-260, 260), 300 + CE.rand(-160, 160), { count: 22, star: true, color: '#FFF3B0' }), k * 120);
              }
              setTimeout(() => CE.win(stars, { time: time.toFixed(1) + ' 秒' }), 900);
            }
          }
        });

        // 影子追逐（开局 1.6 秒宽限，给玩家反应时间）
        if (got >= 12) return;
        if (t < 1.6) return;
        shadows.forEach(s => {
          const dx = me.x - s.x, dy = (me.y - 20) - (s.y - 16);
          const dd = Math.hypot(dx, dy) || 1;
          const sp2 = 96 + Math.min(60, got * 4);
          const ax = (dx / dd) * sp2, ay = (dy / dd) * sp2;
          s.vx = CE.lerp(s.vx, ax, 0.045);
          s.vy = CE.lerp(s.vy, ay, 0.045);
          const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
          if (!map.rectSolid(nx - 18, ny - 44, 36, 44)) { s.x = nx; s.y = ny; }
          else { s.vx *= -0.5; s.vy *= -0.5; }
          if (hitCD <= 0 && CE.dist(s.x, s.y - 16, me.x, me.y - 20) < 36) {
            hitCD = 1.6; shake = 1;
            CE.audio.sfx('hit');
            CE.fx.burst(me.x, me.y - 20, { count: 18, color: '#3B3550' });
            CE.fx.text(me.x, me.y - 62, '-2 光', '#8E7CC3');
            let lost = 0;
            for (let i = lights.length - 1; i >= 0 && lost < 2; i--) {
              if (lights[i].got) {
                lights[i].got = false;
                lights[i].x = CE.clamp(me.x + CE.rand(-300, 300), 60, 900);
                lights[i].y = CE.clamp(me.y + CE.rand(-260, 260), 70, 560);
                got--; lost++;
              }
            }
            CE.setGoal('接住光团（' + got + ' / 12）');
          }
        });

        if (Math.random() < dt * 3) {
          CE.fx.list.push({
            x: CE.rand(0, 960), y: CE.rand(0, 600), vx: CE.rand(-0.2, 0.2), vy: -0.4,
            life: 1, max: 2.2, size: 2, color: '#FFF3B0', g: 0
          });
        }
      },
      draw(ctx) {
        // 夜空
        const g = ctx.createLinearGradient(0, 0, 0, 600);
        g.addColorStop(0, '#2B2A55'); g.addColorStop(0.55, '#4B4A85'); g.addColorStop(1, '#7A6BA8');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
        // 星星
        for (let i = 0; i < 60; i++) {
          const x = (i * 173) % 960, y = (i * 97) % 460;
          ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(t * 1.6 + i) * 0.2;
          CE.circle(ctx, x, y, 1.8, '#fff', 0); ctx.restore();
        }

        ctx.save();
        if (shake > 0) ctx.translate(CE.rand(-1, 1) * shake * 7, CE.rand(-1, 1) * shake * 7);

        // 广场地面
        ctx.fillStyle = '#6F6294';
        ctx.fillRect(0, 0, 960, 600);
        map.drawBase(ctx, { '.': '#7C6FA3', '#': '#5A5080' });
        ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1;
        for (let x = 0; x <= 960; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
        for (let y = 0; y <= 600; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
        map.drawWalls(ctx, '#4E4570', 'rgba(255,255,255,.14)');

        // 中央灯塔
        const lx = 480, ly = 260;
        CE.shadow(ctx, lx, ly + 46, 40, 12, 0.2);
        CE.card(ctx, lx - 30, ly - 10, 60, 100, 8, '#E8DCC4', 3.4);
        ctx.beginPath();
        ctx.moveTo(lx - 42, ly - 8); ctx.lineTo(lx, ly - 58); ctx.lineTo(lx + 42, ly - 8);
        ctx.closePath(); ctx.fillStyle = '#FF8C6B'; ctx.fill();
        ctx.lineWidth = 3.4; ctx.strokeStyle = CE.C.line; ctx.stroke();
        CE.circle(ctx, lx, ly - 26, 15, '#f4cf7d', 3);
        // 塔顶光晕
        ctx.save();
        ctx.globalAlpha = 0.12 + got * 0.03 + Math.sin(t * 2.4) * 0.04;
        CE.circle(ctx, lx, ly - 26, 90 + got * 8, '#FFF3B0', 0);
        ctx.globalAlpha = 0.08 + got * 0.02;
        CE.circle(ctx, lx, ly - 26, 200 + got * 20, '#FFF3B0', 0);
        ctx.restore();

        // 光团
        lights.forEach((l, i) => {
          if (l.got) return;
          const ly2 = l.y + Math.sin(t * 2 + l.ph) * l.bob;
          CE.drawOrb(ctx, l.x, ly2 - 10, 9, t + i);
        });

        // 影子
        shadows.forEach(s => {
          const wob = Math.sin(t * 4 + s.ph) * 3;
          ctx.save();
          ctx.globalAlpha = 0.82;
          ctx.beginPath();
          for (let i = 0; i < 14; i++) {
            const a = (i / 14) * Math.PI * 2;
            const rr = 22 + Math.sin(t * 3 + i * 1.3 + s.ph) * 4;
            const px = s.x + Math.cos(a) * rr, py = s.y - 22 + Math.sin(a) * rr * 1.1;
            ctx[i ? 'lineTo' : 'moveTo'](px, py);
          }
          ctx.closePath();
          ctx.fillStyle = 'rgba(28,22,52,.92)'; ctx.fill();
          ctx.strokeStyle = 'rgba(160,140,220,.75)'; ctx.lineWidth = 2.2; ctx.stroke();
          // 眼睛
          CE.circle(ctx, s.x - 7, s.y - 24 + wob, 3.4, '#FF6B6B', 0);
          CE.circle(ctx, s.x + 7, s.y - 24 + wob, 3.4, '#FF6B6B', 0);
          ctx.restore();
        });

        // 玩家身上的光
        ctx.save(); ctx.globalAlpha = 0.2 + got * 0.02;
        CE.circle(ctx, me.x, me.y - 24, 34 + got * 2, '#FFF3B0', 0); ctx.restore();
        CE.drawHero(ctx, me.x, me.y, { dir: me.dir, walk: me.walk });

        ctx.restore();

        // 进度
        CE.card(ctx, 24, 536, 196, 46, 14, 'rgba(255,253,244,.94)', 2.6);
        CE.text(ctx, '✦ 光团 ' + got + ' / 12', 122, 559, 16, '#3B3550');
        // 光条
        CE.card(ctx, 320, 548, 560, 22, 11, 'rgba(255,255,255,.25)', 2.6);
        CE.card(ctx, 323, 551, 554 * (got / 12), 16, 8, '#f4cf7d', 0);
      }
    };
  }
});
