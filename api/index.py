from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
import yt_dlp

# Для Vercel имя переменной строго должно быть app
app = FastAPI()

HTML_INTERFACE = """
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spotify Clone for Friends</title>
    <style>
        :root {
            --bg-base: #121212;
            --bg-surface: #181818;
            --bg-card: #242424;
            --primary: #1DB954;
            --text-main: #FFFFFF;
            --text-muted: #A7A7A7;
        }
        body { font-family: Arial, sans-serif; background-color: var(--bg-base); color: var(--text-main); margin: 0; padding: 20px; padding-bottom: 120px; }
        .container { max-width: 800px; margin: 0 auto; text-align: left; }
        .header-section { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; }
        h1 { color: var(--text-main); font-size: 28px; font-weight: 800; margin: 0; }
        h1 span { color: var(--primary); }
        .search-box { display: flex; background: #2A2A2A; border-radius: 50px; padding: 6px 12px; width: 100%; max-width: 400px; border: 1px solid transparent; }
        .search-box:focus-within { border-color: var(--primary); background: #333; }
        input { flex: 1; padding: 8px; border: none; background: transparent; outline: none; font-size: 15px; color: white; }
        button { padding: 8px 24px; border: none; background-color: var(--primary); color: white; border-radius: 50px; cursor: pointer; font-size: 15px; font-weight: bold; }
        h2 { font-size: 20px; margin-top: 30px; margin-bottom: 15px; }
        .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
        .track-card { background: var(--bg-surface); padding: 16px; border-radius: 8px; cursor: pointer; transition: 0.2s; position: relative; }
        .track-card:hover { background: var(--bg-card); transform: translateY(-4px); }
        .track-pic { width: 100%; aspect-ratio: 1; background: #282828; border-radius: 6px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; font-size: 40px; color: var(--primary); }
        .track-title { font-weight: 700; font-size: 14px; margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .track-desc { font-size: 12px; color: var(--text-muted); margin: 0; }
        #loading { display: none; text-align: center; color: var(--text-muted); margin: 20px 0; }
        .player-panel { position: fixed; bottom: 0; left: 0; right: 0; background: #181818; padding: 16px 30px; display: none; border-top: 1px solid #282828; z-index: 100; }
        .player-container { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
        #current-title { font-weight: 700; color: var(--primary); margin: 0 0 8px 0; font-size: 14px; text-align: center; }
        audio { width: 100%; max-width: 600px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-section">
            <h1>Music<span>Stream</span></h1>
            <div class="search-box">
                <input type="text" id="search-input" placeholder="Какую песню хочешь найти?">
                <button onclick="searchMusic()">Поиск</button>
            </div>
        </div>
        <div id="loading">✨ Магия Python: ищем лучший аудиопоток...</div>
        <div id="search-results-section" style="display: none;">
            <h2>Результаты поиска</h2>
            <div id="results" class="grid-layout"></div>
        </div>
        <h2>Популярно у друзей 🔥</h2>
        <div class="grid-layout">
            <div class="track-card" onclick="quickPlay('Miyagi Эндшпиль - Люби меня')">
                <div class="track-pic">🎵</div>
                <p class="track-title">Люби меня</p>
                <p class="track-desc">Miyagi & Endshpil</p>
            </div>
            <div class="track-card" onclick="quickPlay('Rammstein - Sonne')">
                <div class="track-pic">🎸</div>
                <p class="track-title">Sonne</p>
                <p class="track-desc">Rammstein</p>
            </div>
            <div class="track-card" onclick="quickPlay('Linkin Park - Numb')">
                <div class="track-pic">🎧</div>
                <p class="track-title">Numb</p>
                <p class="track-desc">Linkin Park</p>
            </div>
            <div class="track-card" onclick="quickPlay('Король и Шут - Лесник')">
                <div class="track-pic">💀</div>
                <p class="track-title">Лесник</p>
                <p class="track-desc">Король и Шут</p>
            </div>
        </div>
    </div>
    <div id="player-panel" class="player-panel">
        <div class="player-container">
            <p id="current-title">Название трека</p>
            <audio id="audio-player" controls autoplay></audio>
        </div>
    </div>
    <script>
        async function searchMusic() {
            const query = document.getElementById('search-input').value;
            if (!query) return;
            document.getElementById('loading').style.display = 'block';
            document.getElementById('search-results-section').style.display = 'block';
            document.getElementById('results').innerHTML = '';
            try {
                const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
                const tracks = await response.json();
                document.getElementById('loading').style.display = 'none';
                if (tracks.length === 0) {
                    document.getElementById('results').innerHTML = '<p style="color:var(--text-muted);">Ничего не найдено</p>';
                    return;
                }
                tracks.forEach(track => {
                    const card = document.createElement('div');
                    card.className = 'track-card';
                    card.onclick = () => playTrack(track.title, track.url);
                    card.innerHTML = `<div class="track-pic">▶️</div><p class="track-title">${track.title}</p><p class="track-desc">Найдено в сети</p>`;
                    document.getElementById('results').appendChild(card);
                });
            } catch (err) {
                document.getElementById('loading').style.display = 'none';
                alert('Ошибка сервера при поиске');
            }
        }
        async function quickPlay(trackName) {
            document.getElementById('loading').style.display = 'block';
            try {
                const response = await fetch(`/api/search?query=${encodeURIComponent(trackName)}`);
                const tracks = await response.json();
                document.getElementById('loading').style.display = 'none';
                if(tracks.length > 0) {
                    playTrack(tracks[0].title, tracks[0].url);
                } else {
                    alert('Не удалось запустить трек');
                }
            } catch(e) {
                document.getElementById('loading').style.display = 'none';
                alert('Ошибка сети');
            }
        }
        function playTrack(title, url) {
            document.getElementById('current-title').innerText = title;
            const player = document.getElementById('audio-player');
            player.src = url;
            document.getElementById('player-panel').style.display = 'block';
            player.play();
        }
        document.getElementById('search-input').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') searchMusic();
        });
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def index():
    return HTML_INTERFACE

@app.get("/api/search")
async def search(query: str):
    ydl_opts = {'format': 'bestaudio/best', 'noplaylist': True, 'quiet': True, 'default_search': 'ytsearch5'}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(query, download=False)
            results = []
            if 'entries' in info:
                for entry in info['entries']:
                    if entry:
                        results.append({"title": entry.get("title"), "url": entry.get("url")})
            return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
