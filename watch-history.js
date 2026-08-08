import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

// ===============================
// WATCH HISTORY
// ===============================

const container =
document.getElementById("historyMovies");

let history =
JSON.parse(localStorage.getItem("watchHistory")) || [];

// ===============================
// LOAD HISTORY
// ===============================

async function loadHistory(){

container.innerHTML = "";

if(history.length===0){

container.innerHTML = `

<div class="empty">

🕒 No Watch History Found

</div>

`;

return;

}

try{

const { data: movies, error } =
await supabase
.from("movies")
.select("*");

if(error) throw error;

history.forEach(id=>{

const movie =
movies.find(item=>item.id==id);

if(movie){

container.innerHTML += `

<div class="movie-card"
onclick="openMovie('${movie.id}')">

<img src="${movie.poster_url || 'logo-192.png'}">

<h3>${movie.title}</h3>

<button
class="watchBtn"
onclick="event.stopPropagation();openMovie('${movie.id}')">

▶ Watch Again

</button>

<button
class="removeBtn"
onclick="event.stopPropagation();removeHistory('${movie.id}')">

🗑 Remove

</button>

</div>

`;

}

});

}catch(error){

console.log(error);

}

}

// ===============================
// OPEN MOVIE
// ===============================

window.openMovie=function(id){

window.location.href =
"movie-details.html?id="+id;

};

// ===============================
// REMOVE HISTORY
// ===============================

window.removeHistory=function(id){

history =
history.filter(movieId=>movieId!=id);

localStorage.setItem(
"watchHistory",
JSON.stringify(history)
);

loadHistory();

};

// ===============================
// LOAD
// ===============================

loadHistory();

applyLanguage();

// ===============================
// HEADER PROFILE
// ===============================

const headerProfile =
document.getElementById("headerProfile");

if(headerProfile){

const isLoggedIn =
localStorage.getItem("isLoggedIn");

const userAvatar =
localStorage.getItem("userAvatar");

if(isLoggedIn==="true" && userAvatar){

headerProfile.src=userAvatar;

}else{

headerProfile.src="avatar-1.png";

}

}