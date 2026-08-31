// ===============================
// FILMY OTT ADMIN PANEL
// ===============================

// ADMIN LOGIN CHECK
if (
    localStorage.getItem("adminLoggedIn") !== "true" ||
    localStorage.getItem("isAdmin") !== "true"
) {
    window.location.href = "admin-login.html";
}

console.log("FILMY OTT Admin Panel Loaded");

// ===============================
// MULTI-LANGUAGE SUPPORT (100% WORKING)
// ===============================

function applyLanguage() {
    const currentLang = localStorage.getItem("selectedLang") || "hi"; // बाय-डिफ़ॉल्ट हिंदी

    let langData = null;

    // 1. Check window.translations object
    if (window.translations && window.translations[currentLang]) {
        langData = window.translations[currentLang];
    } 
    // 2. Direct Fallback Check
    else if (currentLang === "hi" && typeof hi !== "undefined") {
        langData = hi;
    } else if (currentLang === "en" && typeof en !== "undefined") {
        langData = en;
    }

    // 3. Update DOM Elements
    if (langData) {
        document.querySelectorAll("[data-lang]").forEach((element) => {
            const key = element.getAttribute("data-lang");
            if (langData[key]) {
                if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                    element.placeholder = langData[key];
                } else {
                    element.innerText = langData[key];
                }
            }
        });
    }
}

// Execute language setup on load
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage();
    setTimeout(applyLanguage, 150); // Delay buffer for late script execution
});

// ===============================
// NAVIGATION FUNCTIONS
// ===============================

function openAddMovie() {
    window.location.href = "add-movie.html";
}

function openManageMovies() {
    window.location.href = "manage-movies.html";
}

function openDashboard() {
    window.location.href = "admin-dashboard.html";
}

function goHome() {
    window.location.href = "home.html";
}

function adminLogout() {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("isAdmin");
    window.location.href = "home.html";
}

// ===============================
// CARD CLICK SUPPORT
// ===============================

const addMovieCard = document.querySelector(".add-movie-card");
if (addMovieCard) {
    addMovieCard.addEventListener("click", openAddMovie);
}

const manageMoviesCard = document.querySelector(".manage-movies-card");
if (manageMoviesCard) {
    manageMoviesCard.addEventListener("click", openManageMovies);
}

const dashboardCard = document.querySelector(".dashboard-card");
if (dashboardCard) {
    dashboardCard.addEventListener("click", openDashboard);
}

// ===============================
// MAKE FUNCTIONS GLOBAL
// ===============================

window.applyLanguage = applyLanguage;
window.openAddMovie = openAddMovie;
window.openManageMovies = openManageMovies;
window.openDashboard = openDashboard;
window.goHome = goHome;
window.adminLogout = adminLogout;
