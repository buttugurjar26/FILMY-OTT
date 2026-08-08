import { supabase } from "./supabase.js";

const newsForm = document.getElementById("newsForm");
const newsList = document.getElementById("newsList");
const newsStatus = document.getElementById("newsStatus");

let editNewsId = null;


// ===============================
// SAVE / UPDATE
// ===============================

newsForm.addEventListener("submit", async (e)=>{

    e.preventDefault();

    const title =
    document.getElementById("newsTitle").value.trim();

    const type =
    document.getElementById("newsType").value;

    const description =
    document.getElementById("newsDescription").value.trim();

    if(title==="" || description===""){

        newsStatus.innerHTML="❌ Fill all fields.";

        return;

    }

    try{

        if(editNewsId===null){

            const { error } = await supabase
            .from("news")
            .insert([{

                title,
                type,
                description

            }]);

            if(error) throw error;

            newsStatus.innerHTML =
            "✅ News Added Successfully.";

        }

        else{

            const { error } = await supabase
            .from("news")
            .update({

                title,
                type,
                description

            })
            .eq("id",editNewsId);

            if(error) throw error;

            newsStatus.innerHTML =
            "✅ News Updated Successfully.";

            editNewsId = null;

            document.querySelector(".save-btn").innerHTML =
            '<i class="fas fa-save"></i> Save News';

        }

        newsForm.reset();

        loadNews();

    }

    catch(error){

        console.log(error);

        newsStatus.innerHTML =
        "❌ "+error.message;

    }

});


// ===============================
// LOAD NEWS
// ===============================

async function loadNews(){

    newsList.innerHTML="Loading...";

    const { data,error } = await supabase

    .from("news")

    .select("*")

    .order("created_at",{ascending:false});

  

    if(error){

        newsList.innerHTML="Failed to load.";

        return;

    }

    newsList.innerHTML="";

    if(data.length===0){

        newsList.innerHTML="<p>No News Available.</p>";

        return;

    }

    data.forEach(item=>{

        newsList.innerHTML += `

        <div class="news-card">

            <h3>${item.title}</h3>

            <small>${item.type}</small>

            <p>${item.description}</p>

            <div class="card-actions">

                <button
                class="edit-btn"
                onclick="editNews(${item.id})">

                Edit

                </button>

                <button
                class="delete-btn"
                onclick="deleteNews(${item.id})">

                Delete

                </button>

            </div>

        </div>

        `;

    });

}

loadNews();


// ===============================
// DELETE
// ===============================

window.deleteNews = async(id)=>{

    if(!confirm("Delete this news?")) return;

    const { error } = await supabase

    .from("news")

    .delete()

    .eq("id",id);

    if(error){

        alert(error.message);

        return;

    }

    loadNews();

};


// ===============================
// EDIT
// ===============================

window.editNews = async(id)=>{

    const { data,error } = await supabase

    .from("news")

    .select("*")

    .eq("id",id)

    .single();

    if(error){

        alert(error.message);

        return;

    }

    editNewsId=id;

    document.getElementById("newsTitle").value =
    data.title;

    document.getElementById("newsType").value =
    data.type;

    document.getElementById("newsDescription").value =
    data.description;

    document.querySelector(".save-btn").innerHTML =
    '<i class="fas fa-edit"></i> Update News';

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

};