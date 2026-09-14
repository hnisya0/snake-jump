// URL Web App Google Sheets Anda
const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyJXgkEialy7a9N59yysT54kICbmx7vkHw32tsPdtvIJT6wSbdNlXx0T6F0yuSJpp5y/exec";

// Fungsi Fetch Leaderboard dari Google Sheets
function loadLeaderboard() {
    const listContainer = document.getElementById('leaderboard-list');
    listContainer.innerHTML = "<li>Memuat data...</li>";

    fetch(GOOGLE_SHEETS_WEB_APP_URL)
        .then(res => res.json())
        .then(data => {
            listContainer.innerHTML = "";
            if (!data || data.length === 0) {
                listContainer.innerHTML = "<li>Belum ada skor tersimpan.</li>";
                return;
            }
            data.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerText = `${index + 1}. ${item.username} - ${item.skor} Poin`;
                listContainer.appendChild(li);
            });
        })
        .catch(err => {
            console.error("Error fetching leaderboard:", err);
            listContainer.innerHTML = "<li>Gagal memuat leaderboard.</li>";
        });
}

// Event Listener Tombol Leaderboard
document.getElementById('leaderboard-btn').addEventListener('click', () => {
    document.getElementById('leaderboard-modal').classList.remove('hidden');
    loadLeaderboard();
});

document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
    document.getElementById('leaderboard-modal').classList.add('hidden');
});
