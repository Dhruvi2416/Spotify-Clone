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
let playButton = document.getElementById("play-button");
let songs = [];
let currFolder = ""; // '/songs/WeddingSongs'
let cardContainer = document.querySelector(".card-container");
let libraryCards = document.querySelector(".library-cards");

// Define your album folders here
const albumFolders = [
  "WeddingSongs",
  "NCS",
  "CS",
  // Add more folder names as needed
];

// --- Load songs from info.json in a given folder
async function getSongs(folderName) {
  currFolder = `/songs/${folderName}`;
  try {
    const res = await fetch(`${currFolder}/info.json`);
    if (!res.ok) {
      console.warn(`info.json not found for ${folderName}`);
      songs = [];
      return songs;
    }
    const info = await res.json();
    const tracks = info.tracks || info.songs || [];
    songs = tracks.map((t) => (typeof t === "string" ? t : t.file || t.name));
  } catch (err) {
    console.error(`Error loading tracks for ${folderName}:`, err);
    songs = [];
  }

  // Render song list in left panel
  libraryCards.innerHTML = "";
  const frag = document.createDocumentFragment();
  songs.forEach((track) => {
    const card = document.createElement("div");
    card.className = "song-card flex p-1";
    card.innerHTML = `
      <div class="invert"><img src="/assets/music.svg" alt="Music logo"></div>
      <div class="song-info">
        <h5>${escapeHTML(track)}</h5>
        <p>Artist info here</p>
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

// --- Play given track
function playMusic(track, pause = false) {
  if (!track) return;
  const src = `${currFolder}/${track}`;
  currentSong.src = encodeURI(src);

  if (!pause) {
    currentSong.play().catch((e) => console.warn("Play prevented:", e));
    if (playButton) playButton.src = "/assets/resume-button.svg";
  }

  const infoEl = document.querySelector(".playbar-songinfo");
  if (infoEl) infoEl.textContent = decodeURI(track);

  const timeline = document.querySelector(".timeline");
  if (timeline) timeline.textContent = "00:00/00:00";
}

// --- Toggle play/pause
function playPauseDisplayButton(btn) {
  if (currentSong.paused) {
    btn.src = "/assets/resume-button.svg";
    currentSong.play().catch((e) => console.warn("Play prevented:", e));
  } else {
    btn.src = "/assets/play-button.svg";
    currentSong.pause();
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
}

// --- Display albums using info.json from each folder
async function displayAlbums() {
  cardContainer.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const folder of albumFolders) {
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
      const cover = info.cover || "cover.jpg";

      div.innerHTML = `
        <div class="card-img-section">
          <img src="/songs/${folder}/${cover}" alt="${escapeHTML(
        info.title || folder
      )}" />
          <img class="play-button" src="/assets/play-button.svg" alt="Play button" />
        </div>
        <h2 title="${escapeHTML(info.title || folder)}">${escapeHTML(
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
}

// --- Main
async function main() {
  await displayAlbums();

  if (playButton) {
    playButton.addEventListener("click", () =>
      playPauseDisplayButton(playButton)
    );
  }

  currentSong.addEventListener("timeupdate", () => {
    const timeline = document.querySelector(".timeline");
    if (timeline)
      timeline.textContent = `${formatTime(
        currentSong.currentTime
      )}/${formatTime(currentSong.duration)}`;

    const circle = document.querySelector(".circle");
    if (circle && currentSong.duration) {
      const percent = (currentSong.currentTime / currentSong.duration) * 100;
      circle.style.left = percent + "%";
    }
  });

  const seekbar = document.querySelector(".seekbar");
  if (seekbar) {
    seekbar.addEventListener("click", (e) => {
      const w = e.currentTarget.getBoundingClientRect().width;
      const percent = (e.offsetX / w) * 100;
      const circle = document.querySelector(".circle");
      if (circle) circle.style.left = percent + "%";
      if (currentSong.duration) {
        currentSong.currentTime = (currentSong.duration * percent) / 100;
      }
    });
  }

  if (cardContainer) {
    cardContainer.addEventListener("click", async (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const folder = card.dataset.folder;
      const list = await getSongs(folder);
      if (list.length > 0) {
        playMusic(list[0]);
      }
    });
  }

  if (libraryCards) {
    libraryCards.addEventListener("click", (e) => {
      const songCard = e.target.closest(".song-card");
      if (!songCard) return;
      const track = songCard.querySelector(".song-info h5").textContent;
      playMusic(track);
    });
  }

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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
