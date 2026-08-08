import { supabase } from "./supabase.js";


// ==============================
// LOAD DASHBOARD DATA
// ==============================

async function loadDashboard(){


try{


// TOTAL MOVIES

const { count: movieCount } = await supabase
.from("movies")
.select("*",{count:"exact",head:true});


document.getElementById("totalMovies").innerText =
movieCount || 0;





// TOTAL USERS

const { count:userCount } = await supabase
.from("users")
.select("*",{count:"exact",head:true});


document.getElementById("totalUsers").innerText =
userCount || 0;






// TOTAL VIEWS

const { data:viewData } = await supabase
.from("movies")
.select("views");


let totalViews = 0;


viewData?.forEach(movie=>{

totalViews += movie.views || 0;

});


document.getElementById("totalViews").innerText =
totalViews;







// TODAY MOVIES

const today = new Date();

const startToday = new Date(
today.getFullYear(),
today.getMonth(),
today.getDate()
).toISOString();



const { count:todayCount } = await supabase
.from("movies")
.select("*",{count:"exact",head:true})
.gte("created_at",startToday);



document.getElementById("todayMovies").innerText =
todayCount || 0;








// THIS MONTH MOVIES

const startMonth = new Date(
today.getFullYear(),
today.getMonth(),
1
).toISOString();



const { count:monthCount } = await supabase
.from("movies")
.select("*",{count:"exact",head:true})
.gte("created_at",startMonth);



document.getElementById("monthMovies").innerText =
monthCount || 0;







// LAST 5 MOVIES


const {data:movies}=await supabase
.from("movies")
.select("*")
.order("created_at",{ascending:false})
.limit(5);



let movieHTML="";



movies?.forEach(movie=>{


movieHTML += `

<div class="list-item">


<img src="${movie.poster_url || 'logo-192.png'}">


<p>
${movie.title}
</p>


</div>

`;


});



document.getElementById("lastMovies").innerHTML =
movieHTML || "No Movies";







// LAST 5 USERS


const {data:users}=await supabase
.from("users")
.select("*")
.order("created_at",{ascending:false})
.limit(5);



let userHTML="";


users?.forEach(user=>{


userHTML += `

<div class="list-item">

${user.name || user.email || "User"}

</div>

`;


});



document.getElementById("lastUsers").innerHTML =
userHTML || "No Users";







// LAST 5 NOTIFICATIONS


const {data:notifications}=await supabase
.from("notifications")
.select("*")
.order("created_at",{ascending:false})
.limit(5);



let notificationHTML="";


notifications?.forEach(item=>{


notificationHTML += `

<div class="list-item">

${item.message}

</div>

`;


});



document.getElementById("lastNotifications").innerHTML =
notificationHTML || "No Notifications";





}

catch(error){

console.log(error);

}


}









// ==============================
// DELETE MOVIE
// ==============================


window.deleteMovie = async function(id){


const confirmDelete =
confirm("Are you sure you want to delete this movie?");



if(!confirmDelete) return;



const {error}=await supabase
.from("movies")
.delete()
.eq("id",id);



if(error){

alert("❌ Delete Failed");
console.log(error);

return;

}



alert("✅ Movie Deleted");


loadMovies();


}








// ==============================
// LOAD MOVIE LIST
// ==============================


async function loadMovies(){


const movieList =
document.getElementById("movieList");


if(!movieList) return;



const {data:movies,error}=await supabase
.from("movies")
.select("*")
.order("created_at",{ascending:false});



if(error){

movieList.innerHTML="❌ Error Loading Movies";

return;

}



movieList.innerHTML="";



movies?.forEach(movie=>{


movieList.innerHTML += `

<div class="admin-card">


<img src="${movie.poster_url || 'logo-192.png'}">


<h3>${movie.title}</h3>


<p>
⭐ Rating: ${movie.rating || "0"}
</p>


<p>
📅 Year: ${movie.year || "N/A"}
</p>



<button onclick="deleteMovie('${movie.id}')">

🗑 Delete Movie

</button>


</div>

`;


});


}







loadDashboard();

loadMovies();