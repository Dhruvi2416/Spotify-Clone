let currentSong = new Audio();
let playButton = document.getElementById("play-button");
let songs;
let currFolder;
let cardContainer = document.querySelector(".card-contianer");

async function getSongs(folder) {
  currFolder = folder;
  let a = await fetch(`/${folder}`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;

  songs = [];
  let aTagsForSongs = div.getElementsByTagName("a");
  for (let i = 0; i < aTagsForSongs.length; i++) {
    let song = aTagsForSongs[i];

    if (song.href.endsWith(".mp3")) {
      songs.push(song.href.split(`${folder}`)[1]);
    }
  }

  let songList = document.querySelector(".library-cards");
  songList.innerHTML = "";
  for (let song = 0; song < songs.length; song++) {
    songList.innerHTML =
      songList.innerHTML +
      // <img
      //   class="flex library-photo aic"
      //   src="https://i.scdn.co/image/ab67616d00001e021344800458a38197bfc721f3"
      //   alt=""
      // />
      `<div class="song-card flex p-1">
             <div class="invert"><img src="assets/music.svg" alt="Music logo"></div>
              <div class="song-info">
                <h5>${songs[song].replaceAll("%20", " ")}</h5>
                <p>Maanu , Annural Khalid</p>
              </div>
              <div class="play-now-img flex">
              <span>Play Now</span>
              <div class="playbtn">
                <img
                  class="invert"
                  id="playButton"
                  src="assets/play-button.svg"
                  alt="Play button"
                />
              </div>
              </div>
            </div>`;
  }

  Array.from(
    document.querySelector(".library-cards").getElementsByClassName("song-card")
  ).forEach((e) => {
    e.addEventListener("click", () => {
      currentSong.pause();

      playMusic(
        e.querySelector(".song-info").getElementsByTagName("h5")[0].textContent
      );
    });
  });

  return songs;
}

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + track;

  if (!pause) {
    currentSong.play();
    playButton.src = "assets/resume-button.svg";
  }

  document.querySelector(".playbar-songinfo").innerHTML = decodeURI(track);
  document.querySelector(".timeline").innerHTML = "00:00/00:00";
};

const playPauseDisplayButton = (play_button) => {
  if (currentSong.paused) {
    play_button.src = "assets/resume-button.svg";

    currentSong.play();
  } else {
    play_button.src = "assets/play-button.svg";

    currentSong.pause();
  }
};

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  const formattedMins = mins < 10 ? "0" + mins : mins;
  const formattedSecs = secs < 10 ? "0" + secs : secs;

  return `${formattedMins}:${formattedSecs}`;
}

async function displayAlbums() {
  let a = await fetch(`/songs/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;

  let anchors = div.getElementsByTagName("a");

  let array = Array.from(anchors);

  for (let index = 0; index < array.length; index++) {
    let e = array[index];

    if (e.href.includes("/songs/")) {
      let folder = e.href.split("/").slice(-2)[0];
      try {
        let jsonFile = await fetch(`/songs/${folder}/info.json`);
        let response = await jsonFile.json();

        cardContainer.innerHTML =
          cardContainer.innerHTML +
          `<div data-folder=${folder} class="card">
          <div class="card-img-section">
            <img
              src="/songs/${folder}/cover.jpg"
              alt="Cover image"
            />
            <img
              class="play-button"
              src="assets/play-button.svg"
              alt="Play button"
            />
          </div>
          <h2 title=${response.title}>${response.title}</h2>
          <p title=${response.description}>${response.description}</p>
        </div>`;
      } catch (err) {
        console.log(err);
      }
    }
  }
}

async function main() {
  //List of all songs
  await getSongs("songs/WeddingSongs");

  playMusic(songs[0], true);

  //Display all albums
  await displayAlbums();

  //Attach an event listner to play next button
  playButton.addEventListener("click", () => {
    playPauseDisplayButton(playButton);
  });
  //Listen to timeupdate event of a song

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".timeline").innerHTML = `${formatTime(
      currentSong.currentTime
    )}/${formatTime(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%   ";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%   ";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  //Open menu
  document.querySelector(".menu-option").addEventListener("click", (e) => {
    document.querySelector(".left").style.left = 0 + "%";
  });

  //Close menu

  document.querySelector(".close-menu").addEventListener("click", (e) => {
    document.querySelector(".left").style.left = "-150%";
  });

  //Previous song button
  document.getElementById("previousSong").addEventListener("click", () => {
    let currentIndexOfSong = songs.indexOf(
      currentSong.src.split(`/${currFolder}/`)[1]
    );

    if (currentIndexOfSong > 0) {
      playMusic(songs[currentIndexOfSong - 1]);
    }
  });
  //Next song button
  document.getElementById("nextSong").addEventListener("click", () => {
    let currentIndexOfSong = songs.indexOf(
      currentSong.src.split(`/${currFolder}/`)[1]
    );

    if (currentIndexOfSong + 1 < songs.length) {
      playMusic(songs[currentIndexOfSong + 1]);
    }
  });

  //Show hide volume bar
  document.querySelector(".volume-btn").addEventListener("click", (e) => {
    document.querySelector(".volume-range").classList.toggle("show");
  });

  //Listen to volume
  document.querySelector(".volume-range").addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
    let volumeImg = document.querySelector(".volume-btn");

    if (currentSong.volume === 0) {
      volumeImg.src = "/assets/mute.svg";
    } else {
      volumeImg.src = "/assets/volume.svg";
    }
  });

  //Load songs according to folder playlist
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (e) => {
      // console.log(e.currentTarget.dataset.folder);
      //current target means that element where event is listned here card and target is that element where element is clicked like img btn etc of card

      songs = await getSongs(`songs/${e.currentTarget.dataset.folder}/`);
      playMusic(songs[0]);
    });
  });

  //   //Mute volue unmute volume
  //   document.querySelector(".volume-btn").addEventListener("click", (e) => {
  //     console.log("");

  //     console.log("E volume", e.target.src);
  //   });
}

// document.getElementById("playButton").addEventListener("click", main);
main();
