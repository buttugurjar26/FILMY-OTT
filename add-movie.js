import { supabase } from "./supabase.js";

const CLOUD_NAME = "peni6puh";
const UPLOAD_PRESET = "filmy-ott";


// =====================================
// CAST COUNTER
// =====================================

let castCounter = 0;


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

        console.error(
            "Cloudinary Error:",
            data
        );

        throw new Error(
            "Cloudinary upload failed."
        );
    }

    return data.secure_url;
}


// =====================================
// ADD CAST BOX
// =====================================

function addCastBox() {

    castCounter++;

    const container =
        document.getElementById(
            "castContainer"
        );


    const castBox =
        document.createElement(
            "div"
        );


    castBox.className =
        "cast-box";


    castBox.dataset.castId =
        castCounter;


    castBox.innerHTML = `

        <div class="cast-box-header">

            <strong>
                Cast ${castCounter}
            </strong>

            <button
                type="button"
                class="remove-cast-btn"
            >
                <i class="fa-solid fa-trash"></i>
                Remove
            </button>

        </div>


        <input
            type="text"
            class="cast-name"
            placeholder="Cast Name"
        >


        <label>

            Cast Image

        </label>


        <input
            type="file"
            class="cast-image"
            accept="image/*"
        >

    `;


    container.appendChild(
        castBox
    );


    // =================================
    // REMOVE CAST
    // =================================

    const removeBtn =
        castBox.querySelector(
            ".remove-cast-btn"
        );


    removeBtn.addEventListener(
        "click",
        function () {

            castBox.remove();

            updateCastNumbers();

        }
    );

}


// =====================================
// UPDATE CAST NUMBERS
// =====================================

function updateCastNumbers() {

    const boxes =
        document.querySelectorAll(
            ".cast-box"
        );


    boxes.forEach(
        function (box, index) {

            const title =
                box.querySelector(
                    ".cast-box-header strong"
                );


            if (title) {

                title.textContent =
                    "Cast " +
                    (index + 1);

            }

        }
    );

}


// =====================================
// ADD CAST BUTTON
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const addCastBtn =
            document.getElementById(
                "addCastBtn"
            );


        if (addCastBtn) {

            addCastBtn.addEventListener(
                "click",
                function () {

                    addCastBox();

                }
            );

        }

    }
);


// =====================================
// SAVE MOVIE
// =====================================

window.saveMovie = async function () {

    const status =
        document.getElementById(
            "uploadStatus"
        );


    const saveButton =
        document.getElementById(
            "saveMovieBtn"
        );


    // =================================
    // MOVIE DATA
    // =================================

    const title =
        document.getElementById(
            "movieName"
        ).value.trim();


    const description =
        document.getElementById(
            "movieDescription"
        ).value.trim();


    const posterFile =
        document.getElementById(
            "moviePoster"
        ).files[0];


    const trailerFile =
        document.getElementById(
            "movieTrailer"
        ).files[0];


    const watchUrl =
        document.getElementById(
            "watchMovieLink"
        ).value.trim();


    const category =
        document.getElementById(
            "movieCategory"
        ).value;


    const year =
        document.getElementById(
            "movieYear"
        ).value;


    // =================================
    // VALIDATION
    // =================================

    if (
        !title ||
        !description ||
        !posterFile ||
        !trailerFile ||
        !watchUrl ||
        !category ||
        !year
    ) {

        status.style.display =
            "block";


        status.innerHTML =
            "❌ Please fill all required movie fields.";


        return;

    }


    // =================================
    // WATCH URL VALIDATION
    // =================================

    try {

        new URL(watchUrl);

    } catch (error) {

        status.style.display =
            "block";


        status.innerHTML =
            "❌ Please enter a valid Watch Movie link.";


        return;

    }


    // =================================
    // GET CAST
    // =================================

    const castBoxes =
        document.querySelectorAll(
            ".cast-box"
        );


    const castData = [];


    for (
        const box of castBoxes
    ) {

        const nameInput =
            box.querySelector(
                ".cast-name"
            );


        const imageInput =
            box.querySelector(
                ".cast-image"
            );


        const castName =
            nameInput
                ? nameInput.value.trim()
                : "";


        const castImage =
            imageInput?.files[0];


        // दोनों खाली हैं तो skip
        if (
            !castName &&
            !castImage
        ) {

            continue;

        }


        // Name missing
        if (
            !castName
        ) {

            status.style.display =
                "block";


            status.innerHTML =
                "❌ Please enter Cast Name.";


            return;

        }


        // Image missing
        if (
            !castImage
        ) {

            status.style.display =
                "block";


            status.innerHTML =
                "❌ Please select image for " +
                castName +
                ".";


            return;

        }


        castData.push({
            name: castName,
            file: castImage
        });

    }


    try {

        saveButton.disabled =
            true;


        status.style.display =
            "block";


        // =================================
        // POSTER
        // =================================

        status.innerHTML =
            "📤 Uploading Poster...";


        const posterUrl =
            await uploadFile(
                posterFile
            );


        // =================================
        // TRAILER
        // =================================

        status.innerHTML =
            "🎬 Uploading Trailer...";


        const trailerUrl =
            await uploadFile(
                trailerFile
            );


        // =================================
        // SAVE MOVIE
        // =================================

        status.innerHTML =
            "☁️ Saving Movie...";


        const {
            data: movie,
            error: movieError
        } =
            await supabase
                .from("movies")
                .insert([
                    {
                        title: title,

                        category: category,

                        movieyear:
                            Number(year),

                        description:
                            description,

                        poster_url:
                            posterUrl,

                        trailer_url:
                            trailerUrl,

                        watch_url:
                            watchUrl
                    }
                ])
                .select()
                .single();


        if (movieError) {

            throw movieError;

        }


        // =================================
        // UPLOAD CAST
        // =================================

        for (
            let i = 0;
            i < castData.length;
            i++
        ) {

            const cast =
                castData[i];


            status.innerHTML =
                "👤 Uploading Cast " +
                (i + 1) +
                " of " +
                castData.length +
                "...";


            const castImageUrl =
                await uploadFile(
                    cast.file
                );


            // =================================
            // SAVE CAST
            // =================================

            const {
                error: castError
            } =
                await supabase
                    .from("movie_cast")
                    .insert([
                        {
                            movie_id:
                                movie.id,

                            name:
                                cast.name,

                            image_url:
                                castImageUrl
                        }
                    ]);


            if (castError) {

                throw castError;

            }

        }


        // =================================
        // NOTIFICATION
        // =================================

        status.innerHTML =
            "🔔 Creating notification...";


        const {
            error: notificationError
        } =
            await supabase
                .from("notifications")
                .insert([
                    {
                        title:
                            "🎬 New Movie Added",

                        message:
                            `"${title}" is now available to watch.`,

                        movie_id:
                            movie.id,

                        poster_url:
                            posterUrl
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
        // RESET MOVIE FORM
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
            "movieCategory"
        ).selectedIndex = 0;


        document.getElementById(
            "movieYear"
        ).value = "";


        // =================================
        // RESET CAST
        // =================================

        document.getElementById(
            "castContainer"
        ).innerHTML = "";


        castCounter = 0;


    } catch (error) {

        console.error(
            "Add Movie Error:",
            error
        );


        status.style.display =
            "block";


        status.innerHTML =
            "❌ Upload Failed: " +
            error.message;


    } finally {

        saveButton.disabled =
            false;

    }

};
