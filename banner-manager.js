import { supabase } from "./supabase.js";

// ===============================
// ADMIN LOGIN CHECK
// ===============================
if (
    localStorage.getItem("adminLoggedIn") !== "true" ||
    localStorage.getItem("isAdmin") !== "true"
) {
    window.location.href = "admin-login.html";
}

let moviesList = [];
let activeBanners = [];

// ===============================
// LOAD MOVIES & BANNER STATUS
// ===============================
async function loadBannerMovies() {
    const container = document.getElementById("bannerMoviesGrid");
    if (!container) return;

    try {
        // 1. Fetch All Movies
        const { data: movies, error: movieError } = await supabase
            .from("movies")
            .select("*")
            .order("created_at", { ascending: false });

        if (movieError) throw movieError;
        moviesList = movies || [];

        // 2. Fetch Active Banners
        const { data: banners, error: bannerError } = await supabase
            .from("banners")
            .select("*")
            .eq("is_active", true);

        if (bannerError) throw bannerError;
        activeBanners = banners || [];

        renderMovieGrid();

    } catch (error) {
        console.error("Error loading banner manager data:", error);
        container.innerHTML = `<p class="empty-text">❌ Failed to load movies.</p>`;
    }
}

// ===============================
// RENDER MOVIES GRID
// ===============================
function renderMovieGrid() {
    const container = document.getElementById("bannerMoviesGrid");
    if (!container) return;

    container.innerHTML = "";

    if (moviesList.length === 0) {
        container.innerHTML = `<p class="empty-text">No Movies Found</p>`;
        return;
    }

    // List of active banner movie IDs for quick checking
    const activeMovieIds = activeBanners.map(b => b.movie_id);

    moviesList.forEach(movie => {
        const isBanner = activeMovieIds.includes(movie.id);
        const card = document.createElement("div");
        card.className = "movie-card";

        card.innerHTML = `
            <img src="${movie.poster_url || "logo-192.png"}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <button 
                class="banner-btn ${isBanner ? 'banner-on' : 'make-banner'}"
                onclick="toggleBanner('${movie.id}', '${movie.poster_url || 'banner1.jpg'}', ${isBanner})">
                ${isBanner ? 'Banner ON' : 'Make Banner'}
            </button>
        `;

        container.appendChild(card);
    });
}

// ===============================
// TOGGLE BANNER STATUS (MAKE / REMOVE BANNER)
// ===============================
window.toggleBanner = async function(movieId, posterUrl, isCurrentlyBanner) {
    try {
        if (isCurrentlyBanner) {
            // Remove from Banners (Deactivate or Delete banner entry)
            const { error } = await supabase
                .from("banners")
                .delete()
                .eq("movie_id", movieId);

            if (error) throw error;

        } else {
            // Add to Banners with poster_url and movie_id
            const { error } = await supabase
                .from("banners")
                .insert([
                    {
                        movie_id: movieId,
                        image_url: posterUrl,
                        title: "Home Banner",
                        is_active: true
                    }
                ]);

            if (error) throw error;
        }

        // Refresh Grid Layout
        loadBannerMovies();

    } catch (error) {
        console.error("Toggle Banner Error:", error);
        alert("❌ Error updating banner status: " + error.message);
    }
};

// ===============================
// INITIAL LOAD
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    loadBannerMovies();
});
