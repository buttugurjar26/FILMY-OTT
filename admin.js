// ===============================
// FILMY OTT ADMIN PANEL
// ===============================


// ADMIN LOGIN CHECK

if (

localStorage.getItem("adminLoggedIn") !== "true" ||

localStorage.getItem("isAdmin") !== "true"

){

window.location.href = "admin-login.html";

}





console.log("FILMY OTT Admin Panel Loaded");





// ===============================
// NAVIGATION
// ===============================


// ADD MOVIE

function openAddMovie(){

window.location.href = "add-movie.html";

}



// MANAGE MOVIES

function openManageMovies(){

window.location.href = "manage-movies.html";

}



// LIVE DASHBOARD

function openDashboard(){

window.location.href = "admin-dashboard.html";

}



// GO HOME

function goHome(){

window.location.href = "home.html";

}



// ADMIN LOGOUT

function adminLogout(){

localStorage.removeItem("adminLoggedIn");

localStorage.removeItem("isAdmin");

window.location.href = "home.html";

}



// ===============================
// CARD CLICK SUPPORT
// ===============================


const addMovieCard = document.querySelector(".add-movie-card");

if(addMovieCard){

addMovieCard.addEventListener("click",openAddMovie);

}



const manageMoviesCard = document.querySelector(".manage-movies-card");

if(manageMoviesCard){

manageMoviesCard.addEventListener("click",openManageMovies);

}



const dashboardCard = document.querySelector(".dashboard-card");

if(dashboardCard){

dashboardCard.addEventListener("click",openDashboard);

}





// ===============================
// MAKE FUNCTIONS GLOBAL
// ===============================

window.openAddMovie = openAddMovie;

window.openManageMovies = openManageMovies;

window.openDashboard = openDashboard;

window.goHome = goHome;

window.adminLogout = adminLogout;
