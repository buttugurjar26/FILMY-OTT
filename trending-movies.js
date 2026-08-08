import { supabase } from "./supabase.js";



const movieList = document.getElementById("movieList");




// LOAD MOVIES

async function loadMovies(){

    const { data, error } = await supabase
    .from("movies")
    .select("*")
    .order("created_at",{ascending:false});


    if(error){

    alert(error.message);
    console.log(error);
    return;

}


    movieList.innerHTML="";


    data.forEach(movie=>{


        movieList.innerHTML += `


        <div class="movie-card">


            <img src="${movie.poster_url || 'logo-192.png'}">


            <h3>${movie.title || "Movie"}</h3>



            <button 
class="trending-btn ${movie.trending ? 'active':''}"
onclick="toggleTrending('${movie.id}', ${movie.trending})">


            ${movie.trending ? "Trending ON" : "Make Trending"}


            </button>



        </div>


        `;


    });


}





// TOGGLE TRENDING

window.toggleTrending = async function(id,status){


    const { error } = await supabase
    .from("movies")
    .update({

        trending: !status

    })
    .eq("id",id);



    if(error){

        console.log(error);
        return;

    }



    loadMovies();


};





loadMovies();