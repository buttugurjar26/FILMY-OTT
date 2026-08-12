import { supabase } from "./supabase.js";


// =====================================================
// CLOUDINARY
// =====================================================

const CLOUD_NAME = "peni6puh";
const UPLOAD_PRESET = "filmy-ott";


// =====================================================
// SUPABASE EDGE FUNCTION
// =====================================================

const EDGE_FUNCTION = "cloudinary-sign";


// =====================================================
// VIDEO CHUNK SIZE
// 20 MB
// =====================================================

const CHUNK_SIZE = 20 * 1024 * 1024;


// =====================================================
// STATUS
// =====================================================

function setStatus(message) {

    const status =
        document.getElementById("uploadStatus");

    if (!status) return;

    status.style.display = "block";
    status.innerHTML = message;
}


// =====================================================
// GET CLOUDINARY SIGNATURE
// =====================================================

async function getSignature() {

    const timestamp =
        Math.floor(Date.now() / 1000);

    const { data, error } =
        await supabase.functions.invoke(
            EDGE_FUNCTION,
            {
                body: {
                    timestamp: timestamp
                }
            }
        );

    if (error) {

        console.error(
            "Edge Function Error:",
            error
        );

        throw new Error(
            "Cloudinary signature नहीं मिली."
        );
    }

    if (
        !data ||
        !data.signature
    ) {

        console.error(
            "Invalid Edge Function Response:",
            data
        );

        throw new Error(
            "Invalid Cloudinary signature."
        );
    }

    return {

        signature:
            data.signature,

        timestamp:
            data.timestamp || timestamp

    };
}


// =====================================================
// UPLOAD POSTER
// =====================================================

async function uploadPoster(file) {

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );

    formData.append(
        "upload_preset",
        UPLOAD_PRESET
    );


    setStatus(
        "📤 Uploading Poster..."
    );


    const response =
        await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data.secure_url
    ) {

        console.error(
            "Poster Error:",
            data
        );

        throw new Error(
            data.error?.message ||
            "Poster upload failed."
        );
    }


    return data.secure_url;
}


// =====================================================
// UPLOAD VIDEO
// LARGE FILE / CHUNKED
// =====================================================

async function uploadVideo(file) {

    setStatus(
        "🔐 Preparing secure Movie Upload..."
    );


    // -------------------------------------------------
    // SIGNATURE
    // -------------------------------------------------

    const {
        signature,
        timestamp
    } = await getSignature();


    // -------------------------------------------------
    // API KEY
    //
    // यह SECRET नहीं है.
    // यहाँ अपना Cloudinary API KEY डालें.
    // -------------------------------------------------

    const CLOUDINARY_API_KEY =
        "YOUR_CLOUDINARY_API_KEY";


    if (
        CLOUDINARY_API_KEY ===
        "YOUR_CLOUDINARY_API_KEY"
    ) {

        throw new Error(
            "add-movie.js में Cloudinary API Key डालें."
        );
    }


    // -------------------------------------------------
    // UNIQUE UPLOAD ID
    // -------------------------------------------------

    const uploadId =
        "filmyott-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2);


    let start = 0;

    let finalData = null;


    const totalChunks =
        Math.ceil(
            file.size / CHUNK_SIZE
        );


    let chunkNumber = 0;


    // -------------------------------------------------
    // CHUNK LOOP
    // -------------------------------------------------

    while (
        start < file.size
    ) {

        chunkNumber++;


        const end =
            Math.min(
                start + CHUNK_SIZE,
                file.size
            );


        const chunk =
            file.slice(
                start,
                end
            );


        const progress =
            Math.round(
                (end / file.size) * 100
            );


        setStatus(
            `🎬 Uploading Movie... ${progress}%<br>` +
            `📦 Part ${chunkNumber} / ${totalChunks}`
        );


        // -------------------------------------------------
        // FORM DATA
        // -------------------------------------------------

        const formData =
            new FormData();


        formData.append(
            "file",
            chunk,
            file.name
        );


        formData.append(
            "api_key",
            CLOUDINARY_API_KEY
        );


        formData.append(
            "timestamp",
            String(timestamp)
        );


        formData.append(
            "upload_preset",
            UPLOAD_PRESET
        );


        formData.append(
            "signature",
            signature
        );


        // -------------------------------------------------
        // CLOUDINARY VIDEO UPLOAD
        // -------------------------------------------------

        const response =
            await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
                {
                    method: "POST",

                    headers: {

                        "X-Unique-Upload-Id":
                            uploadId,

                        "Content-Range":
                            `bytes ${start}-${end - 1}/${file.size}`

                    },

                    body:
                        formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Cloudinary Video Error:",
                data
            );

            throw new Error(
                data.error?.message ||
                `Video upload failed at ${progress}%`
            );
        }


        // -------------------------------------------------
        // FINAL CHUNK
        // -------------------------------------------------

        if (
            data.secure_url
        ) {

            finalData =
                data;

        }


        start =
            end;
    }


    // -------------------------------------------------
    // CHECK FINAL RESULT
    // -------------------------------------------------

    if (
        !finalData ||
        !finalData.secure_url
    ) {

        throw new Error(
            "Cloudinary ने final video URL नहीं दिया."
        );
    }


    setStatus(
        "✅ Movie uploaded to Cloudinary."
    );


    return finalData.secure_url;
}


// =====================================================
// SAVE MOVIE
// =====================================================

window.saveMovie =
    async function () {

        const title =
            document
                .getElementById("movieName")
                .value
                .trim();


        const description =
            document
                .getElementById("movieDescription")
                .value
                .trim();


        const posterFile =
            document
                .getElementById("moviePoster")
                .files[0];


        const videoFile =
            document
                .getElementById("movieVideo")
                .files[0];


        const category =
            document
                .getElementById("movieCategory")
                .value;


        const year =
            document
                .getElementById("movieYear")
                .value;


        // =================================================
        // VALIDATION
        // =================================================

        if (
            title === "" ||
            description === "" ||
            category === "" ||
            year === "" ||
            !posterFile ||
            !videoFile
        ) {

            setStatus(
                "❌ Please fill all required fields."
            );

            return;
        }


        // =================================================
        // SAVE BUTTON
        // =================================================

        const saveButton =
            document.querySelector(
                '[onclick="saveMovie()"]'
            );


        if (saveButton) {

            saveButton.disabled =
                true;
        }


        try {

            // =================================================
            // POSTER
            // =================================================

            const posterUrl =
                await uploadPoster(
                    posterFile
                );


            // =================================================
            // VIDEO
            // =================================================

            const videoUrl =
                await uploadVideo(
                    videoFile
                );


            // =================================================
            // SUPABASE
            // =================================================

            setStatus(
                "☁️ Saving Movie..."
            );


            const {
                data,
                error
            } =
                await supabase
                    .from("movies")
                    .insert([
                        {

                            title:
                                title,

                            category:
                                category,

                            movieyear:
                                Number(year),

                            description:
                                description,

                            poster_url:
                                posterUrl,

                            video_url:
                                videoUrl

                        }
                    ])
                    .select()
                    .single();


            if (error) {

                console.error(
                    "Supabase Error:",
                    error
                );

                throw error;
            }


            // =================================================
            // NOTIFICATION
            // =================================================

            const {
                error:
                    notificationError
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
                                data.id,

                            poster_url:
                                posterUrl

                        }
                    ]);


            if (
                notificationError
            ) {

                console.log(
                    "Notification Error:",
                    notificationError
                );
            }


            // =================================================
            // SUCCESS
            // =================================================

            setStatus(
                "✅ Movie Uploaded Successfully."
            );


            // =================================================
            // CLEAR FORM
            // =================================================

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
                "movieVideo"
            ).value = "";


            document.getElementById(
                "movieCategory"
            ).selectedIndex = 0;


            document.getElementById(
                "movieYear"
            ).value = "";


        } catch (error) {

            console.error(
                "Upload Error:",
                error
            );


            setStatus(
                "❌ Upload Failed : " +
                (
                    error.message ||
                    "Unknown error"
                )
            );


        } finally {

            if (saveButton) {

                saveButton.disabled =
                    false;
            }
        }
    };
