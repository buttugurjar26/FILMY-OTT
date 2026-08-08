// ===============================
// FILMY OTT ADMIN LOGIN
// ===============================

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