import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

// =========================================
// GLOBAL VARIABLES & LOGIN STATE
// =========================================
let allRelatedMovies = [];
let isViewMoreExpanded = false;

const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
const userId = localStorage.getItem("userId") || "guest_user";

const getLikeKey = (id) => `filmy_ott_like_${userId}__${id}`;
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
// WATCH MOVIE BUTTON
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
            alert("Movie link is not available in database.");
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
// SUPABASE REALTIME & LIVE COMMENTS (FINAL FIX FOR HTML MATCHING)
// =========================================
function setupComments() {
    const commentBtn = document.getElementById("commentBtn");
    const input = document.getElementById("commentInput");
    const list = document.getElementById("commentsList");

    if (!commentBtn || !input || !list) return;

    fetchAndRenderComments();

    commentBtn.addEventListener("click", async function () {
        if (!checkAuth("post comments")) return;

        const text = input.value.trim();
        if (!text) {
            alert("Please enter a comment!");
            return;
        }

        try {
            commentBtn.disabled = true;

            // Get Current Logged In User
            const { data: { user } } = await supabase.auth.getUser();
            let currentUserId = user?.id || localStorage.getItem("userId") || localStorage.getItem("user_id") || null;

            // Validate UUID String Format
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId);

            const insertPayload = {
                movie_id: String(movieId),
                text: text
            };

            if (isValidUUID) {
                insertPayload.user_id = currentUserId;
            }

            const { error } = await supabase
                .from("comments")
                .insert([insertPayload]);

            if (error) {
                console.error("Supabase Comment Insert Error:", error);
                alert("Failed to post comment: " + error.message);
                commentBtn.disabled = false;
                return;
            }

            input.value = "";
            commentBtn.disabled = false;
            
            // Re-fetch comments & update count badge
            await fetchAndRenderComments();
        } catch (err) {
            console.error("Comment Post Exception:", err);
            commentBtn.disabled = false;
        }
    });

    async function fetchAndRenderComments() {
        try {
            // 1. Fetch Comments from Supabase
            const { data: comments, error } = await supabase
                .from("comments")
                .select("id, text, created_at, user_id")
                .eq("movie_id", String(movieId))
                .order("created_at", { ascending: false });

            const totalComments = (comments && !error) ? comments.length : 0;

            // 2. Update Count on <small id="commentCount"> Directly
            const countElem = document.getElementById("commentCount");
            if (countElem) {
                countElem.textContent = totalComments;
            }

            if (error || !comments || comments.length === 0) {
                list.innerHTML = `<p class="no-comments" data-lang="noCommentsYet">No comments yet.</p>`;
                if (typeof applyLanguage === "function") applyLanguage();
                return;
            }

            // 3. Fetch Profiles Data from Supabase
            const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
            let profilesMap = {};

            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, name, avatar_url, username, full_name")
                    .in("id", userIds);

                if (profiles) {
                    profiles.forEach(p => {
                        profilesMap[p.id] = p;
                    });
                }
            }

            // 4. Get Fallback Local Storage Data
            const localUserName = localStorage.getItem("userName") || 
                                  localStorage.getItem("name") || 
                                  localStorage.getItem("user_name") || 
                                  localStorage.getItem("full_name") || 
                                  "Guest User";

            const localAvatar = localStorage.getItem("userAvatar") || 
                                localStorage.getItem("avatar_url") || 
                                localStorage.getItem("profile_pic") || 
                                "logo-192.png";

                        // 5. Render Comments UI (GOLDEN CARD & CHOCOLATE GRAY TEXT)
            list.innerHTML = comments.map(c => {
                const profile = profilesMap[c.user_id] || {};
                const userName = profile.name || profile.full_name || profile.username || localUserName;
                const avatarUrl = profile.avatar_url || localAvatar;
                const formattedTime = c.created_at ? new Date(c.created_at).toLocaleString() : "";

                return `
                    <div class="comment-card" style="display:flex; gap:12px; align-items:flex-start; margin-bottom:12px; padding:12px; border-radius:12px; background: linear-gradient(135deg, #ffd700, #d4af37); box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                        <img src="${avatarUrl}" alt="${userName}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid #3d2b1f;" onerror="this.src='logo-192.png'">
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <strong style="color: #3d2b1f; font-size: 15px; font-weight: 800;">${userName}</strong> 
                                <small style="color: #5c4033; font-size: 11px; font-weight: 600;">${formattedTime}</small>
                            </div>
                            <p style="margin-top:6px; color: #4a3525; font-size: 14px; font-weight: 600; line-height: 1.4; word-break: break-word;">${c.text}</p>
                        </div>
                    </div>
                `;
            }).join("");


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
