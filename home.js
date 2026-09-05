import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

let allMovies = [];
let bannerIndex = 0;
let bannerTimer = null;

// ===============================
// LOAD MOVIES
// ===============================
async function loadMovies() {
    try {
        const { data, error } = await supabase
            .from("movies")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        allMovies = data || [];
        console.log("HOME MOVIES:", allMovies);

        // COMING SOON
        displayMovies(
            "comingSoonMovies",
            allMovies.filter(movie => movie.coming_soon === true).slice(0, 9),
            "scroll"
        );

        // FEATURED
        displayMovies(
            "featuredMovies",
            allMovies.filter(movie => movie.featured === true).slice(0, 9),
            "scroll"
        );

        // TRENDING
        displayMovies(
            "trendingMovies",
            allMovies.filter(movie => movie.trending === true).slice(0, 9),
            "scroll"
        );

        // MOST WATCHED
        const mostWatched = [...allMovies].sort((a, b) => (b.views || 0) - (a.views || 0));
        displayMovies("mostWatchedMovies", mostWatched.slice(0, 9), "scroll");

        // TOP RATED
        const topRated = allMovies
            .filter(movie => movie.rating && Number(movie.rating) > 0)
            .sort((a, b) => Number(b.rating) - Number(a.rating));
        displayMovies("topRatedMovies", topRated.slice(0, 9), "scroll");

        // LATEST MOVIES
        const latestMovies = [...allMovies].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        displayMovies("latestMovies", latestMovies.slice(0, 9), "scroll");

    } catch (error) {
        console.error("Movie Load Error:", error);
    }
}

// ===============================
// LOAD HERO DYNAMIC MOVIE BANNERS
// ===============================
async function loadBanners() {
    const heroSlider = document.getElementById("heroSlider");
    const dotsContainer = document.getElementById("heroDots");

    if (!heroSlider) return;

    try {
        const { data: banners, error } = await supabase
            .from("banners")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        heroSlider.innerHTML = "";
        if (dotsContainer) dotsContainer.innerHTML = "";

        // NO BANNER FALLBACK
        if (!banners || banners.length === 0) {
            heroSlider.innerHTML = `
                <div class="hero-slide" style="background-image: url('banner1.jpg');">
                    <div class="hero-overlay">
                        <a href="movies-list.html" class="hero-play-btn">
                            <i class="fa-solid fa-play"></i> PLAY
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        // RENDER BANNERS WITH PLAY BUTTON LINKED TO MOVIE
        heroSlider.innerHTML = banners.map(banner => {
            const targetLink = banner.movie_id 
                ? `movie-details.html?id=${banner.movie_id}` 
                : (banner.link || "movies-list.html");

            return `
                <div class="hero-slide" style="background-image: url('${banner.image_url || 'banner1.jpg'}');">
                    <div class="hero-overlay">
                        <a href="${targetLink}" class="hero-play-btn">
                            <i class="fa-solid fa-play"></i> PLAY
                        </a>
                    </div>
                </div>
            `;
        }).join("");

        // RENDER DOTS
        if (dotsContainer && banners.length > 1) {
            dotsContainer.innerHTML = banners.map((_, idx) => `
                <span class="hero-dot ${idx === 0 ? 'active' : ''}"></span>
            `).join("");
        }

        bannerIndex = 0;
        heroSlider.style.transform = `translateX(0%)`;

    } catch (error) {
        console.error("Banner Load Error:", error);
    }
}

// ===============================
// DISPLAY MOVIES GRID/SCROLL
// ===============================
function displayMovies(section, movies, layout = "scroll") {
    const container = document.getElementById(section);
    if (!container) return;

    container.innerHTML = "";
    container.className = layout === "scroll" ? "home-scroll" : "movie-grid";

    if (!movies || movies.length === 0) {
        container.innerHTML = `<p class="empty-text">No Movies Found</p>`;
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement("div");
        card.className = "movie-card";

        card.onclick = () => {
            window.location.href = "movie-details.html?id=" + movie.id;
        };

        card.innerHTML = `
            <img src="${movie.poster_url || "logo-192.png"}" alt="${movie.title || "Movie"}">
            <h3>${movie.title || "Movie"}</h3>
            <p>${movie.category || "Movie"}</p>
            <button data-lang="watchNow">▶ Watch Now</button>
        `;

        container.appendChild(card);
    });
}

// ===============================
// AUTO HERO SLIDER
// ===============================
function autoSlider() {
    const heroSlider = document.getElementById("heroSlider");
    if (!heroSlider) return;

    if (bannerTimer) clearInterval(bannerTimer);

    bannerTimer = setInterval(() => {
        const slides = heroSlider.querySelectorAll(".hero-slide");
        if (slides.length <= 1) return;

        bannerIndex = (bannerIndex + 1) % slides.length;
        heroSlider.style.transform = `translateX(-${bannerIndex * 100}%)`;

        const dots = document.querySelectorAll(".hero-dot");
        dots.forEach((dot, idx) => {
            dot.classList.toggle("active", idx === bannerIndex);
        });

    }, 4000);
}

// ===============================
// GLOBAL PROFILE CLICK HANDLER
// ===============================
window.openProfile = function() {
    window.location.href = "profile.html";
};

// ===============================
// START APP
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    requestAnimationFrame(async () => {
        // 1. Profile Avatar Check
        const headerProfile = document.getElementById("headerProfile");
        if (headerProfile) {
            const isLoggedIn = localStorage.getItem("isLoggedIn");
            const userAvatar = localStorage.getItem("userAvatar");
            headerProfile.src = (isLoggedIn === "true" && userAvatar) ? userAvatar : "default-profile.png";
        }

        const profileBtn = document.querySelector(".profile");
        if (profileBtn) {
            profileBtn.onclick = window.openProfile;
        }

        // 2. Fetch Data from Supabase
        await loadMovies();
        await loadBanners();

        // 3. Initialize Auto Slider & Languages
        autoSlider();
        try {
            applyLanguage();
        } catch (e) {
            console.error("Language translation error:", e);
        }
    });
});
