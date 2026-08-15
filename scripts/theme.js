const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const savedTheme = localStorage.getItem('theme');

function hexToRgb(hex) {
    const parsed = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return parsed ? {
        r: parseInt(parsed[1], 16),
        g: parseInt(parsed[2], 16),
        b: parseInt(parsed[3], 16)
    } : null;
}

function applyTheme(theme) {
    // <html> is styled too, and its background is what fills the page beyond
    // body's box — so both elements need the attribute or the two disagree.
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}


themeToggle.addEventListener('click', () => {
    const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
});

const themeColors = {
    update() {
        const style = getComputedStyle(document.body);
        this.starColor = style.getPropertyValue('--star-color').trim();
        this.lineColor = style.getPropertyValue('--line-color').trim();
        this.glowColor = style.getPropertyValue('--glow-color').trim();
        this.accentColor = style.getPropertyValue('--accent-color').trim();
        this.secondaryColor = style.getPropertyValue('--secondary-color').trim();
        this.alertColor = style.getPropertyValue('--alert-color').trim();
    },
    starColor: '',
    lineColor: '',
    glowColor: '',
    accentColor: '',
    secondaryColor: '',
    alertColor: '',
}
const observer = new MutationObserver(() => themeColors.update());
observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });


if (savedTheme) {
    applyTheme(savedTheme);
} else {
    applyTheme(prefersDarkScheme.matches ? 'dark' : 'light');
}
themeColors.update();

// The header glitch clones read their text from data-text, so every page gets
// it wired up here instead of duplicating the attribute across 20+ files.
document.querySelectorAll('header h1 a').forEach(el => {
    el.setAttribute('data-text', el.textContent.trim());
});
