import { supabase } from "./supabase.js";
import { applyLanguage, t } from "./language.js";

// ===============================
// FILMY OTT FORGOT PASSWORD
// ===============================

console.log("FILMY OTT Forgot Password Loaded");

const forgotPasswordForm =
document.getElementById("forgotPasswordForm");

const resetEmail =
document.getElementById("resetEmail");

const resetBtn =
document.querySelector(".login-btn");

// ===============================
// SEND RESET LINK
// ===============================

if (forgotPasswordForm) {

forgotPasswordForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = resetEmail.value.trim();

    if (email === "") {

        alert(t("enterEmail"));

        return;

    }

    resetBtn.disabled = true;

    resetBtn.innerText = t("sendingResetLink");

    const { error } =
    await supabase.auth.resetPasswordForEmail(email, {

        redirectTo:
        window.location.origin + "/reset-password.html"

    });

    if (error) {

        alert("❌ " + error.message);

        resetBtn.disabled = false;

        resetBtn.innerText = t("sendResetLink");

        return;

    }

    alert("✅ " + t("resetLinkSent"));

    resetEmail.value = "";

    resetBtn.disabled = false;

    resetBtn.innerText = t("sendResetLink");

});

}

// ===============================
// APPLY LANGUAGE
// ===============================

applyLanguage();