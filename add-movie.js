import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

const B2_KEY_ID =
  Deno.env.get("BACKBLAZE_KEY_ID");

const B2_APPLICATION_KEY =
  Deno.env.get("BACKBLAZE_APPLICATION_KEY");

const B2_BUCKET_NAME =
  Deno.env.get("BACKBLAZE_BUCKET_NAME");


// =====================================================
// SHA-1
// =====================================================

async function sha1Hex(
  data: Uint8Array
) {
  const hash =
    await crypto.subtle.digest(
      "SHA-1",
      data
    );

  return Array.from(
    new Uint8Array(hash)
  )
    .map(
      (b) =>
        b.toString(16).padStart(2, "0")
    )
    .join("");
}


// =====================================================
// BACKBLAZE AUTH
// =====================================================

async function authorizeB2() {

  if (
    !B2_KEY_ID ||
    !B2_APPLICATION_KEY
  ) {
    throw new Error(
      "Backblaze secrets are missing."
    );
  }

  const credentials =
    btoa(
      `${B2_KEY_ID}:${B2_APPLICATION_KEY}`
    );

  const response =
    await fetch(
      "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
      {
        method: "GET",

        headers: {
          Authorization:
            `Basic ${credentials}`,
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      "Backblaze authorization failed: " +
      await response.text()
    );
  }

  return await response.json();
}


// =====================================================
// GET BUCKET ID
// =====================================================

async function getBucketId(
  auth: any
) {

  const response =
    await fetch(
      `${auth.apiUrl}/b2api/v2/b2_list_buckets`,
      {
        method: "POST",

        headers: {
          Authorization:
            auth.authorizationToken,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          accountId:
            auth.accountId,

          bucketName:
            B2_BUCKET_NAME,
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to find Backblaze bucket: " +
      await response.text()
    );
  }

  const data =
    await response.json();

  if (
    !data.buckets ||
    data.buckets.length === 0
  ) {
    throw new Error(
      `Bucket "${B2_BUCKET_NAME}" not found.`
    );
  }

  return data.buckets[0].bucketId;
}


// =====================================================
// START LARGE FILE
// =====================================================

async function startLargeFile(
  auth: any,
  fileName: string,
  contentType: string
) {

  const bucketId =
    await getBucketId(auth);

  const response =
    await fetch(
      `${auth.apiUrl}/b2api/v2/b2_start_large_file`,
      {
        method: "POST",

        headers: {
          Authorization:
            auth.authorizationToken,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          bucketId:
            bucketId,

          fileName:
            fileName,

          contentType:
            contentType,
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to start large file: " +
      await response.text()
    );
  }

  return await response.json();
}


// =====================================================
// GET UPLOAD PART URL
// =====================================================

async function getUploadPartUrl(
  auth: any,
  fileId: string
) {

  const response =
    await fetch(
      `${auth.apiUrl}/b2api/v2/b2_get_upload_part_url`,
      {
        method: "POST",

        headers: {
          Authorization:
            auth.authorizationToken,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          fileId:
            fileId,
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to get upload part URL: " +
      await response.text()
    );
  }

  return await response.json();
}


// =====================================================
// UPLOAD PART
// =====================================================

async function uploadPart(
  uploadUrl: string,
  authorizationToken: string,
  fileId: string,
  partNumber: number,
  chunk: Uint8Array
) {

  const sha1 =
    await sha1Hex(chunk);

  const response =
    await fetch(
      uploadUrl,
      {
        method: "POST",

        headers: {
          Authorization:
            authorizationToken,

          "X-Bz-Part-Number":
            String(partNumber),

          "X-Bz-Content-Sha1":
            sha1,

          "Content-Length":
            String(chunk.byteLength),
        },

        body:
          chunk,
      }
    );

  if (!response.ok) {
    throw new Error(
      "Backblaze part upload failed: " +
      await response.text()
    );
  }

  return {
    result:
      await response.json(),

    sha1:
      sha1,
  };
}


// =====================================================
// FINISH LARGE FILE
// =====================================================

async function finishLargeFile(
  auth: any,
  fileId: string,
  sha1Array: string[]
) {

  const response =
    await fetch(
      `${auth.apiUrl}/b2api/v2/b2_finish_large_file`,
      {
        method: "POST",

        headers: {
          Authorization:
            auth.authorizationToken,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          fileId:
            fileId,

          partSha1Array:
            sha1Array,
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to finish large file: " +
      await response.text()
    );
  }

  return await response.json();
}


// =====================================================
// SERVER
// =====================================================

serve(
  async (request) => {

    if (
      request.method === "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          status: 200,
          headers:
            corsHeaders,
        }
      );
    }


    if (
      request.method !== "POST"
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Only POST is allowed.",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }


    try {

      const formData =
        await request.formData();

      const action =
        String(
          formData.get("action") || ""
        );


      // =================================================
      // AUTH
      // =================================================

      const auth =
        await authorizeB2();


      // =================================================
      // START
      // =================================================

      if (
        action === "start"
      ) {

        const fileName =
          String(
            formData.get("fileName") ||
            `movies/${Date.now()}`
          );

        const contentType =
          String(
            formData.get("contentType") ||
            "application/octet-stream"
          );

        const result =
          await startLargeFile(
            auth,
            fileName,
            contentType
          );

        return new Response(
          JSON.stringify({
            success: true,

            fileId:
              result.fileId,

            fileName:
              result.fileName,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }


      // =================================================
      // PART
      // =================================================

      if (
        action === "part"
      ) {

        const fileId =
          String(
            formData.get("fileId") || ""
          );

        const partNumber =
          Number(
            formData.get("partNumber")
          );

        const file =
          formData.get("file");


        if (
          !fileId ||
          !partNumber ||
          !(file instanceof File)
        ) {
          throw new Error(
            "Missing part upload data."
          );
        }


        const uploadInfo =
          await getUploadPartUrl(
            auth,
            fileId
          );


        const chunk =
          new Uint8Array(
            await file.arrayBuffer()
          );


        const uploaded =
          await uploadPart(
            uploadInfo.uploadUrl,
            uploadInfo.authorizationToken,
            fileId,
            partNumber,
            chunk
          );


        return new Response(
          JSON.stringify({
            success: true,

            partNumber:
              partNumber,

            sha1:
              uploaded.sha1,

            fileId:
              fileId,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }


      // =================================================
      // FINISH
      // =================================================

      if (
        action === "finish"
      ) {

        const fileId =
          String(
            formData.get("fileId") || ""
          );

        const sha1JSON =
          String(
            formData.get("sha1Array") || "[]"
          );

        const sha1Array =
          JSON.parse(
            sha1JSON
          );


        if (
          !fileId ||
          !Array.isArray(
            sha1Array
          ) ||
          sha1Array.length === 0
        ) {
          throw new Error(
            "Missing finish data."
          );
        }


        const result =
          await finishLargeFile(
            auth,
            fileId,
            sha1Array
          );


        const downloadUrl =
          `${auth.downloadUrl}/file/${encodeURIComponent(
            B2_BUCKET_NAME!
          )}/${encodeURIComponent(
            result.fileName
          )}`;


        return new Response(
          JSON.stringify({
            success: true,

            fileId:
              result.fileId,

            fileName:
              result.fileName,

            url:
              downloadUrl,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }


      throw new Error(
        "Invalid action."
      );


    } catch (error) {

      console.error(
        "BACKBLAZE ERROR:",
        error
      );


      return new Response(
        JSON.stringify({
          success: false,

          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        }),
        {
          status: 500,

          headers: {
            ...corsHeaders,

            "Content-Type":
              "application/json",
          },
        }
      );
    }
  }
);
