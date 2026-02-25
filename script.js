const allTracks = [
    "Mario Kart Stadium", "Water Park", "Sweet Sweet Canyon", "Thwomp Ruins", "Mario Circuit", "Toad Harbor", "Twisted Mansion", "Shy Guy Falls", "Sunshine Airport", "Dolphin Shoals", "Electrodrome", "Mount Wario", "Cloudtop Cruise", "Bone-Dry Dunes", "Bowser's Castle", "Rainbow Road", "Wii Moo Moo Meadows", "GBA Mario Circuit", "DS Cheep Cheep Beach", "N64 Toad's Turnpike", "GCN Dry Dry Desert", "SNES Donut Plains 3", "N64 Royal Raceway", "3DS DK Jungle", "DS Wario Stadium", "GCN Sherbet Land", "3DS Music Park", "N64 Yoshi Valley", "DS Tick-Tock Clock", "3DS Piranha Plant Slide", "Wii Grumble Volcano", "N64 Rainbow Road", "GCN Yoshi Circuit", "Excitebike Arena", "Dragon Driftway", "Mute City", "Wii Wario's Gold Mine", "SNES Rainbow Road", "Ice Ice Outpost", "Hyrule Circuit", "GCN Baby Park", "GBA Cheese Land", "Wild Woods", "Animal Crossing", "3DS Neo Bowser City", "GBA Ribbon Road", "Super Bell Subway", "Big Blue", "Tour Paris Promenade", "3DS Toad Circuit", "N64 Choco Mountain", "Wii Coconut Mall", "Tour Tokyo Blur", "DS Shroom Ridge", "GBA Sky Garden", "Ninja Hideaway", "Tour New York Minute", "SNES Mario Circuit 3", "N64 Kalimari Desert", "DS Waluigi Pinball", "Tour Sydney Sprint", "GBA Snow Land", "Wii Mushroom Gorge", "Sky-High Sundae", "Tour London Loop", "GBA Boo Lake", "3DS Rock Rock Mountain", "Wii Maple Treeway", "Berlin Byways", "DS Peach Gardens", "Merry Mountain", "3DS Rainbow Road", "Tour Amsterdam Drift", "GBA Riverside Park", "Wii DK Summit", "Yoshi’s Island", "Tour Bangkok Rush", "DS Mario Circuit", "GCN Waluigi Stadium", "Tour Singapore Speedway", "Tour Athens Dash", "GCN Daisy Cruiser", "Wii Moonview Highway", "Squeaky Clean Sprint", "Tour Los Angeles Laps", "GBA Sunset Wilds", "Wii Koopa Cape", "Tour Vancouver Velocity", "Tour Rome Avanti", "GCN DK Mountain", "Wii Daisy Circuit", "Piranha Plant Cove", "Tour Madrid Drive", "3DS Rosalina’s Ice World", "SNES Bowser Castle 3", "Wii Rainbow Road"
];

const POINTS_SYSTEM = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

let playedTracksData = JSON.parse(localStorage.getItem('mk8d_history_log')) || [];
let trackSynonyms = JSON.parse(localStorage.getItem('mk8d_synonyms')) || {}; 
let players = JSON.parse(localStorage.getItem('mk8d_players')) || [
    { id: 'p1', name: 'Spieler 1', visible: true }
];

let currentView = 'history'; // 'history' or 'stats' (for the tracker column)
let showSynonyms = false;
let currentCalendarDate = new Date();
let selectedCalendarDate = null; // null means no specific day filter from calendar

// Navigation
function showPage(pageId) {
    // Buttons toggeln
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (pageId === 'tracker') {
        document.getElementById('btn-nav-tracker').classList.add('active');
        document.getElementById('tracker-view').classList.remove('hidden');
        document.getElementById('stats-view').classList.add('hidden');
    } else {
        document.getElementById('btn-nav-stats').classList.add('active');
        document.getElementById('tracker-view').classList.add('hidden');
        document.getElementById('stats-view').classList.remove('hidden');
        updateStatsViews();
        renderCalendar();
    }
}

function savePlayers() {
    localStorage.setItem('mk8d_players', JSON.stringify(players));
}

// ---- Calendar Logic ----

function changeMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarTitle');
    if (!grid || !title) return;

    grid.innerHTML = '';
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Set Title
    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    title.textContent = `${monthNames[month]} ${year}`;

    // Day Headers
    const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    // Calculate Days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Adjust for Monday start (0=Sunday, 1=Monday -> we want 0=Monday, 6=Sunday)
    let startDayIndex = firstDay.getDay() - 1; 
    if (startDayIndex === -1) startDayIndex = 6;

    // Get Race Counts per Day
    const raceCounts = {};
    playedTracksData.forEach(race => {
        const d = new Date(race.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const day = d.getDate();
            raceCounts[day] = (raceCounts[day] || 0) + 1;
        }
    });

    // Fill Empty Slots before 1st
    for (let i = 0; i < startDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day';
        emptyCell.style.backgroundColor = 'transparent';
        grid.appendChild(emptyCell);
    }

    // Fill Days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day current-month';
        
        const count = raceCounts[day] || 0;
        
        // Heatmap Logic
        let heatClass = 'heat-0';
        if (count > 0) heatClass = 'heat-1';
        if (count > 4) heatClass = 'heat-2';
        if (count > 10) heatClass = 'heat-3';
        if (count > 20) heatClass = 'heat-4';
        
        if (count > 0) {
            cell.classList.add(heatClass);
            cell.title = `${count} Rennen am ${day}.${month + 1}.${year}`;
        }

        // Selected Date logic
        if (selectedCalendarDate && 
            selectedCalendarDate.getFullYear() === year && 
            selectedCalendarDate.getMonth() === month && 
            selectedCalendarDate.getDate() === day) {
            cell.classList.add('selected-day');
        }

        cell.onclick = () => {
            const clickedDate = new Date(year, month, day);
            if (selectedCalendarDate && selectedCalendarDate.getTime() === clickedDate.getTime()) {
                selectedCalendarDate = null; // Toggle off
            } else {
                selectedCalendarDate = clickedDate;
            }
            renderCalendar();
            updateStatsViews();
        };
        
        cell.innerHTML = `
            <span class="day-number">${day}</span>
            ${count > 0 ? `<span class="day-count">${count}</span>` : ''}
        `;
        
        grid.appendChild(cell);
    }
}


// ---- Stat Helpers ----

function getFilteredRaces() {
    let filtered = playedTracksData;

    // Calendar Selection Filter (Highest priority for single day)
    if (selectedCalendarDate) {
        const startOfDay = new Date(selectedCalendarDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedCalendarDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(r => {
            const d = new Date(r.date);
            return d >= startOfDay && d <= endOfDay;
        });
    } else {
        // Only apply normal date filters if no specific calendar day is selected
        // Date Filter
        const startDateStr = document.getElementById('dateStartInput').value;
        const endDateStr = document.getElementById('dateEndInput').value;

        if (startDateStr) {
            const startDate = new Date(startDateStr);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(r => new Date(r.date) >= startDate);
        }

        if (endDateStr) {
            const endDate = new Date(endDateStr);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(r => new Date(r.date) <= endDate);
        }
    }

    // Limit Filter
    const limitInput = document.getElementById('recentRacesInput');
    const limit = parseInt(limitInput.value);
    
    if (!isNaN(limit) && limit > 0) {
        filtered = filtered.slice(-limit);
    }
    
    return filtered;
}

function getPlayerStats(playerId, races) {
    let placementSum = 0;
    let pointsSum = 0;
    let raceCount = 0;
    
    const dataToUse = races || playedTracksData;

    dataToUse.forEach(race => {
        if (race.placements && race.placements[playerId]) {
            const placement = parseInt(race.placements[playerId], 10);
            if (!isNaN(placement) && placement >= 1 && placement <= 12) {
                placementSum += placement;
                pointsSum += POINTS_SYSTEM[placement - 1];
                raceCount++;
            }
        }
    });

    return {
        count: raceCount,
        avgPlacement: raceCount > 0 ? (placementSum / raceCount) : 0,
        avgPoints: raceCount > 0 ? (pointsSum / raceCount) : 0
    };
}

// ---- Views & Rendering ----

let dragSrcEl = null;

function updateStatsViews() {
    renderStatistics();
    renderHeadToHead();
}


function renderPlayersManager() {
    const container = document.getElementById('playerManagerList');
    if (!container) return;
    
    container.innerHTML = '';
    players.forEach((p, index) => {
        const div = document.createElement('div');
        div.className = 'player-manager-item';
        div.draggable = true;
        div.dataset.index = index;
        div.dataset.id = p.id;
        
        div.innerHTML = `
            <div class="drag-handle" title="Zum Verschieben ziehen">☰</div>
            <label>
                <input type="checkbox" ${p.visible ? 'checked' : ''} onchange="togglePlayerVisibility('${p.id}')">
                ${p.name}
            </label>
            <button class="btn-delete-player" onclick="deletePlayer('${p.id}')" title="Spieler löschen">🗑️ Löschen</button>
        `;

        addDragEvents(div);
        container.appendChild(div);
    });
}

function addDragEvents(item) {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
    this.classList.add('dragging');
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('over');
}

function handleDragLeave(e) {
    this.classList.remove('over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (dragSrcEl !== this) {
        const fromIndex = parseInt(dragSrcEl.dataset.index);
        const toIndex = parseInt(this.dataset.index);
        
        // Array umsortieren
        const movedItem = players.splice(fromIndex, 1)[0];
        players.splice(toIndex, 0, movedItem);
        
        savePlayers();
        renderPlayersManager();
        renderStatistics();
        renderHeadToHead();
        renderPlayedTracks(); // Aktualisiert auch die Reihenfolge in den Dropdowns
    }
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    let items = document.querySelectorAll('.player-manager-item');
    items.forEach(function (item) {
        item.classList.remove('over');
    });
}

function renderStatistics() {
    const tbody = document.getElementById('statsTableBody');
    const roundsVal = parseInt(document.getElementById('roundsInput').value) || 4;
    document.getElementById('th-points-x').textContent = `Ø Punkte (${roundsVal} Runden)`;
    
    tbody.innerHTML = '';

    const racesToConsider = getFilteredRaces();

    // Sortiere Spieler nach durchschnittlichen Punkten (absteigend)
    const statsList = players
        .filter(p => p.visible)
        .map(p => {
            const s = getPlayerStats(p.id, racesToConsider);
            return { 
                player: p, 
                stats: s 
            };
        }).sort((a, b) => b.stats.avgPoints - a.stats.avgPoints);

    statsList.forEach(item => {
        const p = item.player;
        const s = item.stats;
        
        const avgPointsX = (s.avgPoints * roundsVal).toFixed(1);
        const avgPlacementStr = s.count > 0 ? s.avgPlacement.toFixed(2) : '-';
        const avgPointsStr = s.count > 0 ? s.avgPoints.toFixed(2) : '-';
        const avgPointsXStr = s.count > 0 ? avgPointsX : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${avgPlacementStr}</td>
            <td>${avgPointsStr}</td>
            <td><strong>${avgPointsXStr}</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderHeadToHead() {
    const table = document.getElementById('h2hTable');
    table.innerHTML = '';

    // Header Row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>vs</th>'; // Corner cell
    
    const visiblePlayers = players.filter(p => p.visible);
    
    visiblePlayers.forEach(p => {
        headerRow.innerHTML += `<th>${p.name}</th>`;
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    // Matrix calculation
    // wins[p1_id][p2_id] = number of times p1 beat p2
    const wins = {};
    visiblePlayers.forEach(p1 => {
        wins[p1.id] = {};
        visiblePlayers.forEach(p2 => {
            wins[p1.id][p2.id] = 0;
        });
    });

    const racesToConsider = getFilteredRaces();

    racesToConsider.forEach(race => {
        if (!race.placements) return;
        
        // Vergleiche jeden Spieler mit jedem anderen
        for (let i = 0; i < visiblePlayers.length; i++) {
            const p1 = visiblePlayers[i];
            const p1Place = parseInt(race.placements[p1.id]);
            
            if (isNaN(p1Place)) continue; // p1 nicht mitgefahren

            for (let j = 0; j < visiblePlayers.length; j++) {
                const p2 = visiblePlayers[j];
                if (p1.id === p2.id) continue;

                const p2Place = parseInt(race.placements[p2.id]);
                if (isNaN(p2Place)) continue; // p2 nicht mitgefahren

                if (p1Place < p2Place) {
                    wins[p1.id][p2.id]++;
                }
            }
        }
    });

    // Body Rows
    visiblePlayers.forEach(p1 => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p1.name}</td>`; // Row Header

        visiblePlayers.forEach(p2 => {
            const td = document.createElement('td');
            if (p1.id === p2.id) {
                td.className = 'h2h-cell h2h-self';
                td.textContent = '-';
            } else {
                const p1Wins = wins[p1.id][p2.id];
                const p2Wins = wins[p2.id][p1.id];
                
                td.className = 'h2h-cell';
                if (p1Wins > p2Wins) td.classList.add('h2h-win');
                else if (p1Wins < p2Wins) td.classList.add('h2h-loss');
                else td.classList.add('h2h-draw');

                td.textContent = `${p1Wins} : ${p2Wins}`;
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}

// ---- Actions ----

function togglePlayerVisibility(id) {
    const p = players.find(x => x.id === id);
    if(p) {
        p.visible = !p.visible;
        savePlayers();
        renderPlayedTracks(); // Updates dropdowns in history
        updateStatsViews();    // Updates statistics and H2H
    }
}

function addPlayer() {
    const nameInput = document.getElementById('newPlayerName');
    const name = nameInput.value.trim();
    if(name) {
        players.push({ id: 'p' + Date.now(), name: name, visible: true });
        nameInput.value = '';
        savePlayers();
        renderPlayersManager();
        renderPlayedTracks();
        renderStatistics();
        renderHeadToHead();
    }
}

function deletePlayer(id) {
    const player = players.find(x => x.id === id);
    if (player) {
        if (confirm(`Bist du dir sicher, dass du "${player.name}" löschen möchtest?`)) {
            players = players.filter(x => x.id !== id);
            savePlayers();
            renderPlayersManager();
            renderPlayedTracks();
            renderStatistics();
            renderHeadToHead();
        }
    }
}

function updatePlacement(raceId, playerId, value) {
    const race = playedTracksData.find(r => r.id === raceId);
    if (race) {
        if (!race.placements) race.placements = {};
        race.placements[playerId] = value;
        saveData();
        renderStatistics(); // Stats updaten
        renderHeadToHead(); // H2H updaten
    }
}

function getThumbUrl(trackName) {
    let formattedName = trackName.replace(/’/g, "'");
    formattedName = formattedName.replace(/ /g, "_");
    return `img/184px-MK8D_${formattedName}_Course_Icon_Full.png`;
}

function getFallbackImg() {
    return "this.onerror=null; this.src='https://placehold.co/160x90/e60012/white?text=Fehlt';";
}

function getDisplayName(trackName) {
    if (showSynonyms && trackSynonyms[trackName]) {
        return trackSynonyms[trackName];
    }
    return trackName;
}

function formatDateTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString('de-DE') + ", " + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + " Uhr";
}

function toggleNames() {
    showSynonyms = !showSynonyms;
    const btn = document.getElementById('btnToggleNames');
    btn.textContent = showSynonyms ? "🏷️ Zeige Originalnamen" : "🏷️ Zeige Synonyme";
    filterTracks();
}

function editSynonym(trackName) {
    const currentName = trackSynonyms[trackName] || "";
    const newName = prompt(`Gib einen eigenen Namen/Spitznamen für "${trackName}" ein:\n(Lass das Feld leer, um ihn zu löschen)`, currentName);
    
    if (newName !== null) {
        if (newName.trim() === "") {
            delete trackSynonyms[trackName];
        } else {
            trackSynonyms[trackName] = newName.trim();
        }
        localStorage.setItem('mk8d_synonyms', JSON.stringify(trackSynonyms));
        filterTracks();
    }
}

function renderAllTracks(filter = "") {
    const list = document.getElementById('allTracksList');
    list.innerHTML = "";
    const searchTerm = filter.toLowerCase();

    const filteredTracks = allTracks.filter(track => {
        const matchOriginal = track.toLowerCase().includes(searchTerm);
        const matchSynonym = trackSynonyms[track] && trackSynonyms[track].toLowerCase().includes(searchTerm);
        return matchOriginal || matchSynonym;
    });

    filteredTracks.forEach(track => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="track-info">
                <img class="track-thumb" src="${getThumbUrl(track)}" onerror="${getFallbackImg()}">
                <span class="track-name">${getDisplayName(track)}</span>
                <button class="btn-edit-name" onclick="editSynonym('${track.replace(/'/g, "\\'")}')" title="Synonym bearbeiten">✏️</button>
            </div>
            <button onclick="addPlayedTrack('${track.replace(/'/g, "\\'")}')">+</button>
        `;
        list.appendChild(li);
    });
}

function toggleView() {
    currentView = (currentView === 'history') ? 'stats' : 'history';
    const title = document.getElementById('rightColumnTitle');
    title.textContent = (currentView === 'history') ? "Verlauf (Chronologisch)" : "Top-Strecken (Statistik)";
    renderPlayedTracks();
}

function renderPlayedTracks() {
    const list = document.getElementById('playedTracksList');
    if (!list) return; // Schutz
    list.innerHTML = "";
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (playedTracksData.length === 0) {
        list.innerHTML = "<li style='color:#999'>Noch keine Strecken gefahren.</li>";
        return;
    }

    if (currentView === 'history') {
        const filteredHistory = playedTracksData
            .map((item, index) => ({ item: item, originalIndex: index }))
            .filter(({item}) => {
                const matchOriginal = item.name.toLowerCase().includes(searchTerm);
                const matchSynonym = trackSynonyms[item.name] && trackSynonyms[item.name].toLowerCase().includes(searchTerm);
                return matchOriginal || matchSynonym;
            });

        if (filteredHistory.length === 0) {
            list.innerHTML = "<li style='color:#999'>Keine passenden Einträge im Verlauf.</li>";
            return;
        }

        filteredHistory.forEach(({item, originalIndex}) => {
            const li = document.createElement('li');
            li.className = "history-li";

            let placementsHTML = '<div class="placements-container">';
            players.filter(p => p.visible).forEach(p => {
                const currentVal = (item.placements && item.placements[p.id]) ? item.placements[p.id] : "";
                let options = '<option value="">-</option>';
                for(let i=1; i<=12; i++) {
                    options += `<option value="${i}" ${currentVal == i ? 'selected' : ''}>${i}</option>`;
                }
                placementsHTML += `
                    <div class="player-select">
                        <span class="player-name-label">${p.name}:</span>
                        <select onchange="updatePlacement(${item.id}, '${p.id}', this.value)">
                            ${options}
                        </select>
                    </div>
                `;
            });
            placementsHTML += '</div>';

            li.innerHTML = `
                <div class="history-li-top">
                    <div class="track-info">
                        <span class="race-number">#${originalIndex + 1}</span>
                        <img class="track-thumb" src="${getThumbUrl(item.name)}" onerror="${getFallbackImg()}">
                        <span class="track-name">${getDisplayName(item.name)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span class="track-time">${formatDateTime(item.date)}</span>
                        <button class="btn-remove" onclick="removePlayedTrack(${item.id})">Entfernen</button>
                    </div>
                </div>
                ${placementsHTML}
            `;
            list.appendChild(li);
        });
        
        if (searchTerm === "") {
            list.scrollTop = list.scrollHeight;
        }

    } else {
        const totalRaces = playedTracksData.length; 
        const stats = {};
        
        playedTracksData.forEach(item => {
            stats[item.name] = (stats[item.name] || 0) + 1;
        });

        const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);

        const filteredStats = sortedStats.filter(([trackName, count]) => {
            const matchOriginal = trackName.toLowerCase().includes(searchTerm);
            const matchSynonym = trackSynonyms[trackName] && trackSynonyms[trackName].toLowerCase().includes(searchTerm);
            return matchOriginal || matchSynonym;
        });

        if (filteredStats.length === 0) {
            list.innerHTML = "<li style='color:#999'>Keine passenden Einträge in der Statistik.</li>";
            return;
        }

        filteredStats.forEach(([trackName, count], index) => {
            const percentage = ((count / totalRaces) * 100).toFixed(1);
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="track-info">
                    <span class="race-number">#${index + 1}</span>
                    <img class="track-thumb" src="${getThumbUrl(trackName)}" onerror="${getFallbackImg()}">
                    <span class="track-count">${count}x</span>
                    <span class="track-percent">${percentage}%</span>
                    <span class="track-name">${getDisplayName(trackName)}</span>
                </div>
            `;
            list.appendChild(li);
        });
    }
}

function addPlayedTrack(trackName) {
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    const currentTime = new Date().toISOString();
    
    playedTracksData.push({ id: uniqueId, name: trackName, date: currentTime, placements: {} });
    saveData();
    
    document.getElementById('searchInput').value = "";
    filterTracks();
    renderStatistics();
    renderHeadToHead();
    renderCalendar();
}

function removePlayedTrack(idToRemove) {
    playedTracksData = playedTracksData.filter(item => item.id !== idToRemove);
    if(confirm("Möchten Sie wirklich diesen Eintrag löschen?")){
        saveData();
        renderPlayedTracks();
        renderStatistics();
        renderHeadToHead();
        renderCalendar();
    }
}

function saveData() {
    localStorage.setItem('mk8d_history_log', JSON.stringify(playedTracksData));
}

function filterTracks() {
    renderAllTracks(document.getElementById('searchInput').value);
    renderPlayedTracks();
}

function exportJSON() {
    if (playedTracksData.length === 0 && Object.keys(trackSynonyms).length === 0) {
        alert("Es gibt keine Daten zum Exportieren!");
        return;
    }
    
    const exportData = {
        history: playedTracksData,
        synonyms: trackSynonyms,
        players: players
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "mk8d_tracker_backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) {
                playedTracksData = importedData;
            } 
            else if (importedData.history !== undefined) {
                playedTracksData = importedData.history || [];
                trackSynonyms = importedData.synonyms || {};
                localStorage.setItem('mk8d_synonyms', JSON.stringify(trackSynonyms));
                
                if (importedData.players) {
                    players = importedData.players;
                    savePlayers();
                }
            }
            
            saveData();
            filterTracks();
            renderPlayersManager();
            renderStatistics();
            renderHeadToHead();
            renderCalendar();
            alert("Daten erfolgreich importiert!");
            
        } catch (error) {
            alert("Fehler beim Lesen der JSON-Datei.");
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}

// Init
renderPlayersManager();
renderAllTracks();
renderPlayedTracks();
renderStatistics();
renderHeadToHead();
renderCalendar();
