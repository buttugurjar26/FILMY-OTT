import { supabase } from "./supabase.js";

const CLOUD_NAME = "peni6puh";
const UPLOAD_PRESET = "filmy-ott";

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
// SAVE MOVIE
// ===============================

window.saveMovie = async function () {

    const status = document.getElementById("uploadStatus");

    const title = document.getElementById("movieName").value.trim();

    const description =
        document.getElementById("movieDescription").value.trim();

    const posterFile =
        document.getElementById("moviePoster").files[0];

    const videoFile =
        document.getElementById("movieVideo").files[0];

    const category =
        document.getElementById("movieCategory").value;

    const year =
        document.getElementById("movieYear").value;

    if (
        title === "" ||
        description === "" ||
        category === "" ||
        year === "" ||
        !posterFile ||
        !videoFile
    ) {

        status.style.display = "block";
        status.innerHTML = "❌ Please fill all required fields.";

        return;

    }

    try {

        status.style.display = "block";
        status.innerHTML = "📤 Uploading Poster...";

        const posterUrl = await uploadFile(posterFile);

        status.innerHTML = "🎬 Uploading Movie...";

        const videoUrl = await uploadFile(videoFile);

        status.innerHTML = "☁️ Saving Movie...";

              const { data, error } = await supabase
    .from("movies")
    .insert([
        {
            title: title,
            category: category,
            movieyear: Number(year),
            description: description,
            poster_url: posterUrl,
            video_url: videoUrl
        }
    ])
    .select()
    .single();

if (error) {
    throw error;
}

// ===============================
// SAVE NOTIFICATION
// ===============================

const { error: notificationError } = await supabase
    .from("notifications")
    .insert([
        {
            title: "🎬 New Movie Added",
            message: `"${title}" is now available to watch.`,
            movie_id: data.id,
            poster_url: posterUrl
        }
    ]);

if (notificationError) {
    console.log("Notification Error:", notificationError);
}

        status.innerHTML = "✅ Movie Uploaded Successfully.";

        document.getElementById("movieName").value = "";
        document.getElementById("movieDescription").value = "";
        document.getElementById("moviePoster").value = "";
        document.getElementById("movieVideo").value = "";
        document.getElementById("movieCategory").selectedIndex = 0;
        document.getElementById("movieYear").value = "";

    } catch (error) {

        console.log(error);

        status.innerHTML = "❌ Upload Failed : " + error.message;

    }

};