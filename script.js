// GANTI URL DI BAWAH DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJXgkEialy7a9N59yysT54kICbmx7vkHw32tsPdtvIJT6wSbdNlXx0T6F0yuSJpp5y/exec";

const board = document.getElementById("board");
const rollBtn = document.getElementById("roll-btn");
const diceDisplay = document.getElementById("dice");
const currentTurnDisplay = document.getElementById("current-turn");
const gameStatusDisplay = document.getElementById("game-status");

// Konfigurasi Ular & Tangga (Posisi Awal -> Posisi Akhir)
const snakes = { 99: 54, 70: 55, 52: 42, 25: 2 };
const ladders = { 6: 25, 11: 40, 60: 85, 46: 90 };

let positions = [1, 1]; // Posisi Pemain 1 dan Pemain 2
let turn = 0; // 0 = Pemain 1, 1 = Pemain 2
let turnsCount = [0, 0]; // Menghitung total kocokan per pemain

// Generate Board (100 Ke 1 dengan pola Boustrophedon / Zig-zag)
function createBoard() {
    board.innerHTML = "";
    for (let row = 9; row >= 0; row--) {
        for (let col = 0; col < 10; col++) {
            let cellNum;
            if (row % 2 === 1) {
                cellNum = row * 10 + (10 - col);
            } else {
                cellNum = row * 10 + col + 1;
            }

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

// Fungsi Lempar Dadu
rollBtn.addEventListener("click", () => {
    rollBtn.disabled = true;
    let rolls = 0;
    
    // Animasi Dadu
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
        gameStatusDisplay.innerText = `Pemain ${turn + 1} butuh angka tepat untuk selesai!`;
        switchTurn();
        return;
    }

    positions[turn] = newPos;

    // Cek Ular atau Tangga
    if (snakes[newPos]) {
        gameStatusDisplay.innerText = `Aww! Pemain ${turn + 1} digigit ular ke ${snakes[newPos]}`;
        positions[turn] = snakes[newPos];
    } else if (ladders[newPos]) {
        gameStatusDisplay.innerText = `Hore! Pemain ${turn + 1} naik tangga ke ${ladders[newPos]}`;
        positions[turn] = ladders[newPos];
    } else {
        gameStatusDisplay.innerText = `Pemain ${turn + 1} maju ke petak ${newPos}`;
    }

    updateBoardUI();

    // Cek Kemenangan
    if (positions[turn] === 100) {
        gameStatusDisplay.innerText = `🏆 PEMAIN ${turn + 1} MENANG!`;
        saveScoreToGoogleSheets(`Pemain ${turn + 1}`, turnsCount[turn]);
        return;
    }

    switchTurn();
}

function switchTurn() {
    turn = turn === 0 ? 1 : 0;
    currentTurnDisplay.innerText = `Pemain ${turn + 1}`;
    currentTurnDisplay.style.color = turn === 0 ? "#E91E63" : "#2196F3";
    rollBtn.disabled = false;
}

// Kirim Data Skor ke Google Sheets
function saveScoreToGoogleSheets(playerName, totalTurns) {
    if (GOOGLE_SCRIPT_URL === "URL_WEB_APP_GOOGLE_SHEETS_ANDA") {
        console.warn("URL Google Apps Script belum diatur.");
        return;
    }

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            playerName: playerName,
            score: `Menang dalam ${totalTurns} kocokan`
        })
    })
    .then(() => {
        gameStatusDisplay.innerText += " (Skor tersimpan di Google Sheets!)";
    })
    .catch(error => {
        console.error("Gagal menyimpan data:", error);
    });
}

// Inisialisasi Game
createBoard();
