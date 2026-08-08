import { supabase } from "./supabase.js";

const movieList = document.getElementById("movieList");

// LOAD MOVIES

async function loadMovies(){

    const { data, error } = await supabase
    .from("movies")
    .select("*")
    .order("created_at", { ascending:false });

    if(error){
        console.log(error);
        return;
    }

    movieList.innerHTML = "";

    data.forEach(movie => {

        movieList.innerHTML += `

        <div class="movie-card">

            <div class="movie-info">

                <img src="${movie.poster_url || 'logo-192.png'}">

                <h3>${movie.title}</h3>

            </div>

            <button
                class="toggle-btn ${movie.coming_soon ? 'toggle-on' : 'toggle-off'}"
                onclick="toggleComingSoon('${movie.id}', ${movie.coming_soon})">

                ${movie.coming_soon ? "ON" : "OFF"}

            </button>

        </div>

        `;

    });

}


// TOGGLE COMING SOON

window.toggleComingSoon = async function(id, status){

    const { error } = await supabase
    .from("movies")
    .update({
        coming_soon: !status
    })
    .eq("id", id);

    if(error){
        console.log(error);
        return;
    }

    loadMovies();

}


loadMovies();