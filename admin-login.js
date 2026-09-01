// ===============================
// FILMY OTT ADMIN LOGIN JS
// ===============================

// MULTI-LANGUAGE SUPPORT (FOR BACK, ADMIN LOGIN & LOGIN BUTTON ONLY)
function applyLanguage() {
    const currentLang = localStorage.getItem("selectedLang") || "en";
    let langData = null;

    // 1. Direct variable access (en, hi, kn, ml, ta, te)
    else if (currentLang === "en" && typeof en !== "undefined") langData = en;
    else if (currentLang === "hi" && typeof hi !== "undefined") langData = hi;
    else if (currentLang === "kn" && typeof kn !== "undefined") langData = kn;
    else if (currentLang === "ml" && typeof ml !== "undefined") langData = ml;
    else if (currentLang === "ta" && typeof ta !== "undefined") langData = ta;
    else if (currentLang === "te" && typeof te !== "undefined") langData = te;
    
    // 2. Fallbacks
    else if (window.translations && window.translations[currentLang]) {
        langData = window.translations[currentLang];
    } else if (window[currentLang]) {
        langData = window[currentLang];
    }

    if (!langData) return;

    // 3. Apply text translations only to elements with data-lang attribute
    document.querySelectorAll("[data-lang]").forEach((element) => {
        const key = element.getAttribute("data-lang");
        
        if (langData[key]) {
            element.innerText = langData[key];
        }
    });
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

        // Redirect to Admin Panel
        window.location.href = "admin.html";
    } else {
        if (error) {
            error.innerText = "Invalid Email or Password";
            error.style.color = "red";
        }
    }
}

// DOM LOAD EVENT
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage();
    setTimeout(applyLanguage, 100);

    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", adminLogin);
    }
});

// MAKE FUNCTIONS GLOBAL
window.applyLanguage = applyLanguage;
window.adminLogin = adminLogin;
