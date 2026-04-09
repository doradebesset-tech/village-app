/* ===== App Bootstrap ===== */

// ===== Web Audio Sounds =====
const Sound = {
  ctx: null,
  _getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  },
  pop() {
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  },
  whoosh() {
    try {
      const ctx = this._getCtx();
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  },
  chime() {
    try {
      const ctx = this._getCtx();
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch (e) {}
  },
};

(function () {
  const villagers = [];

  // ===== Preload images =====
  function preload(callback) {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.querySelector('.loading-bar-fill');
    const images = ['town.png', ...FRIENDS.map(f => `sprites/${f.sprite}.png`)];
    let loaded = 0;

    if (!loadingScreen) { callback(); return; }

    images.forEach(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        const pct = (loaded / images.length) * 100;
        if (loadingBar) loadingBar.style.width = pct + '%';
        if (loaded === images.length) {
          setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
              loadingScreen.remove();
              callback();
            }, 500);
          }, 400);
        }
      };
      img.src = src;
    });
  }

  // ===== Create villager DOM elements =====
  function createVillagers() {
    const town = document.getElementById('town');

    FRIENDS.forEach(friendData => {
      const div = document.createElement('div');
      div.className = `villager pulse-${friendData.pulse}`;
      div.dataset.friendId = friendData.id;
      div.style.setProperty('--mood-color', getMoodColor(friendData.mood));

      div.innerHTML = `
        <div class="mood-ring"></div>
        <img class="villager-sprite" src="sprites/${friendData.sprite}.png" alt="${friendData.name}">
        <div class="villager-name">${friendData.name}</div>
        <div class="activity-bubble">${friendData.pulse === 'sleeping' ? '💤' : friendData.pulse === 'dnd' ? '⛔' : getActivityIcon(friendData.activity)}</div>
        <div class="villager-shadow"></div>
      `;

      // Click handler
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        const v = villagers.find(v => v.id === friendData.id);
        if (!v) return;

        v.bounce();
        Sound.pop();

        // Elder opens quest panel
        if (friendData.isElder) {
          UI.openPanel('quests');
          return;
        }

        UI.showProfile(v);
      });

      town.appendChild(div);
      const villager = new Villager(friendData, div);
      villagers.push(villager);
    });

    return villagers;
  }

  // ===== Game Loop =====
  function startLoop() {
    let last = performance.now();

    function loop(now) {
      const dt = Math.min(now - last, 100);
      last = now;
      villagers.forEach(v => v.tick(dt));
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  // ===== Keyboard Shortcuts =====
  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case '1': UI.closeAllPanels(); UI.setActiveTab('hearth'); break;
        case '2': UI.togglePanel('quests'); UI.setActiveTab('quests'); break;
        case '3': UI.togglePanel('memories'); UI.setActiveTab('memories'); break;
        case '4': UI.togglePanel('friends'); UI.setActiveTab('friends'); break;
        case 'Escape': UI.closeAllPanels(); UI.setActiveTab('hearth'); break;
        case 'n': case 'N':
          if (typeof Hearth !== 'undefined') {
            Hearth.dayNightTimer = 42000; // Jump to night phase
          }
          break;
        case 'd': case 'D':
          if (typeof Hearth !== 'undefined') {
            Hearth.cycleLength = Hearth.cycleLength === 60000 ? 6000 : 60000; // Toggle 10x speed
          }
          break;
      }
    });
  }

  // ===== Resize Handler =====
  function setupResize() {
    window.addEventListener('resize', () => {
      const tabbarH = 64;
      villagers.forEach(v => {
        v.x = Math.min(v.x, window.innerWidth - 80);
        v.y = Math.min(v.y, window.innerHeight - tabbarH - 80);
      });
    });
  }

  // ===== Init =====
  preload(() => {
    createVillagers();
    UI.init();
    UI.renderFriendsList(villagers);

    // Init modules (will be populated by agents)
    if (typeof Hearth !== 'undefined' && Hearth.init) {
      Hearth.init(villagers);
      Hearth.startDayNight();
      Hearth.startStateSimulation();
    }
    if (typeof Quests !== 'undefined' && Quests.init) {
      Quests.init();
    }
    if (typeof TownSquare !== 'undefined' && TownSquare.init) {
      TownSquare.init();
    }

    startLoop();
    setupKeyboard();
    setupResize();
  });
})();
