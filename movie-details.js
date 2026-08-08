import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";





// GET MOVIE ID

const params = new URLSearchParams(window.location.search);

const movieId = params.get("id");



// LOAD MOVIE

async function loadMovie(){

if(!movieId) return;


try{


const { data: movie, error } = await supabase
.from("movies")
.select("*")
.eq("id", movieId)
.single();



if(error || !movie){


document.querySelector(".movie-details").innerHTML =
"<h2>Movie Not Found</h2>";

return;

}



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



// WATCH NOW

document.getElementById("watchBtn").onclick=function(){


if(movie.video_url){

window.location.href =
"player.html?id="+movieId;


}else{


alert("Video Not Available");


}


};




// MY LIST

const listBtn = document.getElementById("listBtn");


let myList =
JSON.parse(localStorage.getItem("myList")) || [];


// Remove duplicate IDs
myList = [...new Set(myList)];

localStorage.setItem(
"myList",
JSON.stringify(myList)
);



if(myList.includes(movieId)){

listBtn.innerHTML =
'<i class="fa-solid fa-heart-crack"></i> <span data-lang="removeFromMyList">Remove From My List</span>';

setTimeout(()=>{
    applyLanguage();
},50);

}



listBtn.onclick=function(){


let myList =
JSON.parse(localStorage.getItem("myList")) || [];


// Remove duplicate IDs

myList = [...new Set(myList)];



let index = myList.indexOf(movieId);



if(index > -1){


myList.splice(index,1);


localStorage.setItem(
"myList",
JSON.stringify(myList)
);



listBtn.innerHTML =
'<i class="fa-solid fa-heart"></i> <span data-lang="addToMyList">Add to My List</span>';

setTimeout(()=>{
    applyLanguage();
},50);


alert("Removed From My List");



}else{


// Add only once

if(!myList.includes(movieId)){


myList.push(movieId);


}


localStorage.setItem(
"myList",
JSON.stringify(myList)
);



listBtn.innerHTML =
'<i class="fa-solid fa-heart-crack"></i> Remove From My List';


alert("Added To My List");


}


};




// SHARE MOVIE

document.getElementById("shareBtn").onclick=async function(){


if(navigator.share){


await navigator.share({

title:movie.title,

text:movie.description,

url:window.location.href

});


}else{


navigator.clipboard.writeText(window.location.href);

alert("Movie Link Copied");


}


};



// RELATED

loadRelatedMovies(movie.category);



}

catch(error){

console.log(error);

}

}







// RELATED MOVIES

async function loadRelatedMovies(category){


const container =
document.getElementById("relatedMovies");


if(!container) return;


container.innerHTML="";



const {data,error}=await supabase
.from("movies")
.select("*")
.eq("category",category);



if(error) return;



data.forEach(movie=>{


container.innerHTML+=`

<div class="movie-card"

onclick="location.href='movie-details.html?id=${movie.id}'">


<img src="${movie.poster_url||'logo-192.png'}">


<h3>${movie.title||'Movie'}</h3>


</div>

`;

});


}







// ===============================
// PUBLIC RATING
// ===============================

const stars = document.querySelectorAll(".stars i");
const message = document.getElementById("ratingMessage");

stars.forEach((star, index) => {

    star.onclick = async function () {

        const rating = index + 1;

        // Active Stars
        stars.forEach(s => s.classList.remove("active"));

        for (let i = 0; i <= index; i++) {
            stars[i].classList.add("active");
        }

        const userId = localStorage.getItem("userId");

        if (!userId) {
            message.innerText = "Please login first.";
            return;
        }

        // Save / Update User Rating
const { error } = await supabase
    .from("movie_ratings")
    .upsert(
        {
            movie_id: Number(movieId),
            user_id: userId,
            rating: rating
        },
        {
            onConflict: "movie_id,user_id"
        }
    );

if (error) {
    console.log(error);
    alert(error.message);
    message.innerText = "Rating could not be saved.";
    return;
}

        // Get All Ratings of This Movie
        const { data: ratings, error: ratingError } =
            await supabase
                .from("movie_ratings")
                .select("rating")
                .eq("movie_id", movieId);

        if (ratingError) {
            console.log(ratingError);
            return;
        }

        // Calculate Average Rating
        let total = 0;

        ratings.forEach(item => {
            total += item.rating;
        });

        const average =
            Number((total / ratings.length).toFixed(1));

        // Update Movies Table
        const { error: updateError } = await supabase
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
            "Thanks! You rated " + rating + " ⭐";

        // Show New Average
        const movieRating =
            document.getElementById("movieRating");

        if (movieRating) {
            movieRating.innerText = "⭐ " + average;
        }

    };

});


// ===============================
// LOAD USER RATING
// ===============================

async function loadUserRating() {

    const userId = localStorage.getItem("userId");

    if (!userId) return;

    const { data, error } = await supabase
        .from("movie_ratings")
        .select("rating")
        .eq("movie_id", movieId)
        .eq("user_id", userId)
        .single();

    if (error || !data) return;

    stars.forEach(s => s.classList.remove("active"));

    for (let i = 0; i < data.rating; i++) {
        stars[i].classList.add("active");
    }

    message.innerText = "Your Rating: " + data.rating + " ⭐";

}


loadMovie().then(() => {

    loadUserRating();

    applyLanguage();

});

export function t(key) {
    return languages[currentLanguage]?.[key] || key;
}

// HEADER PROFILE AVATAR

const headerProfile = document.getElementById("headerProfile");

if (headerProfile) {

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userAvatar = localStorage.getItem("userAvatar");

    if (isLoggedIn === "true" && userAvatar) {

        headerProfile.src = userAvatar;

    } else {

        headerProfile.src = "avatar-1.png";

    }

}