// ===============================
// FILMY OTT ADMIN LOGIN JS
// ===============================

// MULTI-LANGUAGE SUPPORT (ALL 6 LANGUAGES)
function applyLanguage() {
    const currentLang = localStorage.getItem("selectedLang") || "hi";
    let langData = null;

    // 1. Check window.translations object
    if (window.translations && window.translations[currentLang]) {
        langData = window.translations[currentLang];
    } 
    // 2. Direct Fallback Check for all 6 languages (en, hi, kn, ml, ta, te)
    else if (window[currentLang] && typeof window[currentLang] === "object") {
        langData = window[currentLang];
    }

    // 3. Apply translations to DOM elements
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

// ADMIN LOGIN FUNCTION
function adminLogin() {
    const emailInput = document.getElementById("adminEmail");
    const passwordInput = document.getElementById("adminPassword");
    const error = document.getElementById("error");

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    const adminEmail = "lrgujjars26@gmail.com";
    const adminPassword = "lekhi0007";

    if (email === adminEmail && password === adminPassword) {
        // Remove User Session
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("isLoggedIn");

        // Create Admin Session
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("isAdmin", "true");

        window.location.href = "admin.html";
    } else {
        if (error) {
            error.innerText = "Invalid Email or Password";
            error.style.color = "red";
        }
    }
}

// DOM LOAD EVENT (HANDLES LANGUAGE & CLICK BINDING)
document.addEventListener("DOMContentLoaded", () => {
    // Apply Language immediately & with a slight buffer for late resources
    applyLanguage();
    setTimeout(applyLanguage, 150);

    // Direct Event Listener Attachment (Guarantees Button Click Working)
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", adminLogin);
    }
});

// MAKE FUNCTIONS GLOBAL
window.applyLanguage = applyLanguage;
window.adminLogin = adminLogin;
