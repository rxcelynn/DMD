let timeLeft = 25 * 60;
let timer = null;
let running = false;
let currentMode = "work";
let musicPlaying = false;

const display = document.getElementById("timeDisplay");
const sessionLabel = document.getElementById("sessionLabel");
const alarm = document.getElementById("alarmSound");
const musicSelect = document.getElementById("bgMusicSelect");

function getBg() {
    return (window.getGlobalAudio && window.getGlobalAudio()) || null;
}

// Restore saved state: endTime, paused, remaining, selected music, and playback
function initState() {
    // restore selected music dropdown
    const sel = localStorage.getItem('selectedMusic');
    if (sel) musicSelect.value = sel;

    // If an endTime exists and is in the future, resume timer
    if (localStorage.getItem("endTime")) {
        let savedEnd = parseInt(localStorage.getItem("endTime"), 10);
        let now = Date.now();
        if (savedEnd > now) {
            running = true;
            timeLeft = Math.floor((savedEnd - now) / 1000);

            // Restore music playback if it was playing
            if (localStorage.getItem("musicPlaying") === "true") {
                musicPlaying = true;
                applySelectedMusic();
                const player = getBg();
                if (player) {
                    player.play().catch(() => console.log('Autoplay blocked'));
                }
            }

            resumeTimer(savedEnd);
        }
        updateDisplay();
        return;
    }

    // If paused state exists, restore remaining time but do not auto-start
    if (localStorage.getItem('paused') === 'true' && localStorage.getItem('remaining')) {
        timeLeft = parseInt(localStorage.getItem('remaining'), 10) || timeLeft;
        updateDisplay();
        // ensure music reflects selected but not auto-play
        applySelectedMusic();
    }
}

function updateDisplay() {
    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;
    display.innerText = `${m}:${s.toString().padStart(2, "0")}`;
}

function applySelectedMusic() {
    const file = musicSelect.value;
    localStorage.setItem('selectedMusic', file);
    const player = getBg();
    if (player) {
        // if player is the global one created by audioPlayer.js, update src
        if (player.id === 'globalBgMusic') {
            if (!player.src || player.src.indexOf(file) === -1) player.src = '../../../sounds/' + file;
            // restore last saved time
            const t = parseFloat(localStorage.getItem('musicCurrentTime')) || 0;
            try { player.currentTime = t; } catch (e) {}
        } else {
            player.src = '../../../sounds/' + file;
        }
    }
}

function setMode(mode, mins) {
    currentMode = mode;
    timeLeft = mins * 60;

    clearInterval(timer);
    running = false;
    localStorage.removeItem("endTime");

    sessionLabel.textContent =
        mode === "work" ? "Focus Time" :
        mode === "short" ? "Short Break" :
        "Long Break";

    document.querySelectorAll(".mode-btn").forEach(btn => btn.classList.remove("active"));
    if (event && event.target) event.target.classList.add("active");

    const player = getBg();
    if (player) {
        player.pause();
        player.currentTime = 0;
        localStorage.setItem('musicCurrentTime', 0);
    }

    updateDisplay();
    updateStartButton();
}

function updateStartButton() {
    const btn = document.getElementById('startBtn');
    if (running) {
        btn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
    } else {
        btn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
    }
}

document.getElementById("startBtn").onclick = () => {
    // Toggle start/pause
    if (running) {
        // Pause
        running = false;
        clearInterval(timer);
        localStorage.setItem('paused', 'true');
        localStorage.setItem('remaining', timeLeft);
        musicPlaying = false;
        localStorage.setItem('musicPlaying', 'false');
        // Remove endTime so other pages don't auto-resume the timer
        localStorage.removeItem('endTime');

        // Pause global audio (host or in-page)
        if (window.pauseGlobalAudio) {
            try { window.pauseGlobalAudio(); } catch (e) {}
        } else {
            const player = getBg();
            if (player) player.pause();
        }
    } else {
        // Start or resume
        running = true;
        localStorage.removeItem('paused');
        localStorage.removeItem('remaining');

        const endTime = Date.now() + timeLeft * 1000;
        localStorage.setItem('endTime', endTime);
        musicPlaying = true;
        localStorage.setItem('musicPlaying', 'true');
        applySelectedMusic();
        
        // Always try to open/use persistent host to prevent music cutout on navigation
        if (window.openAudioHost) {
            window.openAudioHost({ file: musicSelect.value, time: parseFloat(localStorage.getItem('musicCurrentTime')) || 0, play: true });
        }
        
        // Also try to play via in-page global player as backup
        if (window.playGlobalAudio) {
            try { window.playGlobalAudio(musicSelect.value, parseFloat(localStorage.getItem('musicCurrentTime')) || 0); } catch (e) {}
        } else {
            const player = getBg();
            if (player) {
                const pos = parseFloat(localStorage.getItem('musicCurrentTime')) || 0;
                try { player.currentTime = pos; } catch (e) {}
                player.play().catch(() => console.log('Autoplay blocked'));
            }
        }

        resumeTimer(endTime);
    }
    updateStartButton();
};

// Save music selection change and play immediately without waiting for page nav
musicSelect.addEventListener('change', function () {
    const file = musicSelect.value;
    localStorage.setItem('selectedMusic', file);
    
    // Update in-page player if exists
    const player = getBg();
    if (player) {
        if (!player.src || player.src.indexOf(file) === -1) {
            player.src = '../../../sounds/' + file;
        }
        const t = parseFloat(localStorage.getItem('musicCurrentTime')) || 0;
        try { player.currentTime = t; } catch (e) {}
    }
    
    // If music is playing, play new selection via host or in-page immediately
    if (musicPlaying) {
        if (window.playGlobalAudio) {
            window.playGlobalAudio(file, parseFloat(localStorage.getItem('musicCurrentTime')) || 0);
        } else if (player) {
            player.play().catch(() => {});
        }
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }
});

document.getElementById("resetBtn").onclick = () => {
    running = false;
    musicPlaying = false;
    clearInterval(timer);
    localStorage.removeItem("endTime");
    localStorage.removeItem("musicPlaying");
    localStorage.removeItem('paused');
    localStorage.removeItem('remaining');
    localStorage.removeItem('musicCurrentTime');

    const player = getBg();
    if (player) {
        player.pause();
        try { player.currentTime = 0; } catch (e) {}
    }

    if (currentMode === "work") timeLeft = 25 * 60;
    if (currentMode === "short") timeLeft = 5 * 60;
    if (currentMode === "long") timeLeft = 15 * 60;

    updateDisplay();
    updateStartButton();
};

function resumeTimer(endTime) {
    clearInterval(timer);
    timer = setInterval(() => {
        let now = Date.now();
        timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));

        updateDisplay();

        if (timeLeft <= 0) {
            clearInterval(timer);
            running = false;

            localStorage.removeItem("endTime");

            const player = getBg();
            if (player) {
                player.pause();
                try { player.currentTime = 0; } catch (e) {}
            }

            alarm.play();
            updateStartButton();
        }
    }, 250);
}

// Periodically save music time so playback can continue across navigations
setInterval(() => {
    const player = getBg();
    try {
        if (player && !player.paused) {
            localStorage.setItem('musicCurrentTime', player.currentTime);
        }
    } catch (e) { }
}, 1000);

// Initialize
initState();
updateStartButton();

