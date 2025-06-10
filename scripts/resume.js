async function setResumeLink() {
    try {
        const res = await fetch('http://ip-api.com/json/');
        const data = await res.json();
        if (data.status === 'fail') throw new Error('IP lookup failed');
        const cr = data.region;
        const link = document.getElementById('cvDownload');
        if (cr === 'BC') link.href = '/assets/Reza Golkhandani - June-05-2025 - b1.pdf';
        else if (cr === 'AB') link.href = '/assets/Reza Golkhandani - June-05-2025 - a1.pdf';
        else if (cc === 'ON') link.href = '/assets/Reza Golkhandani - June-05-2025 - o1.pdf';
        else link.href = '/assets/Reza Golkhandani - June-05-2025 - o1.pdf';
    } catch (e) {
        console.warn(e.message);
    }
}

setResumeLink();