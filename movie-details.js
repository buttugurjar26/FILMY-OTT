/* =========================================
   FILMY OTT - MOVIE DETAILS UI
========================================= */


/* =========================================
   PROFILE
========================================= */

window.openProfile = function () {

    window.location.href = "profile.html";

};


/* =========================================
   DOM READY
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =====================================
           TAB ELEMENTS
        ===================================== */

        const detailsTabBtn =
            document.getElementById(
                "detailsTabBtn"
            );


        const ratingTabBtn =
            document.getElementById(
                "ratingTabBtn"
            );


        const commentsTabBtn =
            document.getElementById(
                "commentsTabBtn"
            );


        const detailsContent =
            document.getElementById(
                "detailsContent"
            );


        const ratingContent =
            document.getElementById(
                "ratingContent"
            );


        const commentsContent =
            document.getElementById(
                "commentsContent"
            );



        /* =====================================
           TAB FUNCTION
        ===================================== */

        function showTab(
            selectedButton,
            selectedContent
        ) {


            /* REMOVE ACTIVE FROM ALL BUTTONS */

            detailsTabBtn.classList.remove(
                "active"
            );

            ratingTabBtn.classList.remove(
                "active"
            );

            commentsTabBtn.classList.remove(
                "active"
            );


            /* HIDE ALL CONTENT */

            detailsContent.classList.remove(
                "active-content"
            );

            ratingContent.classList.remove(
                "active-content"
            );

            commentsContent.classList.remove(
                "active-content"
            );


            /* SHOW SELECTED */

            selectedButton.classList.add(
                "active"
            );

            selectedContent.classList.add(
                "active-content"
            );

        }



        /* =====================================
           MOVIE DETAILS
        ===================================== */

        if (
            detailsTabBtn &&
            detailsContent
        ) {

            detailsTabBtn.addEventListener(
                "click",
                function () {

                    showTab(
                        detailsTabBtn,
                        detailsContent
                    );

                }
            );

        }



        /* =====================================
           RATING
        ===================================== */

        if (
            ratingTabBtn &&
            ratingContent
        ) {

            ratingTabBtn.addEventListener(
                "click",
                function () {

                    showTab(
                        ratingTabBtn,
                        ratingContent
                    );

                }
            );

        }



        /* =====================================
           COMMENTS
        ===================================== */

        if (
            commentsTabBtn &&
            commentsContent
        ) {

            commentsTabBtn.addEventListener(
                "click",
                function () {

                    showTab(
                        commentsTabBtn,
                        commentsContent
                    );

                }
            );

        }



        /* =====================================
           RATING STARS
        ===================================== */

        const stars =
            document.querySelectorAll(
                ".stars i"
            );


        const ratingMessage =
            document.getElementById(
                "ratingMessage"
            );


        stars.forEach(
            function (star) {

                star.addEventListener(
                    "click",
                    function () {


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


                                if (
                                    itemRate <= rate
                                ) {

                                    item.classList.add(
                                        "active"
                                    );

                                } else {

                                    item.classList.remove(
                                        "active"
                                    );

                                }

                            }
                        );


                        if (ratingMessage) {

                            ratingMessage.textContent =
                                "You rated this movie " +
                                rate +
                                " out of 5.";

                        }

                    }
                );

            }
        );



        /* =====================================
           LIKE BUTTON
        ===================================== */

        const likeBtn =
            document.getElementById(
                "likeBtn"
            );


        const likeCount =
            document.getElementById(
                "likeCount"
            );


        if (likeBtn) {

            likeBtn.addEventListener(
                "click",
                function () {


                    const liked =
                        likeBtn.classList.toggle(
                            "liked"
                        );


                    if (likeCount) {

                        likeCount.textContent =
                            liked ? "1" : "0";

                    }

                }
            );

        }



        /* =====================================
           SHARE BUTTON
        ===================================== */

        const shareBtn =
            document.getElementById(
                "shareBtn"
            );


        if (shareBtn) {

            shareBtn.addEventListener(
                "click",
                async function () {


                    const titleElement =
                        document.getElementById(
                            "movieName"
                        );


                    const title =
                        titleElement
                            ? titleElement.textContent.trim()
                            : "FILMY OTT Movie";


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

                        }


                    } catch (error) {

                        console.log(
                            "Share cancelled."
                        );

                    }

                }
            );

        }



        /* =====================================
           DOWNLOAD BUTTON
        ===================================== */

        const downloadBtn =
            document.getElementById(
                "downloadBtn"
            );


        if (downloadBtn) {

            downloadBtn.addEventListener(
                "click",
                function () {

                    const message =
                        "Download option will be available after the movie download link is added.";

                    alert(message);

                }
            );

        }



        /* =====================================
           LIST BUTTON
        ===================================== */

        const listBtn =
            document.getElementById(
                "listBtn"
            );


        if (listBtn) {

            listBtn.addEventListener(
                "click",
                function () {

                    listBtn.classList.toggle(
                        "saved"
                    );


                    if (
                        listBtn.classList.contains(
                            "saved"
                        )
                    ) {

                        listBtn
                            .querySelector("i")
                            ?.classList.replace(
                                "fa-bookmark",
                                "fa-bookmark"
                            );

                        alert(
                            "Added to My List"
                        );

                    } else {

                        alert(
                            "Removed from My List"
                        );

                    }

                }
            );

        }



        /* =====================================
           COMMENTS
        ===================================== */

        const commentBtn =
            document.getElementById(
                "commentBtn"
            );


        const commentInput =
            document.getElementById(
                "commentInput"
            );


        const commentsList =
            document.getElementById(
                "commentsList"
            );


        const commentCount =
            document.getElementById(
                "commentCount"
            );


        let comments = [];


        function updateCommentCount() {

            if (commentCount) {

                commentCount.textContent =
                    comments.length;

            }

        }


        function renderComments() {


            if (!commentsList) {
                return;
            }


            if (
                comments.length === 0
            ) {

                commentsList.innerHTML = `
                    <p class="no-comments">
                        No comments yet.
                    </p>
                `;

                updateCommentCount();

                return;

            }


            commentsList.innerHTML =
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
                                            Just now
                                        </small>

                                    </div>

                                    <p>
                                        ${escapeHtml(
                                            comment
                                        )}
                                    </p>

                                </div>
                            `;

                        }
                    )
                    .join("");


            updateCommentCount();

        }


        function escapeHtml(text) {

            const div =
                document.createElement(
                    "div"
                );

            div.textContent = text;

            return div.innerHTML;

        }


        if (commentBtn) {

            commentBtn.addEventListener(
                "click",
                function () {


                    const text =
                        commentInput
                            ? commentInput.value.trim()
                            : "";


                    if (!text) {

                        alert(
                            "Please write a comment."
                        );

                        return;

                    }


                    comments.push(
                        text
                    );


                    if (commentInput) {

                        commentInput.value =
                            "";

                    }


                    renderComments();

                }
            );

        }


        renderComments();



        /* =====================================
           WATCH TRAILER
        ===================================== */

        const trailerBtn =
            document.getElementById(
                "trailerBtn"
            );


        if (trailerBtn) {

            trailerBtn.addEventListener(
                "click",
                function () {

                    console.log(
                        "Trailer button clicked"
                    );

                }
            );

        }



        /* =====================================
           WATCH MOVIE
        ===================================== */

        const watchBtn =
            document.getElementById(
                "watchBtn"
            );


        if (watchBtn) {

            watchBtn.addEventListener(
                "click",
                function () {

                    const movieId =
                        new URLSearchParams(
                            window.location.search
                        ).get("id");


                    if (movieId) {

                        window.location.href =
                            "player.html?id=" +
                            encodeURIComponent(
                                movieId
                            );

                    } else {

                        window.location.href =
                            "player.html";

                    }

                }
            );

        }

    }
);

// =====================================
// START MOVIE DETAILS PAGE
// =====================================

loadMovie();
loadUserRating();
