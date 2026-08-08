import { supabase } from "./supabase.js";

const CLOUD_NAME = "peni6puh";
const UPLOAD_PRESET = "filmy-ott";

const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

let oldPoster = "";
let oldVideo = "";

// ===============================
// CLOUDINARY UPLOAD
// ===============================

async function uploadFile(file) {

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    const data = await response.json();

    if (!data.secure_url) {
        throw new Error("Cloudinary Upload Failed");
    }

    return data.secure_url;
}

// ===============================
// LOAD MOVIE
// ===============================

async function loadMovie() {

    if (!movieId) {
        alert("Movie ID Not Found");
        return;
    }

    const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", movieId)
        .single();

    if (error || !data) {
        alert("Movie Not Found");
        return;
    }

    document.getElementById("movieName").value = data.title || "";
    document.getElementById("movieDescription").value = data.description || "";
    document.getElementById("movieCategory").value = data.category || "";
    document.getElementById("movieYear").value = data.movieyear || "";

    oldPoster = data.poster_url || "";
    oldVideo = data.video_url || "";
}

// ===============================
// UPDATE MOVIE
// ===============================

window.updateMovie = async function () {

    const status = document.getElementById("uploadStatus");

    const title =
        document.getElementById("movieName").value.trim();

    const description =
        document.getElementById("movieDescription").value.trim();

    const category =
        document.getElementById("movieCategory").value;

    const year =
        document.getElementById("movieYear").value;

    const posterFile =
        document.getElementById("moviePoster").files[0];

    const videoFile =
        document.getElementById("movieVideo").files[0];

    if (
        title === "" ||
        description === "" ||
        category === "" ||
        year === ""
    ) {

        status.style.display = "block";
        status.innerHTML = "❌ Please fill all required fields.";

        return;
    }

    try {

        let posterUrl = oldPoster;
        let videoUrl = oldVideo;

        if (posterFile) {

            status.innerHTML = "📤 Uploading Poster...";
            posterUrl = await uploadFile(posterFile);

        }

        if (videoFile) {

            status.innerHTML = "🎬 Uploading Video...";
            videoUrl = await uploadFile(videoFile);

        }

        status.innerHTML = "☁️ Updating Movie...";

        const { error } = await supabase
            .from("movies")
            .update({
                title: title,
                description: description,
                category: category,
                movieyear: Number(year),
                poster_url: posterUrl,
                video_url: videoUrl
            })
            .eq("id", movieId);

        if (error) throw error;

        status.innerHTML = "✅ Movie Updated Successfully.";

        setTimeout(() => {

            window.location.href = "manage-movies.html";

        }, 1000);

    } catch (error) {

        console.log(error);

        status.innerHTML =
            "❌ Update Failed : " + error.message;

    }

};

// ===============================
// START
// ===============================

loadMovie();