import { supabase } from "./supabase.js";
import { applyLanguage, t } from "./language.js";

// ===============================
// FILMY OTT SIGN UP
// ===============================

const signupForm = document.getElementById("signupForm");
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const signupBtn = document.querySelector(".login-btn");

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

if (toggleConfirmPassword) {

    toggleConfirmPassword.addEventListener("click", () => {

        if (confirmPassword.type === "password") {

            confirmPassword.type = "text";

            toggleConfirmPassword.innerHTML =
                '<i class="fa-solid fa-eye-slash"></i>';

        } else {

            confirmPassword.type = "password";

            toggleConfirmPassword.innerHTML =
                '<i class="fa-solid fa-eye"></i>';

        }

    });

}

// ===============================
// SIGN UP
// ===============================

if (signupForm) {

    signupForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        signupBtn.disabled = true;
        signupBtn.innerText = t("creatingAccount");

        if (password.value !== confirmPassword.value) {

            alert(t("passwordsDoNotMatch"));

            signupBtn.disabled = false;
            signupBtn.innerText = t("createAccount");

            return;

        }

        if (password.value.length < 8) {

            alert(t("passwordMinLength"));

            signupBtn.disabled = false;
            signupBtn.innerText = t("createAccount");

            return;

        }

        const { data, error } = await supabase.auth.signUp({

    email: email.value.trim(),

    password: password.value,

    options: {

        data: {

            full_name: fullName.value.trim()

        }

    }

});

if (error) {

    alert(error.message);

    signupBtn.disabled = false;

    signupBtn.innerText = t("createAccount");

    return;

}

// Save Profile

alert("✅ " + t("accountCreated"));

window.location.href = "login.html";

        if (error) {

            alert("❌ " + error.message);

            signupBtn.disabled = false;
            signupBtn.innerText = t("createAccount");

            return;

        }

        alert("✅ " + t("accountCreated"));

        window.location.href = "login.html";

    });

}

// ===============================
// APPLY LANGUAGE
// ===============================

applyLanguage();