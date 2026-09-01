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
const getRatingKey = (id) => `filmy_ott_user_rating_${userId}_${id}`;
const getProgressKey = (id) => `filmy_ott_progress_${userId}_${id}`;

// Helper to get My List array from LocalStorage
function getMyListArray() {
    return JSON.parse(localStorage.getItem("myList")) || [];
}

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

    await loadMovie();

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

    listenToRealtimeViews();

    if (typeof applyLanguage === "function") {
        applyLanguage();
    }
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
        if (viewCount) viewCount.textContent = (movie.views || 0).toLocaleString();

        // 1. Fetch & Render Cast
        await fetchAndRenderCast(movie);

        // 2. Load Related Movies
        loadRelatedMovies(movie.category);
        updateLikeButtonUI();
        updateListButtonUI();
        loadUserRating();

    } catch (error) {
        console.error("Fatal Load Movie Error:", error);
    }
}

// =========================================
// FETCH AND RENDER CAST
// =========================================
async function fetchAndRenderCast(movie) {
    const castList = document.getElementById("castList");
    if (!castList) return;

    try {
        const queryId = String(movieId);
        
        const { data: castFromDb, error } = await supabase
            .from("movie_cast")
            .select("*")
            .eq("movie_id", queryId);

        let finalCastList = [];

        if (!error && castFromDb && castFromDb.length > 0) {
            finalCastList = castFromDb;
        } else {
            let castData = movie.cast || movie.cast_members || movie.actors || null;
            if (typeof castData === "string") {
                try { castData = JSON.parse(castData); } catch (e) { castData = []; }
            }
            if (Array.isArray(castData)) {
                finalCastList = castData;
            }
        }

        if (!finalCastList || finalCastList.length === 0) {
            castList.innerHTML = `<p class="cast-empty-text" data-lang="castNotAvailable">Cast information not available.</p>`;
            if (typeof applyLanguage === "function") applyLanguage();
            return;
        }

        castList.innerHTML = finalCastList.map((person, index) => {
            const name = person?.name || person?.actor_name || person?.cast_name || ("Cast " + (index + 1));
            const image = person?.image_url || person?.image || person?.poster_url || "logo-192.png";
            return `
                <div class="cast-card">
                    <img src="${image}" alt="${name}" onerror="this.src='logo-192.png'">
                    <h3>${name}</h3>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Cast Render Exception:", err);
        castList.innerHTML = `<p class="cast-empty-text" data-lang="castNotAvailable">Cast information not available.</p>`;
        if (typeof applyLanguage === "function") applyLanguage();
    }
}

// =========================================
// WATCH MOVIE BUTTON (DISKWALA DIRECT LINK FIX)
// =========================================
function setupWatchButton() {
    const watchBtn = document.getElementById("watchBtn");
    if (!watchBtn) return;

    watchBtn.addEventListener("click", function () {
        if (!checkAuth("watch full movie")) return;

        const movie = window.currentMovie || {};

        const videoUrl = movie.watch_url || 
                         movie.movie_url || 
                         movie.video_url || 
                         movie.full_movie_url || 
                         movie.stream_url || 
                         movie.link;

        if (videoUrl) {
            window.open(videoUrl, "_blank");
        } else {
            alert("Diskwala movie link is not available in database.");
        }
    });
}

// =========================================
// VIEWS & TRAILER
// =========================================
async function triggerViewCount() {
    const viewCountElem = document.getElementById("viewCount");
    if (!movieId) return;

    try {
        const queryId = !isNaN(movieId) ? Number(movieId) : movieId;

        const { data: updatedViews, error } = await supabase.rpc('increment_views', { movie_id_param: String(queryId) });

        if (!error && updatedViews !== null && updatedViews !== undefined) {
            if (viewCountElem) viewCountElem.textContent = Number(updatedViews).toLocaleString();
        } else {
            const currentViews = Number(window.currentMovie?.views || 0) + 1;
            window.currentMovie.views = currentViews;
            await supabase.from("movies").update({ views: currentViews }).eq("id", queryId);
            if (viewCountElem) viewCountElem.textContent = currentViews.toLocaleString();
        }
    } catch (err) {
        console.error("View count increment error:", err);
    }
}

function listenToRealtimeViews() {
    const viewCountElem = document.getElementById("viewCount");
    if (!viewCountElem || !movieId) return;

    const queryId = !isNaN(movieId) ? Number(movieId) : movieId;

    supabase
        .channel(`movie-views-${movieId}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'movies', filter: `id=eq.${queryId}` },
            (payload) => {
                if (payload.new && payload.new.views !== undefined) {
                    viewCountElem.textContent = Number(payload.new.views).toLocaleString();
                }
            }
        )
        .subscribe();
}

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
                if (savedTime > 0 && savedTime < video.duration - 5) {
                    video.currentTime = savedTime;
                }

                const totalSeconds = Math.floor(video.duration);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;

                const durationElem = document.getElementById("movieDuration");
                if (durationElem) {
                    if (minutes > 0) {
                        durationElem.textContent = `${minutes}m ${seconds}s`;
                    } else {
                        durationElem.textContent = `${seconds}s`;
                    }
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

            video.play()
                .then(() => {
                    triggerViewCount();
                })
                .catch(err => console.log("Autoplay Error:", err));
        }
    });
}

// =========================================
// LIKE & LIST BUTTONS
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

        try {
            const queryId = !isNaN(movieId) ? Number(movieId) : movieId;
            await supabase
                .from("movies")
                .update({ likes: newCount })
                .eq("id", queryId);
        } catch (err) {
            console.error("Like Exception:", err);
        }
    });
}

function updateLikeButtonUI() {
    const likeBtn = document.getElementById("likeBtn");
    if (!likeBtn) return;
    const isLiked = localStorage.getItem(getLikeKey(movieId)) === "true";
    likeBtn.classList.toggle("liked", isLiked);
}

function setupListButton() {
    const listBtn = document.getElementById("listBtn");
    if (!listBtn) return;

    listBtn.addEventListener("click", function () {
        if (!checkAuth("save movies to your list")) return;

        let myList = getMyListArray();
        const strMovieId = String(movieId);
        const index = myList.findIndex(id => String(id) === strMovieId);

        if (index !== -1) {
            myList.splice(index, 1);
            localStorage.setItem("myList", JSON.stringify(myList));
            setListButtonState(false);
        } else {
            myList.push(movieId);
            myList = [...new Set(myList)];
            localStorage.setItem("myList", JSON.stringify(myList));
            setListButtonState(true);
        }
    });
}

function updateListButtonUI() {
    const myList = getMyListArray();
    const isSaved = myList.some(id => String(id) === String(movieId));
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
            text.setAttribute("data-lang", "unsave");
            text.textContent = "Unsave";
        }
    } else {
        listBtn.classList.remove("saved");
        if (icon) icon.className = "fa-solid fa-plus";
        if (text) {
            text.setAttribute("data-lang", "save");
            text.textContent = "Save";
        }
    }

    if (typeof applyLanguage === "function") {
        applyLanguage();
    }
}

// =========================================
// CAST, SHARE & RATING
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
            
            const queryId = !isNaN(movieId) ? Number(movieId) : movieId;
            await supabase.from("movies").update({ rating: rate }).eq("id", queryId);
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

// =========================================
// SUPABASE REALTIME & LIVE COMMENTS SETUP
// =========================================
function setupComments() {
    const commentBtn = document.getElementById("commentBtn");
    const input = document.getElementById("commentInput");
    const list = document.getElementById("commentsList");

    if (!commentBtn || !input || !list) return;

    // First load existing comments from Supabase
    fetchAndRenderComments();

    // Event listener for posting comments
    commentBtn.addEventListener("click", async function () {
        if (!checkAuth("post comments")) return;

        const text = input.value.trim();
        if (!text) return;

        try {
            // Get Current Supabase User
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user ? user.id : userId;

            // Insert comment referencing profile via user_id
            const { error } = await supabase
                .from("comments")
                .insert([
                    {
                        movie_id: String(movieId),
                        user_id: currentUserId,
                        text: text
                    }
                ]);

            if (error) {
                console.error("Supabase Comment Insert Error:", error);
                alert("Failed to post comment. Make sure comments table exists.");
                return;
            }

            input.value = "";
            await fetchAndRenderComments();
        } catch (err) {
            console.error("Comment Post Exception:", err);
        }
    });

    async function fetchAndRenderComments() {
        try {
            // Join query: Fetch comments with linked profiles info (Live Name & Avatar)
            const { data: comments, error } = await supabase
                .from("comments")
                .select(`
                    id,
                    text,
                    created_at,
                    profiles (
                        name,
                        avatar_url,
                        username
                    )
                `)
                .eq("movie_id", String(movieId))
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Supabase Comments Fetch Error:", error);
                list.innerHTML = `<p class="no-comments" data-lang="noCommentsYet">No comments yet.</p>`;
                return;
            }

            if (!comments || comments.length === 0) {
                list.innerHTML = `<p class="no-comments" data-lang="noCommentsYet">No comments yet.</p>`;
            } else {
                list.innerHTML = comments.map(c => {
                    const profile = c.profiles || {};
                    const userName = profile.name || profile.username || "User";
                    const avatarUrl = profile.avatar_url || "logo-192.png";
                    const formattedTime = new Date(c.created_at).toLocaleString();

                    return `
                        <div class="comment-card" style="display:flex; gap:12px; align-items:flex-start; margin-bottom:12px;">
                            <img src="${avatarUrl}" alt="${userName}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" onerror="this.src='logo-192.png'">
                            <div>
                                <strong style="display:inline-block; margin-right:8px;">${userName}</strong> 
                                <small style="opacity:0.7;">${formattedTime}</small>
                                <p style="margin-top:4px;">${c.text}</p>
                            </div>
                        </div>
                    `;
                }).join("");
            }

            if (typeof applyLanguage === "function") {
                applyLanguage();
            }
        } catch (err) {
            console.error("Comments Render Error:", err);
        }
    }
}

// =========================================
// DETAILS TABS & RELATED MOVIES
// =========================================
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
        const queryId = !isNaN(movieId) ? Number(movieId) : movieId;
        const { data } = await supabase.from("movies").select("id,title,poster_url").eq("category", category).neq("id", queryId);
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
