import { supabase } from "./supabase.js";


// =====================================================
// CLOUDINARY - POSTER
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

// 50 MB per part
const CHUNK_SIZE =
    50 * 1024 * 1024;


// 3 chunks at the same time
const MAX_PARALLEL_UPLOADS =
    3;


// Retry each failed chunk
const MAX_RETRIES =
    3;


// =====================================================
// STATUS
// =====================================================

function getStatus() {

    return document.getElementById(
        "uploadStatus"
    );

}


function updateStatus(
    message
) {

    const status =
        getStatus();

    if (!status) {

        return;

    }

    status.style.display =
        "block";

    status.innerHTML =
        message;

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


    let data;


    try {

        data =
            JSON.parse(
                text
            );

    } catch {

        throw new Error(
            "Invalid Cloudinary signature response: " +
            text
        );

    }


    if (
        !response.ok ||
        !data.signature
    ) {

        throw new Error(
            "Cloudinary signature function error (" +
            response.status +
            "): " +
            text
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
// CLOUDINARY POSTER
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
                                ) *
                                100
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

                method:
                    "POST",

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
            "Backblaze request failed."
        );

    }


    return data;

}


// =====================================================
// START BACKBLAZE
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


    const safeName =
        file.name
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


    formData.append(
        "fileName",
        `movies/${Date.now()}-${safeName}`
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
// GET DIRECT BACKBLAZE PART URL
// =====================================================

async function getBackblazePartUrl(
    fileId
) {

    const formData =
        new FormData();


    formData.append(
        "action",
        "getPartUrl"
    );


    formData.append(
        "fileId",
        fileId
    );


    return await backblazeRequest(
        formData
    );

}


// =====================================================
// SHA-1
// =====================================================

async function calculateSHA1(
    blob
) {

    const buffer =
        await blob.arrayBuffer();


    const hash =
        await crypto.subtle.digest(
            "SHA-1",
            buffer
        );


    return Array.from(
        new Uint8Array(hash)
    )
        .map(
            (b) =>
                b.toString(16)
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join("");

}


// =====================================================
// DIRECT BACKBLAZE PART UPLOAD
// =====================================================

function uploadPartDirect(
    uploadUrl,
    authorizationToken,
    partNumber,
    chunk,
    onProgress
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
                uploadUrl,
                true
            );


            xhr.setRequestHeader(
                "Authorization",
                authorizationToken
            );


            xhr.setRequestHeader(
                "X-Bz-Part-Number",
                String(
                    partNumber
                )
            );


            // SHA-1 is added before send.
            calculateSHA1(
                chunk
            )
                .then(
                    (
                        sha1
                    ) => {

                        xhr.setRequestHeader(
                            "X-Bz-Content-Sha1",
                            sha1
                        );


                        xhr.setRequestHeader(
                            "Content-Type",
                            "application/octet-stream"
                        );


                        xhr.upload.onprogress =
                            function (
                                event
                            ) {

                                if (
                                    event.lengthComputable &&
                                    onProgress
                                ) {

                                    onProgress(
                                        event.loaded
                                    );

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
                                            "Backblaze part " +
                                            partNumber +
                                            " failed: " +
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
                                            "Invalid Backblaze part response."
                                        )
                                    );

                                    return;

                                }


                                resolve({

                                    sha1:
                                        sha1,

                                    partNumber:
                                        partNumber,

                                    data:
                                        data

                                });

                            };


                        xhr.onerror =
                            function () {

                                reject(
                                    new Error(
                                        "Network error on Backblaze part " +
                                        partNumber
                                    )
                                );

                            };


                        xhr.onabort =
                            function () {

                                reject(
                                    new Error(
                                        "Backblaze part " +
                                        partNumber +
                                        " cancelled."
                                    )
                                );

                            };


                        xhr.send(
                            chunk
                        );

                    }
                )
                .catch(
                    reject
                );

        }
    );

}


// =====================================================
// RETRY PART
// =====================================================

async function uploadPartWithRetry(
    fileId,
    partNumber,
    chunk,
    totalSize,
    loadedParts,
    totalParts
) {

    let lastError =
        null;


    for (
        let attempt = 1;
        attempt <= MAX_RETRIES;
        attempt++
    ) {

        try {

            const uploadInfo =
                await getBackblazePartUrl(
                    fileId
                );


            loadedParts[
                partNumber - 1
            ] = 0;


            const result =
                await uploadPartDirect(

                    uploadInfo.uploadUrl,

                    uploadInfo.authorizationToken,

                    partNumber,

                    chunk,

                    (
                        loaded
                    ) => {

                        loadedParts[
                            partNumber - 1
                        ] = loaded;


                        let totalLoaded =
                            0;


                        for (
                            const value
                            of loadedParts
                        ) {

                            totalLoaded +=
                                value;

                        }


                        const percent =
                            Math.min(
                                100,
                                Math.round(
                                    (
                                        totalLoaded /
                                        totalSize
                                    ) *
                                    100
                                )
                            );


                        const uploadedMB =
                            (
                                totalLoaded /
                                1024 /
                                1024
                            ).toFixed(
                                1
                            );


                        const totalMB =
                            (
                                totalSize /
                                1024 /
                                1024
                            ).toFixed(
                                1
                            );


                        updateStatus(
                            `🎬 Uploading Movie... ${percent}% (${uploadedMB} MB / ${totalMB} MB) — ${Math.min(
                                totalParts,
                                Math.ceil(
                                    totalLoaded /
                                    CHUNK_SIZE
                                )
                            )}/${totalParts} parts`
                        );

                    }

                );


            loadedParts[
                partNumber - 1
            ] =
                chunk.size;


            return result;

        } catch (
            error
        ) {

            lastError =
                error;


            if (
                attempt <
                MAX_RETRIES
            ) {

                updateStatus(
                    `🔄 Retrying part ${partNumber}... (${attempt}/${MAX_RETRIES})`
                );


                await new Promise(
                    (
                        resolve
                    ) =>
                        setTimeout(
                            resolve,
                            1500 *
                            attempt
                        )
                );

            }

        }

    }


    throw (
        lastError ||
        new Error(
            `Part ${partNumber} upload failed.`
        )
    );

}


// =====================================================
// FINISH BACKBLAZE
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
// FAST BACKBLAZE VIDEO UPLOAD
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
        "🎬 Preparing Movie Upload..."
    );


    // =================================================
    // START
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


    // =================================================
    // SHA-1 ARRAY
    // =================================================

    const sha1Array =
        new Array(
            totalParts
        );


    // =================================================
    // PROGRESS
    // =================================================

    const loadedParts =
        new Array(
            totalParts
        ).fill(
            0
        );


    // =================================================
    // PARALLEL WORKER
    // =================================================

    let nextPart =
        1;


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
                await uploadPartWithRetry(

                    fileId,

                    partNumber,

                    chunk,

                    totalSize,

                    loadedParts,

                    totalParts

                );


            sha1Array[
                partNumber - 1
            ] =
                result.sha1;


            loadedParts[
                partNumber - 1
            ] =
                chunk.size;


            let completed =
                0;


            for (
                const hash
                of sha1Array
            ) {

                if (hash) {

                    completed++;

                }

            }


            updateStatus(
                `🎬 Uploading Movie... ${Math.round(
                    (
                        completed /
                        totalParts
                    ) *
                    100
                )}% — ${completed}/${totalParts} parts`
            );

        }

    }


    // =================================================
    // 3 PARALLEL UPLOADS
    // =================================================

    const workers =
        [];


    const workerCount =
        Math.min(
            MAX_PARALLEL_UPLOADS,
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


    // =================================================
    // FINISH
    // =================================================

    updateStatus(
        "☁️ Finalizing Movie on Backblaze..."
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
        // FORM VALUES
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
        // BUTTON
        // =================================================

        const saveButton =
            document.querySelector(
                '[onclick="saveMovie()"]'
            );


        if (
            saveButton
        ) {

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
            // SAVE MOVIE
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


            if (
                error
            ) {

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
                .value =
                "";


            document
                .getElementById(
                    "movieDescription"
                )
                .value =
                "";


            document
                .getElementById(
                    "moviePoster"
                )
                .value =
                "";


            document
                .getElementById(
                    "movieVideo"
                )
                .value =
                "";


            document
                .getElementById(
                    "movieCategory"
                )
                .selectedIndex =
                0;


            document
                .getElementById(
                    "movieYear"
                )
                .value =
                "";


        } catch (
            error
        ) {

            console.error(
                "UPLOAD ERROR:",
                error
            );


            updateStatus(
                "❌ Upload Failed : " +
                (
                    error?.message ||
                    error
                )
            );


        } finally {

            if (
                saveButton
            ) {

                saveButton.disabled =
                    false;

                saveButton.style.opacity =
                    "1";

            }

        }

    };


console.log(
    "ADD MOVIE JS - FAST BACKBLAZE VERSION LOADED"
);
