/* Ambient net behind the HUD: drifting nodes, proximity links, a mouse
   attractor, and a click shockwave. Deliberately sparse — there is a lot of
   interface on top of it now. */

(function () {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    const mouse = { x: -9999, y: -9999, active: false };

    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const nodeCount = () => {
        const area = width * height;
        return Math.max(18, Math.min(56, Math.round(area / 26000)));
    };

    let nodes = [];
    let pulses = [];

    function seed() {
        const count = nodeCount();
        nodes = Array.from({ length: count }, () => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.08 + Math.random() * 0.22;
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                r: 1 + Math.random() * 1.8,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            };
        });
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        seed();
    }

    // Chamfered square — the same corner language as the panels
    function drawNode(x, y, r, color) {
        const cut = r * 0.5;
        ctx.beginPath();
        ctx.moveTo(x - r + cut, y - r);
        ctx.lineTo(x + r, y - r);
        ctx.lineTo(x + r, y + r - cut);
        ctx.lineTo(x + r - cut, y + r);
        ctx.lineTo(x - r, y + r);
        ctx.lineTo(x - r, y - r + cut);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    function step() {
        ctx.clearRect(0, 0, width, height);

        const linkDist = 140;
        const pullDist = 170;

        for (const n of nodes) {
            if (mouse.active) {
                const dx = mouse.x - n.x;
                const dy = mouse.y - n.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 1 && dist < pullDist) {
                    const force = (1 - dist / pullDist) * 0.35;
                    n.x += (dx / dist) * force;
                    n.y += (dy / dist) * force;
                }
            }

            n.x += n.vx;
            n.y += n.vy;

            if (n.x < -20) n.x = width + 20;
            if (n.x > width + 20) n.x = -20;
            if (n.y < -20) n.y = height + 20;
            if (n.y > height + 20) n.y = -20;
        }

        // Links
        ctx.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist > linkDist) continue;

                const midDist = mouse.active
                    ? Math.hypot(mouse.x - (a.x + b.x) / 2, mouse.y - (a.y + b.y) / 2)
                    : Infinity;
                const hot = midDist < 90;

                ctx.strokeStyle = hot ? themeColors.glowColor : themeColors.lineColor;
                ctx.globalAlpha = hot ? 0.5 : 1 - dist / linkDist;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        // Nodes, brighter near the cursor
        for (const n of nodes) {
            const near = mouse.active && Math.hypot(mouse.x - n.x, mouse.y - n.y) < 110;
            drawNode(n.x, n.y, n.r + (near ? 1 : 0), near ? themeColors.accentColor : themeColors.starColor);
        }

        // Click shockwaves
        const now = performance.now();
        pulses = pulses.filter(p => now - p.start < p.life);
        for (const p of pulses) {
            const t = (now - p.start) / p.life;
            const radius = p.max * t;
            ctx.strokeStyle = themeColors.accentColor;
            ctx.globalAlpha = (1 - t) * 0.7;
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
            ctx.globalAlpha = (1 - t) * 0.35;
            ctx.strokeStyle = themeColors.alertColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        requestAnimationFrame(step);
    }

    function drawStatic() {
        ctx.clearRect(0, 0, width, height);
        for (const n of nodes) drawNode(n.x, n.y, n.r, themeColors.starColor);
    }

    window.addEventListener('resize', resize);

    if (!isCoarse) {
        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.active = true;
        });
        window.addEventListener('mouseout', () => { mouse.active = false; });

        // Light up whichever action button the cursor is closest to
        const targets = [...document.querySelectorAll('.act, .chip')];
        let lit = null;
        if (targets.length) {
            window.addEventListener('mousemove', e => {
                let best = null;
                let bestDist = Infinity;
                for (const el of targets) {
                    const rect = el.getBoundingClientRect();
                    const d = Math.hypot(
                        rect.left + rect.width / 2 - e.clientX,
                        rect.top + rect.height / 2 - e.clientY
                    );
                    if (d < bestDist) { bestDist = d; best = el; }
                }
                if (lit && lit !== best) lit.classList.remove('glow');
                if (best && bestDist < 90) {
                    best.classList.add('glow');
                    lit = best;
                } else if (lit) {
                    lit.classList.remove('glow');
                    lit = null;
                }
            });
        }

        window.addEventListener('click', e => {
            pulses.push({ x: e.clientX, y: e.clientY, start: performance.now(), life: 700, max: 160 });
        });
    }

    resize();
    if (reduceMotion) drawStatic();
    else step();
})();
