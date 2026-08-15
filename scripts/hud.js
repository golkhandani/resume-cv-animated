/* HUD chrome: boot sequence, clock, glitch wiring, scroll reveal. */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Glitch clones read their text from data-text ───────────── */
function wireGlitch() {
    document.querySelectorAll('.glitch').forEach(el => {
        if (!el.hasAttribute('data-text')) {
            el.setAttribute('data-text', el.textContent.trim());
        }
    });
}

/* ── Live clock in the top bar ──────────────────────────────── */
function startClock() {
    const el = document.querySelector('[data-clock]');
    if (!el) return;
    const tick = () => {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    tick();
    setInterval(tick, 1000);
}

/* ── Boot overlay: once per tab, and never when motion is reduced ── */
function runBoot() {
    const boot = document.querySelector('.boot');
    if (!boot) return;

    let seen = false;
    try {
        seen = sessionStorage.getItem('booted') === '1';
    } catch (e) {
        /* ignore */
    }

    const finish = () => {
        boot.classList.add('is-done');
        try {
            sessionStorage.setItem('booted', '1');
        } catch (e) {
            /* ignore */
        }
        setTimeout(() => boot.setAttribute('hidden', ''), 400);
    };

    if (seen || reduceMotion) {
        boot.setAttribute('hidden', '');
        return;
    }

    const lines = [...boot.querySelectorAll('.boot__line')];
    lines.forEach((line, i) => {
        setTimeout(() => line.classList.add('is-on'), i * 170);
    });
    setTimeout(finish, lines.length * 170 + 420);
    boot.addEventListener('click', finish);
    document.addEventListener('keydown', finish, { once: true });
}

/* ── Reveal panels as they scroll in ────────────────────────── */
function wireReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-in'));
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px' });

    items.forEach(el => io.observe(el));
}

/* ── Wide tables get their own scroll container ─────────────── */
function wrapTables() {
    document.querySelectorAll('.panel__body > table').forEach(table => {
        const box = document.createElement('div');
        box.className = 'table-scroll';
        table.parentNode.insertBefore(box, table);
        box.appendChild(table);
    });
}

/* ── Mark the current page in the rail nav ──────────────────── */
function markCurrent() {
    const here = location.pathname.replace(/index\.html$/, '');
    document.querySelectorAll('.rail__nav a').forEach(a => {
        const target = new URL(a.getAttribute('href'), location.origin)
            .pathname.replace(/index\.html$/, '');
        if (target === here) a.setAttribute('aria-current', 'page');
    });
}

wireGlitch();
startClock();
runBoot();
wireReveal();
wrapTables();
markCurrent();
