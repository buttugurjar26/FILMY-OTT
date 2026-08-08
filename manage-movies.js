import { supabase } from "./supabase.js";

// ===============================
// ADMIN LOGIN CHECK
// ===============================

if (localStorage.getItem("adminLoggedIn") !== "true") {

    window.location.href = "admin-login.html";

}

// ===============================
// LOAD MOVIES
// ===============================

let allMovies = [];

async function loadMovies() {

    try {

        const { data, error } = await supabase
            .from("movies")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        allMovies = data || [];

        displayMovies(allMovies);

    } catch (error) {

        console.log("Movie Load Error:", error);

    }

}

// ===============================
// DISPLAY MOVIES
// ===============================

function displayMovies(movies) {

    const container = document.getElementById("movieContainer");
    const noResult = document.getElementById("noResult");

    if (!container) return;

    container.innerHTML = "";

    if (movies.length === 0) {

        if (noResult) noResult.style.display = "block";

        return;

    }

    if (noResult) noResult.style.display = "none";

    movies.forEach(movie => {

        const card = document.createElement("div");

        card.className = "movie-card";

        card.innerHTML = `

            <img src="${movie.poster_url || "logo-192.png"}">

            <h3>${movie.title || "Movie"}</h3>

            <p>${movie.category || "Movie"}</p>

            <div class="admin-actions">

                <button class="edit-btn"
                onclick="event.stopPropagation(); editMovie('${movie.id}')">

                    ✏️ Edit

                </button>

                <button class="delete-btn"
                onclick="event.stopPropagation(); deleteMovie('${movie.id}')">

                    🗑️ Delete

                </button>

            </div>

        `;

        container.appendChild(card);

    });

}



// ===============================
// EDIT MOVIE
// ===============================

window.editMovie = function (movieId) {

    window.location.href =
        "edit-movie.html?id=" + movieId;

};

// ===============================
// DELETE MOVIE
// ===============================

window.deleteMovie = async function (movieId) {

    const ok = confirm("Are you sure you want to delete this movie?");

    if (!ok) return;

    const { error } = await supabase
        .from("movies")
        .delete()
        .eq("id", movieId);

    if (error) {

        console.log(error);
        alert("Movie Delete Failed");
        return;

    }

    alert("Movie Deleted Successfully");

    loadMovies();

};

// ===============================
// START
// ===============================

loadMovies();