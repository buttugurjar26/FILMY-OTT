import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

const container = document.getElementById("myListMovies");

function getMyList() {
    return [...new Set(JSON.parse(localStorage.getItem("myList")) || [])];
}

// LOAD MY LIST
async function loadMyList() {
    if (!container) return;
    container.innerHTML = "";

    let myList = getMyList();

    if (myList.length === 0) {
        container.innerHTML = `
            <div class="empty-list" style="grid-column: 1 / -1; width: 100%;">
                <h2 style="text-align:center; color:#5b3500; font-size:16px;">
                    ❤️ Your My List is Empty
                </h2>
            </div>
        `;
        return;
    }

    try {
        const { data: allMovies, error } = await supabase
            .from("movies")
            .select("*");

        if (error) {
            throw error;
        }

        let moviesHTML = "";

        myList.forEach(id => {
            let movie = allMovies.find(item => String(item.id) === String(id));

            if (movie) {
                moviesHTML += `
                    <div class="movie-card" onclick="openMovie('${movie.id}')">
                        <img src="${movie.poster_url || 'logo-192.png'}">
                        <h3>${movie.title || "Movie"}</h3>
                        <button class="watchBtn" data-lang="watchNow">
                            ▶ Watch Now
                        </button>
                        <button class="removeBtn" data-lang="remove" onclick="event.stopPropagation(); removeMovie('${movie.id}')">
                            Remove
                        </button>
                    </div>
                `;
            }
        });

        if (moviesHTML === "") {
            container.innerHTML = `
                <div class="empty-list" style="grid-column: 1 / -1; width: 100%;">
                    <h2 style="text-align:center; color:#5b3500; font-size:16px;">
                        ❤️ Your My List is Empty
                    </h2>
                </div>
            `;
        } else {
            container.innerHTML = moviesHTML;
        }

    } catch (error) {
        console.error("My List Error:", error);
    }
}

// OPEN MOVIE
window.openMovie = function (id) {
    window.location.href = "movie-details.html?id=" + encodeURIComponent(id);
};

// REMOVE MOVIE
window.removeMovie = function (id) {
    let myList = getMyList();
    myList = myList.filter(movieId => String(movieId) !== String(id));

    localStorage.setItem("myList", JSON.stringify(myList));

    loadMyList().then(() => {
        if (typeof applyLanguage === "function") {
            applyLanguage();
        }
    });
};

// INITIAL LOAD
loadMyList().then(() => {
    if (typeof applyLanguage === "function") {
        applyLanguage();
    }
});

// HEADER PROFILE AVATAR
const headerProfile = document.getElementById("headerProfile");
if (headerProfile) {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userAvatar = localStorage.getItem("userAvatar");

    if (isLoggedIn === "true" && userAvatar) {
        headerProfile.src = userAvatar;
    } else {
        headerProfile.src = "avatar-1.png";
    }
}
