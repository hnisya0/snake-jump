// GANTI URL DI BAWAH DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJXgkEialy7a9N59yysT54kICbmx7vkHw32tsPdtvIJT6wSbdNlXx0T6F0yuSJpp5y/exec";

// Element Referensi
const loginScreen = document.getElementById("login-screen");
const gameScreen = document.getElementById("game-screen");
const loginForm = document.getElementById("login-form");

const board = document.getElementById("board");
const rollBtn = document.getElementById("roll-btn");
const diceDisplay = document.getElementById("dice");
const currentTurnDisplay = document.getElementById("current-turn");
const gameStatusDisplay = document.getElementById("game-status");

// Data Pemain
let players = [
    { username: "", password: "", color: "#E91E63" },
    { username: "", password: "", color: "#2196F3" }
];

const snakes = { 99: 54, 70: 55, 52: 42, 25: 2 };
const ladders = { 6: 25, 11: 40, 60: 85, 46: 90 };

let positions = [1, 1];
let turn = 0; // 0 = Player 1, 1 = Player 2
let turnsCount = [0, 0];

// Handle Submit Form Login
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    players[0].username = document.getElementById("p1-username").value;
    players[0].password = document.getElementById("p1-password").value;
    players[1].username = document.getElementById("p2-username").value;
    players[1].password = document.getElementById("p2-password").value;

    loginScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    initGame();
});

function initGame() {
    createBoard();
    updateTurnDisplay();
}

function createBoard() {
    board.innerHTML = "";
    for (let row = 9; row >= 0; row--) {
        for (let col = 0; col < 10; col++) {
            let cellNum = (row % 2 === 1) ? (row * 10 + (10 - col)) : (row * 10 + col + 1);

            const cell = document.createElement("div");
            cell.className = "cell";
            cell.id = `cell-${cellNum}`;
            cell.innerText = cellNum;

            if (snakes[cellNum]) cell.classList.add("snake-head");
            if (ladders[cellNum]) cell.classList.add("ladder-bottom");

            board.appendChild(cell);
        }
    }
    updateBoardUI();
}

function updateBoardUI() {
    document.querySelectorAll(".p1-token, .p2-token").forEach(e => e.remove());

    const cell1 = document.getElementById(`cell-${positions[0]}`);
    const cell2 = document.getElementById(`cell-${positions[1]}`);

    if (cell1) {
        const p1 = document.createElement("div");
        p1.className = "p1-token";
        cell1.appendChild(p1);
    }
    if (cell2) {
        const p2 = document.createElement("div");
        p2.className = "p2-token";
        cell2.appendChild(p2);
    }
}

// Roll Dadu
rollBtn.addEventListener("click", () => {
    rollBtn.disabled = true;
    let rolls = 0;
    
    const interval = setInterval(() => {
        diceDisplay.innerText = Math.floor(Math.random() * 6) + 1;
        rolls++;
        if (rolls > 10) {
            clearInterval(interval);
            const diceValue = Math.floor(Math.random() * 6) + 1;
            diceDisplay.innerText = diceValue;
            movePlayer(diceValue);
        }
    }, 50);
});

function movePlayer(diceValue) {
    turnsCount[turn]++;
    let newPos = positions[turn] + diceValue;

    if (newPos > 100) {
        gameStatusDisplay.innerText = `${players[turn].username} butuh angka tepat!`;
        switchTurn();
        return;
    }

    positions[turn] = newPos;

    if (snakes[newPos]) {
        gameStatusDisplay.innerText = `🐍 Ouch! ${players[turn].username} turun ke ${snakes[newPos]}`;
        positions[turn] = snakes[newPos];
    } else if (ladders[newPos]) {
        gameStatusDisplay.innerText = `🪜 Mantap! ${players[turn].username} naik ke ${ladders[newPos]}`;
        positions[turn] = ladders[newPos];
    } else {
        gameStatusDisplay.innerText = `${players[turn].username} maju ke petak ${newPos}`;
    }

    updateBoardUI();

    // Cek Kemenangan
    if (positions[turn] === 100) {
        gameStatusDisplay.innerText = `🏆 ${players[turn].username} MENANG!`;
        saveScoreToGoogleSheets(players[turn].username, turnsCount[turn]);
        return;
    }

    switchTurn();
}

function updateTurnDisplay() {
    currentTurnDisplay.innerText = players[turn].username;
    currentTurnDisplay.style.color = players[turn].color;
}

function switchTurn() {
    turn = turn === 0 ? 1 : 0;
    updateTurnDisplay();
    rollBtn.disabled = false;
}

// Kirim Data Rekam ke Google Sheets
function saveScoreToGoogleSheets(winnerName, totalTurns) {
    if (GOOGLE_SCRIPT_URL === "URL_WEB_APP_GOOGLE_SHEETS_ANDA") {
        console.warn("URL Google Apps Script belum diisi.");
        return;
    }

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            p1Username: players[0].username,
            p2Username: players[1].username,
            winner: winnerName,
            totalTurns: totalTurns
        })
    })
    .then(() => {
        gameStatusDisplay.innerText += " (Skor berhasil direkam di Google Sheets!)";
    })
    .catch(error => {
        console.error("Gagal mengirim data:", error);
    });
}
