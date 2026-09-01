// ===============================
// FILMY OTT ADMIN LOGIN JS
// ===============================

// MULTI-LANGUAGE SUPPORT
function applyLanguage() {
    const currentLang = localStorage.getItem("selectedLang") || "hi";
    let langData = null;

    // 1. Global translations object check
    if (window.translations && window.translations[currentLang]) {
        langData = window.translations[currentLang];
    } 
    // 2. Direct Window Language object fallback (en, hi, kn, ml, ta, te)
    else if (window[currentLang] && typeof window[currentLang] === "object") {
        langData = window[currentLang];
    }

    if (!langData) return;

    // 3. Direct Key Mapping
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
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("isLoggedIn");

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

// DOM LOAD EVENT
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage();
    setTimeout(applyLanguage, 150);

    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", adminLogin);
    }
});

// MAKE FUNCTIONS GLOBAL
window.applyLanguage = applyLanguage;
window.adminLogin = adminLogin;
