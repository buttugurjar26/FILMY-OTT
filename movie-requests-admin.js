import { supabase } from "./supabase.js";

const requestsContainer =
    document.getElementById("requestsContainer");

async function loadMovieRequests() {

    requestsContainer.innerHTML = `
        <div class="loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading requests...
        </div>
    `;

    const { data, error } = await supabase
        .from("movie_requests")
        .select("*")
        .order("created_at", { ascending: false });


    if (error) {

        console.error(
            "Movie requests error:",
            error
        );

        requestsContainer.innerHTML = `
            <div class="loading">
                ❌ Unable to load movie requests.
            </div>
        `;

        return;
    }


    if (!data || data.length === 0) {

        requestsContainer.innerHTML = `
            <div class="loading">
                🎬 No movie requests found.
            </div>
        `;

        return;
    }


    requestsContainer.innerHTML = "";


    data.forEach((request) => {

        const card = document.createElement("div");

        card.className = "request-card";


        const status =
            request.status || "Pending";


        card.innerHTML = `

            <div class="request-card-header">

                <h2>
                    🎬 ${escapeHTML(
                        request.movie_name || "Unknown Movie"
                    )}
                </h2>

                <span class="
                    request-status
                    ${status.toLowerCase()}
                ">
                    ${escapeHTML(status)}
                </span>

            </div>


            <div class="request-info">

                <p>
                    <strong>👤 Actor / Actress:</strong>
                    ${escapeHTML(
                        request.cast_name || "Not provided"
                    )}
                </p>


                <p>
                    <strong>📝 Message:</strong>
                    ${escapeHTML(
                        request.message || "No message"
                    )}
                </p>


                <p>
                    <strong>📅 Date:</strong>
                    ${formatDate(request.created_at)}
                </p>

            </div>


            <div class="request-actions">

                <button
                    class="approve-btn"
                    onclick="updateRequestStatus(
                        '${request.id}',
                        'Approved'
                    )"
                >
                    ✅ Approve
                </button>


                <button
                    class="reject-btn"
                    onclick="updateRequestStatus(
                        '${request.id}',
                        'Rejected'
                    )"
                >
                    ❌ Reject
                </button>


                <button
                    class="delete-btn"
                    onclick="deleteMovieRequest(
                        '${request.id}'
                    )"
                >
                    🗑️ Delete
                </button>

            </div>

        `;


        requestsContainer.appendChild(card);

    });

}


/* =========================================
   UPDATE STATUS
========================================= */

window.updateRequestStatus = async function (
    id,
    status
) {

    const { error } = await supabase
        .from("movie_requests")
        .update({
            status: status
        })
        .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "❌ Status update nahi ho saka."
        );

        return;
    }


    alert(
        `✅ Request marked as ${status}.`
    );


    loadMovieRequests();

};


/* =========================================
   DELETE REQUEST
========================================= */

window.deleteMovieRequest = async function (
    id
) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this request?"
        );


    if (!confirmDelete) {

        return;
    }


    const { error } = await supabase
        .from("movie_requests")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "❌ Request delete nahi ho saki."
        );

        return;
    }


    alert(
        "✅ Movie request deleted."
    );


    loadMovieRequests();

};


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   DATE
========================================= */

function formatDate(date) {

    if (!date) {

        return "Unknown";

    }


    return new Date(date)
        .toLocaleString();
}


/* =========================================
   LOAD
========================================= */

loadMovieRequests();
