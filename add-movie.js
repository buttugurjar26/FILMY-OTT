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

// 50 MB
const CHUNK_SIZE =
    50 * 1024 * 1024;


// 3 parts simultaneously
const PARALLEL_UPLOADS =
    3;


// Retry each direct upload
const MAX_RETRIES =
    3;


// =====================================================
// STATUS
// =====================================================

function updateStatus(
    message
) {

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
// SHA-1
// =====================================================

async function sha1(
    blob
) {

    const buffer =
        await blob.arrayBuffer();

    const hash =
        await crypto.subtle.digest(
            "SHA-1",
            buffer
        );

    return Array
        .from(
            new Uint8Array(
                hash
            )
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
            Date.now() /
            1000
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
            "Cloudinary signature error: " +
            text
        );
    }


    const data =
        JSON.parse(
            text
        );


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
// CLOUDINARY POSTER
// =====================================================

async function uploadPosterToCloudinary(
    file
) {

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


    return new Promise(
        (
            resolve,
            reject
        ) => {

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
                event => {

                    if (
                        event.lengthComputable
                    ) {

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
                    }
                };


            xhr.onload =
                () => {

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


                    try {

                        const data =
                            JSON.parse(
                                xhr.responseText
                            );


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

                    } catch {

                        reject(
                            new Error(
                                "Invalid Cloudinary response."
                            )
                        );
                    }
                };


            xhr.onerror =
                () => {

                    reject(
                        new Error(
                            "Network error while uploading poster."
                        )
                    );
                };


            xhr.onabort =
                () => {

                    reject(
                        new Error(
                            "Poster upload cancelled."
                        )
                    );
                };


            xhr.send(
                formData
            );
        }
    );
}


// =====================================================
// BACKBLAZE REQUEST
// =====================================================

async function backblazeRequest(
    body
) {

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
            "Backblaze request failed."
        );
    }


    return data;
}


// =====================================================
// START
// =====================================================

async function startUpload(
    file
) {

    return await backblazeRequest({

        action:
            "start",

        fileName:
            `movies/${Date.now()}-${file.name}`,

        contentType:
            file.type ||
            "video/mp4"
    });
}


// =====================================================
// GET DIRECT PART URL
// =====================================================

async function getPartUploadUrl(
    fileId
) {

    return await backblazeRequest({

        action:
            "getPartUrl",

        fileId
    });
}


// =====================================================
// DIRECT BACKBLAZE PART UPLOAD
// =====================================================

async function uploadPartDirect(
    uploadUrl,
    authorizationToken,
    partNumber,
    chunk,
    sha1Hash
) {

    for (
        let attempt = 1;
        attempt <= MAX_RETRIES;
        attempt++
    ) {

        try {

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
                                sha1Hash,

                            "Content-Type":
                                "application/octet-stream"
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


            const data =
                JSON.parse(
                    text
                );


            if (
                !data.sha1
            ) {

                throw new Error(
                    "Backblaze SHA-1 missing."
                );
            }


            return data.sha1;

        } catch (error) {

            if (
                attempt >=
                MAX_RETRIES
            ) {

                throw new Error(
                    `Part ${partNumber} failed after ${MAX_RETRIES} attempts: ` +
                    (
                        error.message ||
                        error
                    )
                );
            }


            updateStatus(
                `🔄 Part ${partNumber} retry ${attempt}/${MAX_RETRIES}...`
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        1500 *
                        attempt
                    )
            );
        }
    }
}


// =====================================================
// UPLOAD ONE PART
// =====================================================

async function uploadOnePart(
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


    const hash =
        await sha1(
            chunk
        );


    const urlData =
        await getPartUploadUrl(
            fileId
        );


    const sha1Result =
        await uploadPartDirect(
            urlData.uploadUrl,
            urlData.authorizationToken,
            partNumber,
            chunk,
            hash
        );


    return {

        partNumber,

        sha1:
            sha1Result,

        size:
            chunk.size
    };
}


// =====================================================
// FAST PARALLEL VIDEO UPLOAD
// =====================================================

async function uploadVideoToBackblaze(
    file
) {

    if (!file) {

        throw new Error(
            "Video file not selected."
        );
    }


    const totalParts =
        Math.ceil(
            file.size /
            CHUNK_SIZE
        );


    if (
        totalParts < 2
    ) {

        throw new Error(
            "Video must be larger than one Backblaze part."
        );
    }


    // ================================================
    // START
    // ================================================

    updateStatus(
        "🎬 Starting direct Backblaze upload..."
    );


    const startResult =
        await startUpload(
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
        );


    let completed =
        0;


    let nextPart =
        1;


    // ================================================
    // WORKER
    // ================================================

    async function worker() {

        while (
            true
        ) {

            const partNumber =
                nextPart++;


            if (
                partNumber >
                totalParts
            ) {

                return;
            }


            const result =
                await uploadOnePart(
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


            completed++;


            const uploadedBytes =
                partSizes
                    .slice(
                        0,
                        totalParts
                    )
                    .reduce(
                        (
                            total,
                            size
                        ) =>
                            total +
                            (
                                size ||
                                0
                            ),
                        0
                    );


            const percent =
                Math.round(
                    (
                        uploadedBytes /
                        file.size
                    ) *
                    100
                );


            const uploadedMB =
                (
                    uploadedBytes /
                    1024 /
                    1024
                ).toFixed(
                    1
                );


            const totalMB =
                (
                    file.size /
                    1024 /
                    1024
                ).toFixed(
                    1
                );


            updateStatus(
                `🚀 Uploading Movie... ${percent}% (${uploadedMB} MB / ${totalMB} MB) • ${completed}/${totalParts} parts`
            );
        }
    }


    // ================================================
    // 3 PARALLEL WORKERS
    // ================================================

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


    try {

        await Promise.all(
            workers
        );

    } catch (error) {

        try {

            await backblazeRequest({

                action:
                    "cancel",

                fileId
            });

        } catch (
            cancelError
        ) {

            console.error(
                "Cancel error:",
                cancelError
            );
        }


        throw error;
    }


    // ================================================
    // FINISH
    // ================================================

    updateStatus(
        "🔗 Combining movie parts..."
    );


    const finishResult =
        await backblazeRequest({

            action:
                "finish",

            fileId,

            sha1Array
        });


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
            document.getElementById(
                "uploadStatus"
            );


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


        // ================================================
        // VALIDATION
        // ================================================

        if (

            !title ||

            !description ||

            !category ||

            !year ||

            !posterFile ||

            !videoFile

        ) {

            updateStatus(
                "❌ Please fill all required fields."
            );

            return;
        }


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

            // ==========================================
            // POSTER
            // ==========================================

            updateStatus(
                "🖼️ Uploading Poster..."
            );


            const posterUrl =
                await uploadPosterToCloudinary(
                    posterFile
                );


            // ==========================================
            // VIDEO
            // ==========================================

            updateStatus(
                "🎬 Preparing direct video upload..."
            );


            const videoUrl =
                await uploadVideoToBackblaze(
                    videoFile
                );


            // ==========================================
            // SAVE MOVIE
            // ==========================================

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

                            title,

                            category,

                            movieyear:
                                Number(
                                    year
                                ),

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


            // ==========================================
            // NOTIFICATION
            // ==========================================

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


            // ==========================================
            // SUCCESS
            // ==========================================

            updateStatus(
                "✅ Movie Uploaded Successfully."
            );


            // ==========================================
            // CLEAR FORM
            // ==========================================

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

        } catch (error) {

            console.error(
                "UPLOAD ERROR:",
                error
            );


            updateStatus(
                "❌ Upload Failed : " +
                (
                    error.message ||
                    error
                )
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


console.log("ADD MOVIE JS LOADED");
