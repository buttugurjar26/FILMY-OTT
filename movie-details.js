import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

// =========================================
// GLOBAL VARIABLES & LOGIN STATE
// =========================================
let allRelatedMovies = [];
let isViewMoreExpanded = false;

const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
const userId = localStorage.getItem("userId") || "guest_user";

const getLikeKey = (id) => `filmy_ott_like_${userId}_${id}`;
const getListKey = (id) => `filmy_ott_list_${userId}_${id}`;
const getRatingKey = (id) => `filmy_ott_user_rating_${userId}_${id}`;
const getProgressKey = (id) => `filmy_ott_progress_${userId}_${id}`;

// =========================================
// GET MOVIE ID FROM URL
// =========================================
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

// =========================================
// AUTH & PROFILE
// =========================================
window.openProfile = function () {
    if (!isLoggedIn) {
        window.location.href = "login.html";
    } else {
        window.location.href = "profile.html";
    }
};

function checkAuth(actionName = "use this feature") {
    if (!isLoggedIn) {
        alert(`Please login to ${actionName}.`);
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// =========================================
// DOM READY
// =========================================
document.addEventListener("DOMContentLoaded", async function () {
    if (!movieId) {
        console.error("Movie ID not found in URL.");
        return;
    }

    // 1. Static UI elements translate karein
    if (typeof applyLanguage === "function") {
        applyLanguage();
    }

    // 2. Movie Data load karein
    await loadMovie();

    // 3. Handlers setup karein
    setupTrailerButton();
    setupWatchButton();
    setupLikeButton();
    setupListButton();
    setupCastButton();
    setupShareButton();
    setupRating();
    setupComments();
    setupDetailsTabs();
    setupViewMoreButton();
});

// =========================================
// LOAD MOVIE DATA
// =========================================
async function loadMovie() {
    try {
        let query = supabase.from("movies").select("*");

        if (!isNaN(movieId)) {
            query = query.eq("id", Number(movieId));
        } else {
            query = query.eq("id", movieId);
        }

        const { data: movie, error } = await query.single();

        if (error || !movie) {
            console.error("Supabase Load Error:", error);
            const title = document.getElementById("movieName");
            if (title) title.textContent = "Movie not found";
            return;
        }

        window.currentMovie = movie;

        // Populate HTML Elements
        const poster = document.getElementById("moviePoster");
        if (poster && movie.poster_url) poster.src = movie.poster_url;

        const title = document.getElementById("movieName");
        if (title) title.textContent = movie.title || "Movie Name";

        const category = document.getElementById("movieCategory");
        if (category) category.textContent = movie.category || "Category";

        const year = document.getElementById("movieYear");
        if (year) year.textContent = movie.movieyear || "2026";

        const duration = document.getElementById("movieDuration");
        if (duration) duration.textContent = movie.duration || "0h 0m";

        const quality = document.getElementById("movieQuality");
        if (quality) quality.textContent = movie.quality || "HD";

        const language = document.getElementById("movieLanguage");
        if (language) language.textContent = movie.language || "Hindi";

        const rating = document.getElementById("movieRating");
        if (rating) rating.textContent = "⭐ " + Number(movie.rating || 0).toFixed(1);

        const description = document.getElementById("movieDescription");
        if (description) description.textContent = movie.description || "No description available.";

        const likeCount = document.getElementById("likeCount");
        if (likeCount) likeCount.textContent = movie.likes || 0;

        const viewCount = document.getElementById("viewCount");
        if (viewCount) viewCount.textContent = movie.views || 0;

        renderCast(movie);
        loadRelatedMovies(movie.category);
        updateLikeButtonUI();
        updateListButtonUI();
        loadUserRating();

    } catch (error) {
        console.error("Fatal Load Movie Error:", error);
    }
}

// =========================================
// TRAILER (DYNAMIC DURATION + RESUME PLAYBACK)
// =========================================
function setupTrailerButton() {
    const trailerBtn = document.getElementById("trailerBtn");
    if (!trailerBtn) return;

    trailerBtn.addEventListener("click", function () {
        if (!checkAuth("watch trailer")) return;

        const movie = window.currentMovie;
        if (!movie || !movie.trailer_url) {
            alert("Trailer is not available.");
            return;
        }

        const poster = document.getElementById("moviePoster");
        const video = document.getElementById("trailerVideo");
        const videoSource = document.getElementById("videoSource");

        if (video && videoSource && poster) {
            videoSource.src = movie.trailer_url;
            video.load();

            poster.style.display = "none";
            video.style.display = "block";

            const progressKey = getProgressKey(movieId);
            const savedTime = parseFloat(localStorage.getItem(progressKey) || "0");

            video.addEventListener("loadedmetadata", function () {
                // 1. Resume Video from saved time
                if (savedTime > 0 && savedTime < video.duration - 5) {
                    video.currentTime = savedTime;
                }

                // 2. Dynamic Duration Calculation (HTML #movieDuration Update)
                const totalSeconds = Math.floor(video.duration);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);

                const durationElem = document.getElementById("movieDuration");
                if (durationElem) {
                    durationElem.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                }
            }, { once: true });

            video.ontimeupdate = function () {
                if (video.currentTime > 0) {
                    localStorage.setItem(progressKey, video.currentTime);
                }
            };

            video.onended = function () {
                localStorage.removeItem(progressKey);
            };

            video.play().catch(err => console.log("Autoplay Error:", err));
        }
    });
}

// =========================================
// WATCH MOVIE
// =========================================
function setupWatchButton() {
    const watchBtn = document.getElementById("watchBtn");
    if (!watchBtn) return;

    watchBtn.addEventListener("click", function () {
        if (!checkAuth("watch this movie")) return;

        const movie = window.currentMovie;
        if (!movie || !movie.watch_url) {
            alert("Watch Movie link is not available.");
            return;
        }
        window.location.href = movie.watch_url;
    });
}

// =========================================
// LIKE BUTTON (WITH REFRESH PERSISTENCE)
// =========================================
function setupLikeButton() {
    const likeBtn = document.getElementById("likeBtn");
    const likeCount = document.getElementById("likeCount");

    if (!likeBtn) return;

    likeBtn.addEventListener("click", async function () {
        if (!checkAuth("like movies")) return;

        const movie = window.currentMovie;
        if (!movie) return;

        const storageKey = getLikeKey(movieId);
        const alreadyLiked = localStorage.getItem(storageKey) === "true";
        let newCount = Number(movie.likes || 0);

        if (alreadyLiked) {
            newCount = Math.max(0, newCount - 1);
            localStorage.removeItem(storageKey);
            likeBtn.classList.remove("liked");
        } else {
            newCount++;
            localStorage.setItem(storageKey, "true");
            likeBtn.classList.add("liked");
        }

        if (likeCount) likeCount.textContent = newCount;
        movie.likes = newCount;

        await supabase.from("movies").update({ likes: newCount }).eq("id", movieId);
    });
}

function updateLikeButtonUI() {
    const likeBtn = document.getElementById("likeBtn");
    if (!likeBtn || !isLoggedIn) return;

    const alreadyLiked = localStorage.getItem(getLikeKey(movieId)) === "true";
    if (alreadyLiked) {
        likeBtn.classList.add("liked");
    } else {
        likeBtn.classList.remove("liked");
    }
}

// =========================================
// MY LIST BUTTON (SAVING FULL DATA FOR MY-LIST PAGE)
// =========================================
function setupListButton() {
    const listBtn = document.getElementById("listBtn");
    if (!listBtn) return;

    listBtn.addEventListener("click", function () {
        if (!checkAuth("add to your list")) return;

        const movie = window.currentMovie;
        if (!movie) return;

        const storageKey = getListKey(movieId);
        const alreadySaved = localStorage.getItem(storageKey) !== null;

        if (alreadySaved) {
            localStorage.removeItem(storageKey);
            setListButtonState(false);
            alert("Removed from My List");
        } else {
            const movieToSave = {
                id: movie.id,
                title: movie.title,
                poster_url: movie.poster_url,
                category: movie.category,
                rating: movie.rating
            };
            localStorage.setItem(storageKey, JSON.stringify(movieToSave));
            setListButtonState(true);
            alert("Added to My List");
        }
    });
}

function updateListButtonUI() {
    if (!isLoggedIn) {
        setListButtonState(false);
        return;
    }
    const isSaved = localStorage.getItem(getListKey(movieId)) !== null;
    setListButtonState(isSaved);
}

function setListButtonState(saved) {
    const listBtn = document.getElementById("listBtn");
    const icon = document.getElementById("listBtnIcon");
    const text = document.getElementById("listBtnText");

    if (!listBtn) return;

    if (saved) {
        listBtn.classList.add("saved");
        if (icon) icon.className = "fa-solid fa-check";
        if (text) {
            text.setAttribute("data-lang", "removeFromMyList");
            text.textContent = "Remove from My List";
        }
    } else {
        listBtn.classList.remove("saved");
        if (icon) icon.className = "fa-solid fa-plus";
        if (text) {
            text.setAttribute("data-lang", "addToList");
            text.textContent = "Add to My List";
        }
    }
}

// =========================================
// CAST, SHARE, RATING & OTHER UTILITIES
// =========================================
function setupCastButton() {
    const castBtn = document.getElementById("castBtn");
    const castContent = document.getElementById("castContent");
    if (!castBtn || !castContent) return;

    castBtn.addEventListener("click", function () {
        const isHidden = castContent.style.display === "none" || castContent.style.display === "";
        castContent.style.display = isHidden ? "block" : "none";
        castBtn.classList.toggle("active", isHidden);
    });
}

function renderCast(movie) {
    const castList = document.getElementById("castList");
    if (!castList) return;

    let castData = movie.cast || movie.cast_members || movie.actors || null;
    if (typeof castData === "string") {
        try { castData = JSON.parse(castData); } catch (e) { castData = []; }
    }

    if (!Array.isArray(castData) || castData.length === 0) {
        castList.innerHTML = `<p style="color:#aaa;" data-lang="castNotAvailable">Cast information not available.</p>`;
        return;
    }

    castList.innerHTML = castData.map((person, index) => {
        const name = person?.name || person?.cast_name || "Cast " + (index + 1);
        const image = person?.image || person?.poster_url || "logo-192.png";
        return `
            <div class="cast-card">
                <img src="${image}" alt="${name}" onerror="this.src='logo-192.png'">
                <h3>${name}</h3>
            </div>
        `;
    }).join("");
}

function setupShareButton() {
    const shareBtn = document.getElementById("shareBtn");
    if (!shareBtn) return;

    shareBtn.addEventListener("click", async function () {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: window.currentMovie?.title || "FILMY OTT",
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Movie link copied!");
            }
        } catch (e) {}
    });
}

function setupRating() {
    const stars = document.querySelectorAll(".stars i");
    const message = document.getElementById("ratingMessage");

    stars.forEach(star => {
        star.addEventListener("click", async function () {
            if (!checkAuth("rate movies")) return;

            const rate = Number(star.dataset.rate);
            const userRatingKey = getRatingKey(movieId);

            stars.forEach(item => {
                item.classList.toggle("active", Number(item.dataset.rate) <= rate);
            });

            if (message) message.textContent = "You rated this movie " + rate + " out of 5.";
            localStorage.setItem(userRatingKey, rate);
            await supabase.from("movies").update({ rating: rate }).eq("id", movieId);
        });
    });
}

function loadUserRating() {
    if (!isLoggedIn) return;
    const savedUserRating = localStorage.getItem(getRatingKey(movieId));
    if (!savedUserRating) return;

    const rateNum = Number(savedUserRating);
    const stars = document.querySelectorAll(".stars i");
    stars.forEach(star => {
        star.classList.toggle("active", Number(star.dataset.rate) <= rateNum);
    });
}

function setupComments() {
    const commentBtn = document.getElementById("commentBtn");
    const input = document.getElementById("commentInput");
    const list = document.getElementById("commentsList");

    if (!commentBtn || !input || !list) return;

    const storageKey = "filmy_ott_comments_" + movieId;
    let comments = JSON.parse(localStorage.getItem(storageKey) || "[]");

    renderComments();

    commentBtn.addEventListener("click", function () {
        if (!checkAuth("post comments")) return;

        const text = input.value.trim();
        if (!text) return;

        comments.push({ text: text, time: new Date().toLocaleString() });
        localStorage.setItem(storageKey, JSON.stringify(comments));
        input.value = "";
        renderComments();
    });

    function renderComments() {
        if (comments.length === 0) {
            list.innerHTML = `<p class="no-comments">No comments yet.</p>`;
            return;
        }
        list.innerHTML = comments.map(c => `
            <div class="comment-card">
                <strong>User</strong> <small>${c.time}</small>
                <p>${c.text}</p>
            </div>
        `).join("");
    }
}

function setupDetailsTabs() {
    const detailsBtn = document.getElementById("detailsTabBtn");
    const ratingBtn = document.getElementById("ratingTabBtn");
    const commentsBtn = document.getElementById("commentsTabBtn");

    const detailsContent = document.getElementById("detailsContent");
    const ratingContent = document.getElementById("ratingContent");
    const commentsContent = document.getElementById("commentsContent");

    if (!detailsBtn) return;

    function showTab(btn, content) {
        [detailsBtn, ratingBtn, commentsBtn].forEach(b => b && b.classList.remove("active"));
        [detailsContent, ratingContent, commentsContent].forEach(c => c && (c.style.display = "none"));

        btn.classList.add("active");
        if (content) content.style.display = "block";
    }

    detailsBtn.addEventListener("click", () => showTab(detailsBtn, detailsContent));
    ratingBtn.addEventListener("click", () => showTab(ratingBtn, ratingContent));
    commentsBtn.addEventListener("click", () => showTab(commentsBtn, commentsContent));
}

async function loadRelatedMovies(category) {
    const container = document.getElementById("relatedMovies");
    if (!container || !category) return;

    try {
        const { data } = await supabase.from("movies").select("id,title,poster_url").eq("category", category).neq("id", movieId);
        allRelatedMovies = data || [];
        renderRelatedMovies();
    } catch (e) {}
}

function renderRelatedMovies() {
    const container = document.getElementById("relatedMovies");
    if (!container) return;

    const moviesToShow = isViewMoreExpanded ? allRelatedMovies : allRelatedMovies.slice(0, 9);
    container.innerHTML = moviesToShow.map(m => `
        <div class="movie-card" onclick="openMovie('${m.id}')">
            <img src="${m.poster_url || 'logo-192.png'}" alt="${m.title}">
            <h3>${m.title}</h3>
        </div>
    `).join("");
}

function setupViewMoreButton() {
    const viewMoreBtn = document.getElementById("viewMoreBtn");
    if (viewMoreBtn) {
        viewMoreBtn.addEventListener("click", () => {
            isViewMoreExpanded = true;
            renderRelatedMovies();
        });
    }
}

window.openMovie = function (id) {
    window.location.href = "movie-details.html?id=" + encodeURIComponent(id);
};
