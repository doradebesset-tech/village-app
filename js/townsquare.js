/* ===== Town Square Module: Memory Archive ===== */

const TownSquare = {
  currentView: 'gallery',
  walkthroughActive: false,

  init() {
    this.renderMemoryPanel();

    // Wire up exit walkthrough button
    const exitBtn = document.getElementById('exit-walkthrough');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.exitWalkthrough());
    }
  },

  renderMemoryPanel() {
    const body = document.querySelector('#memory-panel .panel-body');
    if (!body) return;

    body.innerHTML = `
      <div class="memory-view-toggle">
        <button class="memory-view-btn ${this.currentView === 'gallery' ? 'active' : ''}" data-view="gallery">Gallery</button>
        <button class="memory-view-btn ${this.currentView === 'timeline' ? 'active' : ''}" data-view="timeline">Timeline</button>
      </div>
      <div id="memory-view-container"></div>
      <div class="pixel-divider"></div>
      <button class="btn btn-primary" id="btn-walkthrough" style="width:100%">Walk Through Memories</button>
    `;

    // Toggle listeners
    body.querySelectorAll('.memory-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentView = btn.dataset.view;
        body.querySelectorAll('.memory-view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderCurrentView();
      });
    });

    // Walkthrough button
    document.getElementById('btn-walkthrough').addEventListener('click', () => this.enterWalkthrough());

    this._renderCurrentView();
  },

  _renderCurrentView() {
    if (this.currentView === 'gallery') {
      this.renderGallery();
    } else {
      this.renderTimeline();
    }
  },

  renderGallery() {
    const container = document.getElementById('memory-view-container');
    if (!container) return;

    const cards = MEMORIES.map(m => {
      const avatars = m.participants.map(pid => {
        const f = getFriend(pid);
        if (!f) return '';
        return `<img class="avatar-thumb" src="sprites/${f.sprite}.png" alt="${f.name}" style="width:24px;height:24px;">`;
      }).join('');

      return `
        <div class="pixel-card memory-card" data-memory-id="${m.id}" style="cursor:pointer;padding:8px;margin-bottom:0;">
          <img class="memory-card-thumb" src="${m.thumbnail}" alt="${m.questTitle}">
          <div class="memory-card-title">${m.questTitle}</div>
          <div class="memory-card-date">${m.date}</div>
          <div class="avatar-row" style="margin-top:6px;">${avatars}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="memory-gallery">${cards}</div>`;

    // Click handlers
    container.querySelectorAll('.memory-card').forEach(card => {
      card.addEventListener('click', () => {
        this.showMemoryDetail(card.dataset.memoryId);
      });
    });
  },

  renderTimeline() {
    const container = document.getElementById('memory-view-container');
    if (!container) return;

    const entries = MEMORIES.map(m => {
      const avatars = m.participants.map(pid => {
        const f = getFriend(pid);
        if (!f) return '';
        return `<img class="avatar-thumb" src="sprites/${f.sprite}.png" alt="${f.name}" style="width:24px;height:24px;">`;
      }).join('');

      const snippet = m.description.length > 80 ? m.description.substring(0, 80) + '...' : m.description;

      return `
        <div class="timeline-entry pixel-card" data-memory-id="${m.id}" style="cursor:pointer;">
          <div class="timeline-date">${m.date}</div>
          <div class="memory-card-title">${m.questTitle}</div>
          <div style="font-size:11px;color:var(--color-text-dark);opacity:0.8;margin:6px 0;line-height:1.4;">${snippet}</div>
          <div class="avatar-row">${avatars}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="memory-timeline">${entries}</div>`;

    // Click handlers
    container.querySelectorAll('.timeline-entry').forEach(entry => {
      entry.addEventListener('click', () => {
        this.showMemoryDetail(entry.dataset.memoryId);
      });
    });
  },

  showMemoryDetail(memoryId) {
    const memory = MEMORIES.find(m => m.id === memoryId);
    if (!memory) return;

    const body = document.querySelector('#memory-panel .panel-body');
    if (!body) return;

    // Remove existing overlay if any
    const existing = body.querySelector('.memory-detail-overlay');
    if (existing) existing.remove();

    // Build participant list
    const participantList = memory.participants.map(pid => {
      const f = getFriend(pid);
      if (!f) return '';
      return `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <img src="sprites/${f.sprite}.png" alt="${f.name}" style="width:28px;height:28px;border-radius:50%;border:2px solid var(--color-bg);object-fit:cover;">
          <span style="font-family:var(--font-pixel);font-size:8px;color:var(--color-text-light);">${f.name}</span>
        </div>
      `;
    }).join('');

    // Build voice note bar if applicable
    let voiceNoteHTML = '';
    if (memory.hasVoiceNote) {
      const bars = [];
      const barCount = 25;
      for (let i = 0; i < barCount; i++) {
        const height = Math.floor(Math.random() * 17) + 4; // 4-20px
        bars.push(`<div class="voice-wave-bar" style="height:${height}px;"></div>`);
      }
      voiceNoteHTML = `
        <div class="voice-note-bar">
          <span style="cursor:pointer;font-size:16px;">&#9654;</span>
          <div class="voice-wave">${bars.join('')}</div>
          <span style="font-family:var(--font-pixel);font-size:6px;color:var(--color-text-light);opacity:0.6;">0:30</span>
        </div>
      `;
    }

    const overlay = document.createElement('div');
    overlay.className = 'memory-detail-overlay open';
    overlay.innerHTML = `
      <button class="btn btn-secondary btn-small" id="memory-detail-back" style="margin-bottom:12px;">Back</button>
      <img class="memory-detail-image" src="${memory.thumbnail}" alt="${memory.questTitle}">
      <div class="memory-detail-title">${memory.questTitle}</div>
      <div style="font-family:var(--font-pixel);font-size:7px;color:var(--color-accent-gold);opacity:0.7;margin-bottom:10px;">${memory.date}</div>
      <div class="memory-detail-desc">${memory.description}</div>
      ${voiceNoteHTML}
      <div class="section-header">Participants</div>
      <div style="margin-bottom:12px;">${participantList}</div>
      <div class="pixel-divider"></div>
      <button class="btn btn-secondary btn-small" id="memory-related-quest">Related Quest</button>
    `;

    body.appendChild(overlay);

    // Back button
    document.getElementById('memory-detail-back').addEventListener('click', () => this.hideMemoryDetail());

    // Related quest link
    document.getElementById('memory-related-quest').addEventListener('click', () => {
      this.hideMemoryDetail();
      UI.openPanel('quests');
    });
  },

  hideMemoryDetail() {
    const body = document.querySelector('#memory-panel .panel-body');
    if (!body) return;
    const overlay = body.querySelector('.memory-detail-overlay');
    if (overlay) overlay.remove();
  },

  enterWalkthrough() {
    // Close the memory panel
    UI.closeAllPanels();
    UI.setActiveTab('hearth');

    // Show walkthrough bar
    const bar = document.getElementById('walkthrough-bar');
    if (bar) bar.classList.add('visible');

    // Place polaroids on the town map
    const town = document.getElementById('town');
    if (!town) return;

    const townW = town.offsetWidth || window.innerWidth;
    const townH = town.offsetHeight || window.innerHeight;
    const count = Math.min(MEMORIES.length, 6);
    const selected = MEMORIES.slice(0, count);

    selected.forEach((m, i) => {
      const polaroid = document.createElement('div');
      polaroid.className = 'walkthrough-polaroid';

      // Spread polaroids across the map with some randomness
      const cols = 3;
      const rows = 2;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellW = (townW - 160) / cols;
      const cellH = (townH - 200) / rows;
      const x = 40 + col * cellW + Math.random() * (cellW - 120);
      const y = 80 + row * cellH + Math.random() * (cellH - 100);

      const rotation = Math.floor(Math.random() * 12) - 6; // -6 to 6 degrees

      polaroid.style.left = x + 'px';
      polaroid.style.top = y + 'px';
      polaroid.style.transform = `rotate(${rotation}deg)`;

      polaroid.innerHTML = `
        <img src="${m.thumbnail}" alt="${m.questTitle}">
        <div class="caption">${m.questTitle}</div>
      `;

      polaroid.addEventListener('click', (e) => {
        e.stopPropagation();
        const f = getFriend(m.participants[0]);
        const sprite = f ? f.sprite : 'elder';
        UI.showToast(sprite, m.description);
      });

      town.appendChild(polaroid);
    });

    this.walkthroughActive = true;
  },

  exitWalkthrough() {
    // Remove all polaroids
    document.querySelectorAll('.walkthrough-polaroid').forEach(p => p.remove());

    // Hide walkthrough bar
    const bar = document.getElementById('walkthrough-bar');
    if (bar) bar.classList.remove('visible');

    this.walkthroughActive = false;
  },
};
