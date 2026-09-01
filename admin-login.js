// ===============================
// FILMY OTT ADMIN LOGIN
// ===============================

// MULTI-LANGUAGE SUPPORT
function applyLanguage() {
    const currentLang = localStorage.getItem("selectedLang") || "hi";

    let langData = null;

    if (window.translations && window.translations[currentLang]) {
        langData = window.translations[currentLang];
    } else if (currentLang === "hi" && typeof hi !== "undefined") {
        langData = hi;
    } else if (currentLang === "en" && typeof en !== "undefined") {
        langData = en;
    }

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

// DOM Load पर भाषा लागू करें
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage();
    setTimeout(applyLanguage, 150);
});

// ADMIN LOGIN FUNCTION
function adminLogin() {
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    const error = document.getElementById("error");

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

        error.innerText = "Invalid Email or Password";
        error.style.color = "red";

    }
}

// MAKE FUNCTIONS GLOBAL
window.applyLanguage = applyLanguage;
window.adminLogin = adminLogin;
