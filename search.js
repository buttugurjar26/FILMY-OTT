import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const noResult = document.getElementById("noResult");

let allMovies = [];
let selectedCategory = "All";

// LOAD MOVIES
async function loadMovies() {
    try {
        const { data, error } = await supabase
            .from("movies")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        allMovies = data || [];
        filterMovies();
    } catch (error) {
        console.log("Search Load Error:", error);
    }
}

// FILTER MOVIES
function filterMovies() {
    let text = searchInput.value.toLowerCase();

    let filtered = allMovies.filter(movie => {
        let name = (movie.title || "").toLowerCase();
        let category = (movie.category || "").toLowerCase();

        let matchName = name.includes(text);
        let matchCategory = selectedCategory === "All" || category === selectedCategory.toLowerCase();

        return matchName && matchCategory;
    });

        showMovies(filtered);
}

// SHOW MOVIES
function showMovies(movies) {
    searchResults.innerHTML = "";

    if (movies.length === 0) {
        noResult.style.display = "block";
        return;
    }

    noResult.style.display = "none";

    movies.forEach(movie => {
        let card = document.createElement("div");
        card.className = "movie-card";

        card.onclick = function () {
            window.location.href = "movie-details.html?id=" + movie.id;
        };

        card.innerHTML = `
            <img src="${movie.poster_url || 'logo-192.png'}">
            <h3>${movie.title || "Movie"}</h3>
            <p>${movie.category || "Movie"}</p>
            <button data-lang="watchNow">▶ Watch Now</button>
        `;

        searchResults.appendChild(card);
    });

    // Re-apply language translations for dynamically created elements
    applyLanguage();
}

// SEARCH INPUT
searchInput.addEventListener("input", filterMovies);

// CATEGORY FILTER
document.querySelectorAll("#categoryMenu button").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll("#categoryMenu button").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        selectedCategory = button.dataset.category;

        document.getElementById("categoryMenu").classList.remove("show");

        filterMovies();
    });
});

loadMovies().then(() => {
    applyLanguage();
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
