import { supabase } from "./supabase.js";


// =====================================================
// CLOUDINARY
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

// 50 MB CHUNK

const CHUNK_SIZE =
    50 * 1024 * 1024;


// 3 CHUNKS AT SAME TIME

const MAX_PARALLEL_UPLOADS =
    3;


// RETRIES

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
// SLEEP
// =====================================================

function sleep(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
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


    const response =
        await fetch(
            SIGN_URL,
            {

                method:
                    "POST",

                headers:
                    {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            SUPABASE_PUBLISHABLE_KEY,

                        "apikey":
                            SUPABASE_PUBLISHABLE_KEY

                    },

                body:
                    JSON.stringify(
                        {

                            timestamp:
                                timestamp,

                            upload_preset:
                                UPLOAD_PRESET

                        }
                    )

            }
        );


    const text =
        await response.text();


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

    } catch {

        throw new Error(
            "Invalid Cloudinary signature response."
        );

    }


    if (
        data.success === false
    ) {

        throw new Error(
            data.error ||
            "Cloudinary signature error."
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
                    function (
                        event
                    ) {

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


            } catch (
                error
            ) {

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

    let lastError;


    for (
        let attempt = 1;
        attempt <= MAX_RETRIES;
        attempt++
    ) {

        try {

            const response =
                await fetch(
                    BACKBLAZE_FUNCTION_URL,
                    {

                        method:
                            "POST",

                        headers:
                            {

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
                    `🔄 Connection retry... ${attempt}/${MAX_RETRIES}`
                );


                await sleep(
                    1500 * attempt
                );

            }

        }

    }


    throw (
        lastError ||
        new Error(
            "Backblaze request failed."
        )
    );

}


// =====================================================
// START BACKBLAZE UPLOAD
// =====================================================

async function startBackblazeUpload(
    file
) {

    const safeName =
        file.name
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


    const formData =
        new FormData();


    formData.append(
        "action",
        "start"
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
// UPLOAD BACKBLAZE PART
// =====================================================

async function uploadBackblazePart(
    fileId,
    partNumber,
    chunk
) {

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
        String(
            partNumber
        )
    );


    formData.append(
        "file",
        chunk,
        `part-${partNumber}`
    );


    return await backblazeRequest(
        formData
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
// UPLOAD VIDEO
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
    // SHA ARRAY
    // =================================================

    const sha1Array =
        new Array(
            totalParts
        );


    // =================================================
    // PART STATE
    // =================================================

    const partState =
        new Array(
            totalParts
        ).fill(
            "waiting"
        );


    let uploadedBytes =
        0;


    // =================================================
    // WORKER
    // =================================================

    async function worker() {

        while (true) {

            let index =
                -1;


            for (
                let i = 0;
                i < totalParts;
                i++
            ) {

                if (
                    partState[i] ===
                    "waiting"
                ) {

                    partState[i] =
                        "uploading";

                    index =
                        i;

                    break;

                }

            }


            if (
                index === -1
            ) {

                return;

            }


            const partNumber =
                index + 1;


            const start =
                index *
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


            try {

                let result =
                    null;


                let lastError;


                for (
                    let attempt = 1;
                    attempt <= MAX_RETRIES;
                    attempt++
                ) {

                    try {

                        result =
                            await uploadBackblazePart(
                                fileId,
                                partNumber,
                                chunk
                            );


                        break;

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
                                `🔄 Part ${partNumber} retry ${attempt}/${MAX_RETRIES}...`
                            );


                            await sleep(
                                1500 * attempt
                            );

                        }

                    }

                }


                if (
                    !result ||
                    !result.sha1
                ) {

                    throw (
                        lastError ||
                        new Error(
                            `Part ${partNumber} failed.`
                        )
                    );

                }


                sha1Array[index] =
                    result.sha1;


                partState[index] =
                    "done";


                uploadedBytes +=
                    chunk.size;


                const percent =
                    Math.round(
                        (
                            uploadedBytes /
                            totalSize
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
                        totalSize /
                        1024 /
                        1024
                    ).toFixed(
                        1
                    );


                updateStatus(
                    `🎬 Uploading Movie... ${percent}% (${uploadedMB} MB / ${totalMB} MB)`
                );


            } catch (
                error
            ) {

                partState[index] =
                    "waiting";


                throw error;

            }

        }

    }


    // =================================================
    // PARALLEL WORKERS
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
    // CHECK SHA
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
                `SHA-1 missing for part ${i + 1}.`
            );

        }

    }


    // =================================================
    // FINISH
    // =================================================

    updateStatus(
        "☁️ Finalizing Movie..."
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

async function saveMovie() {

    const status =
        getStatus();


    const saveButton =
        document.getElementById(
            "saveMovieButton"
        );


    console.log(
        "SAVE MOVIE STARTED"
    );


    // =================================================
    // FORM
    // =================================================

    const movieNameElement =
        document.getElementById(
            "movieName"
        );


    const descriptionElement =
        document.getElementById(
            "movieDescription"
        );


    const posterElement =
        document.getElementById(
            "moviePoster"
        );


    const videoElement =
        document.getElementById(
            "movieVideo"
        );


    const categoryElement =
        document.getElementById(
            "movieCategory"
        );


    const yearElement =
        document.getElementById(
            "movieYear"
        );


    if (
        !movieNameElement ||
        !descriptionElement ||
        !posterElement ||
        !videoElement ||
        !categoryElement ||
        !yearElement
    ) {

        throw new Error(
            "Movie form elements not found."
        );

    }


    const title =
        movieNameElement
            .value
            .trim();


    const description =
        descriptionElement
            .value
            .trim();


    const posterFile =
        posterElement
            .files[0];


    const videoFile =
        videoElement
            .files[0];


    const category =
        categoryElement
            .value;


    const year =
        yearElement
            .value;


    // =================================================
    // VALIDATION
    // =================================================

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


    // =================================================
    // DISABLE BUTTON
    // =================================================

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


        if (
            !posterUrl
        ) {

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


        if (
            !videoUrl
        ) {

            throw new Error(
                "Video URL not received."
            );

        }


        // =================================================
        // SUPABASE
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
                .insert(
                    [

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

                    ]
                )
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
                .insert(
                    [

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

                    ]
                );


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
        // CLEAR
        // =================================================

        movieNameElement
            .value = "";


        descriptionElement
            .value = "";


        posterElement
            .value = "";


        videoElement
            .value = "";


        categoryElement
            .selectedIndex = 0;


        yearElement
            .value = "";


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
                error &&
                error.message
                    ? error.message
                    : String(
                        error
                    )
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

}


// =====================================================
// BUTTON INITIALIZATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const saveButton =
            document.getElementById(
                "saveMovieButton"
            );


        if (
            !saveButton
        ) {

            console.error(
                "UPLOAD BUTTON NOT FOUND"
            );

            return;

        }


        console.log(
            "UPLOAD BUTTON READY"
        );


        saveButton.addEventListener(
            "click",
            function () {

                console.log(
                    "UPLOAD BUTTON CLICKED"
                );


                saveMovie();

            }
        );

    }
);


// =====================================================
// JS LOADED
// =====================================================

console.log(
    "ADD MOVIE JS LOADED"
);
