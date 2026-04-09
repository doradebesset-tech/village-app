/* ===== Villager Class ===== */

const SPEED_MIN = 0.3;
const SPEED_MAX = 0.8;
const PAUSE_MIN = 1500;
const PAUSE_MAX = 5000;
const WALK_MIN = 2000;
const WALK_MAX = 6000;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

class Villager {
  constructor(data, el) {
    this.data = data;
    this.id = data.id;
    this.el = el;

    // Position and movement
    const topbarH = 48;
    const tabbarH = 64;
    this.x = rand(60, window.innerWidth - 120);
    this.y = rand(topbarH + 30, window.innerHeight - tabbarH - 80);
    this.vx = 0;
    this.vy = 0;
    this.state = 'idle';
    this.stateTimer = rand(500, 2000);
    this.speed = rand(SPEED_MIN, SPEED_MAX);
    this.facingLeft = false;

    // Apply initial position
    this.render();
  }

  pickDirection() {
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.facingLeft = this.vx < 0;
    this.el.querySelector('.villager-sprite').style.transform = this.facingLeft ? 'scaleX(-1)' : 'scaleX(1)';
  }

  tick(dt) {
    this.stateTimer -= dt;

    if (this.stateTimer <= 0) {
      if (this.state === 'idle') {
        this.state = 'walking';
        this.stateTimer = rand(WALK_MIN, WALK_MAX);
        this.pickDirection();
        this.el.classList.add('walking');
      } else {
        this.state = 'idle';
        this.stateTimer = rand(PAUSE_MIN, PAUSE_MAX);
        this.vx = 0;
        this.vy = 0;
        this.el.classList.remove('walking');
      }
    }

    if (this.state === 'walking') {
      this.x += this.vx * dt * 0.06;
      this.y += this.vy * dt * 0.06;

      const topbarH = 48;
      const tabbarH = 64;
      const margin = 30;
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - tabbarH - 80;
      const minY = topbarH + margin;

      if (this.x < margin) { this.x = margin; this.vx = Math.abs(this.vx); this.facingLeft = false; }
      if (this.x > maxX) { this.x = maxX; this.vx = -Math.abs(this.vx); this.facingLeft = true; }
      if (this.y < minY) { this.y = minY; this.vy = Math.abs(this.vy); }
      if (this.y > maxY) { this.y = maxY; this.vy = -Math.abs(this.vy); }

      this.el.querySelector('.villager-sprite').style.transform = this.facingLeft ? 'scaleX(-1)' : 'scaleX(1)';
    }

    this.render();
  }

  render() {
    this.el.style.left = this.x + 'px';
    this.el.style.top = this.y + 'px';
    this.el.style.zIndex = Math.floor(this.y) + 2;
  }

  bounce() {
    this.el.classList.add('bounce');
    setTimeout(() => this.el.classList.remove('bounce'), 300);
  }

  updateMood(mood) {
    this.data.mood = mood;
    const color = getMoodColor(mood);
    this.el.querySelector('.mood-ring').style.setProperty('--mood-color', color);
  }

  updateActivity(activity) {
    this.data.activity = activity;
    this.el.querySelector('.activity-bubble').textContent = getActivityIcon(activity);
  }

  updatePulse(pulse) {
    this.data.pulse = pulse;
    this.el.classList.remove('pulse-active', 'pulse-away', 'pulse-dnd', 'pulse-sleeping');
    this.el.classList.add('pulse-' + pulse);

    // Update activity bubble for special states
    if (pulse === 'dnd') {
      this.el.querySelector('.activity-bubble').textContent = '⛔';
    } else if (pulse === 'sleeping') {
      this.el.querySelector('.activity-bubble').textContent = '💤';
    } else {
      this.el.querySelector('.activity-bubble').textContent = getActivityIcon(this.data.activity);
    }
  }
}
