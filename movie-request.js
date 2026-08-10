import { supabase } from "./supabase.js";

const form = document.getElementById("movieRequestForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const movieName =
        document.getElementById("movieName").value.trim();

    const castName =
        document.getElementById("castName").value.trim();

    const message =
        document.getElementById("requestMessage").value.trim();


    // Movie name required
    if (!movieName) {

        alert("Please enter a movie or web series name.");

        return;
    }


    const button = form.querySelector("button");


    // Disable button while sending
    button.disabled = true;

    button.textContent = "Sending...";


    const { error } = await supabase

        .from("movie_requests")

        .insert([
            {
                movie_name: movieName,
                cast_name: castName || null,
                message: message || null,
                status: "Pending"
            }
        ]);


    // Error
    if (error) {

        console.error(
            "Movie request error:",
            error
        );


        if (error.code === "42501") {

            alert(
                "❌ Please login to send a movie request."
            );

        } else {

            alert(
                "❌ Request send nahi ho saki. Please try again."
            );
        }


        // IMPORTANT:
        // Error par form reset nahi hoga

        button.disabled = false;

        button.textContent = "🎬 Send Request";

        return;
    }


    // SUCCESS

    alert(
        "✅ Movie request successfully sent!"
    );


    // Sirf successful request ke baad clear hoga
    form.reset();


    button.disabled = false;

    button.textContent = "🎬 Send Request";

});
