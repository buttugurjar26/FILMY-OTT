import { applyLanguage, changeLanguage, t } from "./language.js";


// ==============================
// FILMY OTT SETTINGS
// ==============================

console.log("FILMY OTT Settings Loaded");

// ------------------------------
// Language
// ------------------------------

const languageSelect = document.getElementById("languageSelect");

if (languageSelect) {

    languageSelect.value =
        localStorage.getItem("language") || "en";

    languageSelect.addEventListener("change", function () {

        changeLanguage(this.value);

        location.reload();

    });

}

// ------------------------------
// Playback Quality
// ------------------------------

const playbackQuality = document.getElementById("playbackQuality");

if (playbackQuality) {

    playbackQuality.value =
        localStorage.getItem("playbackQuality") || "auto";

    playbackQuality.addEventListener("change", function () {

        localStorage.setItem(
            "playbackQuality",
            this.value
        );

    });

}


// ------------------------------
// Contact Us
// ------------------------------

function contactUs() {

    window.location.href =
        "mailto:youremail@example.com";

}



window.rateApp = rateApp;
window.contactUs = contactUs;

applyLanguage();