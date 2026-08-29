import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

// =========================================
// DOM READY & INITIALIZATION
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("movieRequestForm");
    if (!form) return;

    form.addEventListener("submit", handleMovieRequest);

    // Dynamic Language Application
    if (typeof applyLanguage === "function") {
        applyLanguage();
    }
});

// =========================================
// HANDLE MOVIE REQUEST SUBMISSION
// =========================================
async function handleMovieRequest(e) {
    e.preventDefault();

    const form = e.target;
    const button = document.getElementById("requestButton") || form.querySelector("button");

    // 1. Auth & Login Check
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    
    // Check Supabase Active Session
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (!isLoggedIn || userError || !user) {
        alert("❌ Please login to send a movie request.");
        window.location.href = "login.html";
        return;
    }

    // 2. Get Form Values
    const movieName = document.getElementById("movieName")?.value.trim();
    const castName = document.getElementById("castName")?.value.trim();
    const message = document.getElementById("requestMessage")?.value.trim();

    // 3. Validation
    if (!movieName) {
        alert("Please enter a movie or web series name.");
        return;
    }

    // 4. Update Button Loading State
    if (button) {
        button.disabled = true;
        button.style.opacity = "0.7";
        button.style.cursor = "not-allowed";
        button.innerHTML = `⌛ Sending...`;
    }

    try {
        // 5. Insert Request into Supabase Database
        const { error } = await supabase
            .from("movie_requests")
            .insert([
                {
                    user_id: user.id,
                    user_email: user.email || null,
                    movie_name: movieName,
                    cast_name: castName || null,
                    message: message || null,
                    status: "Pending"
                }
            ]);

        // 6. Handle Database Response Error
        if (error) {
            console.error("Movie request error:", error);

            if (error.code === "42501") {
                alert("❌ Session expired. Please login again.");
                window.location.href = "login.html";
            } else {
                alert("❌ Request send nahi ho saki. Please try again.");
            }
            return;
        }

        // 7. Success Action
        alert("✅ Movie request successfully sent!");
        form.reset();

    } catch (err) {
        console.error("Unexpected Request Error:", err);
        alert("❌ Something went wrong. Please try again later.");
    } finally {
        // 8. Restore Button State
        if (button) {
            button.disabled = false;
            button.style.opacity = "1";
            button.style.cursor = "pointer";
            button.innerHTML = `🎬 <span data-lang="sendRequest">Send Request</span>`;
            
            if (typeof applyLanguage === "function") {
                applyLanguage();
            }
        }
    }
}
