import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";



let allMovies = [];




// CATEGORY TOGGLE

window.toggleCategory = function(){

let menu = document.getElementById("categoryMenu");

menu.classList.toggle("show");

};






// LOAD MOVIES

async function loadMovies(){


try{


const { data, error } = await supabase
.from("movies")
.select("*")
.order("created_at",{ascending:false});



if(error){
    console.log("SUPABASE ERROR:", error);
    throw error;
}

console.log("MOVIES FROM SUPABASE:", data);

if (!data || data.length === 0) {
    console.log("NO MOVIES FOUND");
}

allMovies = data || [];

displayMovies(allMovies);


}

catch(error){


console.log("Movie Load Error:",error);


}


}








// DISPLAY MOVIES

function displayMovies(movies){


let container =
document.getElementById("movieContainer");


let noResult =
document.getElementById("noResult");



if(!container) return;



container.innerHTML="";





if(movies.length === 0){


if(noResult){

noResult.style.display="block";

}


return;

}


else{


if(noResult){

noResult.style.display="none";

}


}







movies.forEach(movie => {

    let card = document.createElement("div");

    card.className = "movie-card";

    card.onclick = function () {

        window.location.href =
        "movie-details.html?id=" + movie.id;

    };

    card.innerHTML = `

        <img src="${movie.poster_url || 'logo-192.png'}">

        <h3>${movie.title || "Movie"}</h3>

        <p>${movie.category || "Movie"}</p>

<button data-lang="watchNow">

▶ Watch Now

</button>

    `;

    container.appendChild(card);

});


}










// CATEGORY FILTER

window.filterMovies = function(category){



if(category==="All"){


displayMovies(allMovies);


return;

}





let filteredMovies =
allMovies.filter(movie=>{


return movie.category === category;


});



displayMovies(filteredMovies);



};







loadMovies().then(()=>{

    applyLanguage();

});


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


// ===============================
// EDIT MOVIE
// ===============================

window.editMovie = function(movieId){

    window.location.href =
    "edit-movie.html?id=" + movieId;

};
