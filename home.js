import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

let allMovies = [];


// ===============================
// LOAD MOVIES
// ===============================

async function loadMovies(){

    try{

        const { data, error } = await supabase
            .from("movies")
            .select("*")
            .order("created_at", { ascending:false });

        if(error) throw error;

        allMovies = data || [];
        
        console.log("HOME MOVIES:", allMovies);

        // ===============================
        // COMING SOON
        // ===============================

        displayMovies(
            "comingSoonMovies",
            allMovies
                .filter(movie => movie.coming_soon === true)
                .slice(0,9),
            "scroll"
        );


        // ===============================
        // FEATURED
        // ===============================

        displayMovies(
            "featuredMovies",
            allMovies
                .filter(movie => movie.featured === true)
                .slice(0,9),
            "scroll"
        );


        // ===============================
        // TRENDING
        // ===============================

        displayMovies(
            "trendingMovies",
            allMovies
                .filter(movie => movie.trending === true)
                .slice(0,9),
            "scroll"
        );


        // ===============================
        // MOST WATCHED
        // ===============================

        const mostWatched =
            [...allMovies]
            .sort((a,b) =>
                (b.views || 0) - (a.views || 0)
            );


        displayMovies(
            "mostWatchedMovies",
            mostWatched.slice(0,9),
            "scroll"
        );


        // ===============================
        // TOP RATED
        // ===============================

        const topRated =
            allMovies
            .filter(movie =>
                movie.rating &&
                Number(movie.rating) > 0
            )
            .sort((a,b) =>
                Number(b.rating) - Number(a.rating)
            );


        displayMovies(
            "topRatedMovies",
            topRated.slice(0,9),
            "scroll"
        );


        // ===============================
        // LATEST MOVIES
        // ===============================

        const latestMovies =
            [...allMovies]
            .sort((a,b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
            );


        displayMovies(
            "latestMovies",
            latestMovies.slice(0,9),
            "scroll"
        );

    }

    catch(error){

        console.error(
            "Movie Load Error:",
            error
        );

    }

}



// ===============================
// LOAD HOME BANNERS
// ===============================

async function loadBanners(){

    const bannerSlider =
        document.getElementById("bannerSlider");

    if(!bannerSlider) return;


    try{

        const { data: banners, error } =
            await supabase
                .from("banners")
                .select("*")
                .eq("is_active", true)
                .order("created_at", {
                    ascending:false
                });


        if(error) throw error;


        bannerSlider.innerHTML = "";


        // ===============================
        // NO BANNER
        // ===============================

        if(!banners || banners.length === 0){

            bannerSlider.innerHTML = `

                <img
                    src="banner1.jpg"
                    alt="FILMY OTT Banner">

            `;

            return;

        }


        // ===============================
        // DISPLAY BANNERS
        // ===============================

        banners.forEach(banner => {

            bannerSlider.innerHTML += `

                <img
                    src="${banner.image_url}"
                    alt="${banner.title || "FILMY OTT Banner"}">

            `;

        });


        // Reset slider position
        bannerIndex = 0;

        bannerSlider.scrollTo({
            left: 0,
            behavior: "auto"
        });

    }

    catch(error){

        console.error(
            "Banner Load Error:",
            error
        );

    }

}



// ===============================
// DISPLAY MOVIES
// ===============================

function displayMovies(
    section,
    movies,
    layout="scroll"
){

    const container =
        document.getElementById(section);


    if(!container) return;


    container.innerHTML = "";


    if(layout === "scroll"){

        container.className =
            "home-scroll";

    }

    else{

        container.className =
            "movie-grid";

    }


    if(!movies || movies.length === 0){

        container.innerHTML =
            `<p class="empty-text">
                No Movies Found
            </p>`;

        return;

    }


    movies.forEach(movie => {

        const card =
            document.createElement("div");


        card.className =
            "movie-card";


        card.onclick = () => {

            window.location.href =
                "movie-details.html?id=" +
                movie.id;

        };


        card.innerHTML = `

            <img
                src="${movie.poster_url || "logo-192.png"}"
                alt="${movie.title || "Movie"}">

            <h3>
                ${movie.title || "Movie"}
            </h3>

            <p>
                ${movie.category || "Movie"}
            </p>

            <button data-lang="watchNow">
                ▶ Watch Now
            </button>

        `;


        container.appendChild(card);

    });

}



// ===============================
// AUTO BANNER
// ===============================

let bannerIndex = 0;

let bannerTimer = null;


function autoSlider(){

    const slider =
        document.getElementById("bannerSlider");


    if(!slider) return;


    // Clear previous timer
    if(bannerTimer){

        clearInterval(bannerTimer);

    }


    bannerTimer =
        setInterval(() => {

            const banners =
                slider.querySelectorAll("img");


            if(banners.length <= 1){

                return;

            }


            bannerIndex++;


            if(
                bannerIndex >=
                banners.length
            ){

                bannerIndex = 0;

            }


            slider.scrollTo({

                left:
                    slider.clientWidth *
                    bannerIndex,

                behavior:
                    "smooth"

            });


        }, 4000);

}



// ===============================
// START APP
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        // Load movies
        await loadMovies();

        // Load Admin Banner Manager banners
        await loadBanners();

        // Start auto slider
        autoSlider();

        // Apply language
        applyLanguage();

    }
);



// ===============================
// HEADER PROFILE AVATAR & CLICK FIX
// ===============================

const headerProfile =
    document.getElementById(
        "headerProfile"
    );


if(headerProfile){

    const isLoggedIn =
        localStorage.getItem(
            "isLoggedIn"
        );


    const userAvatar =
        localStorage.getItem(
            "userAvatar"
        );


    headerProfile.src =
        (
            isLoggedIn === "true" &&
            userAvatar
        )
        ?
        userAvatar
        :
        "avatar-1.png";

}

// Global scope me function attach kiya hai taki html me onclick="openProfile()" chal sake
window.openProfile = function() {
    window.location.href = "profile.html";
};

// Backup Event Listener (Direct DOM attach)
document.addEventListener("DOMContentLoaded", () => {
    const profileBtn = document.querySelector(".profile") || document.getElementById("headerProfile");
    if (profileBtn) {
        profileBtn.style.cursor = "pointer";
        profileBtn.onclick = function() {
            window.location.href = "profile.html";
        };
    }
});
