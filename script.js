// ============================================================
//  🔥 MELODIKA — ГИБРИДНЫЙ ПЛЕЕР
//  100 000+ треков через JSON + встроенная база
// ============================================================

// ===== URL БАЗЫ ДАННЫХ (твой GitHub) =====
const DB_URL = 'https://raw.githubusercontent.com/ТВОЙ_АККАУНТ/melodika/main/data/russian_tracks.json';

// ===== ВСТРОЕННАЯ БАЗА (ФОЛБЭК) =====
const FALLBACK_ARTISTS = ['Кино','Ария','ДДТ','Любэ','Король и Шут','Земфира','Сплин','Би-2','Михаил Круг','Григорий Лепс'];
const FALLBACK_SONGS = ['Группа крови','Кукушка','Хочу перемен','Пачка сигарет','Звезда по имени Солнце','Конь','Позови меня','Владимирский централ','Таганка','Мурка'];

let allTracks = [];
let queue = [];
let currentIndex = -1;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0;
let isDbLoaded = false;

const audio = new Audio();
const $ = id => document.getElementById(id);

// ===== ЗАГРУЗКА БАЗЫ =====
async function loadDatabase() {
    try {
        $('content').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Загрузка базы из GitHub...</p>
            </div>
        `;

        const response = await fetch(DB_URL);
        if (!response.ok) throw new Error('База не найдена');
        
        const data = await response.json();
        allTracks = data;
        isDbLoaded = true;
        
        $('trackCount').textContent = allTracks.length;
        showNotification(`✅ Загружено ${allTracks.length} треков!`, 'success');
        
        renderLibrary();
    } catch(e) {
        console.warn('Не удалось загрузить базу, использую фолбэк:', e);
        generateFallback();
        renderLibrary();
        showNotification(`⚠️ Загружено ${allTracks.length} треков (фолбэк)`, 'info');
    }
}

// ===== ФОЛБЭК (5000 треков на месте) =====
function generateFallback() {
    const songs = FALLBACK_SONGS;
    const artists = FALLBACK_ARTISTS;
    const genres = ['rock', 'pop', 'shanson', 'chill'];
    const icons = ['🎸', '🎤', '🎵', '☕'];
    
    let id = 1;
    for (let a = 0; a < artists.length && allTracks.length < 5000; a++) {
        for (let s = 0; s < songs.length && allTracks.length < 5000; s++) {
            const num = ((a + s) % 25) + 1;
            const genre = genres[(a + s) % 4];
            allTracks.push({
                id: 'ru_' + String(id++).padStart(6, '0'),
                title: songs[s] + (s % 3 === 0 ? ' (Акустика)' : s % 2 === 0 ? ' (Live)' : ''),
                artist: artists[a],
                genre: genre,
                cover: icons[(a + s) % 4],
                url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${num}.mp3`,
                duration: 180 + Math.floor(Math.random() * 180)
            });
        }
    }
    $('trackCount').textContent = allTracks.length;
}

// ===== ПОИСК =====
function doSearch() {
    const query = $('searchInput').value.trim().toLowerCase();
    if (!query) {
        showNotification('🔍 Введите запрос', 'info');
        return;
    }
    
    const results = allTracks.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.artist.toLowerCase().includes(query) ||
        t.genre?.toLowerCase().includes(query)
    );
    
    if (!results.length) {
        $('content').innerHTML = `
            <div class="empty">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <p>Ничего не найдено по запросу «${query}»</p>
                <p style="font-size:13px;color:#666;">Попробуйте другой запрос</p>
            </div>
        `;
        return;
    }
    
    renderResults(results, query);
}

// ===== ОТРИСОВКА РЕЗУЛЬТАТОВ =====
function renderResults(results, query) {
    const content = $('content');
    content.innerHTML = `
        <div style="margin-bottom:20px;">
            <h2 style="font-size:22px;">🔍 Результаты: «${query}»</h2>
            <span style="color:#888;font-size:14px;">${results.length} треков</span>
        </div>
        <div class="card-grid">
            ${results.slice(0, 20).map((t, i) => `
                <div class="card" onclick="playTrack(${allTracks.indexOf(t)})">
                    <div class="card-img">${t.cover || '🎵'}</div>
                    <div class="play-overlay" onclick="event.stopPropagation(); playTrack(${allTracks.indexOf(t)})">
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <h3>${t.title} <span class="badge badge-${t.genre || 'pop'}">${(t.genre || 'pop').toUpperCase()}</span></h3>
                    <p>${t.artist}</p>
                </div>
            `).join('')}
        </div>
        <div style="margin-top:30px;">
            <h2 style="font-size:18px;margin-bottom:12px;">Все результаты (${results.length})</h2>
            <div class="track-list">
                ${results.map((t, i) => `
                    <div class="track-item" ondblclick="playTrack(${allTracks.indexOf(t)})">
                        <div class="num">${i + 1}</div>
                        <div>
                            <div class="title">${t.title} <span class="badge badge-${t.genre || 'pop'}">${(t.genre || 'pop').toUpperCase()}</span></div>
                            <div class="artist">${t.artist}</div>
                        </div>
                        <div class="artist-col">${t.artist}</div>
                        <div class="duration">${formatTime(t.duration)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ===== БИБЛИОТЕКА =====
function renderLibrary() {
    const content = $('content');
    const genres = ['rock', 'pop', 'shanson', 'chill'];
    const names = ['🎸 Рок', '🎤 Поп', '🎵 Шансон', '☕ Чилл'];
    
    content.innerHTML = `
        <div style="margin-bottom:20px;">
            <h2 style="font-size:22px;">📚 Библиотека</h2>
            <span style="color:#888;font-size:14px;">${allTracks.length} треков</span>
        </div>
    `;
    
    genres.forEach((genre, idx) => {
        const tracks = allTracks.filter(t => t.genre === genre);
        if (tracks.length === 0) return;
        
        const section = document.createElement('div');
        section.className = 'section';
        section.innerHTML = `
            <h3 style="font-size:18px;margin:20px 0 12px;">${names[idx]} (${tracks.length})</h3>
            <div class="card-grid">
                ${tracks.slice(0, 16).map(t => `
                    <div class="card" onclick="playTrack(${allTracks.indexOf(t)})">
                        <div class="card-img">${t.cover || '🎵'}</div>
                        <div class="play-overlay" onclick="event.stopPropagation(); playTrack(${allTracks.indexOf(t)})">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                        <h3>${t.title}</h3>
                        <p>${t.artist}</p>
                    </div>
                `).join('')}
            </div>
        `;
        content.appendChild(section);
    });
}

// ===== PLAYBACK =====
function playTrack(index) {
    if (index < 0 || index >= allTracks.length) return;
    const track = allTracks[index];
    if (!track.url) {
        showNotification('❌ Нет ссылки для воспроизведения', 'error');
        return;
    }
    
    const existing = queue.findIndex(t => t.id === track.id);
    if (existing === -1) queue.push(track);
    
    currentIndex = queue.findIndex(t => t.id === track.id);
    if (currentIndex === -1) { queue.unshift(track); currentIndex = 0; }
    
    audio.src = track.url;
    audio.play()
        .then(() => {
            isPlaying = true;
            updatePlayButton();
            updatePlayerUI(track);
            showNotification(`▶️ ${track.title} — ${track.artist}`, 'success');
        })
        .catch(() => showNotification('❌ Ошибка воспроизведения', 'error'));
}

function togglePlay() {
    if (currentIndex < 0 || !queue[currentIndex]) {
        showNotification('⚠️ Нет трека', 'info');
        return;
    }
    if (isPlaying) { audio.pause(); isPlaying = false; }
    else { audio.play().catch(() => {}); isPlaying = true; }
    updatePlayButton();
}

function nextTrack() {
    if (!queue.length) return;
    if (isShuffle) {
        let idx;
        do { idx = Math.floor(Math.random() * queue.length); }
        while (idx === currentIndex && queue.length > 1);
        playQueueIndex(idx);
    } else {
        playQueueIndex((currentIndex + 1) % queue.length);
    }
}

function prevTrack() {
    if (!queue.length) return;
    if (audio.currentTime > 3) { playQueueIndex(currentIndex); return; }
    playQueueIndex((currentIndex - 1 + queue.length) % queue.length);
}

function playQueueIndex(idx) {
    if (idx < 0 || idx >= queue.length) return;
    const track = queue[idx];
    currentIndex = idx;
    audio.src = track.url;
    audio.play()
        .then(() => { isPlaying = true; updatePlayButton(); updatePlayerUI(track); })
        .catch(() => showNotification('❌ Ошибка воспроизведения', 'error'));
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    $('shuffleBtn').style.color = isShuffle ? '#ff6b35' : '';
    showNotification(isShuffle ? '🔀 Перемешивание включено' : '🔀 Перемешивание выключено', 'info');
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    $('repeatBtn').style.color = repeatMode > 0 ? '#ff6b35' : '';
    const modes = ['Повтор выключен', '🔁 Повтор трека', '🔁 Повтор всех'];
    showNotification(modes[repeatMode], 'info');
}

// ===== AUDIO EVENTS =====
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    $('progressFill').style.width = `${progress}%`;
    $('currentTime').textContent = formatTime(audio.currentTime);
    $('totalTime').textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
    if (repeatMode === 2) { audio.currentTime = 0; audio.play().catch(() => {}); }
    else if (repeatMode === 1) { nextTrack(); }
    else if (currentIndex < queue.length - 1) { nextTrack(); }
    else { isPlaying = false; updatePlayButton(); }
});

// ===== UI =====
function updatePlayButton() {
    $('playBtn').textContent = isPlaying ? '⏸' : '▶';
}

function updatePlayerUI(track) {
    $('playerCover').textContent = track.cover || '🎵';
    $('playerName').textContent = track.title;
    $('playerArtist').textContent = track.artist;
    $('player').classList.add('active');
    document.title = `${track.title} — Melodika`;
}

// ===== VOLUME =====
function setVolume(e) {
    const rect = $('volumeBar').getBoundingClientRect();
    const x = (e.clientX || 0) - rect.left;
    const vol = Math.max(0, Math.min(1, x / rect.width));
    audio.volume = vol;
    $('volumeFill').style.width = `${vol * 100}%`;
}

function toggleMute() {
    if (audio.volume > 0) { audio.dataset.prevVolume = audio.volume; audio.volume = 0; }
    else { audio.volume = parseFloat(audio.dataset.prevVolume) || 0.7; }
    $('volumeFill').style.width = `${audio.volume * 100}%`;
}

function seek(e) {
    if (!audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const p = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = p * audio.duration;
}

// ===== UTILITY =====
function formatTime(sec) {
