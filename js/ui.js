/* ===== UI Manager: Panels, Navigation, Notifications, Friends, Toasts ===== */

const UI = {
  currentPanel: null,
  profileTarget: null,

  init() {
    this.setupTabBar();
    this.setupOverlay();
    this.setupNotifications();
    this.setupProfileCard();
  },

  /* ----- Tab Bar ----- */
  setupTabBar() {
    document.querySelectorAll('#tab-bar .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const panel = tab.dataset.panel;
        if (panel === 'hearth') {
          this.closeAllPanels();
        } else {
          this.togglePanel(panel);
        }
        this.setActiveTab(panel);
      });
    });
  },

  setActiveTab(name) {
    document.querySelectorAll('#tab-bar .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.panel === name);
    });
  },

  /* ----- Panel Management ----- */
  togglePanel(name) {
    const panelMap = {
      quests: 'quest-panel',
      memories: 'memory-panel',
      friends: 'friends-panel',
    };
    const panelId = panelMap[name];
    if (!panelId) return;

    const el = document.getElementById(panelId);
    if (el.classList.contains('open')) {
      this.closeAllPanels();
      this.setActiveTab('hearth');
    } else {
      this.closeAllPanels();
      el.classList.add('open');
      document.getElementById('overlay-dim').classList.add('visible');
      this.currentPanel = name;
      if (typeof Sound !== 'undefined') Sound.whoosh();
    }
  },

  openPanel(name) {
    this.closeAllPanels();
    const panelMap = {
      quests: 'quest-panel',
      memories: 'memory-panel',
      friends: 'friends-panel',
    };
    const panelId = panelMap[name];
    if (!panelId) return;
    document.getElementById(panelId).classList.add('open');
    document.getElementById('overlay-dim').classList.add('visible');
    this.currentPanel = name;
    this.setActiveTab(name);
    if (typeof Sound !== 'undefined') Sound.whoosh();
  },

  closeAllPanels() {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('open'));
    document.getElementById('overlay-dim').classList.remove('visible');
    document.getElementById('notification-feed').classList.remove('open');
    this.currentPanel = null;
    this.hideProfile();
  },

  /* ----- Overlay ----- */
  setupOverlay() {
    document.getElementById('overlay-dim').addEventListener('click', () => {
      this.closeAllPanels();
      this.setActiveTab('hearth');
    });

    // Close buttons on all panels
    document.querySelectorAll('.btn-close').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllPanels();
        this.setActiveTab('hearth');
      });
    });
  },

  /* ----- Profile Card ----- */
  setupProfileCard() {
    // Click on town background to dismiss profile
    document.getElementById('town').addEventListener('click', (e) => {
      if (e.target === document.getElementById('town')) {
        this.hideProfile();
      }
    });
  },

  showProfile(villager) {
    const card = document.getElementById('profile-card');
    const d = villager.data;
    const moodColor = getMoodColor(d.mood);

    card.innerHTML = `
      <div class="profile-top">
        <img class="profile-avatar" src="sprites/${d.sprite}.png" alt="${d.name}">
        <div class="profile-info">
          <div class="profile-name">${d.name}</div>
          <div class="profile-location">📍 ${d.location}</div>
          <div class="profile-status">${d.status}</div>
        </div>
      </div>
      <div class="profile-details">
        <div class="profile-row">
          <span class="label">Mood</span>
          <span class="mood-dot" style="background:${moodColor}"></span>
          <span>${d.mood}</span>
        </div>
        <div class="profile-row">
          <span class="label">Activity</span>
          <span>${getActivityIcon(d.activity)} ${d.activity}</span>
        </div>
        <div class="profile-row">
          <span class="label">Timezone</span>
          <span>${d.timezone}</span>
        </div>
        <div class="profile-row">
          <span class="label">Last seen</span>
          <span>${d.lastSeen}</span>
        </div>
        <div class="profile-row">
          <span class="label">Friends</span>
          <span>Since ${d.friendSince}</span>
        </div>
      </div>
      <div class="profile-bio">${d.bio}</div>
      <div class="profile-actions">
        <button class="btn btn-primary btn-small" onclick="UI.sendNudge('${d.id}')">👋 Nudge</button>
        <button class="btn btn-secondary btn-small" onclick="UI.openPanel('quests')">📜 Quests</button>
      </div>
    `;

    // Position near the villager
    const vx = villager.x;
    const vy = villager.y;
    const cardW = 300;
    const cardH = 360;

    let left = vx + 40;
    let top = vy - cardH / 2;

    // Keep within viewport
    if (left + cardW > window.innerWidth - 20) left = vx - cardW - 20;
    if (top < 60) top = 60;
    if (top + cardH > window.innerHeight - 80) top = window.innerHeight - 80 - cardH;

    card.style.left = left + 'px';
    card.style.top = top + 'px';
    card.classList.add('open');

    this.profileTarget = villager;
  },

  hideProfile() {
    const card = document.getElementById('profile-card');
    card.classList.remove('open');
    this.profileTarget = null;
  },

  sendNudge(friendId) {
    const f = getFriend(friendId);
    if (f) this.showToast(f.sprite, `You nudged ${f.name}! 👋`);
  },

  /* ----- Notifications ----- */
  setupNotifications() {
    const btn = document.getElementById('btn-notifications');
    const feed = document.getElementById('notification-feed');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      feed.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!feed.contains(e.target) && e.target !== btn) {
        feed.classList.remove('open');
      }
    });

    this.renderNotifications();
  },

  renderNotifications() {
    const feed = document.getElementById('notification-feed');
    feed.innerHTML = NOTIFICATIONS.map(n => `
      <div class="notif-item ${n.unread ? 'unread' : ''}">
        <img class="notif-avatar" src="sprites/${n.sprite}.png" alt="">
        <div class="notif-content">
          <div class="notif-text">${n.text}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>
    `).join('');

    // Update badge count
    const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;
    const badge = document.querySelector('#btn-notifications .badge');
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }
  },

  /* ----- Friends Panel ----- */
  renderFriendsList(villagers) {
    const body = document.querySelector('#friends-panel .panel-body');
    body.innerHTML = `
      <input class="friend-search" type="text" placeholder="Search friends..." id="friend-search-input">
      <div id="friends-list"></div>
    `;

    const renderList = (filter = '') => {
      const list = document.getElementById('friends-list');
      const filtered = FRIENDS.filter(f =>
        f.name.toLowerCase().includes(filter.toLowerCase())
      );

      list.innerHTML = filtered.map(f => `
        <div class="friend-row" data-friend-id="${f.id}">
          <img class="friend-row-avatar" src="sprites/${f.sprite}.png" alt="${f.name}">
          <div class="friend-row-info">
            <div class="friend-row-name">${f.name}</div>
            <div class="friend-row-activity">${getActivityIcon(f.activity)} ${f.activity}</div>
          </div>
          <div class="friend-row-dots">
            <span class="mood-dot" style="background:${getMoodColor(f.mood)}" title="${f.mood}"></span>
            <span class="pulse-dot" style="background:${PULSE_COLORS[f.pulse]}" title="${f.pulse}"></span>
          </div>
        </div>
      `).join('');

      // Click handlers
      list.querySelectorAll('.friend-row').forEach(row => {
        row.addEventListener('click', () => {
          const id = row.dataset.friendId;
          const v = villagers.find(v => v.id === id);
          if (v) {
            this.closeAllPanels();
            this.setActiveTab('hearth');
            v.bounce();
            setTimeout(() => this.showProfile(v), 200);
          }
        });
      });
    };

    renderList();

    document.getElementById('friend-search-input').addEventListener('input', (e) => {
      renderList(e.target.value);
    });
  },

  /* ----- Toasts ----- */
  toastQueue: [],
  toastActive: false,

  showToast(sprite, text) {
    this.toastQueue.push({ sprite, text });
    if (!this.toastActive) this._processToast();
  },

  _processToast() {
    if (this.toastQueue.length === 0) {
      this.toastActive = false;
      return;
    }

    this.toastActive = true;
    const { sprite, text } = this.toastQueue.shift();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <img class="toast-avatar" src="sprites/${sprite}.png" alt="">
      <span class="toast-text">${text}</span>
    `;
    document.getElementById('app').appendChild(toast);

    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => {
        toast.remove();
        this._processToast();
      }, 300);
    }, 3000);
  },
};
