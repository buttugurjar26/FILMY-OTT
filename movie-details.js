import { supabase } from "./supabase.js";


// =========================================
// PROFILE
// =========================================

window.openProfile = function () {
    window.location.href = "profile.html";
};


// =========================================
// GET MOVIE ID
// URL: movie-details.html?id=123
// =========================================

const params = new URLSearchParams(
    window.location.search
);

const movieId = params.get("id");


// =========================================
// DOM READY
// =========================================

document.addEventListener("DOMContentLoaded", async function () {

    if (!movieId) {

        console.error("Movie ID not found.");

        showMessage(
            "Movie information not found."
        );

        return;
    }


    await loadMovie();

    setupTrailerButton();

    setupWatchButton();

    setupDownloadButton();

    setupShareButton();

    setupLikeButton();

    setupListButton();

    setupRating();

    setupComments();

    setupDetailsTabs();

});


// =========================================
// LOAD MOVIE
// =========================================

async function loadMovie() {

    try {

        const { data: movie, error } =
            await supabase
                .from("movies")
                .select("*")
                .eq("id", movieId)
                .single();


        if (error) {
            throw error;
        }


        if (!movie) {

            showMessage(
                "Movie not found."
            );

            return;
        }


        console.log(
            "Movie Loaded:",
            movie
        );


        // =================================
        // POSTER
        // =================================

        const poster =
            document.getElementById(
                "moviePoster"
            );

        if (poster && movie.poster_url) {

            poster.src =
                movie.poster_url;

        }


        // =================================
        // TITLE
        // =================================

        const title =
            document.getElementById(
                "movieName"
            );

        if (title) {

            title.textContent =
                movie.title || "Movie Name";

        }


        // =================================
        // CATEGORY
        // =================================

        const category =
            document.getElementById(
                "movieCategory"
            );

        if (category) {

            category.textContent =
                movie.category || "Category";

        }


        // =================================
        // YEAR
        // =================================

        const year =
            document.getElementById(
                "movieYear"
            );

        if (year) {

            year.textContent =
                movie.movieyear || "2026";

        }


        // =================================
        // DURATION
        // =================================

        const duration =
            document.getElementById(
                "movieDuration"
            );

        if (duration) {

            duration.textContent =
                movie.duration || "2h 30m";

        }


        // =================================
        // QUALITY
        // =================================

        const quality =
            document.getElementById(
                "movieQuality"
            );

        if (quality) {

            quality.textContent =
                movie.quality || "HD";

        }


        // =================================
        // LANGUAGE
        // =================================

        const language =
            document.getElementById(
                "movieLanguage"
            );

        if (language) {

            language.textContent =
                movie.language || "Hindi";

        }


        // =================================
        // RATING
        // =================================

        const rating =
            document.getElementById(
                "movieRating"
            );

        if (rating) {

            const movieRating =
                Number(movie.rating || 0);

            rating.textContent =
                "⭐ " +
                movieRating.toFixed(1);

        }


        // =================================
        // DESCRIPTION
        // =================================

        const description =
            document.getElementById(
                "movieDescription"
            );

        if (description) {

            description.textContent =
                movie.description ||
                "Movie description will appear here.";

        }


        // =================================
        // LIKE COUNT
        // =================================

        const likeCount =
            document.getElementById(
                "likeCount"
            );

        if (likeCount) {

            likeCount.textContent =
                movie.likes || 0;

        }


        // =================================
        // VIEW COUNT
        // =================================

        const viewCount =
            document.getElementById(
                "viewCount"
            );

        if (viewCount) {

            viewCount.textContent =
                movie.views || 0;

        }


        // =================================
        // COMMENT COUNT
        // =================================

        const commentCount =
            document.getElementById(
                "commentCount"
            );

        if (commentCount) {

            commentCount.textContent =
                movie.comments_count || 0;

        }


        // =================================
        // STORE MOVIE DATA
        // =================================

        window.currentMovie = movie;


        // =================================
        // LOAD RELATED MOVIES
        // =================================

        loadRelatedMovies(
            movie.category
        );


    } catch (error) {

        console.error(
            "Load Movie Error:",
            error
        );

        showMessage(
            "❌ Movie data load failed."
        );

    }

}


// =========================================
// TRAILER
// =========================================

function setupTrailerButton() {

    const trailerBtn =
        document.getElementById(
            "trailerBtn"
        );


    if (!trailerBtn) {
        return;
    }


    trailerBtn.addEventListener(
        "click",
        function () {

            const movie =
                window.currentMovie;


            if (
                !movie ||
                !movie.trailer_url
            ) {

                alert(
                    "Trailer is not available."
                );

                return;
            }


            openTrailer(
                movie.trailer_url
            );

        }
    );

}


// =========================================
// OPEN TRAILER PLAYER
// =========================================

function openTrailer(url) {

    const oldPlayer =
        document.getElementById(
            "trailerPlayerBox"
        );


    if (oldPlayer) {

        oldPlayer.remove();

    }


    const box =
        document.createElement(
            "div"
        );

    box.id =
        "trailerPlayerBox";


    box.style.cssText = `
        margin:15px 20px 20px;
        padding:10px;
        background:#fffdf8;
        border-radius:18px;
        box-shadow:0 5px 18px rgba(0,0,0,.20);
    `;


    box.innerHTML = `

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:10px;
        ">

            <strong style="
                color:#5b3500;
                font-size:18px;
            ">
                🎬 Trailer
            </strong>

            <button
                id="closeTrailerBtn"
                type="button"
                style="
                    border:none;
                    background:#5b3500;
                    color:white;
                    border-radius:20px;
                    padding:7px 13px;
                    cursor:pointer;
                "
            >
                ✕
            </button>

        </div>


        <video
            controls
            autoplay
            playsinline
            style="
                width:100%;
                max-height:420px;
                border-radius:14px;
                display:block;
                background:#000;
            "
        >

            <source
                src="${escapeAttribute(url)}"
                type="video/mp4"
            >

            Your browser does not support video playback.

        </video>

    `;


    const movieDetails =
        document.querySelector(
            ".movie-details"
        );


    if (movieDetails) {

        movieDetails.insertBefore(
            box,
            movieDetails.firstChild
        );

    }


    document
        .getElementById(
            "closeTrailerBtn"
        )
        ?.addEventListener(
            "click",
            function () {

                box.remove();

            }
        );


    box.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// =========================================
// WATCH MOVIE
// =========================================

function setupWatchButton() {

    const watchBtn =
        document.getElementById(
            "watchBtn"
        );


    if (!watchBtn) {
        return;
    }


    watchBtn.addEventListener(
        "click",
        function () {

            const movie =
                window.currentMovie;


            if (
                !movie ||
                !movie.watch_url
            ) {

                alert(
                    "Watch Movie link is not available."
                );

                return;
            }


            window.location.href =
                movie.watch_url;

        }
    );

}


// =========================================
// DOWNLOAD
// =========================================

function setupDownloadButton() {

    const downloadBtn =
        document.getElementById(
            "downloadBtn"
        );


    if (!downloadBtn) {
        return;
    }


    downloadBtn.addEventListener(
        "click",
        function () {

            const movie =
                window.currentMovie;


            if (
                !movie ||
                !movie.download_url
            ) {

                alert(
                    "Download link is not available."
                );

                return;
            }


            window.location.href =
                movie.download_url;

        }
    );

}


// =========================================
// SHARE
// =========================================

function setupShareButton() {

    const shareBtn =
        document.getElementById(
            "shareBtn"
        );


    if (!shareBtn) {
        return;
    }


    shareBtn.addEventListener(
        "click",
        async function () {

            const movie =
                window.currentMovie;


            const title =
                movie?.title ||
                "FILMY OTT Movie";


            const shareData = {

                title: title,

                text:
                    "Watch " +
                    title +
                    " on FILMY OTT",

                url:
                    window.location.href

            };


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share(
                        shareData
                    );

                } else if (
                    navigator.clipboard
                ) {

                    await navigator.clipboard.writeText(
                        window.location.href
                    );

                    alert(
                        "Movie link copied!"
                    );

                } else {

                    alert(
                        window.location.href
                    );

                }

            } catch (error) {

                console.log(
                    "Share cancelled."
                );

            }

        }
    );

}


// =========================================
// LIKE
// =========================================

function setupLikeButton() {

    const likeBtn =
        document.getElementById(
            "likeBtn"
        );


    const likeCount =
        document.getElementById(
            "likeCount"
        );


    if (!likeBtn) {
        return;
    }


    const storageKey =
        "filmy_ott_like_" +
        movieId;


    if (
        localStorage.getItem(
            storageKey
        ) === "true"
    ) {

        likeBtn.classList.add(
            "liked"
        );

    }


    likeBtn.addEventListener(
        "click",
        async function () {

            const movie =
                window.currentMovie;


            if (!movie) {
                return;
            }


            const alreadyLiked =
                localStorage.getItem(
                    storageKey
                ) === "true";


            let newCount =
                Number(
                    movie.likes || 0
                );


            if (alreadyLiked) {

                newCount =
                    Math.max(
                        0,
                        newCount - 1
                    );

                localStorage.removeItem(
                    storageKey
                );

                likeBtn.classList.remove(
                    "liked"
                );

            } else {

                newCount++;

                localStorage.setItem(
                    storageKey,
                    "true"
                );

                likeBtn.classList.add(
                    "liked"
                );

            }


            if (likeCount) {

                likeCount.textContent =
                    newCount;

            }


            // Save count to Supabase
            const { error } =
                await supabase
                    .from("movies")
                    .update({
                        likes: newCount
                    })
                    .eq("id", movieId);


            if (error) {

                console.error(
                    "Like Update Error:",
                    error
                );

            } else {

                movie.likes =
                    newCount;

            }

        }
    );

}


// =========================================
// MY LIST
// =========================================

function setupListButton() {

    const listBtn =
        document.getElementById(
            "listBtn"
        );


    if (!listBtn) {
        return;
    }


    const storageKey =
        "filmy_ott_list_" +
        movieId;


    if (
        localStorage.getItem(
            storageKey
        ) === "true"
    ) {

        listBtn.classList.add(
            "saved"
        );

    }


    listBtn.addEventListener(
        "click",
        function () {

            const saved =
                listBtn.classList.toggle(
                    "saved"
                );


            if (saved) {

                localStorage.setItem(
                    storageKey,
                    "true"
                );

                alert(
                    "Added to My List"
                );

            } else {

                localStorage.removeItem(
                    storageKey
                );

                alert(
                    "Removed from My List"
                );

            }

        }
    );

}


// =========================================
// RATING
// =========================================

function setupRating() {

    const stars =
        document.querySelectorAll(
            ".stars i"
        );


    const message =
        document.getElementById(
            "ratingMessage"
        );


    stars.forEach(
        function (star) {

            star.addEventListener(
                "click",
                async function () {

                    const rate =
                        Number(
                            star.dataset.rate
                        );


                    stars.forEach(
                        function (item) {

                            const itemRate =
                                Number(
                                    item.dataset.rate
                                );


                            item.classList.toggle(
                                "active",
                                itemRate <= rate
                            );

                        }
                    );


                    if (message) {

                        message.textContent =
                            "You rated this movie " +
                            rate +
                            " out of 5.";

                    }


                    // Save simple rating
                    const { error } =
                        await supabase
                            .from("movies")
                            .update({
                                rating: rate
                            })
                            .eq("id", movieId);


                    if (error) {

                        console.error(
                            "Rating Error:",
                            error
                        );

                    }

                }
            );

        }
    );

}


// =========================================
// LOAD USER RATING
// =========================================

async function loadUserRating() {

    const movie =
        window.currentMovie;


    if (!movie) {
        return;
    }


    const rating =
        Number(
            movie.rating || 0
        );


    const stars =
        document.querySelectorAll(
            ".stars i"
        );


    stars.forEach(
        function (star) {

            const rate =
                Number(
                    star.dataset.rate
                );


            star.classList.toggle(
                "active",
                rate <= rating
            );

        }
    );

}


// =========================================
// COMMENTS
// =========================================

function setupComments() {

    const commentBtn =
        document.getElementById(
            "commentBtn"
        );


    const input =
        document.getElementById(
            "commentInput"
        );


    const list =
        document.getElementById(
            "commentsList"
        );


    if (!commentBtn || !input || !list) {
        return;
    }


    const storageKey =
        "filmy_ott_comments_" +
        movieId;


    let comments =
        JSON.parse(
            localStorage.getItem(
                storageKey
            ) || "[]"
        );


    renderComments();


    commentBtn.addEventListener(
        "click",
        function () {

            const text =
                input.value.trim();


            if (!text) {

                alert(
                    "Please write a comment."
                );

                return;

            }


            comments.push({
                text: text,
                time: new Date()
                    .toLocaleString()
            });


            localStorage.setItem(
                storageKey,
                JSON.stringify(
                    comments
                )
            );


            input.value = "";

            renderComments();

        }
    );


    function renderComments() {

        if (
            comments.length === 0
        ) {

            list.innerHTML = `
                <p class="no-comments">
                    No comments yet.
                </p>
            `;

            updateCommentCount(0);

            return;

        }


        list.innerHTML =
            comments
                .map(
                    function (comment) {

                        return `

                            <div class="comment-card">

                                <div class="comment-header">

                                    <strong>
                                        User
                                    </strong>

                                    <small>
                                        ${escapeHtml(
                                            comment.time
                                        )}
                                    </small>

                                </div>

                                <p>
                                    ${escapeHtml(
                                        comment.text
                                    )}
                                </p>

                            </div>

                        `;

                    }
                )
                .join("");


        updateCommentCount(
            comments.length
        );

    }

}


// =========================================
// COMMENT COUNT
// =========================================

function updateCommentCount(count) {

    const element =
        document.getElementById(
            "commentCount"
        );


    if (element) {

        element.textContent =
            count;

    }

}


// =========================================
// DETAILS TAB
// =========================================

function setupDetailsTabs() {

    const detailsBtn =
        document.getElementById(
            "detailsTabBtn"
        );


    const viewsBtn =
        document.getElementById(
            "viewsBtn"
        );


    const commentsBtn =
        document.getElementById(
            "commentsBtn"
        );


    const description =
        document.querySelector(
            ".description-box"
        );


    const commentsSection =
        document.querySelector(
            ".comments-section"
        );


    if (detailsBtn) {

        detailsBtn.addEventListener(
            "click",
            function () {

                detailsBtn.classList.add(
                    "active"
                );

                if (commentsBtn) {
                    commentsBtn.classList.remove(
                        "active"
                    );
                }

                if (description) {

                    description.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }

            }
        );

    }


    if (commentsBtn) {

        commentsBtn.addEventListener(
            "click",
            function () {

                commentsBtn.classList.add(
                    "active"
                );

                if (detailsBtn) {
                    detailsBtn.classList.remove(
                        "active"
                    );
                }

                if (commentsSection) {

                    commentsSection.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }

            }
        );

    }


    if (viewsBtn) {

        viewsBtn.addEventListener(
            "click",
            function () {

                viewsBtn.classList.add(
                    "active"
                );

            }
        );

    }

}


// =========================================
// RELATED MOVIES
// =========================================

async function loadRelatedMovies(category) {

    const container =
        document.getElementById(
            "relatedMovies"
        );


    if (!container || !category) {
        return;
    }


    try {

        const { data, error } =
            await supabase
                .from("movies")
                .select(
                    "id,title,poster_url,category"
                )
                .eq(
                    "category",
                    category
                )
                .neq(
                    "id",
                    movieId
                )
                .limit(6);


        if (error) {
            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML =
                "";

            return;

        }


        container.innerHTML =
            data
                .map(
                    function (movie) {

                        return `

                            <div
                                class="movie-card"
                                onclick="openMovie('${movie.id}')"
                            >

                                <img
                                    src="${escapeAttribute(
                                        movie.poster_url ||
                                        "logo-192.png"
                                    )}"
                                    alt="${escapeAttribute(
                                        movie.title ||
                                        "Movie"
                                    )}"
                                >

                                <h3>
                                    ${escapeHtml(
                                        movie.title ||
                                        "Movie"
                                    )}
                                </h3>

                            </div>

                        `;

                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Related Movies Error:",
            error
        );

    }

}


// =========================================
// OPEN RELATED MOVIE
// =========================================

window.openMovie = function (id) {

    window.location.href =
        "movie-details.html?id=" +
        encodeURIComponent(id);

};


// =========================================
// MESSAGE
// =========================================

function showMessage(message) {

    const title =
        document.getElementById(
            "movieName"
        );


    if (title) {

        title.textContent =
            message;

    }

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text ?? "";

    return div.innerHTML;

}


// =========================================
// ESCAPE ATTRIBUTE
// =========================================

function escapeAttribute(text) {

    return String(
        text ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}
