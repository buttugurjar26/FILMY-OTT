import { applyLanguage, changeLanguage, t } from "./language.js";

// ==============================
// FILMY OTT SETTINGS & MODAL
// ==============================

console.log("FILMY OTT Settings Loaded");

const languages = [
    { code: "en", label: "🇬🇧 English" },
    { code: "hi", label: "🇮🇳 Hindi" },
    { code: "ta", label: "🇮🇳 Tamil" },
    { code: "te", label: "🇮🇳 Telugu" },
    { code: "kn", label: "🇮🇳 Kannada" },
    { code: "ml", label: "🇮🇳 Malayalam" }
];

const qualities = [
    { value: "auto", label: "Auto" },
    { value: "480p", label: "480p" },
    { value: "720p", label: "720p HD" },
    { value: "1080p", label: "1080p Full HD" }
];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Language Restore
    const savedLang = localStorage.getItem("language") || "en";
    const foundLang = languages.find(l => l.code === savedLang) || languages[0];
    const langElem = document.getElementById("selectedLanguageText");
    if (langElem) langElem.innerText = foundLang.label;

    // 2. Playback Quality Restore
    const savedQuality = localStorage.getItem("playbackQuality") || "auto";
    const foundQuality = qualities.find(q => q.value === savedQuality) || qualities[0];
    const qualityElem = document.getElementById("selectedPlaybackText");
    if (qualityElem) qualityElem.innerText = foundQuality.label;

    // 3. Modals Triggers
    const langBtn = document.getElementById("languageBtn");
    if (langBtn) langBtn.addEventListener("click", openLanguageModal);

    const playbackBtn = document.getElementById("playbackBtn");
    if (playbackBtn) playbackBtn.addEventListener("click", openPlaybackModal);

    const overlay = document.getElementById("customModalOverlay");
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target.id === "customModalOverlay") {
                closeCustomModal();
            }
        });
    }

    applyLanguage();
});

function openLanguageModal() {
    const listContainer = document.getElementById("modalOptionsList");
    document.getElementById("modalTitle").innerText = "Language / भाषा";
    listContainer.innerHTML = "";

    const savedLang = localStorage.getItem("language") || "en";

    languages.forEach(lang => {
        const isSelected = savedLang === lang.code;
        const item = document.createElement("div");
        item.className = `modal-option-btn ${isSelected ? "selected" : ""}`;
        item.innerHTML = `
            <span>${lang.label}</span>
            <i class="${isSelected ? "fa-solid fa-circle-dot" : "fa-regular fa-circle"}"></i>
        `;
        item.onclick = () => {
            document.getElementById("selectedLanguageText").innerText = lang.label;
            changeLanguage(lang.code);
            closeCustomModal();
            location.reload();
        };
        listContainer.appendChild(item);
    });

    document.getElementById("customModalOverlay").classList.add("active");
}

function openPlaybackModal() {
    const listContainer = document.getElementById("modalOptionsList");
    document.getElementById("modalTitle").innerText = "Playback Settings";
    listContainer.innerHTML = "";

    const savedQuality = localStorage.getItem("playbackQuality") || "auto";

    qualities.forEach(quality => {
        const isSelected = savedQuality === quality.value;
        const item = document.createElement("div");
        item.className = `modal-option-btn ${isSelected ? "selected" : ""}`;
        item.innerHTML = `
            <span>${quality.label}</span>
            <i class="${isSelected ? "fa-solid fa-circle-dot" : "fa-regular fa-circle"}"></i>
        `;
        item.onclick = () => {
            document.getElementById("selectedPlaybackText").innerText = quality.label;
            localStorage.setItem("playbackQuality", quality.value);
            closeCustomModal();
        };
        listContainer.appendChild(item);
    });

    document.getElementById("customModalOverlay").classList.add("active");
}

function closeCustomModal() {
    document.getElementById("customModalOverlay").classList.remove("active");
}

function contactUs() {
    window.location.href = "mailto:youremail@example.com";
}

window.contactUs = contactUs;
