import { applyLanguage } from "./language.js";

// ===============================
// FILMY OTT ADMIN LOGIN
// ===============================

// DOM Load होते ही भाषा लागू करें
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage();
});

// ADMIN LOGIN FUNCTION
window.adminLogin = function () {
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
};

// Event listener for login button click
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", window.adminLogin);
    }
});
