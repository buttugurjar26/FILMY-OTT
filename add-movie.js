import { supabase } from "./supabase.js";

const CLOUD_NAME = "peni6puh";
const UPLOAD_PRESET = "filmy-ott";


// =====================================
// CLOUDINARY UPLOAD
// =====================================

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

    if (!response.ok || !data.secure_url) {
        console.log("Cloudinary Error:", data);
        throw new Error("Cloudinary upload failed.");
    }

    return data.secure_url;
}


// =====================================
// SAVE MOVIE
// =====================================

window.saveMovie = async function () {

    const status =
        document.getElementById("uploadStatus");

    const saveButton =
        document.getElementById("saveMovieBtn");


    // =================================
    // GET VALUES
    // =================================

    const title =
        document.getElementById("movieName")
            .value
            .trim();

    const description =
        document.getElementById("movieDescription")
            .value
            .trim();

    const posterFile =
        document.getElementById("moviePoster")
            .files[0];

    const trailerFile =
        document.getElementById("movieTrailer")
            .files[0];

    const watchUrl =
        document.getElementById("watchMovieLink")
            .value
            .trim();

    const downloadUrl =
        document.getElementById("downloadMovieLink")
            .value
            .trim();

    const category =
        document.getElementById("movieCategory")
            .value;

    const year =
        document.getElementById("movieYear")
            .value;


    // =================================
    // VALIDATION
    // =================================

    if (
        !title ||
        !description ||
        !posterFile ||
        !trailerFile ||
        !watchUrl ||
        !downloadUrl ||
        !category ||
        !year
    ) {

        status.style.display = "block";

        status.innerHTML =
            "❌ Please fill all required fields.";

        return;
    }


    // =================================
    // URL VALIDATION
    // =================================

    try {

        new URL(watchUrl);
        new URL(downloadUrl);

    } catch (error) {

        status.style.display = "block";

        status.innerHTML =
            "❌ Please enter valid Watch Movie and Download links.";

        return;
    }


    try {

        saveButton.disabled = true;

        status.style.display = "block";


        // =================================
        // POSTER UPLOAD
        // =================================

        status.innerHTML =
            "📤 Uploading Poster...";

        const posterUrl =
            await uploadFile(posterFile);


        // =================================
        // TRAILER UPLOAD
        // =================================

        status.innerHTML =
            "🎬 Uploading Trailer...";

        const trailerUrl =
            await uploadFile(trailerFile);


        // =================================
        // SAVE MOVIE TO SUPABASE
        // =================================

        status.innerHTML =
            "☁️ Saving Movie...";


        const { data, error } =
            await supabase
                .from("movies")
                .insert([
                    {
                        title: title,
                        category: category,
                        movieyear: Number(year),
                        description: description,

                        poster_url: posterUrl,

                        trailer_url: trailerUrl,

                        watch_url: watchUrl,

                        download_url: downloadUrl
                    }
                ])
                .select()
                .single();


        if (error) {

            console.log(
                "Supabase Movie Error:",
                error
            );

            throw error;
        }


        // =================================
        // NOTIFICATION
        // =================================

        status.innerHTML =
            "🔔 Creating notification...";


        const { error: notificationError } =
            await supabase
                .from("notifications")
                .insert([
                    {
                        title: "🎬 New Movie Added",

                        message:
                            `"${title}" is now available to watch.`,

                        movie_id: data.id,

                        poster_url: posterUrl
                    }
                ]);


        if (notificationError) {

            console.log(
                "Notification Error:",
                notificationError
            );

        }


        // =================================
        // SUCCESS
        // =================================

        status.innerHTML =
            "✅ Movie Added Successfully.";


        // =================================
        // RESET FORM
        // =================================

        document.getElementById(
            "movieName"
        ).value = "";


        document.getElementById(
            "movieDescription"
        ).value = "";


        document.getElementById(
            "moviePoster"
        ).value = "";


        document.getElementById(
            "movieTrailer"
        ).value = "";


        document.getElementById(
            "watchMovieLink"
        ).value = "";


        document.getElementById(
            "downloadMovieLink"
        ).value = "";


        document.getElementById(
            "movieCategory"
        ).selectedIndex = 0;


        document.getElementById(
            "movieYear"
        ).value = "";


    } catch (error) {

        console.error(
            "Add Movie Error:",
            error
        );


        status.style.display = "block";

        status.innerHTML =
            "❌ Upload Failed: " +
            error.message;


    } finally {

        saveButton.disabled = false;

    }

};
