import { supabase } from "./supabase.js";
import { applyLanguage, t } from "./language.js";

// ===============================
// FILMY OTT LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const togglePassword = document.getElementById("togglePassword");
const loginBtn = document.querySelector(".login-btn");

// ===============================
// SHOW / HIDE PASSWORD
// ===============================

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        if (password.type === "password") {

            password.type = "text";

            togglePassword.innerHTML =
                '<i class="fa-solid fa-eye-slash"></i>';

        } else {

            password.type = "password";

            togglePassword.innerHTML =
                '<i class="fa-solid fa-eye"></i>';

        }

    });

}

// ===============================
// REMEMBER EMAIL
// ===============================

const savedEmail = localStorage.getItem("rememberEmail");

if (savedEmail) {

    email.value = savedEmail;

    rememberMe.checked = true;

}

// ===============================
// LOGIN
// ===============================

if (loginForm) {

    loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        loginBtn.disabled = true;
        loginBtn.innerText = t("loggingIn");

        const userEmail = email.value.trim();
        const userPassword = password.value;

        if (userEmail === "" || userPassword === "") {

            alert(t("enterEmailPassword"));

            loginBtn.disabled = false;
            loginBtn.innerText = t("login");

            return;

        }

        if (rememberMe.checked) {

            localStorage.setItem("rememberEmail", userEmail);

        } else {

            localStorage.removeItem("rememberEmail");

        }

        const { data, error } =
            await supabase.auth.signInWithPassword({

                email: userEmail,
                password: userPassword

            });

        if (error) {

            alert("❌ " + t("invalidLogin"));

            loginBtn.disabled = false;
            loginBtn.innerText = t("login");

            return;

        }

        // Remove Admin Session
        localStorage.removeItem("adminLoggedIn");
        localStorage.removeItem("isAdmin");

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem(
            "userName",
            data.user.user_metadata.full_name || "User"
        );
        localStorage.setItem(
            "userEmail",
            data.user.email
        );

        alert("✅ " + t("loginSuccess"));

        const redirect =
            localStorage.getItem("redirectAfterLogin");

        if (redirect) {

            localStorage.removeItem("redirectAfterLogin");

            window.location.href = redirect;

        } else {

            window.location.href = "home.html";

        }

    });

}

// ===============================
// APPLY LANGUAGE
// ===============================

applyLanguage();

// ===============================
// UPDATE BUTTON LANGUAGE
// ===============================

function updateLoginButton() {

    if (!loginBtn) return;

    loginBtn.innerText = t("login");

}

updateLoginButton();

// ===============================
// RESET BUTTON AFTER ERROR
// ===============================

window.addEventListener("pageshow", () => {

    if (!loginBtn) return;

    loginBtn.disabled = false;

    loginBtn.innerText = t("login");

});

// ===============================
// APPLY LANGUAGE ON LOAD
// ===============================

document.addEventListener("DOMContentLoaded", () => {


    updateLoginButton();

});