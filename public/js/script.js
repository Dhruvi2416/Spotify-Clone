// --- helper escape
function escapeHTML(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- Globals
let currentSong = new Audio();
let playButton = document.getElementById("play-button"); // main play/pause control
let songs = [];
let currFolder = ""; // '/songs/WeddingSongs'
let cardContainer = document.querySelector(".card-container"); // ensure HTML uses .card-container
let libraryCards = document.querySelector(".library-cards");

// --- getSongs now reads info.json instead of directory listing
async function getSongs(folderName) {
  // folderName example: "WeddingSongs" (no leading /)
  currFolder = `/songs/${folderName}`; // normalized absolute folder path
  try {
    const res = await fetch(`${currFolder}/info.json`);
    if (!res.ok) {
      console.warn(`info.json not found for ${folderName}: ${res.status}`);
      songs = [];
      return songs;
    }
    const info = await res.json();
    const tracks = info.tracks || info.songs || [];
    // keep tracks as strings (file names)
    songs = tracks.map((t) => (typeof t === "string" ? t : t.file || t.name));
  } catch (err) {
    console.error("Error loading tracks:", err);
    songs = [];
  }

  // render song list
  libraryCards.innerHTML = "";
  const frag = document.createDocumentFragment();
  songs.forEach((track) => {
    const card = document.createElement("div");
    card.className = "song-card flex p-1";
    card.innerHTML = `
      <div class="invert"><img src="/assets/music.svg" alt="Music logo"></div>
      <div class="song-info">
        <h5>${escapeHTML(track)}</h5>
        <p>Maanu , Annural Khalid</p>
      </div>
      <div class="play-now-img flex">
        <span>Play Now</span>
        <div class="playbtn">
          <img class="invert play-now-btn" src="/assets/play-button.svg" alt="Play button" />
        </div>
      </div>`;
    frag.appendChild(card);
  });
  libraryCards.appendChild(frag);

  return songs;
}

const playMusic = (track, pause = false) => {
  if (!track) return;
  // build URL and encode it (handles spaces)
  const src = `${currFolder}/${track}`;
  currentSong.src = encodeURI(src);

  if (!pause) {
    // attempt to play, handle promise
    currentSong.play().catch((e) => console.warn("Play prevented:", e));
    if (playButton) playButton.src = "/assets/resume-button.svg";
  }

  const infoEl = document.querySelector(".playbar-songinfo");
  if (infoEl) infoEl.textContent = decodeURI(track);

  const timeline = document.querySelector(".timeline");
  if (timeline) timeline.textContent = "00:00/00:00";
};

const playPauseDisplayButton = (play_button) => {
  if (currentSong.paused) {
    play_button.src = "/assets/resume-button.svg";
    currentSong.play().catch((e) => console.warn("Play prevented:", e));
  } else {
    play_button.src = "/assets/play-button.svg";
    currentSong.pause();
  }
};

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const mm = mins < 10 ? "0" + mins : mins;
  const ss = secs < 10 ? "0" + secs : secs;
  return `${mm}:${ss}`;
}

// --- displayAlbums uses /songs/albums.json
async function displayAlbums() {
  try {
    const listRes = await fetch("/songs/albums.json");
    if (!listRes.ok) {
      console.warn("albums.json not found at /songs/albums.json");
      return;
    }
    const albums = await listRes.json();
    cardContainer.innerHTML = "";
    const frag = document.createDocumentFragment();

    // Load info.json for each album
    for (const alb of albums) {
      const folder = alb.folder;
      try {
        const infoRes = await fetch(`/songs/${folder}/info.json`);
        if (!infoRes.ok) {
          console.warn(`info.json missing for ${folder}`);
          continue;
        }
        const info = await infoRes.json();
        const div = document.createElement("div");
        div.className = "card";
        div.dataset.folder = folder;
        const cover = info.cover || alb.cover || "cover.jpg";
        div.innerHTML = `
          <div class="card-img-section">
            <img src="/songs/${folder}/${cover}" alt="${escapeHTML(
          info.title || folder
        )}" />
            <img class="play-button" src="/assets/play-button.svg" alt="Play button" />
          </div>
          <h2 title="${escapeHTML(info.title || "")}">${escapeHTML(
          info.title || folder
        )}</h2>
          <p title="${escapeHTML(info.description || "")}">${escapeHTML(
          info.description || ""
        )}</p>
        `;
        frag.appendChild(div);
      } catch (err) {
        console.warn(`Error reading info.json for ${folder}`, err);
      }
    }

    cardContainer.appendChild(frag);
  } catch (err) {
    console.error("Error loading albums.json:", err);
  }
}

// --- Event listeners & main
async function main() {
  // display albums (so user can click an album)
  await displayAlbums();

  // attach top play button
  if (playButton) {
    playButton.addEventListener("click", () =>
      playPauseDisplayButton(playButton)
    );
  }

  // audio timeupdate
  currentSong.addEventListener("timeupdate", () => {
    const timeline = document.querySelector(".timeline");
    if (timeline)
      timeline.textContent = `${formatTime(
        currentSong.currentTime
      )}/${formatTime(currentSong.duration)}`;

    const circle = document.querySelector(".circle");
    if (
      circle &&
      currentSong.duration &&
      !isNaN(currentSong.duration) &&
      currentSong.duration > 0
    ) {
      const percent = (currentSong.currentTime / currentSong.duration) * 100;
      circle.style.left = percent + "%";
    }
  });

  // seekbar click
  const seekbar = document.querySelector(".seekbar");
  if (seekbar) {
    seekbar.addEventListener("click", (e) => {
      const w = e.currentTarget.getBoundingClientRect().width;
      const percent = (e.offsetX / w) * 100;
      const circle = document.querySelector(".circle");
      if (circle) circle.style.left = percent + "%";
      if (currentSong.duration && !isNaN(currentSong.duration)) {
        currentSong.currentTime = (currentSong.duration * percent) / 100;
      }
    });
  }

  // card click via delegation
  if (cardContainer) {
    cardContainer.addEventListener("click", async (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const folder = card.dataset.folder;
      if (!folder) return;
      const list = await getSongs(folder);
      if (list.length > 0) {
        playMusic(list[0]);
      }
    });
  }

  // songs list click via delegation
  if (libraryCards) {
    libraryCards.addEventListener("click", (e) => {
      const songCard = e.target.closest(".song-card");
      if (!songCard) return;
      const track = songCard.querySelector(".song-info h5").textContent;
      playMusic(track);
    });
  }

  // previous / next
  const prevBtn = document.getElementById("previousSong");
  const nextBtn = document.getElementById("nextSong");
  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      const idx = songs.indexOf(
        decodeURI(currentSong.src.split(`${currFolder}/`)[1] || "")
      );
      if (idx > 0) playMusic(songs[idx - 1]);
    });
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      const idx = songs.indexOf(
        decodeURI(currentSong.src.split(`${currFolder}/`)[1] || "")
      );
      if (idx + 1 < songs.length) playMusic(songs[idx + 1]);
    });
}

// run after DOM loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
