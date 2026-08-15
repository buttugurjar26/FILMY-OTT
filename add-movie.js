import { supabase } from "./supabase.js";


// =====================================================
// CONFIG
// =====================================================

// =====================================================
// CLOUDINARY - POSTER ONLY
// =====================================================

const CLOUD_NAME =
    "peni6puh";

const UPLOAD_PRESET =
    "filmy-ott";

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
// CHUNK SETTINGS
// =====================================================

// 50 MB per chunk
const CHUNK_SIZE =
    50 * 1024 * 1024;


// Retry settings
const MAX_RETRIES = 3;

const RETRY_DELAY =
    2000;


// =====================================================
// GET STATUS
// =====================================================

function getStatus() {

    return document.getElementById(
        "uploadStatus"
    );

}


// =====================================================
// UPDATE STATUS
// =====================================================

function updateStatus(message) {

    const status =
        getStatus();

    if (status) {

        status.style.display =
            "block";

        status.innerHTML =
            message;

    }

}


// =====================================================
// WAIT
// =====================================================

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
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

    try {

        const response =
            await fetch(
                SIGN_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "apikey":
                            SUPABASE_PUBLISHABLE_KEY,

                        "Authorization":
                            "Bearer " +
                            SUPABASE_PUBLISHABLE_KEY
                    },

                    body:
                        JSON.stringify({
                            timestamp:
                                timestamp,

                            upload_preset:
                                UPLOAD_PRESET
                        })
                }
            );


        const text =
            await response.text();


        console.log(
            "CLOUDINARY SIGN RESPONSE:",
            response.status,
            text
        );


        if (!response.ok) {

            throw new Error(
                "Cloudinary signature function error (" +
                response.status +
                "): " +
                text
            );

        }


        let data;

        try {

            data =
                JSON.parse(
                    text
                );

        } catch (error) {

            throw new Error(
                "Signature function returned invalid JSON: " +
                text
            );

        }


        if (
            !data.signature ||
            !data.timestamp
        ) {

            throw new Error(
                "Cloudinary signature missing: " +
                JSON.stringify(data)
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

    } catch (error) {

        console.error(
            "CLOUDINARY SIGN ERROR:",
            error
        );

        throw error;

    }

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


                        updateStatus(
                            `🖼️ Uploading Poster... ${percent}%`
                        );

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

                reject(
                    error
                );

            }

        }
    );

}


// =====================================================
// BACKBLAZE REQUEST
// =====================================================

async function backblazeRequest(
    formData
) {

    const response =
        await fetch(
            BACKBLAZE_FUNCTION_URL,
            {

                method: "POST",

                headers: {

                    "apikey":
                        SUPABASE_PUBLISHABLE_KEY,

                    "Authorization":
                        "Bearer " +
                        SUPABASE_PUBLISHABLE_KEY

                },

                body:
                    formData

            }
        );


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(
                text
            );

    } catch (error) {

        throw new Error(
            "Invalid Backblaze response: " +
            text
        );

    }


    if (
        !response.ok ||
        data.success === false
    ) {

        throw new Error(
            data.error ||
            "Backblaze request failed."
        );

    }


    return data;

}


// =====================================================
// START BACKBLAZE UPLOAD
// =====================================================

async function startBackblazeUpload(
    file
) {

    const formData =
        new FormData();


    formData.append(
        "action",
        "start"
    );


    formData.append(
        "fileName",
        `movies/${Date.now()}-${file.name}`
    );


    formData.append(
        "contentType",
        file.type ||
        "video/mp4"
    );


    return await backblazeRequest(
        formData
    );

}


// =====================================================
// UPLOAD ONE PART
// =====================================================

async function uploadBackblazePart(
    fileId,
    partNumber,
    chunk
) {

    let lastError =
        null;


    // =================================================
    // RETRY
    // =================================================

    for (
        let attempt = 1;
        attempt <= MAX_RETRIES;
        attempt++
    ) {

        try {

            updateStatus(
                `🎬 Uploading Part ${partNumber}... Attempt ${attempt}/${MAX_RETRIES}`
            );


            const formData =
                new FormData();


            formData.append(
                "action",
                "part"
            );


            formData.append(
                "fileId",
                fileId
            );


            formData.append(
                "partNumber",
                String(partNumber)
            );


            formData.append(
                "file",
                chunk,
                `part-${partNumber}`
            );


            const result =
                await backblazeRequest(
                    formData
                );


            if (
                !result.sha1
            ) {

                throw new Error(
                    "Backblaze SHA-1 missing."
                );

            }


            return result;

        } catch (error) {

            lastError =
                error;


            if (
                attempt <
                MAX_RETRIES
            ) {

                updateStatus(
                    `⚠️ Part ${partNumber} failed. Retrying...`
                );


                await wait(
                    RETRY_DELAY *
                    attempt
                );

            }

        }

    }


    throw new Error(
        `Part ${partNumber} failed after ${MAX_RETRIES} attempts: ` +
        lastError.message
    );

}


// =====================================================
// FINISH BACKBLAZE UPLOAD
// =====================================================

async function finishBackblazeUpload(
    fileId,
    sha1Array
) {

    const formData =
        new FormData();


    formData.append(
        "action",
        "finish"
    );


    formData.append(
        "fileId",
        fileId
    );


    formData.append(
        "sha1Array",
        JSON.stringify(
            sha1Array
        )
    );


    return await backblazeRequest(
        formData
    );

}


// =====================================================
// BACKBLAZE VIDEO UPLOAD
// =====================================================

async function uploadVideoToBackblaze(
    file
) {

    if (!file) {

        throw new Error(
            "Video file not selected."
        );

    }


    if (!file.size) {

        throw new Error(
            "Invalid video file."
        );

    }


    const totalSize =
        file.size;


    const totalParts =
        Math.ceil(
            totalSize /
            CHUNK_SIZE
        );


    updateStatus(
        `🎬 Preparing Movie Upload...<br>` +
        `📦 ${totalParts} parts × 50 MB`
    );


    // =================================================
    // START LARGE FILE
    // =================================================

    const startResult =
        await startBackblazeUpload(
            file
        );


    if (
        !startResult.fileId
    ) {

        throw new Error(
            "Backblaze did not return fileId."
        );

    }


    const fileId =
        startResult.fileId;


    const sha1Array =
        [];


    // =================================================
    // UPLOAD PARTS
    // =================================================

    for (
        let partNumber = 1;
        partNumber <= totalParts;
        partNumber++
    ) {

        const start =
            (
                partNumber - 1
            ) *
            CHUNK_SIZE;


        const end =
            Math.min(
                start +
                CHUNK_SIZE,
                totalSize
            );


        const chunk =
            file.slice(
                start,
                end
            );


        const result =
            await uploadBackblazePart(
                fileId,
                partNumber,
                chunk
            );


        sha1Array.push(
            result.sha1
        );


        const uploadedBytes =
            end;


        const percent =
            Math.round(
                (
                    uploadedBytes /
                    totalSize
                ) * 100
            );


        const uploadedMB =
            (
                uploadedBytes /
                1024 /
                1024
            ).toFixed(1);


        const totalMB =
            (
                totalSize /
                1024 /
                1024
            ).toFixed(1);


        updateStatus(
            `🎬 Uploading Movie... ${percent}%<br>` +
            `📦 Part ${partNumber}/${totalParts}<br>` +
            `☁️ ${uploadedMB} MB / ${totalMB} MB`
        );

    }


    // =================================================
    // FINISH
    // =================================================

    updateStatus(
        "⏳ Finalizing Movie Upload..."
    );


    const finishResult =
        await finishBackblazeUpload(
            fileId,
            sha1Array
        );


    if (
        !finishResult.url
    ) {

        throw new Error(
            "Backblaze did not return video URL."
        );

    }


    return finishResult.url;

}


// =====================================================
// SAVE MOVIE
// =====================================================

window.saveMovie =
    async function () {

        const status =
            getStatus();


        // =================================================
        // FORM
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

            updateStatus(
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

            saveButton.style.opacity =
                "0.6";

        }


        try {

            // =================================================
            // POSTER
            // =================================================

            updateStatus(
                "🖼️ Uploading Poster..."
            );


            const posterUrl =
                await uploadPosterToCloudinary(
                    posterFile
                );


            // =================================================
            // VIDEO
            // =================================================

            updateStatus(
                "🎬 Preparing Movie Upload..."
            );


            const videoUrl =
                await uploadVideoToBackblaze(
                    videoFile
                );


            // =================================================
            // SAVE DATABASE
            // =================================================

            updateStatus(
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

            updateStatus(
                "✅ Movie Uploaded Successfully."
            );


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


            updateStatus(
                "❌ Upload Failed : " +
                error.message
            );

        } finally {

            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.style.opacity =
                    "1";

            }

        }

    };


console.log(
    "ADD MOVIE JS LOADED - 50MB CHUNKS"
);
