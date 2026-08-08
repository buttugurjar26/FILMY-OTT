import { supabase } from "./supabase.js";
import { applyLanguage, t } from "./language.js";

// ===============================
// FILMY OTT RESET PASSWORD
// ===============================

console.log("FILMY OTT Reset Password Loaded");

const form = document.getElementById("resetPasswordForm");

const newPassword = document.getElementById("newPassword");

const confirmPassword = document.getElementById("confirmPassword");

const toggleNewPassword = document.getElementById("toggleNewPassword");

const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

const updateBtn = document.querySelector(".login-btn");

// ===============================
// SHOW / HIDE PASSWORD
// ===============================

if (toggleNewPassword) {

    toggleNewPassword.addEventListener("click", () => {

        if (newPassword.type === "password") {

            newPassword.type = "text";

            toggleNewPassword.innerHTML =
                '<i class="fa-solid fa-eye-slash"></i>';

        } else {

            newPassword.type = "password";

            toggleNewPassword.innerHTML =
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
// UPDATE PASSWORD
// ===============================

if (form) {

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    updateBtn.disabled = true;

    updateBtn.innerText = t("updatingPassword");

    if (newPassword.value.length < 8) {

        alert(t("passwordMinLength"));

        updateBtn.disabled = false;
        updateBtn.innerText = t("updatePassword");

        return;

    }

    if (newPassword.value !== confirmPassword.value) {

        alert(t("passwordsDoNotMatch"));

        updateBtn.disabled = false;
        updateBtn.innerText = t("updatePassword");

        return;

    }

    const { error } = await supabase.auth.updateUser({

        password: newPassword.value

    });

    if (error) {

        alert("❌ " + error.message);

        updateBtn.disabled = false;
        updateBtn.innerText = t("updatePassword");

        return;

    }

    alert("✅ " + t("passwordUpdated"));

    window.location.href = "login.html";

});

}

// ===============================
// APPLY LANGUAGE
// ===============================

applyLanguage();