import { supabase } from "./supabase.js";


// =====================================================
// FILMY OTT - ADD MOVIE
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
// BACKBLAZE
// =====================================================

const BACKBLAZE_FUNCTION_URL =
    "https://ochfxvxxrvunlxuwdcop.supabase.co/functions/v1/backblaze-upload";


// =====================================================
// UPLOAD SETTINGS
// =====================================================

// 50 MB
const CHUNK_SIZE =
    50 * 1024 * 1024;


// 2 parts at the same time
// Mobile network ke liye 3 se zyada stable
const PARALLEL_UPLOADS =
    2;


// Maximum retry
const MAX_RETRIES =
    3;


// =====================================================
// STATUS
// =====================================================

function updateStatus(message) {

    const status =
        document.getElementById(
            "uploadStatus"
        );

    if (!status) {
        return;
    }

    status.style.display =
        "block";

    status.innerHTML =
        message;
}


// =====================================================
// GET BUTTON
// =====================================================

function getSaveButton() {

    return document.querySelector(
        '[onclick="saveMovie()"]'
    );
}


// =====================================================
// SHA-1
// =====================================================

async function calculateSHA1(blob) {

    const buffer =
        await blob.arrayBuffer();

    const hash =
        await crypto.subtle.digest(
            "SHA-1",
            buffer
        );

    return Array
        .from(
            new Uint8Array(hash)
        )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join("");
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
                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Bearer " +
                        SUPABASE_PUBLISHABLE_KEY,

                    "apikey":
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


    if (!response.ok) {

        throw new Error(
            "Cloudinary signature error (" +
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

    } catch {

        throw new Error(
            "Invalid Cloudinary signature response."
        );
    }


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

function uploadPosterToCloudinary(file) {

    return new Promise(
        async (
            resolve,
            reject
        ) => {

            try {

                updateStatus(
                    "🔐 Preparing Poster Upload..."
                );


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
                    String(
                        signed.timestamp
                    )
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
                    function(event) {

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
                                ) *
                                100
                            );


                        updateStatus(
                            `🖼️ Uploading Poster... ${percent}%`
                        );
                    };


                xhr.onload =
                    function() {

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

                        } catch {

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
                    function() {

                        reject(
                            new Error(
                                "Network error while uploading poster."
                            )
                        );
                    };


                xhr.onabort =
                    function() {

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

async function backblazeRequest(body) {

    const response =
        await fetch(
            BACKBLAZE_FUNCTION_URL,
            {
                method:
                    "POST",

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
                    JSON.stringify(
                        body
                    )
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

    } catch {

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
            `Backblaze request failed (${response.status}).`
        );
    }


    return data;
}


// =====================================================
// START BACKBLAZE LARGE FILE
// =====================================================

async function startBackblazeUpload(file) {

    const safeName =
        file.name
            .replace(
                /[^\w.\- ]/g,
                "_"
            );


    return await backblazeRequest({

        action:
            "start",

        fileName:
            `movies/${Date.now()}-${safeName}`,

        contentType:
            file.type ||
            "video/mp4"
    });
}


// =====================================================
// GET DIRECT UPLOAD URL
// =====================================================

async function getDirectUploadUrl(fileId) {

    return await backblazeRequest({

        action:
            "getPartUrl",

        fileId:
            fileId
    });
}


// =====================================================
// DIRECT PART UPLOAD
// =====================================================

async function uploadPartDirect(
    uploadUrl,
    authorizationToken,
    partNumber,
    chunk,
    chunkSHA1
) {

    for (
        let attempt = 1;
        attempt <= MAX_RETRIES;
        attempt++
    ) {

        try {

            updateStatus(
                `🚀 Uploading Part ${partNumber}...`
            );


            const response =
                await fetch(
                    uploadUrl,
                    {
                        method:
                            "POST",

                        headers: {

                            "Authorization":
                                authorizationToken,

                            "X-Bz-Part-Number":
                                String(
                                    partNumber
                                ),

                            "X-Bz-Content-Sha1":
                                chunkSHA1
                        },

                        body:
                            chunk
                    }
                );


            const text =
                await response.text();


            if (
                !response.ok
            ) {

                throw new Error(
                    text ||
                    `HTTP ${response.status}`
                );
            }


            let data;


            try {

                data =
                    JSON.parse(
                        text
                    );

            } catch {

                throw new Error(
                    "Invalid Backblaze upload response."
                );
            }


            if (
                !data.contentSha1 &&
                !data.sha1
            ) {

                throw new Error(
                    "Backblaze SHA-1 response missing."
                );
            }


            return (
                data.contentSha1 ||
                data.sha1
            );

        } catch (error) {

            console.error(
                `Part ${partNumber} attempt ${attempt}:`,
                error
            );


            if (
                attempt >=
                MAX_RETRIES
            ) {

                throw new Error(
                    `Part ${partNumber} failed after ${MAX_RETRIES} retries.`
                );
            }


            updateStatus(
                `🔄 Part ${partNumber} retry ${attempt}/${MAX_RETRIES}...`
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        2000 * attempt
                    )
            );
        }
    }


    throw new Error(
        `Part ${partNumber} upload failed.`
    );
}


// =====================================================
// UPLOAD ONE PART
// =====================================================

async function prepareAndUploadPart(
    file,
    fileId,
    partNumber,
    totalParts
) {

    const start =
        (
            partNumber -
            1
        ) *
        CHUNK_SIZE;


    const end =
        Math.min(
            start +
            CHUNK_SIZE,
            file.size
        );


    const chunk =
        file.slice(
            start,
            end
        );


    updateStatus(
        `🔐 Preparing Part ${partNumber}/${totalParts}...`
    );


    const chunkSHA1 =
        await calculateSHA1(
            chunk
        );


    const uploadInfo =
        await getDirectUploadUrl(
            fileId
        );


    if (
        !uploadInfo.uploadUrl ||
        !uploadInfo.authorizationToken
    ) {

        throw new Error(
            `Backblaze upload authorization missing for Part ${partNumber}.`
        );
    }


    const uploadedSHA1 =
        await uploadPartDirect(
            uploadInfo.uploadUrl,
            uploadInfo.authorizationToken,
            partNumber,
            chunk,
            chunkSHA1
        );


    return {

        partNumber:
            partNumber,

        sha1:
            uploadedSHA1,

        size:
            chunk.size
    };
}


// =====================================================
// FAST DIRECT VIDEO UPLOAD
// =====================================================

async function uploadVideoToBackblaze(file) {

    if (!file) {

        throw new Error(
            "Video file not selected."
        );
    }


    if (
        file.size <= 0
    ) {

        throw new Error(
            "Invalid video file."
        );
    }


    const totalParts =
        Math.ceil(
            file.size /
            CHUNK_SIZE
        );


    // Backblaze large file needs
    // at least 2 parts
    if (
        totalParts < 2
    ) {

        throw new Error(
            "Video is too small for the current large-file upload system."
        );
    }


    const totalMB =
        (
            file.size /
            1024 /
            1024
        ).toFixed(
            1
        );


    updateStatus(
        `🎬 Starting Direct Upload... 0% (0 MB / ${totalMB} MB)`
    );


    // =================================================
    // START
    // =================================================

    const startResult =
        await startBackblazeUpload(
            file
        );


    const fileId =
        startResult.fileId;


    if (!fileId) {

        throw new Error(
            "Backblaze did not return fileId."
        );
    }


    const sha1Array =
        new Array(
            totalParts
        );


    const partSizes =
        new Array(
            totalParts
        ).fill(
            0
        );


    let nextPart =
        1;


    let completedParts =
        0;


    // =================================================
    // PROGRESS
    // =================================================

    function showProgress() {

        const uploadedBytes =
            partSizes.reduce(
                (
                    total,
                    value
                ) =>
                    total +
                    value,
                0
            );


        const percent =
            Math.min(
                100,
                Math.round(
                    (
                        uploadedBytes /
                        file.size
                    ) *
                    100
                )
            );


        const uploadedMB =
            (
                uploadedBytes /
                1024 /
                1024
            ).toFixed(
                1
            );


        updateStatus(
            `🚀 Uploading Movie... ${percent}% (${uploadedMB} MB / ${totalMB} MB) • ${completedParts}/${totalParts} parts`
        );
    }


    // =================================================
    // WORKER
    // =================================================

    async function worker() {

        while (true) {

            const partNumber =
                nextPart++;


            if (
                partNumber >
                totalParts
            ) {

                return;
            }


            const result =
                await prepareAndUploadPart(
                    file,
                    fileId,
                    partNumber,
                    totalParts
                );


            sha1Array[
                partNumber - 1
            ] =
                result.sha1;


            partSizes[
                partNumber - 1
            ] =
                result.size;


            completedParts++;


            showProgress();
        }
    }


    // =================================================
    // PARALLEL UPLOAD
    // =================================================

    try {

        const workers =
            [];


        const workerCount =
            Math.min(
                PARALLEL_UPLOADS,
                totalParts
            );


        for (
            let i = 0;
            i < workerCount;
            i++
        ) {

            workers.push(
                worker()
            );
        }


        await Promise.all(
            workers
        );

    } catch (error) {

        // =============================================
        // CANCEL INCOMPLETE B2 FILE
        // =============================================

        try {

            await backblazeRequest({

                action:
                    "cancel",

                fileId:
                    fileId
            });

        } catch (
            cancelError
        ) {

            console.error(
                "Backblaze cancel error:",
                cancelError
            );
        }


        throw error;
    }


    // =================================================
    // VERIFY PARTS
    // =================================================

    for (
        let i = 0;
        i < sha1Array.length;
        i++
    ) {

        if (
            !sha1Array[i]
        ) {

            throw new Error(
                `Part ${i + 1} SHA-1 missing.`
            );
        }
    }


    // =================================================
    // FINISH
    // =================================================

    updateStatus(
        "🔗 Combining video parts..."
    );


    const finishResult =
        await backblazeRequest({

            action:
                "finish",

            fileId:
                fileId,

            sha1Array:
                sha1Array
        });


    if (
        !finishResult.url
    ) {

        throw new Error(
            "Backblaze did not return video URL."
        );
    }


    updateStatus(
        "✅ Video upload completed."
    );


    return finishResult.url;
}


// =====================================================
// CLEAR FORM
// =====================================================

function clearForm() {

    const movieName =
        document.getElementById(
            "movieName"
        );

    const movieDescription =
        document.getElementById(
            "movieDescription"
        );

    const moviePoster =
        document.getElementById(
            "moviePoster"
        );

    const movieVideo =
        document.getElementById(
            "movieVideo"
        );

    const movieCategory =
        document.getElementById(
            "movieCategory"
        );

    const movieYear =
        document.getElementById(
            "movieYear"
        );


    if (movieName) {
        movieName.value =
            "";
    }


    if (movieDescription) {
        movieDescription.value =
            "";
    }


    if (moviePoster) {
        moviePoster.value =
            "";
    }


    if (movieVideo) {
        movieVideo.value =
            "";
    }


    if (movieCategory) {
        movieCategory.selectedIndex =
            0;
    }


    if (movieYear) {
        movieYear.value =
            "";
    }
}


// =====================================================
// SAVE MOVIE
// =====================================================

window.saveMovie =
    async function() {

        console.log(
            "SAVE MOVIE CLICKED"
        );


        const status =
            document.getElementById(
                "uploadStatus"
            );


        // =================================================
        // GET ELEMENTS
        // =================================================

        const movieName =
            document.getElementById(
                "movieName"
            );

        const movieDescription =
            document.getElementById(
                "movieDescription"
            );

        const moviePoster =
            document.getElementById(
                "moviePoster"
            );

        const movieVideo =
            document.getElementById(
                "movieVideo"
            );

        const movieCategory =
            document.getElementById(
                "movieCategory"
            );

        const movieYear =
            document.getElementById(
                "movieYear"
            );


        // =================================================
        // CHECK ELEMENTS
        // =================================================

        if (
            !movieName ||
            !movieDescription ||
            !moviePoster ||
            !movieVideo ||
            !movieCategory ||
            !movieYear
        ) {

            updateStatus(
                "❌ Add Movie form elements not found."
            );

            console.error(
                "Missing Add Movie form element."
            );

            return;
        }


        // =================================================
        // VALUES
        // =================================================

        const title =
            movieName.value.trim();


        const description =
            movieDescription.value.trim();


        const category =
            movieCategory.value;


        const year =
            movieYear.value;


        const posterFile =
            moviePoster.files &&
            moviePoster.files[0];


        const videoFile =
            movieVideo.files &&
            movieVideo.files[0];


        // =================================================
        // VALIDATION
        // =================================================

        if (!title) {

            updateStatus(
                "❌ Please enter Movie Name."
            );

            return;
        }


        if (!description) {

            updateStatus(
                "❌ Please enter Movie Description."
            );

            return;
        }


        if (!posterFile) {

            updateStatus(
                "❌ Please select Poster."
            );

            return;
        }


        if (!videoFile) {

            updateStatus(
                "❌ Please select Video."
            );

            return;
        }


        if (!category) {

            updateStatus(
                "❌ Please select Category."
            );

            return;
        }


        if (!year) {

            updateStatus(
                "❌ Please enter Release Year."
            );

            return;
        }


        // =================================================
        // BUTTON
        // =================================================

        const saveButton =
            getSaveButton();


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.style.opacity =
                "0.6";

            saveButton.style.pointerEvents =
                "none";
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


            if (!posterUrl) {

                throw new Error(
                    "Poster URL not received."
                );
            }


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


            if (!videoUrl) {

                throw new Error(
                    "Video URL not received."
                );
            }


            // =================================================
            // SAVE TO SUPABASE
            // =================================================

            updateStatus(
                "☁️ Saving Movie..."
            );


            const {
                data,
                error
            } =
                await supabase
                    .from(
                        "movies"
                    )
                    .insert([
                        {

                            title:
                                title,

                            category:
                                category,

                            movieyear:
                                Number(
                                    year
                                ),

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

                throw new Error(
                    error.message
                );
            }


            // =================================================
            // NOTIFICATION
            // =================================================

            try {

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

                    console.error(
                        "Notification Error:",
                        notificationError
                    );
                }

            } catch (
                notificationError
            ) {

                console.error(
                    "Notification failed:",
                    notificationError
                );
            }


            // =================================================
            // SUCCESS
            // =================================================

            updateStatus(
                "✅ Movie Uploaded Successfully."
            );


            clearForm();

        } catch (error) {

            console.error(
                "UPLOAD ERROR:",
                error
            );


            updateStatus(
                "❌ Upload Failed : " +
                (
                    error &&
                    error.message
                        ? error.message
                        : String(
                            error
                        )
                )
            );

        } finally {

            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.style.opacity =
                    "1";

                saveButton.style.pointerEvents =
                    "auto";
            }
        }
    };


// =====================================================
// MODULE READY
// =====================================================

console.log(
    "ADD MOVIE JS LOADED"
);

console.log(
    "saveMovie available:",
    typeof window.saveMovie
);
