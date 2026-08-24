import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

// =========================================
// GLOBAL VARIABLES & LOGIN STATE
// =========================================
let allRelatedMovies = [];
let isViewMoreExpanded = false;

// Check user login session
const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
const userId = localStorage.getItem("userId") || "guest_user";

// Unique keys per logged-in user
const getLikeKey = (id) => `filmy_ott_like_${userId}_${id}`;
const getListKey = (id) => `filmy_ott_list_${userId}_${id}`;
const getRatingKey = (id) => `filmy_ott_user_rating_${userId}_${id}`;
const getProgressKey = (id) => `filmy_ott_progress_${userId}_${id}`;

// =========================================
// PROFILE & LOGIN REDIRECT
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
// GET MOVIE ID
// =========================================
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

// =========================================
// DOM READY
// =========================================
document.addEventListener("DOMContentLoaded", async function () {
    if (!movieId) {
        console.error("Movie ID not found.");
        showMessage("Movie information not found.");
        return;
    }

    await loadMovie();

    setupTrailerButton();
    setupWatchButton();
    setupCastButton();
    setupShareButton();
    setupLikeButton();
    setupListButton();
    setupRating();
    setupComments();
    setupDetailsTabs();
    setupViewMoreButton();

    if (typeof applyLanguage === "function") {
        applyLanguage();
    }
});

// =========================================
// LOAD MOVIE
// =========================================
async function loadMovie() {
    try {
        const { data: movie, error } = await supabase
            .from("movies")
            .select("*")
            .eq("id", movieId)
            .single();

        if (error) throw error;

        if (!movie) {
            showMessage("Movie not found.");
            return;
        }

        // DOM Rendering
        const poster = document.getElementById("moviePoster");
        if (poster && movie.poster_url) poster.src = movie.poster_url;

        const title = document.getElementById("movieName");
        if (title) title.textContent = movie.title || "Movie Name";

        const category = document.getElementById("movieCategory");
        if (category) category.textContent = movie.category || "Category";

        const year = document.getElementById("movieYear");
        if (year) year.textContent = movie.movieyear || "2026";

        const duration = document.getElementById("movieDuration");
        if (duration) duration.textContent = movie.duration || "2h 30m";

        const quality = document.getElementById("movieQuality");
        if (quality) quality.textContent = movie.quality || "HD";

        const language = document.getElementById("movieLanguage");
        if (language) language.textContent = movie.language || "Hindi";

        const rating = document.getElementById("movieRating");
        if (rating) {
            const movieRating = Number(movie.rating || 0);
            rating.textContent = "⭐ " + movieRating.toFixed(1);
        }

        const description = document.getElementById("movieDescription");
        if (description) {
            description.textContent = movie.description || "Movie description will appear here.";
        }

        const likeCount = document.getElementById("likeCount");
        if (likeCount) likeCount.textContent = movie.likes || 0;

        const viewCount = document.getElementById("viewCount");
        if (viewCount) viewCount.textContent = movie.views || 0;

        const commentCount = document.getElementById("commentCount");
        if (commentCount) commentCount.textContent = movie.comments_count || 0;

        window.currentMovie = movie;

        renderCast(movie);
        loadRelatedMovies(movie.category);
        loadUserRating();
        updateLikeButtonUI();
        updateListButtonUI();

    } catch (error) {
        console.error("Load Movie Error:", error);
        showMessage("❌ Movie data load failed.");
    }
}

// =========================================
// TRAILER BUTTON (LOGIN CHECK & RESUME PROGRESS)
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

            const mediaBox = poster.parentElement;
            if (mediaBox) {
                mediaBox.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            // 🕒 1. Resume Time
            const progressKey = getProgressKey(movieId);
            const savedTime = parseFloat(localStorage.getItem(progressKey) || "0");

            video.addEventListener("loadedmetadata", function onMetadata() {
                if (savedTime > 0 && savedTime < video.duration - 5) {
                    video.currentTime = savedTime;
                }
                video.removeEventListener("loadedmetadata", onMetadata);
            });

            // 💾 2. Save Progress Time
            video.ontimeupdate = function () {
                if (video.currentTime > 0) {
                    localStorage.setItem(progressKey, video.currentTime);
                }
            };

            // 🛑 3. Reset on Finish
            video.onended = function () {
                localStorage.removeItem(progressKey);
            };

            video.play().catch(err => console.log("Autoplay blocked:", err));
        }
    });
}

// =========================================
// WATCH MOVIE BUTTON (WITH LOGIN CHECK)
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
// LIKE BUTTON (WITH LOGIN & PERSISTENCE)
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
    if (!likeBtn) return;

    // isLoggedIn चेक करें
    const loggedInState = localStorage.getItem("isLoggedIn") === "true";
    if (!loggedInState) return;

    const storageKey = getLikeKey(movieId);
    const alreadyLiked = localStorage.getItem(storageKey) === "true";

    if (alreadyLiked) {
        likeBtn.classList.add("liked");
    } else {
        likeBtn.classList.remove("liked");
    }
}

// =========================================
// MY LIST BUTTON (WITH LOGIN & PERSISTENCE)
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
            // लिस्ट से हटाएं
            localStorage.removeItem(storageKey);
            setListButtonState(false);
            alert("Removed from My List");
        } else {
            // पूरा मूवी ऑब्जेक्ट सेव करें ताकि My List पेज पर शो हो सके
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
    const loggedInState = localStorage.getItem("isLoggedIn") === "true";
    if (!loggedInState) {
        setListButtonState(false);
        return;
    }
    const storageKey = getListKey(movieId);
    const isSaved = localStorage.getItem(storageKey) !== null;
    setListButtonState(isSaved);
}

// =========================================
// INLINE CAST TOGGLE
// =========================================
function setupCastButton() {
    const castBtn = document.getElementById("castBtn");
    const castContent = document.getElementById("castContent");

    if (!castBtn || !castContent) return;

    castBtn.addEventListener("click", function () {
        const isHidden = castContent.style.display === "none" || castContent.style.display === "";
        if (isHidden) {
            castContent.style.display = "block";
            castBtn.classList.add("active");
        } else {
            castContent.style.display = "none";
            castBtn.classList.remove("active");
        }
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
        castList.innerHTML = `<p class="no-cast" style="color:#aaa;" data-lang="castNotAvailable">Cast information not available.</p>`;
        if (typeof applyLanguage === "function") applyLanguage();
        return;
    }

    castList.innerHTML = castData.map((person, index) => {
        const name = person?.name || person?.cast_name || person?.actor_name || "Cast " + (index + 1);
        const image = person?.image || person?.image_url || person?.cast_image || person?.photo || "logo-192.png";

        return `
            <div class="cast-card">
                <img src="${escapeAttribute(image)}" alt="${escapeAttribute(name)}" loading="lazy" onerror="this.src='logo-192.png'">
                <h3>${escapeHtml(name)}</h3>
            </div>
        `;
    }).join("");
}

// =========================================
// SHARE BUTTON
// =========================================
function setupShareButton() {
    const shareBtn = document.getElementById("shareBtn");
    if (!shareBtn) return;

    shareBtn.addEventListener("click", async function () {
        const movie = window.currentMovie;
        const title = movie?.title || "FILMY OTT Movie";

        try {
            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: "Watch " + title + " on FILMY OTT",
                    url: window.location.href
                });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                alert("Movie link copied!");
            }
        } catch (error) {
            console.log("Share cancelled.");
        }
    });
}

// =========================================
// RATING SYSTEM (WITH LOGIN CHECK)
// =========================================
function setupRating() {
    const stars = document.querySelectorAll(".stars i");
    const message = document.getElementById("ratingMessage");

    stars.forEach(star => {
        star.addEventListener("click", async function () {
            if (!checkAuth("rate movies")) return;

            const rate = Number(star.dataset.rate);
            const userRatingKey = getRatingKey(movieId);
            const previousRating = localStorage.getItem(userRatingKey);

            stars.forEach(item => {
                const itemRate = Number(item.dataset.rate);
                item.classList.toggle("active", itemRate <= rate);
            });

            if (message) {
                message.textContent = previousRating
                    ? "Updated your rating to " + rate + " out of 5."
                    : "You rated this movie " + rate + " out of 5.";
            }

            localStorage.setItem(userRatingKey, rate);
            await supabase.from("movies").update({ rating: rate }).eq("id", movieId);
        });
    });
}

function loadUserRating() {
    if (!isLoggedIn) return;

    const savedUserRating = localStorage.getItem(getRatingKey(movieId));
    const movieRating = savedUserRating ? Number(savedUserRating) : Number(window.currentMovie?.rating || 0);

    const stars = document.querySelectorAll(".stars i");
    const message = document.getElementById("ratingMessage");

    stars.forEach(star => {
        const rate = Number(star.dataset.rate);
        star.classList.toggle("active", rate <= movieRating);
    });

    if (savedUserRating && message) {
        message.textContent = "Your current rating: " + savedUserRating + " / 5";
    }
}

// =========================================
// COMMENTS SYSTEM (WITH LOGIN CHECK)
// =========================================
function setupComments() {
    const commentBtn = document.getElementById("commentBtn");
    const input = document.getElementById("commentInput");
    const list = document.getElementById("commentsList");

    if (!commentBtn || !input || !list) return;

    const storageKey = "filmy_ott_comments_" + movieId;
    let comments = [];

    try {
        comments = JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch (e) {
        comments = [];
    }

    renderComments();

    commentBtn.addEventListener("click", function () {
        if (!checkAuth("post comments")) return;

        const text = input.value.trim();
        if (!text) {
            alert("Please write a comment.");
            return;
        }

        comments.push({
            text: text,
            time: new Date().toLocaleString()
        });

        localStorage.setItem(storageKey, JSON.stringify(comments));
        input.value = "";
        renderComments();
    });

    function renderComments() {
        if (comments.length === 0) {
            list.innerHTML = `<p class="no-comments" data-lang="noComments">No comments yet.</p>`;
            if (typeof applyLanguage === "function") applyLanguage();
            updateCommentCount(0);
            return;
        }

        list.innerHTML = comments.map(comment => `
            <div class="comment-card">
                <div class="comment-header">
                    <strong>User</strong>
                    <small>${escapeHtml(comment.time)}</small>
                </div>
                <p>${escapeHtml(comment.text)}</p>
            </div>
        `).join("");

        updateCommentCount(comments.length);
    }
}

function updateCommentCount(count) {
    const element = document.getElementById("commentCount");
    if (element) element.textContent = count;
}

// =========================================
// TABS & RELATED MOVIES
// =========================================
function setupDetailsTabs() {
    const detailsBtn = document.getElementById("detailsTabBtn");
    const ratingBtn = document.getElementById("ratingTabBtn");
    const commentsBtn = document.getElementById("commentsTabBtn");

    const detailsContent = document.getElementById("detailsContent");
    const ratingContent = document.getElementById("ratingContent");
    const commentsContent = document.getElementById("commentsContent");

    if (!detailsBtn || !ratingBtn || !commentsBtn) return;

    function showTab(activeBtn, activeContent) {
        [detailsBtn, ratingBtn, commentsBtn].forEach(b => b.classList.remove("active"));
        [detailsContent, ratingContent, commentsContent].forEach(c => {
            if (c) c.style.display = "none";
        });

        activeBtn.classList.add("active");
        if (activeContent) activeContent.style.display = "block";
    }

    detailsBtn.addEventListener("click", () => showTab(detailsBtn, detailsContent));
    ratingBtn.addEventListener("click", () => showTab(ratingBtn, ratingContent));
    commentsBtn.addEventListener("click", () => showTab(commentsBtn, commentsContent));
}

async function loadRelatedMovies(category) {
    const container = document.getElementById("relatedMovies");
    if (!container || !category) return;

    try {
        const { data, error } = await supabase
            .from("movies")
            .select("id,title,poster_url,category")
            .eq("category", category)
            .neq("id", movieId);

        if (error) throw error;

        allRelatedMovies = data || [];
        renderRelatedMovies();
    } catch (error) {
        console.error("Related Movies Error:", error);
    }
}

function renderRelatedMovies() {
    const container = document.getElementById("relatedMovies");
    const viewMoreContainer = document.querySelector(".view-more-container");

    if (!container) return;

    if (allRelatedMovies.length === 0) {
        container.innerHTML = `<p style="color:#aaa;" data-lang="noRelatedMovies">No related movies found.</p>`;
        if (viewMoreContainer) viewMoreContainer.style.display = "none";
        if (typeof applyLanguage === "function") applyLanguage();
        return;
    }

    const moviesToShow = isViewMoreExpanded ? allRelatedMovies : allRelatedMovies.slice(0, 9);

    container.innerHTML = moviesToShow.map(movie => `
        <div class="movie-card" onclick="openMovie('${escapeAttribute(movie.id)}')">
            <img src="${escapeAttribute(movie.poster_url || "logo-192.png")}" alt="${escapeAttribute(movie.title || "Movie")}">
            <h3>${escapeHtml(movie.title || "Movie")}</h3>
        </div>
    `).join("");

    if (viewMoreContainer) {
        viewMoreContainer.style.display = (allRelatedMovies.length > 9 && !isViewMoreExpanded) ? "flex" : "none";
    }
}

function setupViewMoreButton() {
    const viewMoreBtn = document.getElementById("viewMoreBtn");
    if (!viewMoreBtn) return;

    viewMoreBtn.addEventListener("click", function () {
        isViewMoreExpanded = true;
        renderRelatedMovies();
    });
}

window.openMovie = function (id) {
    window.location.href = "movie-details.html?id=" + encodeURIComponent(id);
};

function showMessage(message) {
    const title = document.getElementById("movieName");
    if (title) title.textContent = message;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

function escapeAttribute(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
