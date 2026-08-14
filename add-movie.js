import { supabase } from "./supabase.js";


// =====================================================
// CONFIG
// =====================================================

// =====================================================
// CLOUDINARY - POSTER ONLY
// =====================================================

const CLOUD_NAME = "peni6puh";

const UPLOAD_PRESET = "filmy-ott";

const CLOUDINARY_API_KEY =
    "351391556181673";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_3VILNZNCEMCUBO2h45YOKg_adfNG9Ld";

const SIGN_URL =
    "https://ochfxvxxrvunlxuwdcop.supabase.co/functions/v1/cloudinary-sign";


// =====================================================
// BACKBLAZE B2 - VIDEO
// =====================================================

const BACKBLAZE_FUNCTION_URL =
    "https://ochfxvxxrvunlxuwdcop.supabase.co/functions/v1/backblaze-upload";


// =====================================================
// GET STATUS
// =====================================================

function getStatus() {

    return document.getElementById(
        "uploadStatus"
    );

}


// =====================================================
// CLOUDINARY SIGNATURE
// =====================================================

async function getCloudinarySignature() {

    const timestamp =
        Math.floor(
            Date.now() / 1000
        );


    const response =
        await fetch(
            SIGN_URL,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Bearer " +
                        SUPABASE_PUBLISHABLE_KEY,

                    "apikey":
                        SUPABASE_PUBLISHABLE_KEY

                },

                body: JSON.stringify({

                    timestamp:
                        timestamp,

                    upload_preset:
                        UPLOAD_PRESET

                })

            }
        );


    if (!response.ok) {

        const text =
            await response.text();

        throw new Error(
            "Signature request failed: " +
            text
        );

    }


    const data =
        await response.json();


    if (
        !data.signature ||
        !data.timestamp
    ) {

        throw new Error(
            "Cloudinary signature not received."
        );

    }


    return {

        signature:
            data.signature,

        timestamp:
            data.timestamp,

        upload_preset:
            data.upload_preset ||
            UPLOAD_PRESET

    };

}


// =====================================================
// CLOUDINARY POSTER UPLOAD
// =====================================================

function uploadPosterToCloudinary(
    file
) {

    return new Promise(
        async (
            resolve,
            reject
        ) => {

            try {

                const signed =
                    await getCloudinarySignature();


                const formData =
                    new FormData();


                formData.append(
                    "file",
                    file,
                    file.name
                );


                formData.append(
                    "api_key",
                    CLOUDINARY_API_KEY
                );


                formData.append(
                    "timestamp",
                    signed.timestamp
                );


                formData.append(
                    "upload_preset",
                    signed.upload_preset
                );


                formData.append(
                    "signature",
                    signed.signature
                );


                const xhr =
                    new XMLHttpRequest();


                const uploadUrl =
                    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;


                xhr.open(
                    "POST",
                    uploadUrl,
                    true
                );


                xhr.upload.onprogress =
                    function (event) {

                        if (
                            !event.lengthComputable
                        ) {

                            return;

                        }


                        const percent =
                            Math.round(
                                (
                                    event.loaded /
                                    event.total
                                ) * 100
                            );


                        const status =
                            getStatus();


                        if (status) {

                            status.style.display =
                                "block";

                            status.innerHTML =
                                `🖼️ Uploading Poster... ${percent}%`;

                        }

                    };


                xhr.onload =
                    function () {

                        if (
                            xhr.status < 200 ||
                            xhr.status >= 300
                        ) {

                            reject(

                                new Error(
                                    "Cloudinary poster upload failed: " +
                                    xhr.responseText
                                )

                            );

                            return;

                        }


                        let data;


                        try {

                            data =
                                JSON.parse(
                                    xhr.responseText
                                );

                        } catch (error) {

                            reject(

                                new Error(
                                    "Invalid Cloudinary response."
                                )

                            );

                            return;

                        }


                        if (
                            !data.secure_url
                        ) {

                            reject(

                                new Error(
                                    "Cloudinary did not return poster URL."
                                )

                            );

                            return;

                        }


                        resolve(
                            data.secure_url
                        );

                    };


                xhr.onerror =
                    function () {

                        reject(

                            new Error(
                                "Network error while uploading poster."
                            )

                        );

                    };


                xhr.onabort =
                    function () {

                        reject(

                            new Error(
                                "Poster upload cancelled."
                            )

                        );

                    };


                xhr.send(
                    formData
                );


            } catch (error) {

                reject(error);

            }

        }
    );

}


// =====================================================
// BACKBLAZE B2 VIDEO UPLOAD
// =====================================================

function uploadVideoToBackblaze(
    file
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const xhr =
                new XMLHttpRequest();


            xhr.open(
                "POST",
                BACKBLAZE_FUNCTION_URL,
                true
            );


            // -------------------------------------------------
            // SUPABASE EDGE FUNCTION AUTH
            // -------------------------------------------------

            xhr.setRequestHeader(
                "apikey",
                SUPABASE_PUBLISHABLE_KEY
            );


            xhr.setRequestHeader(
                "Authorization",
                "Bearer " +
                SUPABASE_PUBLISHABLE_KEY
            );


            // -------------------------------------------------
            // UPLOAD PROGRESS
            // -------------------------------------------------

            xhr.upload.onprogress =
                function (event) {

                    if (
                        !event.lengthComputable
                    ) {

                        return;

                    }


                    const percent =
                        Math.round(
                            (
                                event.loaded /
                                event.total
                            ) * 100
                        );


                    const uploadedMB =
                        (
                            event.loaded /
                            1024 /
                            1024
                        ).toFixed(1);


                    const totalMB =
                        (
                            event.total /
                            1024 /
                            1024
                        ).toFixed(1);


                    const status =
                        getStatus();


                    if (status) {

                        status.style.display =
                            "block";

                        status.innerHTML =
                            `🎬 Uploading Movie... ${percent}% (${uploadedMB} MB / ${totalMB} MB)`;

                    }

                };


            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            xhr.onload =
                function () {

                    if (
                        xhr.status < 200 ||
                        xhr.status >= 300
                    ) {

                        reject(

                            new Error(
                                "Backblaze upload failed: " +
                                xhr.responseText
                            )

                        );

                        return;

                    }


                    let data;


                    try {

                        data =
                            JSON.parse(
                                xhr.responseText
                            );

                    } catch (error) {

                        reject(

                            new Error(
                                "Invalid Backblaze response."
                            )

                        );

                        return;

                    }


                    if (
                        !data.success ||
                        !data.url
                    ) {

                        reject(

                            new Error(
                                data.error ||
                                "Backblaze did not return video URL."
                            )

                        );

                        return;

                    }


                    resolve(
                        data.url
                    );

                };


            // -------------------------------------------------
            // NETWORK ERROR
            // -------------------------------------------------

            xhr.onerror =
                function () {

                    reject(

                        new Error(
                            "Network error while uploading movie to Backblaze."
                        )

                    );

                };


            // -------------------------------------------------
            // ABORT
            // -------------------------------------------------

            xhr.onabort =
                function () {

                    reject(

                        new Error(
                            "Movie upload cancelled."
                        )

                    );

                };


            // -------------------------------------------------
            // FORM DATA
            // -------------------------------------------------

            const formData =
                new FormData();


            formData.append(
                "file",
                file,
                file.name
            );


            // IMPORTANT:
            // Do NOT manually set Content-Type.
            // Browser creates the correct multipart boundary.

            xhr.send(
                formData
            );

        }
    );

}


// =====================================================
// SAVE MOVIE
// =====================================================

window.saveMovie =
    async function () {

        const status =
            getStatus();


        // =================================================
        // GET FORM VALUES
        // =================================================

        const title =
            document
                .getElementById(
                    "movieName"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "movieDescription"
                )
                .value
                .trim();


        const posterInput =
            document.getElementById(
                "moviePoster"
            );


        const videoInput =
            document.getElementById(
                "movieVideo"
            );


        const posterFile =
            posterInput.files[0];


        const videoFile =
            videoInput.files[0];


        const category =
            document
                .getElementById(
                    "movieCategory"
                )
                .value;


        const year =
            document
                .getElementById(
                    "movieYear"
                )
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

            status.style.display =
                "block";


            status.innerHTML =
                "❌ Please fill all required fields.";


            return;

        }


        // =================================================
        // DISABLE SAVE BUTTON
        // =================================================

        const saveButton =
            document.querySelector(
                '[onclick="saveMovie()"]'
            );


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.style.opacity =
                "0.6";

        }


        try {

            // =================================================
            // POSTER
            // =================================================

            status.style.display =
                "block";


            status.innerHTML =
                "🖼️ Uploading Poster...";


            const posterUrl =
                await uploadPosterToCloudinary(
                    posterFile
                );


            // =================================================
            // VIDEO
            // =================================================

            status.innerHTML =
                "🎬 Uploading Movie... 0%";


            const videoUrl =
                await uploadVideoToBackblaze(
                    videoFile
                );


            // =================================================
            // SAVE MOVIE
            // =================================================

            status.innerHTML =
                "☁️ Saving Movie...";


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

                    .from(
                        "notifications"
                    )

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

            status.innerHTML =
                "✅ Movie Uploaded Successfully.";


            // =================================================
            // CLEAR FORM
            // =================================================

            document
                .getElementById(
                    "movieName"
                )
                .value = "";


            document
                .getElementById(
                    "movieDescription"
                )
                .value = "";


            document
                .getElementById(
                    "moviePoster"
                )
                .value = "";


            document
                .getElementById(
                    "movieVideo"
                )
                .value = "";


            document
                .getElementById(
                    "movieCategory"
                )
                .selectedIndex = 0;


            document
                .getElementById(
                    "movieYear"
                )
                .value = "";


        } catch (error) {

            console.error(
                "UPLOAD ERROR:",
                error
            );


            status.style.display =
                "block";


            status.innerHTML =
                "❌ Upload Failed : " +
                error.message;


        } finally {

            // =================================================
            // ENABLE BUTTON
            // =================================================

            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.style.opacity =
                    "1";

            }

        }

    };
