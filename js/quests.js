/* ===== Quests Module: Quest Board & Interactions ===== */

const Quests = {
  init() {
    this.renderQuestPanel();
  },

  renderQuestPanel() {
    const body = document.querySelector('#quest-panel .panel-body');

    let html = '';

    // Elder's Suggestion
    html += this.renderElderSuggestion();

    // Weekly Traditions
    html += '<div class="quest-section">';
    html += '<div class="section-header">Weekly Traditions</div>';
    QUESTS.weeklyTraditions.forEach(q => {
      html += this.renderQuestCard(q);
    });
    html += '</div>';

    // Monthly Expeditions
    html += '<div class="quest-section">';
    html += '<div class="section-header">Monthly Expeditions</div>';
    QUESTS.monthlyExpeditions.forEach(q => {
      html += this.renderQuestCard(q);
    });
    html += '</div>';

    body.innerHTML = html;

    // Attach click handlers
    body.querySelectorAll('.pixel-card[data-quest-id]').forEach(card => {
      const qid = card.dataset.questId;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn')) return;
        this.expandQuest(qid);
      });
    });

    body.querySelectorAll('.btn-complete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.completeQuest(btn.dataset.questId);
      });
    });

    const acceptBtn = body.querySelector('.btn-accept-elder');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.acceptElderQuest();
      });
    }
  },

  renderQuestCard(quest) {
    const avatars = quest.participants.map(pid => {
      const f = getFriend(pid);
      if (!f) return '';
      return `<img class="avatar-thumb" src="sprites/${f.sprite}.png" alt="${f.name}" title="${f.name}">`;
    }).join('');

    const segments = [];
    for (let i = 0; i < quest.total; i++) {
      segments.push(`<div class="progress-segment${i < quest.progress ? ' filled' : ''}"></div>`);
    }

    const canComplete = quest.progress >= quest.total - 1 && quest.status === 'active';
    const isCompleted = quest.status === 'completed';

    return `
      <div class="pixel-card${isCompleted ? ' completed' : ''}" data-quest-id="${quest.id}">
        <div class="quest-card-header">
          <span class="quest-card-icon">${quest.icon}</span>
          <div>
            <div class="quest-card-title">${quest.title}</div>
          </div>
        </div>
        <div class="quest-card-desc">${quest.description}</div>
        <div class="avatar-row">${avatars}</div>
        <div class="quest-card-meta">
          <div class="progress-bar">${segments.join('')}</div>
        </div>
        <div class="quest-card-footer">
          <span class="quest-card-deadline">${quest.deadline}</span>
          ${canComplete ? `<button class="btn btn-primary btn-small btn-complete" data-quest-id="${quest.id}">Mark Complete</button>` : ''}
          ${isCompleted ? '<span class="tag">Completed</span>' : ''}
        </div>
        <div class="quest-detail" id="detail-${quest.id}">
          ${this._renderTimeline(quest)}
          ${this._renderMiniGallery(quest)}
        </div>
      </div>
    `;
  },

  renderElderSuggestion() {
    const q = QUESTS.elderSuggestion;
    if (!q) return '';

    return `
      <div class="pixel-card elder-suggestion" data-quest-id="${q.id}">
        <div class="elder-label">🌿 Elder's Suggestion</div>
        <div class="quest-card-header">
          <span class="quest-card-icon">${q.icon}</span>
          <div>
            <div class="quest-card-title">${q.title}</div>
          </div>
        </div>
        <div class="quest-card-desc">${q.description}</div>
        <div class="quest-card-footer">
          <span class="quest-card-deadline">${q.deadline}</span>
          <button class="btn btn-primary btn-small btn-accept-elder">Accept Quest</button>
        </div>
      </div>
    `;
  },

  expandQuest(questId) {
    const detail = document.getElementById('detail-' + questId);
    if (!detail) return;
    detail.classList.toggle('expanded');
  },

  completeQuest(questId) {
    // Find quest across all lists
    const quest = this._findQuest(questId);
    if (!quest || quest.status === 'completed') return;

    quest.status = 'completed';
    quest.progress = quest.total;

    // Get the card element for gold flash
    const card = document.querySelector(`.pixel-card[data-quest-id="${questId}"]`);
    if (card) {
      card.style.animation = 'gold-flash 0.8s ease-out';
      card.addEventListener('animationend', () => {
        card.style.animation = '';
      }, { once: true });
    }

    // Confetti from center of screen
    Confetti.burst();
    if (typeof Sound !== 'undefined') Sound.chime();

    // Re-render after a short delay so the flash is visible
    setTimeout(() => {
      this.renderQuestPanel();
    }, 900);

    UI.showToast('elder', 'Memory Created! 🎉');
  },

  acceptElderQuest() {
    const elder = QUESTS.elderSuggestion;
    if (!elder) return;

    // Move to weekly traditions
    elder.status = 'active';
    QUESTS.weeklyTraditions.push(elder);
    QUESTS.elderSuggestion = null;

    this.renderQuestPanel();
    UI.showToast('elder', 'New quest accepted! 🌸');
  },

  /* ----- Internal Helpers ----- */

  _findQuest(id) {
    const all = [...QUESTS.weeklyTraditions, ...QUESTS.monthlyExpeditions];
    if (QUESTS.elderSuggestion && QUESTS.elderSuggestion.id === id) return QUESTS.elderSuggestion;
    return all.find(q => q.id === id);
  },

  _renderTimeline(quest) {
    const actions = [
      'shared a photo', 'left a voice note', 'added a comment',
      'uploaded a memory', 'sent encouragement', 'shared a recipe',
      'posted a sunset snap', 'shared a matcha latte', 'checked in',
    ];

    const entries = [];
    const count = Math.min(quest.participants.length, 5);
    for (let i = 0; i < count; i++) {
      const pid = quest.participants[i % quest.participants.length];
      const f = getFriend(pid);
      if (!f) continue;
      const action = actions[Math.floor(Math.random() * actions.length)];
      entries.push(`
        <div class="quest-timeline-entry">
          <span class="quest-timeline-day">Day ${i + 1}</span>
          <span>${f.name} ${action}</span>
        </div>
      `);
    }
    return entries.join('');
  },

  _renderMiniGallery(quest) {
    const thumbs = quest.participants.slice(0, 4).map(pid => {
      const f = getFriend(pid);
      if (!f) return '';
      return `<img class="avatar-thumb" src="sprites/${f.sprite}.png" alt="${f.name}" style="width:40px;height:40px;border-radius:4px;">`;
    }).join('');

    return `<div class="avatar-row" style="margin-top:8px;gap:6px;">${thumbs}</div>`;
  },
};
