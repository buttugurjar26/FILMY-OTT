// FILMY OTT SPLASH CONTROL


// Splash Screen Timer

setTimeout(function(){


    // Redirect to Home Page

    window.location.href = "home.html";


},3000);

const headerProfile = document.getElementById("headerProfile");

if (headerProfile) {

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userAvatar = localStorage.getItem("userAvatar");

    if (isLoggedIn === "true" && userAvatar) {
        headerProfile.src = userAvatar;
    } else {
        headerProfile.src = "default-profile.png";
    }

}