console.log("TIME TO WRITE JAVASCRIPT");
let currentSong = new Audio();
let currentIndex = 0;
let songs = [];
let currentFolder = "songs/";
let allSongs = [];
const initialSongs = [
    "songs/A_C_-_Your_Hands___Romantic_Piano_Music.mp3",
    "songs/Believe_in_your_success_-_addict_sound.mp3",
    "songs/Carlos_Estella_-_Inspiring_Epic_Emotional_Cinematic.mp3",
    "songs/Epic_Movie_-_newtone.mp3",
    "songs/Good_Luck_-_bkfm-b-side.mp3",
    "songs/Inspiration_-_Cleric.mp3",
    "songs/Inspire_the_WORLD_-_alumo.mp3",
    "songs/Inspiring_Epic_Fly_Cinematic_Action_Triumphant_Bed_-_vivaproduction.mp3",
    "songs/Motivation_-_AkashicRecords.mp3",
    "songs/Piano.mp3",
    "songs/Way_to_Success_-_addict_sound.mp3"
];

function formatTime(seconds) {
    seconds = Math.floor(seconds); // Ensure we only deal with whole numbers
    let minutes = Math.floor(seconds / 60);
    let secs = seconds % 60;

    // Ensure two-digit format
    minutes = String(minutes).padStart(2, "0");
    secs = String(secs).padStart(2, "0");

    return `${minutes}:${secs}`;
}

async function getSongs(folder = "songs/") {
    try {
        if (folder === "songs/") {
            console.log(`Returning initial songs for ${folder}:`, initialSongs);
            return initialSongs;
        }

        const response = await fetch("/albums.json");
        if (!response.ok) {
            throw new Error(`Failed to fetch albums.json: ${response.status} ${response.statusText}`);
        }
        const albums = await response.json();
        
        const album = albums.find(album => album.folder === folder);
        if (!album || !album.songs) {
            console.warn(`No songs found for folder ${folder}`);
            return [];
        }

        console.log(`Songs fetched from ${folder}:`, album.songs);
        return album.songs;
    } catch (error) {
        console.error(`Error fetching songs from ${folder}:`, error);
        return [];
    }
}

const playMusic = (track, folder = "songs/") => {
    // Check if the track already includes the folder path (e.g., for initialSongs)
    let songUrl = track;
    if (!track.startsWith("songs/")) {
        const normalizedFolder = folder.endsWith("/") ? folder : `${folder}/`;
        songUrl = `${normalizedFolder}${track}`;
    }
    console.log(`Attempting to play song: ${songUrl} (Folder: ${folder}, Track: ${track})`);

    // Always reset the current song, whether it's playing or paused
    if (currentSong.src) {
        currentSong.pause();
        currentSong.currentTime = 0; // Reset to the beginning
        currentSong.src = ""; // Clear the source to ensure a fresh state
    }

    currentSong.src = songUrl;
    console.log(`Setting currentSong.src to: ${currentSong.src}`);

    const playPromise = currentSong.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error(`Error playing song ${track}:`, error);
            document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
            document.getElementById("play").src = "play.svg";
            if (error.name === "NotAllowedError") {
                console.log("Playback blocked: User interaction required. Please click the play button to start the song.");
                alert("Playback blocked: Please click the play button to start the song.");
            } else if (error.name === "NotSupportedError") {
                console.log("File format not supported or file not found. Check the song URL:", songUrl);
            }
        });
    }

    document.getElementById("play").src = "pause.svg";
    // Extract the song name from the track (remove the "songs/" prefix for display)
    const displayName = track.replace("songs/", "").replace(/%20/g, " ");
    document.querySelector(".songinfo").innerHTML = displayName;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    document.querySelectorAll(".songlist li").forEach((li, idx) => {
        li.classList.toggle("playing", idx === currentIndex);
    });

    currentSong.addEventListener("loadedmetadata", () => {
        document.querySelector(".songtime").innerHTML = `00:00 / ${formatTime(currentSong.duration)}`;
    }, { once: true });

    // Update song time as it plays
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
    });
};

const playNext = () => {
    let playButton = document.getElementById("play");
    playButton.src = "play.svg";
    setTimeout(async () => {
        const currentSongData = allSongs.find(song => song.rawName === songs[currentIndex]);
        if (currentSongData && (songs.length <= 1 || !songs.some(song => song === currentSongData.rawName && currentFolder === currentSongData.folder))) {
            songs = await getSongs(currentSongData.folder);
            currentFolder = currentSongData.folder;
            currentIndex = songs.findIndex(song => song === currentSongData.rawName);
        }

        currentIndex = (currentIndex + 1) % songs.length;
        const nextSongData = allSongs.find(song => song.rawName === songs[currentIndex]);
        const songFolder = nextSongData ? nextSongData.folder : currentFolder;

        playMusic(songs[currentIndex], songFolder);
        playButton.src = "pause.svg";

        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            const displayName = song.replace(/%20/g, " "); // Display with spaces
            songUL.innerHTML += `<li>
                <img class="invert" src="music.svg" alt="music">
                <div class="info">
                    <div>${displayName}</div>
                    <div>KBR EDITS</div>
                </div>
                <div class="playNow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="playButton">
                </div>
            </li>`;
        }

        document.querySelectorAll(".playNow img").forEach(img => img.src = "play.svg");
        const currentSongLi = document.querySelector(`.songlist li:nth-child(${currentIndex + 1}) .playNow img`);
        if (currentSongLi) currentSongLi.src = "pause.svg";
        document.querySelectorAll(".songlist li").forEach((li, idx) => {
            li.classList.toggle("playing", idx === currentIndex);
        });

        attachPlayNowListeners();
    }, 300);
};

const playPrevious = () => {
    let playButton = document.getElementById("play");
    playButton.src = "play.svg";
    setTimeout(async () => {
        const currentSongData = allSongs.find(song => song.rawName === songs[currentIndex]);
        if (currentSongData && (songs.length <= 1 || !songs.some(song => song === currentSongData.rawName && currentFolder === currentSongData.folder))) {
            songs = await getSongs(currentSongData.folder);
            currentFolder = currentSongData.folder;
            currentIndex = songs.findIndex(song => song === currentSongData.rawName);
        }

        currentIndex = (currentIndex - 1 + songs.length) % songs.length;
        const prevSongData = allSongs.find(song => song.rawName === songs[currentIndex]);
        const songFolder = prevSongData ? prevSongData.folder : currentFolder;

        playMusic(songs[currentIndex], songFolder);
        playButton.src = "pause.svg";

        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            const displayName = song.replace(/%20/g, " "); // Display with spaces
            songUL.innerHTML += `<li>
                <img class="invert" src="music.svg" alt="music">
                <div class="info">
                    <div>${displayName}</div>
                    <div>KBR EDITS</div>
                </div>
                <div class="playNow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="playButton">
                </div>
            </li>`;
        }

        document.querySelectorAll(".playNow img").forEach(img => img.src = "play.svg");
        const currentSongLi = document.querySelector(`.songlist li:nth-child(${currentIndex + 1}) .playNow img`);
        if (currentSongLi) currentSongLi.src = "pause.svg";
        document.querySelectorAll(".songlist li").forEach((li, idx) => {
            li.classList.toggle("playing", idx === currentIndex);
        });

        attachPlayNowListeners();
    }, 300);
};
function attachPlayNowListeners() {
    Array.from(document.querySelectorAll(".playNow")).forEach((playNow, index) => {
        // Skip if the playNow button already has a click listener
        if (playNow.dataset.listenerAttached) return;
        playNow.dataset.listenerAttached = "true";

        playNow.addEventListener("click", (e) => {
            e.stopPropagation();
            const selectedSongDisplay = document.querySelector(`.songlist li:nth-child(${index + 1}) .info div:first-child`).textContent.trim();
            const selectedSongRaw = songs[index]; // Use the raw name from songs array
            const playNowImg = playNow.querySelector("img");
            const songLiCount = document.querySelectorAll(".songlist li").length;

            if (index >= songLiCount || !document.querySelector(`.songlist li:nth-child(${index + 1})`)) {
                console.warn("Index out of bounds or invalid, resetting to 0 or matching clicked song");
                currentIndex = index < songLiCount ? index : 0;
            }

            const songData = allSongs.find(song => song.rawName === selectedSongRaw);
            const songFolder = songData ? songData.folder : currentFolder;

            const isCurrentSong = currentIndex === index && songs[currentIndex] && (selectedSongRaw === songs[currentIndex]);

            if (isCurrentSong) {
                if (currentSong.paused) {
                    currentSong.play();
                    document.getElementById("play").src = "pause.svg";
                    playNowImg.src = "pause.svg";
                    document.querySelectorAll(".songlist li").forEach((li, idx) => {
                        li.classList.toggle("playing", idx === index);
                    });
                } else {
                    currentSong.pause();
                    document.getElementById("play").src = "play.svg";
                    playNowImg.src = "play.svg";
                    document.querySelectorAll(".songlist li").forEach(li => li.classList.remove("playing"));
                }
            } else {
                currentIndex = index;
                if (currentSong.src && !currentSong.paused && !currentSong.ended) {
                    currentSong.pause();
                }
                playMusic(selectedSongRaw, songFolder);
                document.querySelectorAll(".playNow img").forEach(img => {
                    if (img) img.src = "play.svg";
                });
                if (playNowImg) {
                    playNowImg.src = "pause.svg";
                } else {
                    console.error("playNowImg not found for index:", index);
                }
                document.getElementById("play").src = "pause.svg";
                document.querySelectorAll(".songlist li").forEach((li, idx) => {
                    li.classList.toggle("playing", idx === currentIndex);
                });
            }
        });
    });
}

async function main() {
    songs = await getSongs();
    currentFolder = "songs/";
    console.log("Initial songs:", songs);

    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    console.log("songUL element:", songUL);
    if (!songUL) {
        console.error("songUL not found in the DOM!");
        return;
    }
    songUL.innerHTML = "";
    for (const song of songs) {
        console.log("Adding song to songlist:", song);
        const displayName = song.replace("songs/", "").replace(/%20/g, " "); // Remove "songs/" for display
        songUL.innerHTML += `<li>
                            <img class="invert" src="music.svg" alt="music">
                            <div class="info">
                                <div>${displayName}</div>
                                <div>KBR EDITS</div>
                            </div>
                            <div class="playNow">
                                <span>Play Now</span>
                                <img class="invert" src="play.svg" alt="playButton">
                            </div>
                        </li>`;
    }
    console.log("Final songUL content:", songUL.innerHTML);
    await fetchAllSongs();

    // Set up the first song but don't play it automatically
    if (songs.length > 0) {
        currentIndex = 0;
        const firstSong = songs[0];
        // Set the song source and display info, but don't play yet
        currentSong.src = firstSong; // Use the full path directly
        const displayName = firstSong.replace("songs/", "").replace(/%20/g, " ");
        document.querySelector(".songinfo").innerHTML = displayName;
        document.querySelector(".songtime").innerHTML = `00:00 / 00:00`;
        const audio = new Audio(firstSong); // Use the full path directly
        audio.addEventListener("loadedmetadata", () => {
            document.querySelector(".songtime").innerHTML = `00:00 / ${formatTime(audio.duration)}`;
        });
        // Update the play SVG for the first song in the song list, but keep it as "play" since we're not playing yet
        document.querySelectorAll(".playNow img").forEach(img => img.src = "play.svg");
        const firstPlayNow = document.querySelector(`.songlist li:nth-child(${currentIndex + 1}) .playNow img`);
        if (firstPlayNow) firstPlayNow.src = "play.svg"; // Keep as "play" since the song isn't playing
        document.querySelectorAll(".songlist li").forEach((li, idx) => {
            li.classList.toggle("playing", idx === currentIndex);
        });
    }

    const cardFolders = [
        "songs/my-terrible-mind/",
        "songs/gnx/",
        "songs/gods-plan/",
        "songs/utopia/",
        "songs/hit-me-hard-n-soft/",
        "songs/future-nostalgia/",
        "songs/all-eyes-on-me/",
        "songs/kamikazi/",
        "songs/this-is-jj47/",
        "songs/get-rich-or-die-tryin/",
        "songs/ready-to-die/",
        "songs/still-rollin/",
        "songs/rolling-papers/"
    ];

    const response = await fetch("albums.json");
    const albums = await response.json();
    const cardContainer = document.querySelector(".cardContainer");
    albums.forEach(album => {
        cardContainer.innerHTML += `
        <div class="card">
            <div class="play">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="black">
                    <path d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z" stroke="black" stroke-width="1.5" stroke-linejoin="round" />
                </svg>
            </div>
            <img class="p-0" src="${album.cover}" alt="album photo">
            <h2 class="p-0">${album.title}</h2>
           <p class="p-0">${album.artist.map(artist => `<a draggable="false" dir="auto" href="${artist.url}" class="artist-link">${artist.name}</a>`).join(", ")}</p>
        </div>
    `;
    });

    const card_Container = document.querySelector(".cardContainer");
    card_Container.addEventListener("click", (e) => {
        if (e.target.classList.contains("artist-link")) {
            e.preventDefault();
            e.stopPropagation();
            window.open(e.target.href, "_blank");
            console.log("Artist link clicked, redirecting to:", e.target.href);
            e.stopImmediatePropagation();
            return false;
        }
    });

    Array.from(document.querySelectorAll(".card")).forEach((card, index) => {
        card.addEventListener("click", async (e) => {
            if (!e.target.closest(".artist-link") && !e.target.classList.contains("artist-link")) {
                const album = albums[index];
                console.log(`Card ${index + 1} clicked/tapped, loading folder: ${album.folder}`);
                songs = await getSongs(album.folder);
                currentFolder = album.folder;
                let songUL = document.querySelector(".songlist ul");
                songUL.innerHTML = "";
                for (const song of songs) {
                    const displayName = song.replace(/%20/g, " ");
                    songUL.innerHTML += `<li>
                                <img class="invert" src="music.svg" alt="music">
                                <div class="info">
                                    <div>${displayName}</div>
                                    <div>KBR EDITS</div>
                                </div>
                                <div class="playNow">
                                    <span>Play Now</span>
                                    <img class="invert" src="play.svg" alt="playButton">
                                </div>
                            </li>`;
                }
                Array.from(songUL.getElementsByTagName("li")).forEach((e, idx) => {
                    e.addEventListener("click", () => {
                        let selectedSong = songs[idx]; // Use raw name
                        if (currentIndex === idx && currentSong.src.includes(selectedSong)) {
                            if (currentSong.paused) {
                                currentSong.play();
                                document.getElementById("play").src = "pause.svg";
                            } else {
                                currentSong.pause();
                                document.getElementById("play").src = "play.svg";
                            }
                        } else {
                            currentIndex = idx;
                            playMusic(selectedSong, album.folder);
                        }
                    });
                });
                attachPlayNowListeners();
                if (songs.length > 0) {
                    currentIndex = 0;
                    const selectedSong = songs[0];
                    console.log("Card clicked, playing song:", selectedSong, "Folder:", album.folder);
                    playMusic(selectedSong, album.folder);
                    document.querySelector(".songinfo").innerHTML = selectedSong.replace(/%20/g, " ");
                    document.querySelector(".songtime").innerHTML = `00:00 / 00:00`;
                    const audio = new Audio(`${album.folder}${selectedSong}`); // Relative path
                    audio.addEventListener("loadedmetadata", () => {
                        document.querySelector(".songtime").innerHTML = `00:00 / ${formatTime(audio.duration)}`;
                    });
                    document.querySelectorAll(".playNow img").forEach(img => img.src = "play.svg");
                    const currentPlayNow = document.querySelector(`.songlist li:nth-child(${currentIndex + 1}) .playNow img`);
                    if (currentPlayNow) {
                        currentPlayNow.src = "pause.svg";
                    } else {
                        console.error("playNow not found for index:", currentIndex);
                    }
                    document.getElementById("play").src = "pause.svg";
                }
                if (window.innerWidth <= 900) {
                    document.querySelector(".left").style.left = "0";
                }
            }
        });
    });

    attachPlayNowListeners();

    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.src) {
            if (currentSong.paused) {
                // Instead of directly calling currentSong.play(), re-call playMusic to ensure the correct song plays
                const currentSongInList = songs[currentIndex];
                if (currentSongInList) {
                    const songData = allSongs.find(song => song.rawName === currentSongInList);
                    const songFolder = songData ? songData.folder : currentFolder;
                    playMusic(currentSongInList, songFolder);
                } else {
                    // Fallback: If the song isn't in the list, just play the current audio
                    currentSong.play();
                    document.getElementById("play").src = "pause.svg";
                    const currentSongLi = document.querySelector(`.songlist li:nth-child(${currentIndex + 1}) .playNow img`);
                    if (currentSongLi) currentSongLi.src = "pause.svg";
                }
            } else {
                currentSong.pause();
                document.getElementById("play").src = "play.svg";
                const currentSongLi = document.querySelector(`.songlist li:nth-child(${currentIndex + 1}) .playNow img`);
                if (currentSongLi) currentSongLi.src = "play.svg";
            }
        } else {
            if (songs.length > 0) {
                currentIndex = 0;
                const firstSong = songs[0];
                playMusic(firstSong, currentFolder);
                const displayName = firstSong.replace("songs/", "").replace(/%20/g, " ");
                document.querySelector(".songinfo").innerHTML = displayName;
                document.querySelector(".songtime").innerHTML = `00:00 / 00:00`;
                const audio = new Audio(firstSong);
                audio.addEventListener("loadedmetadata", () => {
                    document.querySelector(".songtime").innerHTML = `00:00 / ${formatTime(audio.duration)}`;
                });
                document.getElementById("play").src = "pause.svg";
                const firstPlayNow = document.querySelector(`.songlist li:nth-child(${currentIndex + 1}) .playNow img`);
                if (firstPlayNow) firstPlayNow.src = "pause.svg";
                console.log("Played first song, SVG set to pause on songlist and playbar");
            }
        }
    });
    document.getElementById("next").addEventListener("click", playNext);
    document.getElementById("previous").addEventListener("click", playPrevious);

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    currentSong.addEventListener("ended", () => {
        playNext();
        document.querySelectorAll(".playNow img").forEach(img => img.src = "play.svg");
        const currentSongLi = document.querySelector(`.songlist li:nth-child(${currentIndex + 1}) .playNow img`);
        if (currentSongLi) currentSongLi.src = "pause.svg";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        if (!currentSong.duration || isNaN(currentSong.duration)) {
            console.warn("Cannot seek: Song duration is not available yet.");
            return;
        }
        let percentage = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percentage + "%";
        currentSong.currentTime = (currentSong.duration * percentage) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    const volumeRange = document.getElementById("volume-range");
    const volumeIcon = document.querySelector(".volume-control img");
    const volumeControl = document.querySelector(".volume-control");

    if (volumeRange && volumeIcon && volumeControl) {
        volumeRange.min = 0;
        volumeRange.max = 100;
        volumeRange.value = currentSong.volume * 100;

        function updateVolume() {
            const volumeValue = volumeRange.value;
            currentSong.volume = volumeValue / 100;

            if (volumeValue == 0) {
                volumeIcon.src = "mute.svg";
                volumeIcon.alt = "mute icon";
            } else if (volumeValue <= 50) {
                volumeIcon.src = "low-volume.svg";
                volumeIcon.alt = "low volume icon";
            } else {
                volumeIcon.src = "volume.svg";
                volumeIcon.alt = "volume icon";
            }
        }

        volumeRange.addEventListener("input", () => {
            updateVolume();
        });

        volumeIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleVolumeSlider();
        });

        volumeIcon.addEventListener("touchstart", (e) => {
            e.stopPropagation();
            if (!volumeControl.classList.contains("show") && e.cancelable) {
                e.preventDefault();
            }
            console.log("Touch started (mobile)");
        }, { passive: false });

        volumeIcon.addEventListener("touchend", (e) => {
            e.stopPropagation();
            toggleVolumeSlider();
        });

        function toggleVolumeSlider() {
            if (currentSong.volume > 0) {
                currentSong.volume = 0;
                volumeRange.value = 0;
                volumeIcon.src = "mute.svg";
                volumeIcon.alt = "mute icon";
            } else {
                currentSong.volume = 0.5;
                volumeRange.value = 50;
                volumeIcon.src = "volume.svg";
                volumeIcon.alt = "volume icon";
            }
            volumeControl.classList.toggle("show");
        }

        document.addEventListener("touchstart", (e) => {
            if (!volumeControl.contains(e.target)) {
                volumeControl.classList.remove("show");
            }
        }, { passive: true });

        document.addEventListener("click", (e) => {
            if (!volumeControl.contains(e.target)) {
                volumeControl.classList.remove("show");
            }
        });

        volumeRange.addEventListener("change", () => {
            if ("ontouchstart" in window || navigator.maxTouchPoints) {
                setTimeout(() => {
                    volumeControl.classList.remove("show");
                }, 300);
            }
        });

        updateVolume();
    } else {
        console.error("Volume elements not found in DOM!");
    }

    const searchToggle = document.querySelector(".search-toggle");
    const searchBar = document.querySelector(".search-bar");
    const searchInput = document.querySelector(".search-input");
    const searchClose = document.querySelector(".search-close");

    async function fetchAllSongs() {
        try {
            const response = await fetch("/albums.json");
            if (!response.ok) {
                throw new Error(`Failed to fetch albums.json: ${response.status} ${response.statusText}`);
            }
            const albums = await response.json();
            console.log("Albums loaded:", albums);
            allSongs = [];

            // Add initial songs (not part of any album)
            initialSongs.forEach(song => {
                allSongs.push({
                    name: song.replace("songs/", "").replace(/%20/g, " "), // Display name without "songs/"
                    rawName: song, // Raw name for playback (includes "songs/")
                    folder: "songs/",
                    artist: "Various Artists"
                });
            });

            // Add songs from albums
            for (const album of albums) {
                console.log(`Processing songs from folder: ${album.folder}`);
                const songs = album.songs || [];
                console.log(`Songs for ${album.folder}:`, songs);
                songs.forEach(song => {
                    allSongs.push({
                        name: song.replace(/%20/g, " "), // Display name with spaces
                        rawName: song, // Raw name for playback
                        folder: album.folder,
                        artist: album.artist.map(a => a.name).join(", ")
                    });
                });
            }
            console.log("All songs fetched for search:", allSongs);
        } catch (error) {
            console.error("Error in fetchAllSongs:", error);
            allSongs = [];
        }
    }

    searchToggle.addEventListener("click", async () => {
        searchBar.classList.toggle("active");
        if (searchBar.classList.contains("active")) {
            searchInput.focus();
        } else {
            searchInput.value = "";
            songs = await getSongs(currentFolder);
            let songUL = document.querySelector(".songlist ul");
            songUL.innerHTML = "";
            for (const song of songs) {
                const displayName = song.replace("songs/", "").replace(/%20/g, " ");
                songUL.innerHTML += `<li>
                    <img class="invert" src="music.svg" alt="music">
                    <div class="info">
                        <div>${displayName}</div>
                        <div>KBR EDITS</div>
                    </div>
                    <div class="playNow">
                        <span>Play Now</span>
                        <img class="invert" src="play.svg" alt="playButton">
                    </div>
                </li>`;
            }
            attachPlayNowListeners();
        }
    });

    searchClose.addEventListener("click", async () => {
        searchBar.classList.remove("active");
        searchInput.value = "";
        songs = await getSongs(currentFolder);
        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            const displayName = song.replace("songs/", "").replace(/%20/g, " ");
            songUL.innerHTML += `<li>
                <img class="invert" src="music.svg" alt="music">
                <div class="info">
                    <div>${displayName}</div>
                    <div>KBR EDITS</div>
                </div>
                <div class="playNow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="playButton">
                </div>
            </li>`;
        }
        attachPlayNowListeners();
    });

    searchInput.addEventListener("input", async () => {
        console.log("Search input changed:", searchInput.value);
        const query = searchInput.value.trim().toLowerCase();
        let songUL = document.querySelector(".songlist ul");
        console.log("songUL element in search:", songUL);
        if (!songUL) {
            console.error("songUL not found in the DOM during search!");
            return;
        }
        songUL.innerHTML = "";
    
        let filteredSongs = []; // Declare filteredSongs here to use it later
    
        if (query === "") {
            songs = await getSongs(currentFolder);
            console.log("Songs for current folder:", songs);
            for (const song of songs) {
                const displayName = song.replace("songs/", "").replace(/%20/g, " ");
                songUL.innerHTML += `<li>
                    <img class="invert" src="music.svg" alt="music">
                    <div class="info">
                        <div>${displayName}</div>
                        <div>KBR EDITS</div>
                    </div>
                    <div class="playNow">
                        <span>Play Now</span>
                        <img class="invert" src="play.svg" alt="playButton">
                    </div>
                </li>`;
            }
        } else {
            console.log("allSongs before filtering:", allSongs);
            filteredSongs = allSongs.filter(song =>
                song.name.toLowerCase().includes(query) ||
                song.artist.toLowerCase().includes(query)
            );
            console.log("Filtered songs:", filteredSongs);
    
            // Update the global songs array to the filtered list
            songs = filteredSongs.map(song => song.rawName);
            filteredSongs.forEach(song => {
                songUL.innerHTML += `<li>
                    <img class="invert" src="music.svg" alt="music">
                    <div class="info">
                        <div>${song.name}</div>
                        <div>${song.artist}</div>
                    </div>
                    <div class="playNow">
                        <span>Play Now</span>
                        <img class="invert" src="play.svg" alt="playButton">
                    </div>
                </li>`;
            });
        }
    
        console.log("songUL content after search:", songUL.innerHTML);
        console.log(`After search - songs: ${songs}, currentIndex: ${currentIndex}, currentFolder: ${currentFolder}`);
    
        // Attach click listeners to the entire <li> element
        Array.from(songUL.getElementsByTagName("li")).forEach((e, idx) => {
            e.addEventListener("click", (event) => {
                // Prevent the click on "Play Now" from triggering the <li> click event twice
                if (event.target.closest(".playNow")) return;
    
                const selectedSong = filteredSongs.length > 0 ? filteredSongs[idx]?.rawName : songs[idx];
                const selectedFolder = filteredSongs.length > 0 ? filteredSongs[idx]?.folder : currentFolder;
                console.log(`<li> clicked - Playing song: ${selectedSong} from folder: ${selectedFolder}`);
    
                if (filteredSongs.length > 0) {
                    songs = filteredSongs.map(song => song.rawName);
                    console.log("Updated songs array in search mode:", songs);
                }
    
                if (currentIndex === idx && currentSong.src.includes(selectedSong)) {
                    console.log(`Toggling play/pause for current song - currentSong.src: ${currentSong.src}`);
                    if (currentSong.paused) {
                        currentSong.play();
                        document.getElementById("play").src = "pause.svg";
                        const playImg = e.querySelector(".playNow img");
                        if (playImg) playImg.src = "pause.svg";
                    } else {
                        currentSong.pause();
                        document.getElementById("play").src = "play.svg";
                        const playImg = e.querySelector(".playNow img");
                        if (playImg) playImg.src = "play.svg";
                    }
                } else {
                    currentIndex = idx;
                    currentFolder = selectedFolder;
                    console.log(`Before playMusic - Song: ${selectedSong}, Folder: ${selectedFolder}, Songs: ${songs}, currentIndex: ${currentIndex}`);
                    playMusic(selectedSong, selectedFolder);
                    document.querySelectorAll(".playNow img").forEach(img => img.src = "play.svg");
                    const playImg = e.querySelector(".playNow img");
                    if (playImg) playImg.src = "pause.svg";
                }
            });
    
            // Attach a separate click listener to the "Play Now" button
            const playNowButton = e.querySelector(".playNow");
            if (playNowButton) {
                playNowButton.addEventListener("click", (event) => {
                    event.stopPropagation(); // Prevent the <li> click event from firing
    
                    const selectedSong = filteredSongs.length > 0 ? filteredSongs[idx]?.rawName : songs[idx];
                    const selectedFolder = filteredSongs.length > 0 ? filteredSongs[idx]?.folder : currentFolder;
                    console.log(`Play Now button clicked - Playing song: ${selectedSong} from folder: ${selectedFolder}`);
    
                    if (filteredSongs.length > 0) {
                        songs = filteredSongs.map(song => song.rawName);
                        console.log("Updated songs array in search mode:", songs);
                    }
    
                    if (currentIndex === idx && currentSong.src.includes(selectedSong)) {
                        console.log(`Toggling play/pause for current song - currentSong.src: ${currentSong.src}`);
                        if (currentSong.paused) {
                            currentSong.play().then(() => {
                                console.log("Song played successfully after Play Now click");
                                document.getElementById("play").src = "pause.svg";
                                const playImg = e.querySelector(".playNow img");
                                if (playImg) playImg.src = "pause.svg";
                            }).catch(error => {
                                console.error("Error playing song after Play Now click:", error);
                                document.getElementById("play").src = "play.svg";
                            });
                        } else {
                            currentSong.pause();
                            document.getElementById("play").src = "play.svg";
                            const playImg = e.querySelector(".playNow img");
                            if (playImg) playImg.src = "play.svg";
                        }
                    } else {
                        currentIndex = idx;
                        currentFolder = selectedFolder;
                        console.log(`Before playMusic - Song: ${selectedSong}, Folder: ${selectedFolder}, Songs: ${songs}, currentIndex: ${currentIndex}`);
                        playMusic(selectedSong, selectedFolder);
                        document.querySelectorAll(".playNow img").forEach(img => img.src = "play.svg");
                        const playImg = e.querySelector(".playNow img");
                        if (playImg) playImg.src = "pause.svg";
                    }
                });
            }
        });
    
        // Remove the separate attachPlayNowListeners() call since we're handling it here
        // attachPlayNowListeners();
    });

}

main();

// searchInput.addEventListener("input", async () => {
//     console.log("Search input changed:", searchInput.value);
//     const query = searchInput.value.trim().toLowerCase();
//     let songUL = document.querySelector(".songlist ul");
//     console.log("songUL element in search:", songUL);
//     if (!songUL) {
//         console.error("songUL not found in the DOM during search!");
//         return;
//     }
//     songUL.innerHTML = "";

//     let filteredSongs = []; // Declare filteredSongs here to use it later

//     if (query === "") {
//         songs = await getSongs(currentFolder);
//         console.log("Songs for current folder:", songs);
//         for (const song of songs) {
//             const displayName = song.replace("songs/", "").replace(/%20/g, " ");
//             songUL.innerHTML += `<li>
//                 <img class="invert" src="music.svg" alt="music">
//                 <div class="info">
//                     <div>${displayName}</div>
//                     <div>KBR EDITS</div>
//                 </div>
//                 <div class="playNow">
//                     <span>Play Now</span>
//                     <img class="invert" src="play.svg" alt="playButton">
//                 </div>
//             </li>`;
//         }
//     } else {
//         console.log("allSongs before filtering:", allSongs);
//         filteredSongs = allSongs.filter(song =>
//             song.name.toLowerCase().includes(query) ||
//             song.artist.toLowerCase().includes(query)
//         );
//         console.log("Filtered songs:", filteredSongs);

//         // Update the global songs array to the filtered list
//         songs = filteredSongs.map(song => song.rawName);
//         filteredSongs.forEach(song => {
//             songUL.innerHTML += `<li>
//                 <img class="invert" src="music.svg" alt="music">
//                 <div class="info">
//                     <div>${song.name}</div>
//                     <div>${song.artist}</div>
//                 </div>
//                 <div class="playNow">
//                     <span>Play Now</span>
//                     <img class="invert" src="play.svg" alt="playButton">
//                 </div>
//             </li>`;
//         });
//     }

//     console.log("songUL content after search:", songUL.innerHTML);

// //     Array.from(songUL.getElementsByTagName("li")).forEach((e, idx) => {
// //         e.addEventListener("click", () => {
// //             const selectedSong = filteredSongs.length > 0 ? filteredSongs[idx]?.rawName : songs[idx];
// //             const selectedFolder = filteredSongs.length > 0 ? filteredSongs[idx]?.folder : currentFolder;
// //             console.log(`Playing song: ${selectedSong} from folder: ${selectedFolder}`);

// //             if (filteredSongs.length > 0) {
// //                 // If we're in search mode, update the global songs array to the filtered list
// //                 songs = filteredSongs.map(song => song.rawName);
// //             }

// //             if (currentIndex === idx && currentSong.src.includes(selectedSong)) {
// //                 if (currentSong.paused) {
// //                     currentSong.play();
// //                     document.getElementById("play").src = "pause.svg";
// //                 } else {
// //                     currentSong.pause();
// //                     document.getElementById("play").src = "play.svg";
// //                 }
// //             } else {
// //                 currentIndex = idx;
// //                 currentFolder = selectedFolder;
// //                 console.log(`Before playMusic - Song: ${selectedSong}, Folder: ${selectedFolder}, Songs:`, songs);
// //                 playMusic(selectedSong, selectedFolder);
// //             }
// //         });
// //     });
// //     attachPlayNowListeners();
// // });
// Array.from(songUL.getElementsByTagName("li")).forEach((e, idx) => {
//     e.addEventListener("click", () => {
//         const selectedSong = filteredSongs.length > 0 ? filteredSongs[idx]?.rawName : songs[idx];
//     const selectedFolder = filteredSongs.length > 0 ? filteredSongs[idx]?.folder : currentFolder;
//     console.log(`Playing song: ${selectedSong} from folder: ${selectedFolder}`);
    
//     if (filteredSongs.length > 0) {
//         // If we're in search mode, update the global songs array to the filtered list
//         songs = filteredSongs.map(song => song.rawName);
//     }
    
//     if (currentIndex === idx && currentSong.src.includes(selectedSong)) {
//         if (currentSong.paused) {
//             currentSong.play();
//             document.getElementById("play").src = "pause.svg";
//             // Update the song list SVG icon
//             const playImg = e.querySelector(".playNow img");
//             if (playImg) playImg.src = "pause.svg";
//         } else {
//             currentSong.pause();
//             document.getElementById("play").src = "play.svg";
//             // Update the song list SVG icon
//             const playImg = e.querySelector(".playNow img");
//             if (playImg) playImg.src = "play.svg";
//         }
//     } else {
//         currentIndex = idx;
//         currentFolder = selectedFolder;
//         console.log(`Before playMusic - Song: ${selectedSong}, Folder: ${selectedFolder}, Songs:`, songs);
//         playMusic(selectedSong, selectedFolder);
//         // Ensure all other song list items show the play icon, and the current one shows pause
//         document.querySelectorAll(".playNow img").forEach(img => img.src = "play.svg");
//         const playImg = e.querySelector(".playNow img");
//         if (playImg) playImg.src = "pause.svg";
//     }
// });
// });
// attachPlayNowListeners();
// });