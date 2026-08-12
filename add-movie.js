import { supabase } from "./supabase.js";


// =====================================================
// CONFIG
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
// GET ELEMENT
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
        Math.floor(Date.now() / 1000);


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
                        "sb_publishable_3VILNZNCEMCUBO2h45YOKg_adfNG9Ld";

                    "apikey":
                        "sb_publishable_3VILNZNCEMCUBO2h45YOKg_adfNG9Ld";

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
// XHR CHUNK UPLOAD
// =====================================================

function uploadChunk({

    file,
    start,
    end,
    totalSize,
    uploadId,
    signed,
    resourceType

}) {

    return new Promise(
        (resolve, reject) => {

            const xhr =
                new XMLHttpRequest();


            // IMPORTANT:
            // Cloudinary REST API upload endpoint
            // is /upload.
            //
            // Large upload is achieved using
            // Content-Range + X-Unique-Upload-Id.

            const uploadUrl =
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;


            xhr.open(
                "POST",
                uploadUrl,
                true
            );


            // =================================================
            // CHUNK HEADERS
            // =================================================

            xhr.setRequestHeader(
                "X-Unique-Upload-Id",
                uploadId
            );


            xhr.setRequestHeader(
                "Content-Range",
                `bytes ${start}-${end - 1}/${totalSize}`
            );


            // =================================================
            // PROGRESS
            // =================================================

            xhr.upload.onprogress =
                function (event) {

                    if (
                        !event.lengthComputable
                    ) {

                        return;

                    }


                    const status =
                        getStatus();


                    const chunkLoaded =
                        event.loaded;


                    const uploadedBytes =
                        start +
                        chunkLoaded;


                    const percent =
                        Math.min(

                            100,

                            Math.round(

                                (
                                    uploadedBytes /
                                    totalSize

                                ) * 100

                            )

                        );


                    if (status) {

                        status.style.display =
                            "block";

                        status.innerHTML =
                            `🎬 Uploading Movie... ${percent}%`;

                    }

                };


            // =================================================
            // RESPONSE
            // =================================================

            xhr.onload =
                function () {

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


                    resolve(data);

                };


            // =================================================
            // NETWORK ERROR
            // =================================================

            xhr.onerror =
                function () {

                    reject(

                        new Error(
                            "Network error while uploading to Cloudinary."
                        )

                    );

                };


            // =================================================
            // ABORT
            // =================================================

            xhr.onabort =
                function () {

                    reject(

                        new Error(
                            "Upload cancelled."
                        )

                    );

                };


            // =================================================
            // FORM DATA
            // =================================================

            const formData =
                new FormData();


            const chunk =
                file.slice(
                    start,
                    end
                );


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


            xhr.send(
                formData
            );

        }
    );

}


// =====================================================
// CLOUDINARY CHUNKED UPLOAD
// =====================================================

async function uploadToCloudinary(file) {

    // -------------------------------------------------
    // 20 MB CHUNKS
    // -------------------------------------------------

    const CHUNK_SIZE =
        20 * 1024 * 1024;


    const totalSize =
        file.size;


    if (!totalSize) {

        throw new Error(
            "Invalid file."
        );

    }


    // -------------------------------------------------
    // GET SIGNATURE
    // -------------------------------------------------

    const signed =
        await getCloudinarySignature();


    // -------------------------------------------------
    // UNIQUE ID
    // -------------------------------------------------

    const uploadId =
        "filmyott-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2);


    let start =
        0;


    let finalResult =
        null;


    const resourceType =
        file.type.startsWith("video/")
            ? "video"
            : "image";


    // =================================================
    // UPLOAD EACH CHUNK
    // =================================================

    while (
        start < totalSize
    ) {

        const end =
            Math.min(
                start +
                CHUNK_SIZE,
                totalSize
            );


        const status =
            getStatus();


        if (status) {

            const uploadedMB =
                (
                    start /
                    1024 /
                    1024
                ).toFixed(1);


            const totalMB =
                (
                    totalSize /
                    1024 /
                    1024
                ).toFixed(1);


            status.innerHTML =
                `🎬 Uploading Movie... ${uploadedMB} MB / ${totalMB} MB`;

        }


        const result =
            await uploadChunk({

                file:
                    file,

                start:
                    start,

                end:
                    end,

                totalSize:
                    totalSize,

                uploadId:
                    uploadId,

                signed:
                    signed,

                resourceType:
                    resourceType

            });


        finalResult =
            result;


        // -------------------------------------------------
        // NEXT CHUNK
        // -------------------------------------------------

        start =
            end;


        // -------------------------------------------------
        // SERVER INTERMEDIATE RESPONSE
        // -------------------------------------------------

        const statusAfterChunk =
            getStatus();


        if (
            start < totalSize &&
            statusAfterChunk
        ) {

            const percent =
                Math.round(
                    (
                        start /
                        totalSize
                    ) * 100
                );


            statusAfterChunk.innerHTML =
                `🎬 Uploading Movie... ${percent}%`;

        }

    }


    // =================================================
    // FINAL RESULT
    // =================================================

    if (
        finalResult &&
        finalResult.secure_url
    ) {

        return finalResult.secure_url;

    }


    throw new Error(
        "Cloudinary did not return secure_url."
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
        // SAVE BUTTON
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
                await uploadToCloudinary(
                    posterFile
                );


            // =================================================
            // MOVIE
            // =================================================

            status.innerHTML =
                "🎬 Uploading Movie... 0%";


            const videoUrl =
                await uploadToCloudinary(
                    videoFile
                );


            // =================================================
            // SAVE TO SUPABASE
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
