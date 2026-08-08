import { supabase } from "./supabase.js";
import { applyLanguage } from "./language.js";


let selectedRating = 0;

const stars = document.querySelectorAll(".star");
const ratingText = document.getElementById("ratingText");


// ===============================
// STAR RATING
// ===============================

stars.forEach(star=>{

    star.addEventListener("click",()=>{

        selectedRating = Number(
            star.dataset.rating
        );

        stars.forEach(s=>{

            if(
                Number(s.dataset.rating)
                <= selectedRating
            ){

                s.classList.remove("fa-regular");
                s.classList.add("fa-solid");
                s.classList.add("active");

            }

            else{

                s.classList.remove("fa-solid");
                s.classList.add("fa-regular");
                s.classList.remove("active");

            }

        });

        ratingText.innerHTML =
        "Your Rating : ⭐ " + selectedRating + "/5";

    });

});


// ===============================
// SUBMIT REVIEW
// ===============================

document
.getElementById("submitReview")
.addEventListener("click", submitReview);


async function submitReview(){

    const status =
    document.getElementById("reviewStatus");

    const title =
    document.getElementById("reviewTitle")
    .value.trim();

    const review =
    document.getElementById("reviewMessage")
    .value.trim();


    if(selectedRating===0){

        status.innerHTML =
        "❌ Please select a rating.";

        return;

    }


    if(review===""){

        status.innerHTML =
        "❌ Please write your review.";

        return;

    }


    status.innerHTML =
    "⏳ Submitting Review...";


    const { error } =
    await supabase
    .from("app_reviews")
    .insert([

        {

            rating:selectedRating,

            title:title,

            review:review

        }

    ]);


    if(error){

        console.log(error);

        status.innerHTML =
        "❌ " + error.message;

        return;

    }


    status.innerHTML =
    "✅ Thank you for your feedback!";


    document
    .getElementById("reviewTitle")
    .value="";

    document
    .getElementById("reviewMessage")
    .value="";


    selectedRating = 0;

    ratingText.innerHTML =
    "Tap a star to rate.";


    stars.forEach(star=>{

        star.classList.remove("fa-solid");
        star.classList.add("fa-regular");
        star.classList.remove("active");

    });

}

applyLanguage();