import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

alert("MOVIES JS LOADED");

let allMovies = [];

// ===============================
// CATEGORY TOGGLE
// ===============================

window.toggleCategory = function () {

    const menu = document.getElementById("categoryMenu");

    if (menu) {
        menu.classList.toggle("show");
    }

};


// ===============================
// LOAD MOVIES
// ===============================

async function loadMovies() {

    const container =
        document.getElementById("movieContainer");

    const noResult =
        document.getElementById("noResult");


    try {

        if (container) {

            container.innerHTML = `
                <p style="text-align:center;padding:20px;">
                    Loading Movies...
                </p>
            `;

        }


        const { data, error } = await supabase

            .from("movies")

            .select("*")

            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "SUPABASE ERROR:",
                error
            );

            if (container) {

                container.innerHTML = `
                    <p style="text-align:center;padding:20px;">
                        Unable to load movies.
                    </p>
                `;

            }

            return;

        }


        console.log(
            "MOVIES FROM SUPABASE:",
            data
        );


        allMovies = data || [];


        displayMovies(allMovies);
        


    }

    catch (error) {

        console.error(
            "MOVIE LOAD ERROR:",
            error
        );


        if (container) {

            container.innerHTML = `
                <p style="text-align:center;padding:20px;">
                    Unable to load movies.
                </p>
            `;

        }

    }

}


// ===============================
// DISPLAY MOVIES
// ===============================

function displayMovies(movies) {

    const container =
        document.getElementById("movieContainer");

    const noResult =
        document.getElementById("noResult");


    if (!container) {

        console.error(
            "movieContainer not found"
        );

        return;

    }


    container.innerHTML = "";


    if (!movies || movies.length === 0) {

        if (noResult) {

            noResult.style.display =
                "block";

        }

        return;

    }


    if (noResult) {

        noResult.style.display =
            "none";

    }


    movies.forEach(movie => {


        const card =
            document.createElement("div");


        card.className =
            "movie-card";


        card.onclick = function () {

            window.location.href =
                "movie-details.html?id=" +
                movie.id;

        };


        card.innerHTML = `

            <img
                src="${movie.poster_url || "logo-192.png"}"
                alt="${movie.title || "Movie"}"
            >

            <h3>
                ${movie.title || "Movie"}
            </h3>

            <p>
                ${movie.category || "Movie"}
            </p>

            <button
                data-lang="watchNow"
                onclick="event.stopPropagation(); window.location.href='movie-details.html?id=${movie.id}'"
            >
                ▶ Watch Now
            </button>

        `;


        container.appendChild(card);

    });


}


// ===============================
// CATEGORY FILTER
// ===============================

window.filterMovies = function (category) {


    if (category === "All") {

        displayMovies(allMovies);

        return;

    }


    const filteredMovies =
        allMovies.filter(movie =>
            movie.category === category
        );


    displayMovies(filteredMovies);

};


// ===============================
// HEADER PROFILE
// ===============================

const headerProfile =
    document.getElementById(
        "headerProfile"
    );


if (headerProfile) {

    const isLoggedIn =
        localStorage.getItem(
            "isLoggedIn"
        );


    const userAvatar =
        localStorage.getItem(
            "userAvatar"
        );


    if (
        isLoggedIn === "true" &&
        userAvatar
    ) {

        headerProfile.src =
            userAvatar;

    } else {

        headerProfile.src =
            "avatar-1.png";

    }

}


// ===============================
// EDIT MOVIE
// ===============================

window.editMovie = function (movieId) {

    window.location.href =
        "edit-movie.html?id=" +
        movieId;

};


// ===============================
// START
// ===============================

loadMovies().then(() => {

    applyLanguage();

});
