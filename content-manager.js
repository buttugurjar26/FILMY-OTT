// ===============================
// FILMY OTT CONTENT MANAGER
// ===============================


// LOGIN CHECK

if (

localStorage.getItem("adminLoggedIn") !== "true" ||

localStorage.getItem("isAdmin") !== "true"

){

window.location.href = "admin-login.html";

}



console.log("Content Manager Loaded");




// ===============================
// BANNER MANAGER
// ===============================

document.getElementById("bannerManager").onclick = function(){

alert("Banner Manager Coming Soon");

};




// ===============================
// FEATURED MOVIES
// ===============================

document.getElementById("featuredMovies").onclick = function(){

alert("Featured Movies Coming Soon");

};




// ===============================
// TRENDING MOVIES
// ===============================

document.getElementById("trendingMovies").onclick = function(){

alert("Trending Movies Coming Soon");

};




// ===============================
// LATEST MOVIES
// ===============================

document.getElementById("latestMovies").onclick = function(){

alert("Latest Movies Manager Coming Soon");

};




// ===============================
// COMING SOON
// ===============================

document.getElementById("comingSoon").onclick = function(){

alert("Coming Soon Manager Coming Soon");

};