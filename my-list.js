import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";



const container =
document.getElementById("myListMovies");


let myList = [
...new Set(
JSON.parse(localStorage.getItem("myList")) || []
)
];

localStorage.setItem(
"myList",
JSON.stringify(myList)
);





// LOAD MY LIST

async function loadMyList(){


container.innerHTML="";



if(myList.length===0){


container.innerHTML = `

<h2 style="text-align:center;color:#5b3500;">

❤️ Your My List is Empty

</h2>

`;


return;

}





try{


const { data: allMovies, error } = await supabase
.from("movies")
.select("*");



if(error){

throw error;

}





myList.forEach(id=>{


let movie =
allMovies.find(
item=>item.id==id
);



if(movie){


container.innerHTML += `


<div class="movie-card"
onclick="openMovie('${movie.id}')">


<img src="${movie.poster_url || 'logo-192.png'}">


<h3>${movie.title || "Movie"}</h3>



<button class="watchBtn" data-lang="watchNow">

▶ Watch Now

</button>



<button 
class="removeBtn"
data-lang="remove"
onclick="event.stopPropagation(); removeMovie('${movie.id}')">

🗑 Remove

</button>


</div>


`;

}



});



}

catch(error){


console.log("My List Error:",error);


}


}








// OPEN MOVIE


window.openMovie=function(id){


window.location.href =
"movie-details.html?id="+id;


}







// REMOVE MOVIE


window.removeMovie=function(id){


myList =
myList.filter(
movieId=>movieId!=id
);



localStorage.setItem(
"myList",
JSON.stringify(myList)
);



loadMyList();

  applyLanguage();

}







loadMyList().then(()=>{

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