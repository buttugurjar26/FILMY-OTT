import { supabase } from "./supabase.js";

// =========================================
// GLOBAL VARIABLES
// =========================================
let allRelatedMovies = [];
let isViewMoreExpanded = false;

// =========================================
// PROFILE
// =========================================
window.openProfile = function () {
    window.location.href = "profile.html";
};

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

        console.log("Movie Loaded:", movie);

        // POSTER
        const poster = document.getElementById("moviePoster");
        if (poster && movie.poster_url) {
            poster.src = movie.poster_url;
        }

        // TITLE
        const title = document.getElementById("movieName");
        if (title) title.textContent = movie.title || "Movie Name";

        // CATEGORY
        const category = document.getElementById("movieCategory");
        if (category) category.textContent = movie.category || "Category";

        // YEAR
        const year = document.getElementById("movieYear");
        if (year) year.textContent = movie.movieyear || "2026";

        // DURATION
        const duration = document.getElementById("movieDuration");
        if (duration) duration.textContent = movie.duration || "2h 30m";

        // QUALITY
        const quality = document.getElementById("movieQuality");
        if (quality) quality.textContent = movie.quality || "HD";

        // LANGUAGE
        const language = document.getElementById("movieLanguage");
        if (language) language.textContent = movie.language || "Hindi";

        // RATING
        const rating = document.getElementById("movieRating");
        if (rating) {
            const movieRating = Number(movie.rating || 0);
            rating.textContent = "⭐ " + movieRating.toFixed(1);
        }

        // DESCRIPTION
        const description = document.getElementById("movieDescription");
        if (description) {
            description.textContent = movie.description || "Movie description will appear here.";
        }

        // COUNTS
        const likeCount = document.getElementById("likeCount");
        if (likeCount) likeCount.textContent = movie.likes || 0;

        const viewCount = document.getElementById("viewCount");
        if (viewCount) viewCount.textContent = movie.views || 0;

        const commentCount = document.getElementById("commentCount");
        if (commentCount) commentCount.textContent = movie.comments_count || 0;

        window.currentMovie = movie;

        // LOAD CAST
        renderCast(movie);

        // LOAD RELATED MOVIES
        loadRelatedMovies(movie.category);

        // LOAD USER RATING
        loadUserRating();

        // UPDATE LIST BUTTON
        updateListButton();

    } catch (error) {
        console.error("Load Movie Error:", error);
        showMessage("❌ Movie data load failed.");
    }
}

// =========================================
// IN-PLACE TRAILER VIDEO PLAYER SWITCH (LAYOUT-SAFE)
// =========================================
function setupTrailerButton() {
    const trailerBtn = document.getElementById("trailerBtn");
    if (!trailerBtn) return;

    trailerBtn.addEventListener("click", function () {
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

            // Hide Poster & Display Inline Video
            poster.style.display = "none";
            video.style.display = "block";

            // Smooth Scroll to Top Media Box
            const mediaBox = poster.parentElement;
            if (mediaBox) {
                mediaBox.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            video.play().catch(err => console.log("Autoplay blocked or failed:", err));
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
        const movie = window.currentMovie;
        if (!movie || !movie.watch_url) {
            alert("Watch Movie link is not available.");
            return;
        }
        window.location.href = movie.watch_url;
    });
}

// =========================================
// INLINE CAST TOGGLE (NO POPUP)
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

// =========================================
// RENDER CAST SLIDER
// =========================================
function renderCast(movie) {
    const castList = document.getElementById("castList");
    if (!castList) return;

    let castData = movie.cast || movie.cast_members || movie.actors || null;

    if (typeof castData === "string") {
        try {
            castData = JSON.parse(castData);
        } catch (error) {
            castData = [];
        }
    }

    if (!Array.isArray(castData) || castData.length === 0) {
        castList.innerHTML = `<p class="no-cast" style="color:#aaa;">Cast information not available.</p>`;
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

        const shareData = {
            title: title,
            text: "Watch " + title + " on FILMY OTT",
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                alert("Movie link copied!");
            } else {
                alert(window.location.href);
            }
        } catch (error) {
            console.log("Share cancelled.");
        }
    });
}

// =========================================
// LIKE BUTTON
// =========================================
function setupLikeButton() {
    const likeBtn = document.getElementById("likeBtn");
    const likeCount = document.getElementById("likeCount");

    if (!likeBtn) return;

    const storageKey = "filmy_ott_like_" + movieId;

    if (localStorage.getItem(storageKey) === "true") {
        likeBtn.classList.add("liked");
    }

    likeBtn.addEventListener("click", async function () {
        const movie = window.currentMovie;
        if (!movie) return;

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

        const { error } = await supabase.from("movies").update({ likes: newCount }).eq("id", movieId);

        if (!error) movie.likes = newCount;
    });
}

// =========================================
// MY LIST BUTTON
// =========================================
function setupListButton() {
    const listBtn = document.getElementById("listBtn");
    if (!listBtn) return;

    updateListButton();

    listBtn.addEventListener("click", function () {
        const storageKey = "filmy_ott_list_" + movieId;
        const alreadySaved = localStorage.getItem(storageKey) === "true";

        if (alreadySaved) {
            localStorage.removeItem(storageKey);
            setListButtonState(false);
            alert("Removed from My List");
        } else {
            localStorage.setItem(storageKey, "true");
            setListButtonState(true);
            alert("Added to My List");
        }
    });
}

function updateListButton() {
    const storageKey = "filmy_ott_list_" + movieId;
    const saved = localStorage.getItem(storageKey) === "true";
    setListButtonState(saved);
}

function setListButtonState(saved) {
    const listBtn = document.getElementById("listBtn");
    const icon = document.getElementById("listBtnIcon");
    const text = document.getElementById("listBtnText");

    if (!listBtn) return;

    if (saved) {
        listBtn.classList.add("saved");
        if (icon) icon.className = "fa-solid fa-check";
        if (text) text.textContent = "Remove from My List";
    } else {
        listBtn.classList.remove("saved");
        if (icon) icon.className = "fa-solid fa-plus";
        if (text) text.textContent = "Add to My List";
    }
}

// =========================================
// RATING SYSTEM (1 USER = 1 RATE OR EDIT)
// =========================================
function setupRating() {
    const stars = document.querySelectorAll(".stars i");
    const message = document.getElementById("ratingMessage");
    const userRatingKey = "filmy_ott_user_rating_" + movieId;

    stars.forEach(star => {
        star.addEventListener("click", async function () {
            const rate = Number(star.dataset.rate);
            const previousRating = localStorage.getItem(userRatingKey);

            stars.forEach(item => {
                const itemRate = Number(item.dataset.rate);
                item.classList.toggle("active", itemRate <= rate);
            });

            if (message) {
                if (previousRating) {
                    message.textContent = "Updated your rating to " + rate + " out of 5.";
                } else {
                    message.textContent = "You rated this movie " + rate + " out of 5.";
                }
            }

            localStorage.setItem(userRatingKey, rate);

            const { error } = await supabase.from("movies").update({ rating: rate }).eq("id", movieId);

            if (!error && window.currentMovie) {
                window.currentMovie.rating = rate;
            }
        });
    });
}

function loadUserRating() {
    const userRatingKey = "filmy_ott_user_rating_" + movieId;
    const savedUserRating = localStorage.getItem(userRatingKey);
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
// COMMENTS SYSTEM
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
    } catch (error) {
        comments = [];
    }

    renderComments();

    commentBtn.addEventListener("click", function () {
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
            list.innerHTML = `<p class="no-comments">No comments yet.</p>`;
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
// DETAILS / RATING / COMMENTS TABS
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

// =========================================
// RELATED MOVIES (9 INITIAL + VIEW MORE)
// =========================================
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
        container.innerHTML = `<p style="color:#aaa;">No related movies found.</p>`;
        if (viewMoreContainer) viewMoreContainer.style.display = "none";
        return;
    }

    // Limit to 9 if not expanded
    const moviesToShow = isViewMoreExpanded ? allRelatedMovies : allRelatedMovies.slice(0, 9);

    container.innerHTML = moviesToShow.map(movie => `
        <div class="movie-card" onclick="openMovie('${escapeAttribute(movie.id)}')">
            <img src="${escapeAttribute(movie.poster_url || "logo-192.png")}" alt="${escapeAttribute(movie.title || "Movie")}">
            <h3>${escapeHtml(movie.title || "Movie")}</h3>
        </div>
    `).join("");

    if (viewMoreContainer) {
        if (allRelatedMovies.length > 9 && !isViewMoreExpanded) {
            viewMoreContainer.style.display = "flex";
        } else {
            viewMoreContainer.style.display = "none";
        }
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

// =========================================
// OPEN RELATED MOVIE
// =========================================
window.openMovie = function (id) {
    window.location.href = "movie-details.html?id=" + encodeURIComponent(id);
};

// =========================================
// UTILITY FUNCTIONS
// =========================================
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
