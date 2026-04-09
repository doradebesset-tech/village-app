/* ===== Hearth Module: Day/Night Cycle & Ambient State Simulation ===== */

const Hearth = {
  villagers: [],
  dayNightTimer: 0,
  starsCreated: false,
  cycleLength: 60000, // 60-second demo cycle in ms
  simulationInterval: null,

  init(villagers) {
    this.villagers = villagers;
  },

  /* ----- Day/Night Cycle ----- */

  startDayNight() {
    this.dayNightTimer = 0;
    const overlay = document.getElementById('daynight-overlay');
    if (!overlay) return;

    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(now - last, 100);
      last = now;
      this.dayNightTimer = (this.dayNightTimer + dt) % this.cycleLength;
      this.updateDayNight(this.dayNightTimer);
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  },

  updateDayNight(elapsed) {
    const overlay = document.getElementById('daynight-overlay');
    if (!overlay) return;

    // Normalize to 0–1 progress through the cycle
    const t = elapsed / this.cycleLength;

    // Phase boundaries (as fractions of the cycle):
    // dawn:     0.000 – 0.167  (0s  – 10s)
    // day:      0.167 – 0.500  (10s – 30s)
    // dusk:     0.500 – 0.667  (30s – 40s)
    // night:    0.667 – 0.917  (40s – 55s)
    // pre-dawn: 0.917 – 1.000  (55s – 60s)

    let r, g, b, a;

    if (t < 0.167) {
      // Dawn: warm gold tint fading out
      const p = t / 0.167;
      r = 255;
      g = 183;
      b = 77;
      a = 0.25 * (1 - p);
    } else if (t < 0.500) {
      // Day: clear, no overlay
      r = 0;
      g = 0;
      b = 0;
      a = 0;
    } else if (t < 0.667) {
      // Dusk: orange/pink tint fading in
      const p = (t - 0.500) / 0.167;
      r = 255;
      g = 140;
      b = 90;
      a = 0.2 * p;
    } else if (t < 0.917) {
      // Night: transition from dusk into deep blue
      const p = (t - 0.667) / 0.250;
      // Blend from orange-pink to deep blue
      r = Math.round(255 * (1 - p) + 20 * p);
      g = Math.round(140 * (1 - p) + 30 * p);
      b = Math.round(90 * (1 - p) + 80 * p);
      a = 0.2 + 0.3 * p;
    } else {
      // Pre-dawn: deep blue fading to purple, then easing toward dawn gold
      const p = (t - 0.917) / 0.083;
      r = Math.round(20 + (100 - 20) * p);
      g = Math.round(30 + (50 - 30) * p);
      b = Math.round(80 + (120 - 80) * p);
      a = 0.5 * (1 - p * 0.5);
    }

    overlay.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;

    // Stars visible during night and pre-dawn phases (t >= 0.70 to t < 0.96)
    const showStars = t >= 0.70 && t < 0.96;

    if (showStars && !this.starsCreated) {
      this.createStars();
    }
    this.showStars(showStars);
  },

  createStars() {
    if (this.starsCreated) return;

    const overlay = document.getElementById('daynight-overlay');
    if (!overlay) return;

    for (let i = 0; i < 20; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 60 + '%'; // keep stars in upper portion
      star.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
      star.style.animationDuration = (2 + Math.random() * 2).toFixed(1) + 's';
      overlay.appendChild(star);
    }

    this.starsCreated = true;
  },

  showStars(show) {
    const overlay = document.getElementById('daynight-overlay');
    if (!overlay) return;

    const stars = overlay.querySelectorAll('.star');
    stars.forEach(star => {
      star.style.display = show ? 'block' : 'none';
    });
  },

  /* ----- Simulated State Changes ----- */

  startStateSimulation() {
    this._scheduleNextChange();
  },

  _scheduleNextChange() {
    // Random interval between 15–30 seconds
    const delay = 15000 + Math.random() * 15000;
    this.simulationInterval = setTimeout(() => {
      this.simulateChange();
      this._scheduleNextChange();
    }, delay);
  },

  simulateChange() {
    if (!this.villagers.length) return;

    // Pick a random villager
    const villager = this.villagers[Math.floor(Math.random() * this.villagers.length)];
    const friend = villager.data;

    // Decide what to change: mood, activity, or pulse
    const changeType = Math.random();

    if (changeType < 0.4) {
      // Change mood
      const moods = Object.keys(MOOD_COLORS).filter(m => m !== friend.mood);
      const newMood = moods[Math.floor(Math.random() * moods.length)];
      villager.updateMood(newMood);
      villager.bounce();

      const text = `${friend.name} is feeling ${newMood}`;
      UI.showToast(friend.sprite, text);
      NOTIFICATIONS.unshift({
        id: 'n-' + Date.now(),
        sprite: friend.sprite,
        text: text,
        time: 'Just now',
        unread: true,
      });

    } else if (changeType < 0.75) {
      // Change activity
      const activities = Object.keys(ACTIVITY_ICONS).filter(a => a !== friend.activity);
      const newActivity = activities[Math.floor(Math.random() * activities.length)];
      villager.updateActivity(newActivity);
      villager.bounce();

      const icon = getActivityIcon(newActivity);
      const text = `${friend.name} started ${newActivity} ${icon}`;
      UI.showToast(friend.sprite, text);
      NOTIFICATIONS.unshift({
        id: 'n-' + Date.now(),
        sprite: friend.sprite,
        text: text,
        time: 'Just now',
        unread: true,
      });

    } else {
      // Change pulse
      const pulses = ['active', 'away', 'dnd', 'sleeping'].filter(p => p !== friend.pulse);
      const newPulse = pulses[Math.floor(Math.random() * pulses.length)];
      villager.updatePulse(newPulse);
      villager.bounce();

      const labels = { active: 'online', away: 'away', dnd: 'do not disturb', sleeping: 'sleeping' };
      const text = `${friend.name} is now ${labels[newPulse]}`;
      UI.showToast(friend.sprite, text);
      NOTIFICATIONS.unshift({
        id: 'n-' + Date.now(),
        sprite: friend.sprite,
        text: text,
        time: 'Just now',
        unread: true,
      });
    }

    // Re-render notification feed
    UI.renderNotifications();
  },
};
