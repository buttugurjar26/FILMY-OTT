import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";

async function loadNews() {

    const newsList = document.getElementById("newsList");

    newsList.innerHTML = "<p>Loading News...</p>";

    const { data, error } = await supabase
.from("news")
.select("*")
.order("created_at", { ascending: false });

    if (error) {
        newsList.innerHTML = "<p>❌ Failed to Load News.</p>";
        return;
    }

    if (!data || data.length === 0) {
        newsList.innerHTML = "<p>No News Available.</p>";
        return;
    }

    newsList.innerHTML = "";

    data.forEach(item => {

        newsList.innerHTML += `
        <div class="news-card">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <span class="news-date">
                📅 ${new Date(item.created_at).toLocaleDateString()}
            </span>
        </div>
        `;

    });

}

loadNews().then(() => {
    applyLanguage();
});