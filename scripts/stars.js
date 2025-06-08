const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
let mouse = { x: width / 2, y: height / 2 };

let stars = [
    ...Array.from({ length: 150 }, () => [
        Math.random() * width,
        Math.random() * height,
        Math.random() * 2 + 1,
        Math.cos(Math.random() * 2 * Math.PI),
        Math.sin(Math.random() * 2 * Math.PI)
    ]),
    ...Array.from({ length: 50 }, () => {
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        if (edge === 0) {
            x = Math.random() * width;
            y = -10;
        } else if (edge === 1) {
            x = width + 10;
            y = Math.random() * height;
        } else if (edge === 2) {
            x = Math.random() * width;
            y = height + 10;
        } else {
            x = -10;
            y = Math.random() * height;
        }
        const r = Math.random() * 2 + 1;
        const angle = Math.random() * 2 * Math.PI;
        return [x, y, r, Math.cos(angle), Math.sin(angle)];
    })
];

const pointerTargets = [...document.querySelectorAll('.btn-download, .links a, .skills span')];

const hoverTimers = new Array(stars.length).fill(0);
const explosionTimers = new Array(stars.length).fill(null);
const releasedGravitation = new Set();
let explosions = [];
let externalNodes = [];
let closestEl = null;

function updateExternalNodes() {
    externalNodes = [...document.querySelectorAll('.btn-download, .links a, .skills span')].map(el => {
        const rect = el.getBoundingClientRect();
        return [rect.left + rect.width / 2, rect.top + rect.height / 2];
    });
}

function triggerExplosion(x, y) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 2 + 1;
        explosions.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: 3 + Math.random() * 2,
            alpha: 1,
            startTime: performance.now(),
            life: 100,
            maxLife: 500 // in ms
        });
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = themeColors.starColor;
    stars.forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
    });

    stars.forEach(([x, y, r], i) => {
        const dx = mouse.x - x;
        const dy = mouse.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;

        if (releasedGravitation.has(i)) {
            hoverTimers[i] = 0;
            return;
        }

        if (dist < 40) {
            hoverTimers[i] += 1;
            if (explosionTimers[i]) {
                clearTimeout(explosionTimers[i]);
                explosionTimers[i] = null;
            }
            if (hoverTimers[i] > 30) {
                ctx.beginPath();
                ctx.arc(x, y, r * Math.min(10, hoverTimers[i] / 5), 0, 2 * Math.PI);
                ctx.fillStyle = themeColors.starColor;
                ctx.fill();
            }
        } else {
            if (hoverTimers[i] > 30 && !explosionTimers[i]) {
                explosionTimers[i] = setTimeout(() => {
                    explosionTimers[i] = null;
                }, 1000);
            }
            hoverTimers[i] = 0;
        }
    });

    for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
            const [x1, y1] = stars[i];
            const [x2, y2] = stars[j];
            const dist = Math.hypot(x1 - x2, y1 - y2);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const mouseDist = Math.hypot(mouse.x - mx, mouse.y - my);
            const glow = mouseDist < 40;
            if (dist < 120) {
                ctx.strokeStyle = glow ? themeColors.glowColor : themeColors.lineColor;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    }

    stars = stars.map(([x, y, r, vx, vy]) => {
        const dx = mouse.x - x;
        const dy = mouse.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const force = Math.min(100 / dist, 2);

        x += dx / dist * force;
        y += dy / dist * force;

        x += vx * r * 0.5;
        y += vy * r * 0.5;

        if (x < -10) x = width + 10;
        if (x > width + 10) x = -10;
        if (y < -10) y = height + 10;
        if (y > height + 10) y = -10;

        return [x, y, r, vx, vy];
    });

    const now = performance.now();
    explosions = explosions.filter(p => now - p.startTime < p.maxLife);
    explosions.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        const progress = (now - p.startTime) / p.maxLife;
        p.alpha = 1 - progress;
        const radius = p.r * (1 - progress);

        const { r, g, b } = hexToRgb(themeColors.accentColor) || { r: 255, g: 200, b: 100 };
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
        ctx.fill();
    });

    requestAnimationFrame(animate);
}

window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    let minDist = Infinity;
    let nearest = null;
    pointerTargets.forEach(el => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(cx - mouse.x, cy - mouse.y);
        if (dist < minDist) {
            minDist = dist;
            nearest = el;
        }
    });

    if (closestEl && closestEl !== nearest) closestEl.classList.remove('glow');
    if (nearest && minDist < 100) {
        nearest.classList.add('glow');
        closestEl = nearest;
    } else if (closestEl) {
        closestEl.classList.remove('glow');
        closestEl = null;
    }
});

window.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const radius = 1000;
    const nearbyStars = stars
        .map(([x, y], i) => ({ x, y, i, dist: Math.hypot(x - clickX, y - clickY) }))
        .filter(star => star.dist < radius)
        .sort((a, b) => a.dist - b.dist);

    nearbyStars.forEach((star, idx) => {
        setTimeout(() => triggerExplosion(star.x, star.y), idx * 20);
    });

    const releaseDelay = nearbyStars.length * 10 + 200;
    const releaseDuration = 1000;
    const stepDelay = releaseDuration / nearbyStars.length;

    nearbyStars.forEach(({ i }, index) => {
        const delay = releaseDelay + index * stepDelay;
        setTimeout(() => {
            releasedGravitation.add(i);
            hoverTimers[i] = 0;
        }, delay);
        // allow glow again
        setTimeout(() => {
            releasedGravitation.delete(i);
        }, delay + 100);
    });
});

window.addEventListener('resize', () => {
    updateExternalNodes();
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

updateExternalNodes();
animate();
