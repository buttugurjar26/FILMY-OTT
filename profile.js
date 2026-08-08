import { applyLanguage } from "./language.js";

// ===============================
// FILMY OTT PROFILE
// ===============================

console.log("FILMY OTT Profile Loaded");

// Elements
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const profilePhoto = document.getElementById("profilePhoto");

// ===============================
// CHECK LOGIN STATUS
// ===============================

const isLoggedIn = localStorage.getItem("isLoggedIn");

if(isLoggedIn !== "true"){
    window.location.replace("login.html");
}

// ===============================
// LOAD USER DATA
// ===============================

const savedName = localStorage.getItem("userName");
const savedEmail = localStorage.getItem("userEmail");
const savedAvatar = localStorage.getItem("userAvatar");

// Show Name & Email
userName.innerText = savedName || "FILMY OTT User";
userEmail.innerText = savedEmail || "user@example.com";

// Default Avatar
profilePhoto.src = savedAvatar || "avatar-1.png";

// ===============================
// EDIT PROFILE
// ===============================

window.editProfile = function(){

    window.location.href = "edit-profile.html";

};

// ===============================
// LOGOUT
// ===============================

window.logoutUser = function(){

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userAvatar");

    alert("Logout Successful");

    window.location.replace("login.html");

};

applyLanguage();