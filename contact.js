import { applyLanguage } from "./language.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. RequestAnimationFrame Ensures Layout Painting is Complete Before Script Runs
    requestAnimationFrame(() => {
        try {
            applyLanguage();
        } catch (error) {
            console.error("Language script error:", error);
        }
    });
});
