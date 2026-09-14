// ==========================================
// CONFIGURATION & DATABASE URL
// ==========================================
// GANTI URL INI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA!
const GOOGLE_SHEETS_WEB_APP_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 16;
let TILE_SIZE = 20;
const SPEED = 160;

let snake = [];
let food = { x: 0, y: 0 };
let obstacles = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let isJumping = false;
let jumpProgress = 0;
let gameInterval = null;
let isGameOver = false;

let currentUser = "";
let currentPass = "";

// Audio Effects (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'eat') {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'jump') {
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'over') {
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    }
}

// Adjust Responsive Canvas Size
function resizeCanvas() {
    const minSize = Math.min(window.innerWidth - 30, window.innerHeight - 200);
    canvas.width = Math.max(minSize, 280);
    canvas.height = canvas.width;
    TILE_SIZE = canvas.width / GRID_SIZE;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==========================================
// GAME ENGINE 2D
// ==========================================
function resetGame() {
    snake = [
        { x: 5, y: 5, isJumping: false },
        { x: 4, y: 5, isJumping: false },
        { x: 3, y: 5, isJumping: false }
    ];
    obstacles = [];
    score = 0;
    document.getElementById('score').innerText = score;
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    isJumping = false;
    isGameOver = false;

    spawnFood();
    spawnObstacles();
}

function spawnFood() {
    let x, y, collision;
    do {
        collision = false;
        x = Math.floor(Math.random() * GRID_SIZE);
        y = Math.floor(Math.random() * GRID_SIZE);
        snake.forEach(s => { if (s.x === x && s.y === y) collision = true; });
        obstacles.forEach(o => { if (o.x === x && o.y === y) collision = true; });
    } while (collision);

    food = { x, y };
}

function spawnObstacles() {
    for (let i = 0; i < 4; i++) {
        let x, y, collision;
        do {
            collision = false;
            x = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
            y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
            snake.forEach(s => { if (s.x === x && s.y === y) collision = true; });
        } while (collision);
        obstacles.push({ x, y });
    }
}

function jump() {
    if (!isJumping && !isGameOver) {
        isJumping = true;
        jumpProgress = 0;
        playSound('jump');
    }
}

function gameLoop() {
    if (isGameOver) return;
    direction = { ...nextDirection };

    let newX = snake[0].x + direction.x;
    let newY = snake[0].y + direction.y;
    let headJumping = false;

    if (isJumping) {
        jumpProgress++;
        if (jumpProgress === 1) headJumping = true;
        else if (jumpProgress >= 2) {
            headJumping = false;
            isJumping = false;
        }
    }

    // Wall Collision
    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
        return gameOver("Nabrak Dinding!");
    }

    // Obstacle Collision (Hanya jika tidak sedang melompat)
    if (!headJumping) {
        for (let obs of obstacles) {
            if (obs.x === newX && obs.y === newY) return gameOver("Nabrak Rintangan!");
        }
    }

    // Self Collision (Hanya jika tidak melompat melangkahi tubuh)
    if (!headJumping) {
        for (let i = 1; i < snake.length; i++) {
            if (snake[i].x === newX && snake[i].y === newY && !snake[i].isJumping) {
                return gameOver("Nabrak Ekor Sendiri!");
            }
        }
    }

    snake.unshift({ x: newX, y: newY, isJumping: headJumping });

    // Eat Food Check
    if (newX === food.x && newY === food.y && !headJumping) {
        score += 10;
        document.getElementById('score').innerText = score;
        playSound('eat');
        spawnFood();
    } else {
        snake.pop();
    }

    draw();
}

function draw() {
    // Clear Screen & Grid Ground
    ctx.fillStyle = "#16213e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#0f3460";
    for (let i = 0; i < GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * TILE_SIZE, 0); ctx.lineTo(i * TILE_SIZE, canvas.height);
        ctx.moveTo(0, i * TILE_SIZE); ctx.lineTo(canvas.width, i * TILE_SIZE);
        ctx.stroke();
    }

    // Draw Obstacles
    ctx.fillStyle = "#ffaa00";
    obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.arc((obs.x + 0.5) * TILE_SIZE, (obs.y + 0.5) * TILE_SIZE, TILE_SIZE / 2.5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Food
    ctx.fillStyle = "#ff0055";
    ctx.beginPath();
    ctx.arc((food.x + 0.5) * TILE_SIZE, (food.y + 0.5) * TILE_SIZE, TILE_SIZE / 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Draw Snake
    snake.forEach((seg, index) => {
        let size = TILE_SIZE * 0.8;
        let offset = (TILE_SIZE - size) / 2;

        if (seg.isJumping) {
            size *= 1.4; // Efek visual membesar saat melompat di 2D
            offset = (TILE_SIZE - size) / 2;
            ctx.fillStyle = "#ffffff";
        } else {
            ctx.fillStyle = index === 0 ? "#00ffcc" : "#0099ff";
        }

        ctx.fillRect(seg.x * TILE_SIZE + offset, seg.y * TILE_SIZE + offset, size, size);
    });
}

function gameOver(reason) {
    isGameOver = true;
    clearInterval(gameInterval);
    playSound('over');

    document.getElementById('go-desc').innerText = `${reason}\nSkor Akhir: ${score}`;
    document.getElementById('gameover-modal').classList.remove('hidden');

    sendScoreToGoogleSheets(currentUser, score);
}

// ==========================================
// AUTH & GOOGLE SHEETS
// ==========================================
function handleLogin() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();
    const statusDiv = document.getElementById('auth-status');

    if (!userInp || !passInp) {
        statusDiv.innerText = "Isi username dan password!";
        return;
    }

    statusDiv.style.color = "#00ffcc";
    statusDiv.innerText = "Memeriksa Akun...";

    fetch(GOOGLE_SHEETS_WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "login", username: userInp, password: passInp })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            currentUser = userInp;
            currentPass = passInp;
            document.getElementById('display-user').innerText = currentUser;
            document.getElementById('login-modal').classList.add('hidden');
            resetGame();
            gameInterval = setInterval(gameLoop, SPEED);
        } else {
            statusDiv.style.color = "#ff3366";
            statusDiv.innerText = data.message;
        }
    })
    .catch(() => {
        // Fallback jika offline/CORS
        currentUser = userInp;
        document.getElementById('display-user').innerText = currentUser;
        document.getElementById('login-modal').classList.add('hidden');
        resetGame();
        gameInterval = setInterval(gameLoop, SPEED);
    });
}

function sendScoreToGoogleSheets(username, score) {
    if (!GOOGLE_SHEETS_WEB_APP_URL || GOOGLE_SHEETS_WEB_APP_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) return;

    fetch(GOOGLE_SHEETS_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "save_score", username: username, skor: score })
    });
}

// ==========================================
// TOUCH & CONTROLS FOR MOBILE ANDROID
// ==========================================
function handleInput(dir) {
    if (dir === 'UP' && direction.y === 0) nextDirection = { x: 0, y: -1 };
    if (dir === 'DOWN' && direction.y === 0) nextDirection = { x: 0, y: 1 };
    if (dir === 'LEFT' && direction.x === 0) nextDirection = { x: -1, y: 0 };
    if (dir === 'RIGHT' && direction.x === 0) nextDirection = { x: 1, y: 0 };
}

// Keyboard Controls
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': handleInput('UP'); break;
        case 'ArrowDown': case 's': case 'S': handleInput('DOWN'); break;
        case 'ArrowLeft': case 'a': case 'A': handleInput('LEFT'); break;
        case 'ArrowRight': case 'd': case 'D': handleInput('RIGHT'); break;
        case ' ': jump(); break;
    }
});

// Touch Swipe Controls
let touchStartX = 0, touchStartY = 0;
window.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

window.addEventListener('touchend', (e) => {
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) {
            if (diffX > 0) handleInput('RIGHT');
            else handleInput('LEFT');
        }
    } else {
        if (Math.abs(diffY) > 30) {
            if (diffY > 0) handleInput('DOWN');
            else handleInput('UP');
        }
    }
}, false);

// D-Pad & Touch Event Listeners
document.getElementById('ctrl-up').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput('UP'); });
document.getElementById('ctrl-down').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput('DOWN'); });
document.getElementById('ctrl-left').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput('LEFT'); });
document.getElementById('ctrl-right').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput('RIGHT'); });
document.getElementById('ctrl-jump').addEventListener('touchstart', (e) => { e.preventDefault(); jump(); });
document.getElementById('ctrl-jump').addEventListener('click', () => jump());

document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('gameover-modal').classList.add('hidden');
    resetGame();
    gameInterval = setInterval(gameLoop, SPEED);
});
