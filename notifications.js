import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

// ===============================
// TIME AGO
// ===============================
function getTimeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return minutes + " min ago";
    if (hours < 24) return hours + " hr ago";
    if (days === 1) return "Yesterday";
    if (days < 7) return days + " days ago";

    return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// ===============================
// LOAD NOTIFICATIONS
// ===============================
async function loadNotifications() {
    const container = document.getElementById("notificationContainer");
    const noNotification = document.getElementById("noNotification");

    if (!container) return;
    container.innerHTML = "";

    try {
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            if (noNotification) noNotification.style.display = "block";
            return;
        }

        if (noNotification) noNotification.style.display = "none";

        data.forEach(notification => {
            const card = document.createElement("div");
            
            // unseen class check
            card.className = "notification-card " + (notification.is_read ? "" : "unseen");

            const date = getTimeAgo(notification.created_at);
            const poster = notification.poster_url || "logo-192.png";

            card.innerHTML = `
                <img src="${poster}" alt="Poster">
                <div class="notification-info">
                    <div class="notification-title">
                        ${notification.title}
                    </div>
                    <div class="notification-message">
                        🎬 ${notification.message}
                    </div>
                    <div class="notification-date">
                        📅 ${date}
                    </div>
                </div>
                <div class="notification-status">
                    ${notification.is_read ? "" : "New"}
                </div>
            `;

            // CLICK EVENT FIX
            card.onclick = async function () {
                const statusTag = card.querySelector(".notification-status");

                // 1. UI को तुरंत अपडेट करें
                card.classList.remove("unseen");
                if (statusTag) statusTag.innerText = "";

                // 2. Supabase में 'is_read' अपडेट करें
                if (!notification.is_read) {
                    try {
                        const { error: updateError } = await supabase
                            .from("notifications")
                            .update({ is_read: true })
                            .eq("id", notification.id);

                        if (updateError) {
                            console.error("Supabase Update Error:", updateError);
                        }
                    } catch (err) {
                        console.error("Update Request Failed:", err);
                    }
                }

                // 3. अपडेट पूरा होने के बाद ही पेज रीडायरेक्ट करें
                if (notification.movie_id) {
                    window.location.href = "movie-details.html?id=" + notification.movie_id;
                }
            };

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Notification Fetch Error:", error);
    }
}

loadNotifications();
applyLanguage();
