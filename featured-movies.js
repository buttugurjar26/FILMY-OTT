import { supabase } from "./supabase.js";

// ===============================
// ADMIN LOGIN CHECK
// ===============================

if (
    localStorage.getItem("adminLoggedIn") !== "true" ||
    localStorage.getItem("isAdmin") !== "true"
){
    window.location.href = "admin-login.html";
}

const movieList =
document.getElementById("movieList");

// ===============================
// LOAD MOVIES
// ===============================

async function loadMovies(){

    try{

        const { data: movies, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at",{ascending:false});

        if(error){

            throw error;

        }

        movieList.innerHTML = "";

        if(!movies || movies.length===0){

            movieList.innerHTML =
            "<h2>No Movies Found</h2>";

            return;

        }

        movies.forEach((movie)=>{

            movieList.innerHTML += `

            <div class="movie-card">

                <img src="${movie.poster_url || 'logo-192.png'}">

                <h3>${movie.title}</h3>

                <button
                onclick="toggleFeatured('${movie.id}', ${movie.featured})">

                ${
                    movie.featured
                    ? "⭐ Remove Featured"
                    : "⭐ Make Featured"
                }

                </button>

            </div>

            `;

        });

    }

    catch(error){

        console.log(error);

        movieList.innerHTML =
        "❌ Failed to Load Movies";

    }

}

// ===============================
// FEATURE / UNFEATURE MOVIE
// ===============================

window.toggleFeatured = async function(id, currentStatus){

    try{

        const { error } = await supabase
        .from("movies")
        .update({
            featured: !currentStatus
        })
        .eq("id", id);

        if(error){

            throw error;

        }

        loadMovies();

    }

    catch(error){

        console.log(error);

        alert("❌ " + error.message);

    }

};


// ===============================
// INITIAL LOAD
// ===============================

loadMovies();