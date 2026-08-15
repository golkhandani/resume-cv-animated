/* Theme state. Runs before the other scripts so they can read live colours. */

const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function hexToRgb(hex) {
    const parsed = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return parsed ? {
        r: parseInt(parsed[1], 16),
        g: parseInt(parsed[2], 16),
        b: parseInt(parsed[3], 16)
    } : null;
}

function applyTheme(theme) {
    // <html> carries the page background, <body> is what the colour probe
    // reads — both need the attribute or the two can disagree.
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    try {
        localStorage.setItem('theme', theme);
    } catch (e) {
        /* private mode — theme just won't persist */
    }
}

const themeColors = {
    update() {
        const style = getComputedStyle(document.body);
        const read = name => style.getPropertyValue(name).trim();
        this.starColor = read('--star-color');
        this.lineColor = read('--line-color');
        this.glowColor = read('--glow-color');
        this.accentColor = read('--accent-color');
        this.secondaryColor = read('--secondary-color');
        this.alertColor = read('--alert-color');
    },
    starColor: '',
    lineColor: '',
    glowColor: '',
    accentColor: '',
    secondaryColor: '',
    alertColor: ''
};

// The inline bootstrap in <head> already picked a theme to avoid a flash of
// the wrong scheme; adopt it rather than deciding again.
let savedTheme = document.documentElement.getAttribute('data-theme');
if (!savedTheme) {
    try {
        savedTheme = localStorage.getItem('theme');
    } catch (e) {
        /* ignore */
    }
}

applyTheme(savedTheme || (prefersDarkScheme.matches ? 'dark' : 'light'));
themeColors.update();

new MutationObserver(() => themeColors.update())
    .observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.checked = document.body.getAttribute('data-theme') === 'light';
    toggle.addEventListener('change', () => {
        applyTheme(toggle.checked ? 'light' : 'dark');
    });
});
