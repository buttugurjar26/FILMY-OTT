import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

let relatedMovies = [];

// ===============================
// LOGIN CHECK
// ===============================

const isLoggedIn = localStorage.getItem("isLoggedIn");

if (isLoggedIn !== "true") {

    localStorage.setItem(
        "redirectAfterLogin",
        window.location.href
    );

    alert("Please Login First");

    window.location.href = "login.html";
}


// ===============================
// GET MOVIE ID
// ===============================

const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

const player = document.getElementById("videoPlayer");
const loading = document.getElementById("loading");


// ===============================
// MOVIE DETAILS
// ===============================

const movieTitle =
    document.getElementById("movieTitle");

const movieGenre =
    document.getElementById("movieGenre");

const movieYear =
    document.getElementById("movieYear");

const movieLanguage =
    document.getElementById("movieLanguage");


// ===============================
// LOAD MOVIE
// ===============================

async function loadMovie() {

    if (!movieId || !player) return;

    try {

        if (loading) {
            loading.style.display = "block";
        }

        const { data: movie, error } = await supabase
            .from("movies")
            .select("*")
            .eq("id", movieId)
            .single();

        if (error || !movie) {

            if (loading) {
                loading.style.display = "none";
            }

            document.querySelector(".player-section").innerHTML = `
                <h2 style="text-align:center;">
                    Movie Not Found
                </h2>
            `;

            return;
        }


        // ===============================
        // SAVE WATCH HISTORY
        // ===============================

        let history =
            JSON.parse(
                localStorage.getItem("watchHistory")
            ) || [];

        history =
            history.filter(id => id != movieId);

        history.unshift(movieId);

        localStorage.setItem(
            "watchHistory",
            JSON.stringify(history)
        );


        // ===============================
        // MOVIE DETAILS
        // ===============================

        if (movieTitle) {

            movieTitle.textContent =
                movie.title || "Movie";

        }


        if (movieGenre) {

            movieGenre.textContent =
                movie.category || "Movie";

        }


        if (movieYear) {

            movieYear.textContent =
                movie.release_year ||
                movie.movieyear ||
                movie.year ||
                "N/A";

        }


        if (movieLanguage) {

            movieLanguage.textContent =
                movie.language || "Hindi";

        }


        // ===============================
        // LOAD VIDEO
        // ===============================

        player.poster =
            movie.poster_url || "logo-192.png";

        player.src =
            movie.video_url || "";

        player.load();


        // ===============================
        // RELATED MOVIES
        // ===============================

        loadRelatedMovies(movie.category);


    } catch (error) {

        console.error(
            "Movie Load Error:",
            error
        );

        if (loading) {
            loading.style.display = "none";
        }

    }

}


// ===============================
// VIDEO LOADED
// ===============================

player.addEventListener(
    "loadedmetadata",
    () => {

        if (loading) {
            loading.style.display = "none";
        }


        // Resume previous position

        const lastTime =
            localStorage.getItem(
                "watch_" + movieId
            );

        if (lastTime) {

            player.currentTime =
                Number(lastTime);

        }


        // Total duration

        const totalTime =
            document.getElementById("totalTime");

        if (totalTime) {

            totalTime.textContent =
                formatTime(player.duration);

        }


        // Auto play

        player.play().catch(() => {});

    }
);


// ===============================
// WATCH PROGRESS
// ===============================

player.addEventListener(
    "timeupdate",
    () => {

        localStorage.setItem(
            "watch_" + movieId,
            player.currentTime
        );


        const progress =
            document.getElementById(
                "progressBar"
            );

        if (
            progress &&
            player.duration
        ) {

            progress.value =
                (
                    player.currentTime /
                    player.duration
                ) * 100;

        }


        const currentTime =
            document.getElementById(
                "currentTime"
            );

        if (currentTime) {

            currentTime.textContent =
                formatTime(
                    player.currentTime
                );

        }

    }
);


// ===============================
// SEEK BAR
// ===============================

const progressBar =
    document.getElementById("progressBar");

if (progressBar) {

    progressBar.addEventListener(
        "input",
        () => {

            if (player.duration) {

                player.currentTime =
                    (
                        progressBar.value /
                        100
                    ) * player.duration;

            }

        }
    );

}


// ===============================
// PLAY / PAUSE
// ===============================

const playPauseBtn =
    document.getElementById(
        "playPauseBtn"
    );

if (playPauseBtn) {

    playPauseBtn.onclick = (event) => {

        event.stopPropagation();

        const icon =
            playPauseBtn.querySelector("i");

        if (player.paused) {

            player.play();

            if (icon) {
                icon.className =
                    "fa-solid fa-pause";
            }

        } else {

            player.pause();

            if (icon) {
                icon.className =
                    "fa-solid fa-play";
            }

        }

    };

}


// ===============================
// UPDATE PLAY BUTTON
// ===============================

player.addEventListener(
    "play",
    () => {

        const icon =
            document.querySelector(
                "#playPauseBtn i"
            );

        if (icon) {

            icon.className =
                "fa-solid fa-pause";

        }

    }
);


player.addEventListener(
    "pause",
    () => {

        const icon =
            document.querySelector(
                "#playPauseBtn i"
            );

        if (icon) {

            icon.className =
                "fa-solid fa-play";

        }

    }
);


// ===============================
// BACKWARD 10 SEC
// ===============================

const backwardBtn =
    document.getElementById(
        "backwardBtn"
    );

if (backwardBtn) {

    backwardBtn.onclick = (event) => {

        event.stopPropagation();

        player.currentTime =
            Math.max(
                0,
                player.currentTime - 10
            );

    };

}


// ===============================
// FORWARD 10 SEC
// ===============================

const forwardBtn =
    document.getElementById(
        "forwardBtn"
    );

if (forwardBtn) {

    forwardBtn.onclick = (event) => {

        event.stopPropagation();

        player.currentTime =
            Math.min(
                player.duration || 0,
                player.currentTime + 10
            );

    };

}


// ===============================
// FULLSCREEN
// ===============================

const fullscreenBtn =
    document.getElementById(
        "fullscreenBtn"
    );

const playerContainer =
    document.querySelector(
        ".player-container"
    );


if (fullscreenBtn && playerContainer) {

    fullscreenBtn.onclick = async (event) => {

        event.stopPropagation();

        try {

            if (!document.fullscreenElement) {

                await playerContainer.requestFullscreen();

                // Landscape mode
                if (
                    screen.orientation &&
                    screen.orientation.lock
                ) {

                    try {

                        await screen.orientation.lock(
                            "landscape"
                        );

                    } catch (orientationError) {

                        console.log(
                            "Landscape lock not supported:",
                            orientationError
                        );

                    }

                }

            } else {

                await document.exitFullscreen();

            }

        } catch (error) {

            console.error(
                "Fullscreen Error:",
                error
            );

        }

    };

}


// ===============================
// FULLSCREEN CHANGE
// ===============================

document.addEventListener(
    "fullscreenchange",
    async () => {

        const isFullscreen =
            !!document.fullscreenElement;


        if (isFullscreen) {

            // Landscape mode
            if (
                screen.orientation &&
                screen.orientation.lock
            ) {

                try {

                    await screen.orientation.lock(
                        "landscape"
                    );

                } catch (error) {

                    console.log(
                        "Orientation lock unavailable:",
                        error
                    );

                }

            }


            // Fullscreen icon → exit
            const icon =
                fullscreenBtn?.querySelector("i");

            if (icon) {

                icon.className =
                    "fa-solid fa-compress";

            }

        } else {

            // Back to portrait
            if (
                screen.orientation &&
                screen.orientation.unlock
            ) {

                try {

                    screen.orientation.unlock();

                } catch (error) {

                    console.log(
                        "Orientation unlock unavailable:",
                        error
                    );

                }

            }


            // Exit fullscreen icon → expand
            const icon =
                fullscreenBtn?.querySelector("i");

            if (icon) {

                icon.className =
                    "fa-solid fa-expand";

            }

        }

    }
);

// ===============================
// TIME FORMAT
// ===============================

function formatTime(seconds) {

    if (
        isNaN(seconds) ||
        !isFinite(seconds)
    ) {

        return "00:00";

    }

    const min =
        Math.floor(seconds / 60);

    const sec =
        Math.floor(seconds % 60);

    return (
        String(min).padStart(2, "0") +
        ":" +
        String(sec).padStart(2, "0")
    );

}


// ===============================
// VIDEO ERROR
// ===============================

player.addEventListener(
    "error",
    () => {

        if (loading) {

            loading.style.display =
                "none";

        }

        console.error(
            "Video could not be loaded."
        );

    }
);


// ===============================
// RELATED MOVIES
// ===============================

async function loadRelatedMovies(category) {

    const container =
        document.getElementById(
            "relatedMovies"
        );

    if (!container) return;

    container.innerHTML = "";


    try {

        const { data, error } =
            await supabase
                .from("movies")
                .select("*")
                .eq("category", category)
                .neq("id", movieId)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(9);


        if (error) {

            console.error(
                "Related Movie Error:",
                error
            );

            return;

        }


        relatedMovies =
            data || [];


        if (
            relatedMovies.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-text">
                    No Related Movies Found
                </p>
            `;

            return;

        }


        relatedMovies.forEach(
            (movie) => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "movie-card";


                card.innerHTML = `

                    <img
                        src="${
                            movie.poster_url ||
                            "logo-192.png"
                        }"
                        alt="${
                            movie.title ||
                            "Movie"
                        }"
                    >

                    <h3>
                        ${
                            movie.title ||
                            "Movie"
                        }
                    </h3>

                `;


                card.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            "player.html?id=" +
                            movie.id;

                    }
                );


                container.appendChild(card);

            }
        );


    } catch (error) {

        console.error(
            "Related Movie Error:",
            error
        );

    }

}


// ===============================
// HEADER PROFILE
// ===============================

const headerProfile =
    document.getElementById(
        "headerProfile"
    );

if (headerProfile) {

    const userAvatar =
        localStorage.getItem(
            "userAvatar"
        );

    headerProfile.src =
        userAvatar ||
        "avatar-1.png";

}


// ===============================
// VIDEO OVERLAY
// ===============================

const overlay =
    document.getElementById(
        "videoOverlay"
    );

let overlayTimer;


function showOverlay() {

    if (!overlay) return;

    overlay.classList.add("show");

    clearTimeout(
        overlayTimer
    );

    overlayTimer =
        setTimeout(
            () => {

                overlay.classList.remove(
                    "show"
                );

            },
            3000
        );

}


player.addEventListener(
    "click",
    showOverlay
);

player.addEventListener(
    "play",
    showOverlay
);

player.addEventListener(
    "pause",
    showOverlay
);


// ===============================
// START
// ===============================

loadMovie();

applyLanguage();


// ===============================
// AUTO NEXT MOVIE
// ===============================

player.addEventListener(
    "ended",
    () => {

        if (
            relatedMovies.length > 0
        ) {

            window.location.href =
                "player.html?id=" +
                relatedMovies[0].id;

        }

    }
);
