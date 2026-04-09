/* ===== Confetti Module: Canvas-based pixel confetti burst ===== */

const Confetti = {
  burst(x, y) {
    // Default to center of screen
    if (x === undefined) x = window.innerWidth / 2;
    if (y === undefined) y = window.innerHeight / 2;

    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:3000;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const colors = ['#e8a735', '#5b8c3e', '#c0392b', '#4a7fb5', '#9b59b6', '#f1c40f', '#e67e22', '#2ecc71'];
    const particles = [];

    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4 - Math.random() * 3,
        size: 4 + Math.floor(Math.random() * 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
      });
    }

    const gravity = 0.15;
    const startTime = performance.now();
    const duration = 2500;

    function frame(now) {
      const elapsed = now - startTime;
      if (elapsed > duration) {
        canvas.remove();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  },
};
