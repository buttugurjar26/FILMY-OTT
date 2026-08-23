import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";


// =====================================
// GET MOVIE ID
// =====================================

const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");


// =====================================
// LOAD MOVIE
// =====================================

async function loadMovie() {

    if (!movieId) return;

    try {

        const { data: movie, error } = await supabase
            .from("movies")
            .select("*")
            .eq("id", movieId)
            .single();

        if (error || !movie) {

            document.querySelector(".movie-details").innerHTML =
                "<h2>Movie Not Found</h2>";

            return;
        }


        // =====================================
        // MOVIE INFORMATION
        // =====================================

        document.getElementById("moviePoster").src =
            movie.poster_url || "logo-192.png";

        document.getElementById("movieName").innerText =
            movie.title || "Movie";

        document.getElementById("movieCategory").innerText =
            movie.category || "Movie";

        document.getElementById("movieYear").innerText =
            movie.year || "2026";

        document.getElementById("movieDuration").innerText =
            movie.duration || "N/A";

        document.getElementById("movieQuality").innerText =
            movie.quality || "HD";

        document.getElementById("movieLanguage").innerText =
            movie.language || "Hindi";

        document.getElementById("movieRating").innerText =
            "⭐ " + (movie.rating || "0.0");

        document.getElementById("movieDescription").innerText =
            movie.description || "No Description Available.";


        // =====================================
        // TRAILER
        // =====================================

        const trailerBtn =
            document.getElementById("trailerBtn");

        if (trailerBtn) {

            if (movie.trailer_url) {

                trailerBtn.onclick = function () {

                    window.location.href =
                        "player.html?id=" +
                        encodeURIComponent(movieId) +
                        "&type=trailer";

                };

            } else {

                trailerBtn.onclick = function () {

                    alert("Trailer Not Available");

                };

            }

        }


        // =====================================
        // WATCH MOVIE - DISKWALA
        // =====================================

        const watchBtn =
            document.getElementById("watchBtn");

        if (watchBtn) {

            if (movie.diskwala_url) {

                watchBtn.onclick = function () {

                    window.open(
                        movie.diskwala_url,
                        "_blank",
                        "noopener,noreferrer"
                    );

                };

            } else {

                watchBtn.onclick = function () {

                    alert("Watch Link Not Available");

                };

            }

        }


        // =====================================
        // DOWNLOAD MOVIE - NITROFLARE
        // =====================================

        const downloadBtn =
            document.getElementById("downloadBtn");

        if (downloadBtn) {

            if (movie.nitroflare_url) {

                downloadBtn.onclick = function () {

                    window.open(
                        movie.nitroflare_url,
                        "_blank",
                        "noopener,noreferrer"
                    );

                };

            } else {

                downloadBtn.onclick = function () {

                    alert("Download Link Not Available");

                };

            }

        }


        // =====================================
        // MY LIST
        // =====================================

        const listBtn =
            document.getElementById("listBtn");

        let myList =
            JSON.parse(localStorage.getItem("myList")) || [];

        myList = [...new Set(myList)];

        localStorage.setItem(
            "myList",
            JSON.stringify(myList)
        );


        function updateListButton() {

            if (myList.includes(movieId)) {

                listBtn.innerHTML =
                    '<i class="fa-solid fa-heart-crack"></i> ' +
                    '<span data-lang="removeFromMyList">' +
                    'Remove From My List' +
                    '</span>';

            } else {

                listBtn.innerHTML =
                    '<i class="fa-solid fa-heart"></i> ' +
                    '<span data-lang="addToMyList">' +
                    'Add to My List' +
                    '</span>';

            }

            setTimeout(() => {
                applyLanguage();
            }, 50);

        }


        updateListButton();


        listBtn.onclick = function () {

            let currentList =
                JSON.parse(localStorage.getItem("myList")) || [];

            currentList =
                [...new Set(currentList)];

            const index =
                currentList.indexOf(movieId);


            if (index > -1) {

                currentList.splice(index, 1);

                localStorage.setItem(
                    "myList",
                    JSON.stringify(currentList)
                );

                myList = currentList;

                updateListButton();

                alert("Removed From My List");


            } else {

                currentList.push(movieId);

                localStorage.setItem(
                    "myList",
                    JSON.stringify(currentList)
                );

                myList = currentList;

                updateListButton();

                alert("Added To My List");

            }

        };


        // =====================================
        // SHARE MOVIE
        // =====================================

        const shareBtn =
            document.getElementById("shareBtn");

        if (shareBtn) {

            shareBtn.onclick = async function () {

                try {

                    if (navigator.share) {

                        await navigator.share({

                            title: movie.title,

                            text:
                                movie.description ||
                                "Watch " + movie.title +
                                " on FILMY OTT",

                            url: window.location.href

                        });

                    } else {

                        await navigator.clipboard.writeText(
                            window.location.href
                        );

                        alert("Movie Link Copied");

                    }

                } catch (error) {

                    console.log("Share cancelled");

                }

            };

        }


        // =====================================
        // LOAD RELATED MOVIES
        // =====================================

        loadRelatedMovies(movie.category);


        // =====================================
        // LOAD LIKE
        // =====================================

        loadLikeStatus();


        // =====================================
        // LOAD COMMENTS
        // =====================================

        loadComments();


        // =====================================
        // ADD VIEW
        // =====================================

        addMovieView();

    }
    catch (error) {

        console.log("Movie Load Error:", error);

    }

}



// =====================================
// RELATED MOVIES
// =====================================

async function loadRelatedMovies(category) {

    const container =
        document.getElementById("relatedMovies");

    if (!container) return;

    container.innerHTML = "";

    const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("category", category)
        .neq("id", movieId)
        .limit(10);

    if (error) {

        console.log(error);

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML =
            "<p>No related movies found.</p>";

        return;
    }


    data.forEach(movie => {

        container.innerHTML += `

            <div
                class="movie-card"
                onclick="location.href='movie-details.html?id=${encodeURIComponent(movie.id)}'"
            >

                <img
                    src="${movie.poster_url || "logo-192.png"}"
                    alt="${movie.title || "Movie"}"
                >

                <h3>
                    ${movie.title || "Movie"}
                </h3>

            </div>

        `;

    });

}



// =====================================
// PUBLIC RATING
// =====================================

const stars =
    document.querySelectorAll(".stars i");

const message =
    document.getElementById("ratingMessage");


stars.forEach((star, index) => {

    star.onclick = async function () {

        const rating = index + 1;

        stars.forEach(s =>
            s.classList.remove("active")
        );

        for (let i = 0; i <= index; i++) {

            stars[i].classList.add("active");

        }


        const userId =
            localStorage.getItem("userId");


        if (!userId) {

            message.innerText =
                "Please login first.";

            return;

        }


        const { error } =
            await supabase
                .from("movie_ratings")
                .upsert(
                    {
                        movie_id: Number(movieId),
                        user_id: userId,
                        rating: rating
                    },
                    {
                        onConflict:
                            "movie_id,user_id"
                    }
                );


        if (error) {

            console.log(error);

            alert(error.message);

            message.innerText =
                "Rating could not be saved.";

            return;

        }


        const {
            data: ratings,
            error: ratingError
        } = await supabase
            .from("movie_ratings")
            .select("rating")
            .eq("movie_id", movieId);


        if (ratingError) {

            console.log(ratingError);

            return;

        }


        let total = 0;

        ratings.forEach(item => {

            total += Number(item.rating);

        });


        const average =
            ratings.length
                ? Number(
                    (total / ratings.length)
                    .toFixed(1)
                )
                : 0;


        const {
            error: updateError
        } = await supabase
            .from("movies")
            .update({
                rating: average
            })
            .eq("id", movieId);


        if (updateError) {

            console.log(updateError);

            return;

        }


        message.innerText =
            "Thanks! You rated " +
            rating +
            " ⭐";


        const movieRating =
            document.getElementById(
                "movieRating"
            );


        if (movieRating) {

            movieRating.innerText =
                "⭐ " + average;

        }

    };

});



// =====================================
// LOAD USER RATING
// =====================================

async function loadUserRating() {

    const userId =
        localStorage.getItem("userId");

    if (!userId) return;


    const {
        data,
        error
    } = await supabase
        .from("movie_ratings")
        .select("rating")
        .eq("movie_id", movieId)
        .eq("user_id", userId)
        .single();


    if (error || !data) return;


    stars.forEach(s =>
        s.classList.remove("active")
    );


    for (
        let i = 0;
        i < data.rating;
        i++
    ) {

        stars[i].classList.add("active");

    }


    message.innerText =
        "Your Rating: " +
        data.rating +
        " ⭐";

}



// =====================================
// LIKE SYSTEM
// =====================================

async function loadLikeStatus() {

    const likeBtn =
        document.getElementById("likeBtn");

    const likeCount =
        document.getElementById("likeCount");

    if (!likeBtn) return;


    const userId =
        localStorage.getItem("userId");


    const {
        count,
        error: countError
    } = await supabase
        .from("movie_likes")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("movie_id", movieId);


    if (!countError && likeCount) {

        likeCount.innerText =
            count || 0;

    }


    if (!userId) return;


    const {
        data,
        error
    } = await supabase
        .from("movie_likes")
        .select("id")
        .eq("movie_id", movieId)
        .eq("user_id", userId)
        .maybeSingle();


    if (!error && data) {

        likeBtn.classList.add("liked");

    }


    likeBtn.onclick = async function () {

        const currentUser =
            localStorage.getItem("userId");


        if (!currentUser) {

            alert("Please login first.");

            return;

        }


        const {
            data: existingLike,
            error: findError
        } = await supabase
            .from("movie_likes")
            .select("id")
            .eq("movie_id", movieId)
            .eq("user_id", currentUser)
            .maybeSingle();


        if (findError) {

            console.log(findError);

            return;

        }


        if (existingLike) {

            const { error: deleteError } =
                await supabase
                    .from("movie_likes")
                    .delete()
                    .eq("id", existingLike.id);


            if (deleteError) {

                console.log(deleteError);

                return;

            }


            likeBtn.classList.remove("liked");


        } else {

            const { error: insertError } =
                await supabase
                    .from("movie_likes")
                    .insert({

                        movie_id:
                            Number(movieId),

                        user_id:
                            currentUser

                    });


            if (insertError) {

                console.log(insertError);

                return;

            }


            likeBtn.classList.add("liked");

        }


        const {
            count: newCount
        } = await supabase
            .from("movie_likes")
            .select("*", {
                count: "exact",
                head: true
            })
            .eq("movie_id", movieId);


        if (likeCount) {

            likeCount.innerText =
                newCount || 0;

        }

    };

}



// =====================================
// COMMENT SYSTEM
// =====================================

async function loadComments() {

    const list =
        document.getElementById(
            "commentsList"
        );

    const commentCount =
        document.getElementById(
            "commentCount"
        );


    if (!list) return;


    const {
        data,
        error
    } = await supabase
        .from("movie_comments")
        .select("*")
        .eq("movie_id", movieId)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.log(error);

        return;

    }


    if (commentCount) {

        commentCount.innerText =
            data ? data.length : 0;

    }


    if (!data || data.length === 0) {

        list.innerHTML =
            `<p class="no-comments">
                No comments yet.
            </p>`;

        return;

    }


    list.innerHTML = "";


    data.forEach(comment => {

        const div =
            document.createElement("div");

        div.className =
            "comment-card";


        div.innerHTML = `

            <div class="comment-header">

                <strong>
                    ${escapeHTML(
                        comment.user_name ||
                        "User"
                    )}
                </strong>

                <small>
                    ${formatDate(
                        comment.created_at
                    )}
                </small>

            </div>

            <p>
                ${escapeHTML(
                    comment.comment || ""
                )}
            </p>

        `;


        list.appendChild(div);

    });

}



// =====================================
// POST COMMENT
// =====================================

const commentBtn =
    document.getElementById(
        "commentBtn"
    );


if (commentBtn) {

    commentBtn.onclick =
        async function () {

            const userId =
                localStorage.getItem(
                    "userId"
                );


            if (!userId) {

                alert(
                    "Please login first."
                );

                return;

            }


            const input =
                document.getElementById(
                    "commentInput"
                );


            const comment =
                input.value.trim();


            if (!comment) {

                alert(
                    "Please write a comment."
                );

                return;

            }


            const userName =
                localStorage.getItem(
                    "userName"
                ) ||
                "User";


            const {
                error
            } = await supabase
                .from("movie_comments")
                .insert({

                    movie_id:
                        Number(movieId),

                    user_id:
                        userId,

                    user_name:
                        userName,

                    comment:
                        comment

                });


            if (error) {

                console.log(error);

                alert(
                    "Comment could not be posted."
                );

                return;

            }


            input.value = "";

            await loadComments();

            alert(
                "Comment Posted"
            );

        };

}



// =====================================
// MOVIE VIEW
// =====================================

async function addMovieView() {

    const userId =
        localStorage.getItem(
            "userId"
        );


    if (!userId) return;


    const {
        error
    } = await supabase
        .from("movie_views")
        .insert({

            movie_id:
                Number(movieId),

            user_id:
                userId

        });


    if (error) {

        console.log(
            "View Error:",
            error
        );

        return;

    }


    const {
        count
    } = await supabase
        .from("movie_views")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("movie_id", movieId);


    const viewCount =
        document.getElementById(
            "viewCount"
        );


    if (viewCount) {

        viewCount.innerText =
            count || 0;

    }

}



// =====================================
// HTML SECURITY
// =====================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



// =====================================
// DATE FORMAT
// =====================================

function formatDate(date) {

    if (!date) return "";

    try {

        return new Date(date)
            .toLocaleDateString();

    } catch {

        return "";

    }

}



// =====================================
// LOAD EVERYTHING
// =====================================

loadMovie().then(() => {

    loadUserRating();

    applyLanguage();

});



// =====================================
// HEADER PROFILE AVATAR
// =====================================

const headerProfile =
    document.getElementById(
        "headerProfile"
    );


if (headerProfile) {

    const isLoggedIn =
        localStorage.getItem(
            "isLoggedIn"
        );

    const userAvatar =
        localStorage.getItem(
            "userAvatar"
        );


    if (
        isLoggedIn === "true" &&
        userAvatar
    ) {

        headerProfile.src =
            userAvatar;

    } else {

        headerProfile.src =
            "avatar-1.png";

    }

}
