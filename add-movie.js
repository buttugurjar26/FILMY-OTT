import { supabase } from "./supabase.js";


// =====================================================
// CONFIG
// =====================================================

const CLOUD_NAME = "peni6puh";

const UPLOAD_PRESET = "filmy-ott";

const SIGN_URL =
    "https://ochfxvxxrvunlxuwdcop.supabase.co/functions/v1/cloudinary-sign";


// =====================================================
// CLOUDINARY SIGNATURE
// =====================================================

async function getCloudinarySignature() {

    const timestamp =
        Math.floor(Date.now() / 1000);

    const response = await fetch(SIGN_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            timestamp: timestamp,

            upload_preset: UPLOAD_PRESET

        })

    });


    if (!response.ok) {

        const text = await response.text();

        throw new Error(
            "Signature request failed: " + text
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

        signature: data.signature,

        timestamp: data.timestamp,

        upload_preset:
            data.upload_preset ||
            UPLOAD_PRESET

    };

}


// =====================================================
// CLOUDINARY CHUNK UPLOAD
// =====================================================

function uploadToCloudinary(file) {

    return new Promise(async (resolve, reject) => {

        try {

            // -------------------------------------------------
            // CHUNK SIZE
            // 20 MB
            // -------------------------------------------------

            const CHUNK_SIZE =
                20 * 1024 * 1024;


            const totalSize =
                file.size;


            const totalChunks =
                Math.ceil(
                    totalSize / CHUNK_SIZE
                );


            // -------------------------------------------------
            // GET SIGNATURE
            // -------------------------------------------------

            const signed =
                await getCloudinarySignature();


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

            let chunkNumber = 0;

            let finalResult = null;


            // -------------------------------------------------
            // UPLOAD CHUNKS
            // -------------------------------------------------

            while (start < totalSize) {

                const end =
                    Math.min(
                        start + CHUNK_SIZE,
                        totalSize
                    );


                const chunk =
                    file.slice(
                        start,
                        end
                    );


                chunkNumber++;


                const formData =
                    new FormData();


                formData.append(
                    "file",
                    chunk,
                    file.name
                );


                formData.append(
                    "api_key",
                    ""
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
                    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;


                xhr.open(
                    "POST",
                    uploadUrl,
                    true
                );


                // -------------------------------------------------
                // CHUNK HEADERS
                // -------------------------------------------------

                xhr.setRequestHeader(
                    "X-Unique-Upload-Id",
                    uploadId
                );


                xhr.setRequestHeader(
                    "Content-Range",
                    `bytes ${start}-${end - 1}/${totalSize}`
                );


                // -------------------------------------------------
                // PROGRESS
                // -------------------------------------------------

                xhr.upload.onprogress =
                    function (event) {

                        if (!event.lengthComputable) {
                            return;
                        }


                        const chunkProgress =
                            event.loaded /
                            event.total;


                        const completedBytes =
                            start;


                        const currentBytes =
                            completedBytes +
                            event.loaded;


                        const percent =
                            Math.min(
                                100,
                                Math.round(
                                    (
                                        currentBytes /
                                        totalSize
                                    ) * 100
                                )
                            );


                        const status =
                            document.getElementById(
                                "uploadStatus"
                            );


                        if (status) {

                            status.style.display =
                                "block";


                            status.innerHTML =
                                `🎬 Uploading Movie... ${percent}%`;
                        }

                    };


                // -------------------------------------------------
                // RESPONSE
                // -------------------------------------------------

                xhr.onload =
                    async function () {

                        if (
                            xhr.status < 200 ||
                            xhr.status >= 300
                        ) {

                            reject(
                                new Error(
                                    "Cloudinary upload failed: " +
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


                        finalResult =
                            data;


                        start = end;


                        // -------------------------------------------------
                        // NEXT CHUNK
                        // -------------------------------------------------

                        if (start < totalSize) {

                            uploadNextChunk();

                        } else {

                            // -------------------------------------------------
                            // COMPLETE
                            // -------------------------------------------------

                            if (
                                finalResult &&
                                finalResult.secure_url
                            ) {

                                resolve(
                                    finalResult.secure_url
                                );

                            } else {

                                reject(
                                    new Error(
                                        "Cloudinary did not return secure_url."
                                    )
                                );

                            }

                        }

                    };


                xhr.onerror =
                    function () {

                        reject(
                            new Error(
                                "Network error while uploading to Cloudinary."
                            )
                        );

                    };


                xhr.onabort =
                    function () {

                        reject(
                            new Error(
                                "Upload cancelled."
                            )
                        );

                    };


                xhr.send(formData);


                // -------------------------------------------------
                // WAIT FOR CURRENT CHUNK
                // -------------------------------------------------

                await new Promise(
                    function (next) {

                        const oldStart =
                            start;


                        const check =
                            setInterval(
                                function () {

                                    if (
                                        start !==
                                        oldStart
                                    ) {

                                        clearInterval(
                                            check
                                        );

                                        next();

                                    }

                                },
                                100
                            );

                    }
                );

            }


        } catch (error) {

            reject(error);

        }

    });

}


// =====================================================
// SAVE MOVIE
// =====================================================

window.saveMovie = async function () {

    const status =
        document.getElementById(
            "uploadStatus"
        );


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

        status.style.display =
            "block";


        status.innerHTML =
            "❌ Please fill all required fields.";


        return;

    }


    // =================================================
    // DISABLE BUTTON
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

        // =============================================
        // POSTER
        // =============================================

        status.style.display =
            "block";


        status.innerHTML =
            "🖼️ Uploading Poster...";


        const posterUrl =
            await uploadToCloudinary(
                posterFile
            );


        // =============================================
        // MOVIE
        // =============================================

        status.innerHTML =
            "🎬 Uploading Movie... 0%";


        const videoUrl =
            await uploadToCloudinary(
                videoFile
            );


        // =============================================
        // SAVE TO SUPABASE
        // =============================================

        status.innerHTML =
            "☁️ Saving Movie...";


        const {
            data,
            error
        } = await supabase

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

                    video_url:
                        videoUrl

                }

            ])

            .select()

            .single();


        if (error) {

            throw error;

        }


        // =============================================
        // NOTIFICATION
        // =============================================

        const {
            error: notificationError
        } = await supabase

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


        if (notificationError) {

            console.log(
                "Notification Error:",
                notificationError
            );

        }


        // =============================================
        // SUCCESS
        // =============================================

        status.innerHTML =
            "✅ Movie Uploaded Successfully.";


        // =============================================
        // CLEAR FORM
        // =============================================

        document
            .getElementById("movieName")
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

        // =============================================
        // ENABLE BUTTON AGAIN
        // =============================================

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.style.opacity =
                "1";

        }

    }

};
