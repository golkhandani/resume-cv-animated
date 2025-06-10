const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const savedTheme = localStorage.getItem('theme');
const style = getComputedStyle(document.body);

function hexToRgb(hex) {
    const parsed = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return parsed ? {
        r: parseInt(parsed[1], 16),
        g: parseInt(parsed[2], 16),
        b: parseInt(parsed[3], 16)
    } : null;
}

function applyTheme(theme) {
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
        this.secondayColor = style.getPropertyValue('--seconday-color').trim();
    },
    starColor: '',
    lineColor: '',
    glowColor: '',
    accentColor: '',
    secondayColor: '',

}
const observer = new MutationObserver(() => themeColors.update());
observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });


if (savedTheme) {
    applyTheme(savedTheme);
} else {
    applyTheme(prefersDarkScheme.matches ? 'dark' : 'light');
}
themeColors.update();

