/* ===================================================================
   光之城 · 主流程 main.js
   状态机 / 屏幕切换 / 城市地图 / 剧情播放 / 结算 / 图鉴
   =================================================================== */
(async function () {
  'use strict';
  await CE.artReady;

  const DPR = Math.min(2, window.devicePixelRatio || 1);
  CE.DPR = DPR;
  const canvas = document.getElementById('game');
  const displayCtx = canvas.getContext('2d');
  const pixelCanvas = document.createElement('canvas');
  pixelCanvas.width = 960; pixelCanvas.height = 600;
  const ctx = pixelCanvas.getContext('2d');
  canvas.width = 960 * DPR;
  canvas.height = 600 * DPR;
  canvas.style.width = '960px';
  canvas.style.height = '600px';
  CE.ctx = ctx;

  const $ = id => document.getElementById(id);

  /* ---------------- 状态 ---------------- */
  let screen = 'title';
  let scene = null;
  let levelObj = null;
  let paused = false;
  let resolving = false;   // 防止重复结算
  let toastTimer = null;
  let hintTimer = null;

  /* ---------------- 存档 ---------------- */
  CE.save.load();
  function syncSave() {
    const cleared = CE.save.data.cleared;
    const ids = Object.keys(cleared).map(Number);
    CE.save.data.frags = ids.length;
    let mx = 1;
    ids.forEach(i => { if (i + 1 > mx) mx = i + 1; });
    CE.save.data.maxUnlock = Math.min(10, Math.max(CE.save.data.maxUnlock || 1, mx));
    CE.save.flush();
  }
  syncSave();

  /* ---------------- 屏幕 ---------------- */
  const screensEl = { title: $('scr-title'), map: $('scr-map'), story: $('scr-story') };
  function showScreen(name) {
    ['title', 'map', 'story'].forEach(k => screensEl[k].classList.toggle('hidden', k !== name));
    $('hud').classList.toggle('hidden', name !== 'play');
    screen = name;
  }

  /* ---------------- Toast / Hint / 目标 ---------------- */
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 1900);
  }
  function setHint(text, secs) {
    const el = $('hintBar');
    if (!text) { el.classList.add('hidden'); return; }
    el.textContent = text;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => el.classList.add('hidden'), (secs || 4.5) * 1000);
  }
  function setGoal(text) { $('hudGoal').textContent = text; }
  function updateFragHud() { $('hudFrag').textContent = CE.save.data.frags; }

  CE.toast = toast;
  CE.setGoal = setGoal;
  CE.setHint = setHint;

  /* ---------------- 弹窗 ---------------- */
  function openModal(html) {
    $('modalPanel').innerHTML = html;
    $('modal').classList.remove('hidden');
  }
  function closeModal() { $('modal').classList.add('hidden'); }

  /* ===================================================================
     城市地图
     =================================================================== */
  const MAP_NODES = [
    {id:1,x:115,y:410},{id:2,x:170,y:220},{id:3,x:320,y:410},
    {id:4,x:220,y:80},{id:5,x:355,y:220},{id:6,x:530,y:300},
    {id:7,x:610,y:115},{id:8,x:680,y:420},{id:9,x:840,y:300},{id:10,x:820,y:95}
  ];
  const MAP_LINKS = [[1, 2], [2, 3], [2, 4], [4, 5], [3, 6], [5, 6], [5, 7], [6, 8], [7, 9], [8, 9], [9, 10]];

  function nodeOf(id) { return MAP_NODES.find(n => n.id === id); }

  function renderMap() {
    const svg = $('mapLines');
    const holder = $('mapNodes');
    const d = CE.save.data;
    svg.innerHTML = '';
    holder.innerHTML = '';

    MAP_LINKS.forEach(pair => {
      const a = nodeOf(pair[0]), b = nodeOf(pair[1]);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      const open = (d.cleared[pair[0]] || pair[0] <= d.maxUnlock) && (d.cleared[pair[1]] || pair[1] <= d.maxUnlock);
      line.setAttribute('stroke', open ? '#d1b174' : '#607786');
      line.setAttribute('stroke-width', open ? 3 : 2);
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-dasharray', open ? '3 7' : '4 10');
      svg.appendChild(line);
    });

    CE.levels.forEach(lv => {
      const n = nodeOf(lv.id);
      const el = document.createElement('div');
      const cleared = !!d.cleared[lv.id];
      const unlocked = lv.id <= d.maxUnlock;
      el.className = 'node ' + (cleared ? 'cleared' : unlocked ? 'current' : 'locked');
      el.style.left = n.x + 'px';
      el.style.top = n.y + 'px';
      el.innerHTML = `<span class="num">${lv.id}</span>` +
        (cleared ? '' : unlocked ? '❗' : '🔒');
      if (cleared) {
        el.innerHTML = `<span class="num">${lv.id}</span>${lv.icon}` +
          `<span class="mini-stars">${'★'.repeat(d.stars[lv.id] || 1)}</span>`;
      }
      el.insertAdjacentHTML('beforeend', '<span class="node-label">' + lv.name + '</span>');
      el.title = lv.name;
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.setAttribute('aria-label', lv.name + (unlocked ? '，进入关卡' : '，尚未解锁'));
      el.onkeydown = e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } };
      el.onclick = () => {
        CE.audio.init();
        if (!unlocked) { CE.audio.sfx('error'); toast('先完成前面的街区吧'); return; }
        CE.audio.sfx('click');
        openLevelCard(lv);
      };
      holder.appendChild(el);
    });

    $('fragCount').textContent = d.frags;
    CE.renderAwakening(MAP_NODES);
  }

  function openLevelCard(lv) {
    const d = CE.save.data;
    $('lcIcon').textContent = lv.icon;
    $('lcName').textContent = `${lv.id}. ${lv.name}`;
    $('lcDesc').textContent = lv.desc + (d.cleared[lv.id] ? ' · ' + CE.cityChanges[lv.id-1] : '');
    $('lcGoal').textContent = lv.goal;
    const st = d.stars[lv.id] || 0;
    $('lcStars').innerHTML = st ? '★'.repeat(st) + '<span style="color:#D8D4E0">' + '★'.repeat(3 - st) + '</span>' : '<span style="color:#C9C4D8;font-size:13px">尚未通关</span>';
    $('lcPlay').textContent = d.cleared[lv.id] ? '再玩一次' : '进入关卡';
    $('lcPlay').onclick = () => {
      closeLevelCard();
      CE.audio.sfx('open');
      startLevel(lv.id);
    };
    $('levelCard').classList.remove('hidden');
  }
  function closeLevelCard() { $('levelCard').classList.add('hidden'); }

  /* ===================================================================
     关卡流程
     =================================================================== */
  function startLevel(id) {
    levelObj = CE.levels[id - 1];
    const before = (CE.story.before && CE.story.before[id]) || [];
    playStory(before, () => launchLevel());
  }

  function launchLevel() {
    scene = levelObj.create();
    paused = false;
    resolving = false;
    CE.fx.clear();
    showScreen('play');
    $('hudName').textContent = levelObj.id + '. ' + levelObj.name;
    $('hudFrag').textContent = CE.save.data.frags;
    setGoal(levelObj.goal);
    setHint(levelObj.hint, 5.5);
    closeLevelCard();
    closeModal();
    updateFragHud();
    touchpadToggle(true);
  }

  CE.win = function (stars, extra) {
    if (resolving) return;
    resolving = true;
    CE.audio.sfx('win');
    touchpadToggle(false);

    const id = levelObj.id;
    const d = CE.save.data;
    const first = !d.cleared[id];
    d.cleared[id] = true;
    d.stars[id] = Math.max(d.stars[id] || 0, stars);
    syncSave();

    let extraTxt = '';
    if (extra) {
      extraTxt = Object.keys(extra).map(k => {
        const names = { time: '用时', cat: '小猫', move: '步数', score: '得分', caught: '被发现', star: '星星', ring: '钟声' };
        return (names[k] || k) + '：' + extra[k];
      }).join('　');
    }

    setTimeout(() => {
      openModal(`
        <h2>街区通关！</h2>
        <p class="p-sub">${levelObj.id}. ${levelObj.name}</p>
        <div class="stars">${'★'.repeat(stars)}<span class="off">${'★'.repeat(3 - stars)}</span></div>
        ${first ? '<div class="prize">✦ 光之碎片 +1</div>' : '<div class="prize">✦ 已收集过碎片</div>'}
        ${extraTxt ? '<div class="p-body">' + extraTxt + '</div>' : ''}
        <div class="p-body" style="font-size:13.5px;color:#7A7490">${CE.cityChanges[id-1]}</div>
        <div class="row"><button class="btn big" id="mNext">继续旅程</button></div>
      `);
      updateFragHud();
      $('mNext').onclick = () => {
        closeModal();
        const after = (CE.story.after && CE.story.after[id]) || [];
        playStory(after, () => {
          if (id === 10) playStory(CE.story.ending, showCredits);
          else backToMap();
        });
      };
    }, 520);
  };

  CE.lose = function (msg) {
    if (resolving) return;
    resolving = true;
    touchpadToggle(false);
    setTimeout(() => {
      openModal(`
        <h2>差一点点</h2>
        <div class="p-body">${msg || '再试一次吧，光还在等你。'}</div>
        <div class="row">
          <button class="btn" id="mRetry">再试一次</button>
          <button class="btn ghost" id="mMap">返回地图</button>
        </div>
      `);
      $('mRetry').onclick = () => { closeModal(); launchLevel(); };
      $('mMap').onclick = () => { closeModal(); backToMap(); };
    }, 380);
  };

  function backToMap() {
    scene = null;
    resolving = false;
    pauseClose();
    touchpadToggle(false);
    showScreen('map');
    renderMap();
    CE.audio.startBgm();
  }

  /* ---------------- 暂停 ---------------- */
  function pauseOpen() {
    if (screen !== 'play' || !scene) return;
    paused = true;
    touchpadToggle(false);
    openModal(`
      <h2>暂停一下</h2>
      <p class="p-sub">${levelObj ? levelObj.id + '. ' + levelObj.name : ''}</p>
      <div class="row">
        <button class="btn" id="pResume">继续游戏</button>
        <button class="btn ghost" id="pRestart">重新开始本关</button>
      </div>
      <div class="row">
        <button class="btn pink" id="pMap">返回城市地图</button>
        <button class="btn blue" id="pSound">音效：开</button>
      </div>
    `);
    $('pResume').onclick = () => { pauseClose(); };
    $('pRestart').onclick = () => { pauseClose(); launchLevel(); };
    $('pMap').onclick = () => { pauseClose(); backToMap(); };
    const sb = $('pSound');
    sb.textContent = '音效：' + (CE.audio.sfxOn ? '开' : '关');
    sb.onclick = () => {
      CE.audio.sfxOn = !CE.audio.sfxOn;
      sb.textContent = '音效：' + (CE.audio.sfxOn ? '开' : '关');
    };
  }
  function pauseClose() {
    paused = false;
    if (screen === 'play') { closeModal(); touchpadToggle(true); }
  }

  /* ===================================================================
     剧情播放
     =================================================================== */
  let storyLines = [], storyIdx = 0, storyDone = null, typeTimer = null, typing = false, curLine = '';

  function playStory(lines, done) {
    if (!lines || !lines.length) { if (done) done(); return; }
    storyLines = lines.slice();
    storyIdx = 0;
    storyDone = done;
    showScreen('story');
    renderStoryLine();
  }

  function renderStoryLine() {
    const line = storyLines[storyIdx];
    const ch = CE.chars[line.sp] || CE.chars.narr;
    $('storyScene').style.background = line.bg || 'linear-gradient(#8FD8F7,#CFF3C8)';
    CE.renderPortrait(line.sp);
    $('dlgName').textContent = ch.n;
    $('dlgName').style.background = ch.c;
    $('dlgText').textContent = '';
    $('dlgNext').classList.add('hidden');
    curLine = line.txt;
    typing = true;
    clearInterval(typeTimer);
    let i = 0;
    typeTimer = setInterval(() => {
      i++;
      $('dlgText').textContent = curLine.slice(0, i);
      if (i >= curLine.length) {
        clearInterval(typeTimer);
        typing = false;
        $('dlgNext').classList.remove('hidden');
      }
    }, 26);
  }

  function storyAdvance() {
    if (screen !== 'story') return;
    if (typing) {
      clearInterval(typeTimer);
      typing = false;
      $('dlgText').textContent = curLine;
      $('dlgNext').classList.remove('hidden');
      return;
    }
    storyIdx++;
    if (storyIdx >= storyLines.length) {
      const d = storyDone;
      storyDone = null;
      clearInterval(typeTimer);
      if (d) d();
      return;
    }
    renderStoryLine();
  }

  function storySkip() {
    if (screen !== 'story') return;
    clearInterval(typeTimer);
    typing = false;
    const d = storyDone;
    storyDone = null;
    storyIdx = storyLines.length;
    if (d) d();
  }

  /* ===================================================================
     图鉴 / 帮助 / 制作
     =================================================================== */
  function openGallery() {
    const d = CE.save.data;
    let html = '<h2>城市图鉴</h2><p class="p-sub">每走完一个街区，就会收集到一张明信片</p><div class="gallery-grid">';
    CE.levels.forEach(lv => {
      const cleared = !!d.cleared[lv.id];
      const st = d.stars[lv.id] || 0;
      html += `<div class="gcard ${cleared ? '' : 'lock'}">
        <div class="g-ico">${cleared ? lv.icon : '❔'}</div>
        <h4>${lv.id}. ${cleared ? lv.name : '未探索街区'}</h4>
        <p>${cleared ? lv.desc.slice(0, 34) + '…' : '走进这座城市，才能知道这里有什么。'}</p>
        <div class="g-star">${cleared ? '★'.repeat(st) : ''}</div>
      </div>`;
    });
    html += `</div><div class="p-sub" style="margin-top:12px">已收集光之碎片 ${d.frags} / 10</div>
      <div class="row"><button class="btn" id="gClose">关闭</button></div>`;
    openModal(html);
    $('gClose').onclick = closeModal;
  }

  function openHelp() {
    openModal(`
      <h2>玩法说明</h2>
      <div class="help-list">
        <b>移动</b>　<span class="key">W</span><span class="key">A</span><span class="key">S</span><span class="key">D</span> 或 <span class="key">↑</span><span class="key">←</span><span class="key">↓</span><span class="key">→</span><br>
        <b>跳跃 / 敲击 / 互动</b>　<span class="key">空格</span> 或 <span class="key">E</span><br>
        <b>点击</b>　菜单、翻牌、拼图、管道全部支持鼠标点击<br>
        <b>暂停</b>　<span class="key">Esc</span> 或右上角暂停按钮<br>
        <b>重排管道</b>　在电视塔关卡按 <span class="key">R</span>
      </div>
      <p class="p-body" style="font-size:13.5px">
        城市被分成了十个街区，每个街区都会给你一块「光之碎片」。<br>
        集齐十块碎片，城市之心就会重新亮起来。
      </p>
      <div class="row"><button class="btn" id="hClose">知道了</button></div>
    `);
    $('hClose').onclick = closeModal;
  }

  function showCredits() {
    showScreen('title');
    const d = CE.save.data;
    d.ending = true;
    CE.save.flush();
    $('btnStart').textContent = '再次启程';
    const totalStars = Object.values(d.stars).reduce((a, b) => a + b, 0);
    openModal(`
      <h2>光 之 城</h2>
      <p class="p-sub">城市探索物语 · 完</p>
      <div class="stars">${'★'.repeat(Math.min(3, Math.ceil(totalStars / 10)))}</div>
      <div class="p-body">
        光之碎片　${d.frags} / 10<br>
        获得星星　${totalStars} / 30
      </div>
      <p class="p-body" style="font-size:13px;color:#8A84A0;margin-top:14px">
        《光之城 · 城市探索物语》<br>
        创新多媒体娱乐 · 毕业设计作品<br>
        全部画面与音效均实时生成，无外部素材
      </p>
      <div class="row">
        <button class="btn" id="cBack">回到城市</button>
        <button class="btn ghost" id="cTitle">回到标题</button>
      </div>
    `);
    $('cBack').onclick = () => { closeModal(); backToMap(); };
    $('cTitle').onclick = () => { closeModal(); showScreen('title'); renderTitleState(); };
  }

  function renderTitleState() {
    const d = CE.save.data;
    $('btnStart').textContent = (d.intro || d.frags > 0) ? '继续旅程' : '开始冒险';
  }

  /* ===================================================================
     触屏虚拟按键
     =================================================================== */
  let padEl = null;
  function buildTouchpad() {
    if (padEl) return;
    const style = document.createElement('style');
    style.textContent = `
      #tpad{position:absolute;inset:0;pointer-events:none;z-index:40}
      #tpad .pad{position:absolute;left:16px;bottom:16px;width:150px;height:150px;pointer-events:auto}
      #tpad .pad button{position:absolute;width:50px;height:50px;border-radius:14px;border:3px solid #3B3550;
        background:rgba(255,253,244,.85);font-size:18px;font-weight:900;color:#3B3550;
        display:flex;align-items:center;justify-content:center}
      #tpad .pad .u{left:50px;top:0}#tpad .pad .d{left:50px;top:100px}
      #tpad .pad .l{left:0;top:50px}#tpad .pad .r{left:100px;top:50px}
      #tpad .act{position:absolute;right:22px;bottom:26px;width:76px;height:76px;border-radius:50%;
        border:4px solid #3B3550;background:rgba(255,217,61,.9);font-size:15px;font-weight:900;color:#3B3550;
        pointer-events:auto;box-shadow:0 4px 0 #3B3550}
      #tpad button:active{transform:scale(.94)}
    `;
    document.head.appendChild(style);
    padEl = document.createElement('div');
    padEl.id = 'tpad';
    padEl.className = 'hidden';
    padEl.innerHTML = `
      <div class="pad">
        <button class="u" data-k="w">▲</button>
        <button class="l" data-k="a">◀</button>
        <button class="r" data-k="d">▶</button>
        <button class="d" data-k="s">▼</button>
      </div>
      <button class="act" data-k=" ">跳跃/互动</button>
    `;
    document.getElementById('ui').appendChild(padEl);

    padEl.querySelectorAll('button[data-k]').forEach(btn => {
      const k = btn.getAttribute('data-k');
      const on = e => { e.preventDefault(); CE.input.keys[k] = true; CE.input.pressed[k] = true; CE.audio.init(); };
      const off = e => { e.preventDefault(); CE.input.keys[k] = false; };
      btn.addEventListener('touchstart', on, { passive: false });
      btn.addEventListener('touchend', off, { passive: false });
      btn.addEventListener('touchcancel', off, { passive: false });
      btn.addEventListener('mousedown', on);
      btn.addEventListener('mouseup', off);
      btn.addEventListener('mouseleave', off);
    });
  }
  function touchpadToggle(show) {
    if (!padEl) return;
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    padEl.classList.toggle('hidden', !(show && isTouch));
  }

  /* ===================================================================
     输入
     =================================================================== */
  const BLOCK = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'spacebar'];
  window.addEventListener('keydown', e => {
    const k = (e.key || '').toLowerCase();
    if (BLOCK.indexOf(k) >= 0) e.preventDefault();
    CE.audio.init();
    if (!CE.input.keys[k]) CE.input.pressed[k] = true;
    CE.input.keys[k] = true;

    if (k === 'escape') {
      if (screen === 'play') { if (paused) pauseClose(); else pauseOpen(); }
      return;
    }
    if (screen === 'story' && (k === ' ' || k === 'enter')) { e.preventDefault(); storyAdvance(); }
  });
  window.addEventListener('keyup', e => {
    const k = (e.key || '').toLowerCase();
    CE.input.keys[k] = false;
  });

  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    const cx = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY);
    return { x: (cx - r.left) * (960 / r.width), y: (cy - r.top) * (600 / r.height) };
  }
  canvas.addEventListener('mousemove', e => {
    const p = pointerPos(e);
    CE.input.mx = p.x; CE.input.my = p.y;
  });
  canvas.addEventListener('mousedown', e => {
    const p = pointerPos(e);
    CE.input.mx = p.x; CE.input.my = p.y;
    CE.input.clicked = true;
    CE.audio.init();
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const p = pointerPos(e);
    CE.input.mx = p.x; CE.input.my = p.y;
    CE.input.clicked = true;
    CE.audio.init();
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const p = pointerPos(e);
    CE.input.mx = p.x; CE.input.my = p.y;
  }, { passive: false });

  /* ===================================================================
     界面按钮
     =================================================================== */
  function newGame() {
    CE.audio.init();
    CE.audio.sfx('open');
    const d = CE.save.data;
    if (!d.intro) {
      playStory(CE.story.intro, () => {
        d.intro = true;
        CE.save.flush();
        backToMap();
      });
    } else {
      backToMap();
    }
  }

  $('btnStart').onclick = newGame;
  $('btnGallery').onclick = () => { CE.audio.init(); CE.audio.sfx('click'); openGallery(); };
  $('btnHelp').onclick = () => { CE.audio.init(); CE.audio.sfx('click'); openHelp(); };
  $('btnGallery2').onclick = () => { CE.audio.sfx('click'); openGallery(); };
  $('btnHome').onclick = () => {
    CE.audio.sfx('click');
    scene = null;
    touchpadToggle(false);
    showScreen('title');
    renderTitleState();
  };
  $('btnSound').onclick = () => {
    CE.audio.init();
    CE.audio.sfxOn = !CE.audio.sfxOn;
    $('btnSound').textContent = CE.audio.sfxOn ? '🔊' : '🔇';
    if (CE.audio.sfxOn) CE.audio.sfx('ok');
  };
  $('btnMusic').onclick = () => {
    CE.audio.init();
    CE.audio.bgmOn = !CE.audio.bgmOn;
    $('btnMusic').textContent = CE.audio.bgmOn ? '🎵' : '🎵̶';
    if (CE.audio.bgmOn) CE.audio.startBgm(); else CE.audio.stopBgm();
  };
  $('btnPause').onclick = () => { CE.audio.sfx('click'); pauseOpen(); };
  $('lcClose').onclick = () => { CE.audio.sfx('click'); closeLevelCard(); };
  $('dialog').onclick = storyAdvance;
  $('btnSkip').onclick = e => { e.stopPropagation(); storySkip(); };
  $('modal').onclick = e => {
    if (e.target.id === 'modal') {
      // 点击遮罩不关闭，避免误触丢失结算
    }
  };

  /* ===================================================================
     自适应缩放
     =================================================================== */
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min((vw - 24) / 960, (vh - 24) / 600);
    const stage = $('stage');
    stage.style.transform = 'scale(' + Math.max(0.3, s) + ')';
  }
  window.addEventListener('resize', fit);
  window.addEventListener('blur', () => {
    CE.input.keys = {}; CE.input.pressed = {}; CE.input.down = false; CE.input.clicked = false;
    CE.touchInput.dir = {x:0,y:0}; CE.touchInput.act = false; CE.touchInput.jump = false;
  });

  /* ===================================================================
     主循环
     =================================================================== */
  let last = performance.now();
  function loop(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.06) dt = 0.06;
    if (dt < 0) dt = 0;

    // 更新
    if (screen === 'play' && scene && !paused) scene.update(dt);
    CE.fx.update(dt);

    // 绘制
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const bg = ctx.createLinearGradient(0, 0, 0, 600);
    bg.addColorStop(0, '#8FD8F7'); bg.addColorStop(1, '#CFF3C8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 960, 600);

    if (screen === 'play' && scene) {
      scene.draw(ctx);
      CE.fx.draw(ctx);
    } else {
      // 非游戏状态：画一层淡淡的城市剪影
      drawIdleScene(ctx, now / 1000);
    }

    displayCtx.imageSmoothingEnabled = false;
    displayCtx.drawImage(pixelCanvas, 0, 0, canvas.width, canvas.height);
    CE.endFrame();
    requestAnimationFrame(loop);
  }

  function drawIdleScene(c, t) {
    c.save();
    c.globalAlpha = 0.9;
    for (let i = 0; i < 14; i++) {
      const w = 60 + (i * 37) % 46;
      const h = 90 + (i * 71) % 150;
      const x = i * 72 - 20;
      c.fillStyle = i % 2 ? '#A9CBE8' : '#BBD8EE';
      CE.card(c, x, 600 - h, w, h, 6, c.fillStyle, 3);
      c.fillStyle = 'rgba(255,255,255,.55)';
      for (let r = 0; r < Math.floor(h / 40); r++) {
        for (let k = 0; k < Math.floor(w / 26); k++) {
          c.fillRect(x + 8 + k * 26, 600 - h + 12 + r * 40, 13, 13);
        }
      }
    }
    c.fillStyle = '#8BD96B';
    c.fillRect(0, 560, 960, 40);
    c.restore();
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 300 + t * 18) % 1200) - 150;
      CE.drawCloud(c, cx, 60 + (i % 3) * 46, 0.8 + (i % 3) * 0.25, 0.8);
    }
  }

  /* ===================================================================
     启动
     =================================================================== */
  buildTouchpad();
  fit();
  renderTitleState();
  syncSave();
  showScreen('title');
  $('fragCount').textContent = CE.save.data.frags;
  requestAnimationFrame(loop);

  /* 演示 / 调试用：index.html#lv=5 直接进入第 5 关，#map 看地图，#story 看序章 */
  const hashMatch = (location.hash || '').match(/lv=(\d+)/);
  if (hashMatch) {
    const id = Math.max(1, Math.min(CE.levels.length, parseInt(hashMatch[1], 10)));
    CE.save.data.maxUnlock = Math.max(CE.save.data.maxUnlock, id);
    levelObj = CE.levels[id - 1];
    launchLevel();
  } else if (/map/.test(location.hash || '')) {
    backToMap();
  } else if (/story/.test(location.hash || '')) {
    playStory(CE.story.intro, () => backToMap());
  }

  // 首次交互后启动背景音乐
  const once = () => {
    CE.audio.init();
    if (screen !== 'title') CE.audio.startBgm();
    window.removeEventListener('pointerdown', once);
  };
  window.addEventListener('pointerdown', once);
})();
