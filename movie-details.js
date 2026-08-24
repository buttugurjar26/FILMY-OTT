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

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        if (!movieId) {

            console.error(
                "Movie ID not found."
            );

            showMessage(
                "Movie information not found."
            );

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

    }
);


// =========================================
// LOAD MOVIE
// =========================================

async function loadMovie() {

    try {

        const {
            data: movie,
            error
        } = await supabase
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


        if (
            poster &&
            movie.poster_url
        ) {

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
                movie.title ||
                "Movie Name";

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
                movie.category ||
                "Category";

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
                movie.movieyear ||
                "2026";

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
                movie.duration ||
                "2h 30m";

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
                movie.quality ||
                "HD";

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
                movie.language ||
                "Hindi";

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
                Number(
                    movie.rating || 0
                );


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
        // STORE MOVIE
        // =================================

        window.currentMovie =
            movie;


        // =================================
        // LOAD CAST
        // =================================

        renderCast(
            movie
        );


        // =================================
        // LOAD RELATED MOVIES
        // =================================

        loadRelatedMovies(
            movie.category
        );


        // =================================
        // LOAD USER RATING
        // =================================

        loadUserRating();


        // =================================
        // UPDATE MY LIST BUTTON
        // =================================

        updateListButton();


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
// OPEN TRAILER
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
                    width:auto;
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
// CAST BUTTON
// =========================================

function setupCastButton() {

    const castBtn =
        document.getElementById(
            "castBtn"
        );


    const castContent =
        document.getElementById(
            "castContent"
        );


    if (!castBtn || !castContent) {
        return;
    }


    castBtn.addEventListener(
        "click",
        function () {

            const isVisible =
                castContent.classList.contains(
                    "active-content"
                );


            if (isVisible) {

                castContent.classList.remove(
                    "active-content"
                );


                castBtn.classList.remove(
                    "active"
                );


                return;

            }


            castContent.classList.add(
                "active-content"
            );


            castBtn.classList.add(
                "active"
            );


            castContent.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }
    );

}


// =========================================
// RENDER CAST
// =========================================

function renderCast(movie) {

    const castContent =
        document.getElementById(
            "castContent"
        );


    const castList =
        document.getElementById(
            "castList"
        );


    if (!castContent || !castList) {
        return;
    }


    let castData = null;


    // =================================
    // TRY CAST FIELDS
    // =================================

    if (movie.cast) {

        castData =
            movie.cast;

    } else if (movie.cast_members) {

        castData =
            movie.cast_members;

    } else if (movie.actors) {

        castData =
            movie.actors;

    }


    // =================================
    // STRING JSON
    // =================================

    if (
        typeof castData === "string"
    ) {

        try {

            castData =
                JSON.parse(
                    castData
                );

        } catch (error) {

            console.error(
                "Cast JSON Error:",
                error
            );

            castData = [];

        }

    }


    // =================================
    // NO CAST
    // =================================

    if (
        !Array.isArray(castData) ||
        castData.length === 0
    ) {

        castList.innerHTML = `

            <div class="no-cast">

                <i class="fa-solid fa-users-slash"></i>

                <p>
                    Cast information not available.
                </p>

            </div>

        `;

        return;

    }


    //
