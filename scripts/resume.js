/* Point the CV download at the regional variant of the resume. */

const RESUMES = {
    BC: '/assets/Reza Golkhandani - June-05-2025 - b1.pdf',
    AB: '/assets/Reza Golkhandani - June-05-2025 - a1.pdf',
    ON: '/assets/Reza Golkhandani - June-05-2025 - o1.pdf'
};
const DEFAULT_RESUME = '/assets/Reza Golkhandani - June-05-2025 - o1.pdf';

async function setResumeLink() {
    const link = document.getElementById('cvDownload');
    if (!link) return;
    try {
        const res = await fetch('https://ip-api.com/json/');
        const data = await res.json();
        if (data.status === 'fail') throw new Error('IP lookup failed');
        link.href = RESUMES[data.region] || DEFAULT_RESUME;
    } catch (e) {
        console.warn('Resume region lookup failed:', e.message);
    }
}

setResumeLink();
