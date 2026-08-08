import { supabase } from "./supabase.js";

// ===============================
// CLOUDINARY
// ===============================

const CLOUD_NAME = "peni6puh";
const UPLOAD_PRESET = "filmy-ott";

// ===============================
// ADMIN LOGIN CHECK
// ===============================

if (
    localStorage.getItem("adminLoggedIn") !== "true" ||
    localStorage.getItem("isAdmin") !== "true"
) {
    window.location.href = "admin-login.html";
}

// ===============================
// CLOUDINARY UPLOAD
// ===============================

async function uploadFile(file){

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        {
            method:"POST",
            body:formData
        }
    );

    const data = await response.json();

    if(!data.secure_url){
        throw new Error("Banner Upload Failed");
    }

    return data.secure_url;

}

// ===============================
// UPLOAD BANNER
// ===============================

document.getElementById("uploadBanner").onclick = async function(){

    const file =
    document.getElementById("bannerFile").files[0];

    if(!file){

        alert("Please Select Banner");

        return;

    }

    try{

        const imageUrl =
        await uploadFile(file);

        const { error } =
        await supabase
        .from("banners")
        .insert([
            {
                image_url:imageUrl,
                title:"Home Banner",
                subtitle:"",
                is_active:true
            }
        ]);

        if(error){

            throw error;

        }

        alert("✅ Banner Uploaded Successfully");

        document.getElementById("bannerFile").value="";

        loadBanners();

    }

    catch(error){

        console.log(error);

        alert("❌ "+error.message);

    }

};

// ===============================
// LOAD BANNERS
// ===============================

async function loadBanners(){

    try{

        const { data: banners, error } = await supabase
        .from("banners")
        .select("*")
        .order("created_at",{ascending:false});

        if(error){

            throw error;

        }

        const bannerList =
        document.getElementById("bannerList");

        bannerList.innerHTML = "";

        if(!banners || banners.length===0){

            bannerList.innerHTML =
            "<h3>No Banner Found</h3>";

            return;

        }

        banners.forEach((banner)=>{

            bannerList.innerHTML += `

            <div class="banner-card">

                <img src="${banner.image_url}">

                <div style="padding:12px;">

                    <h3>
                    ${banner.title || "Home Banner"}
                    </h3>

                    <p style="margin:8px 0;">
Status :
<b style="color:${
    banner.is_active ? "green" : "red"
};">
${
    banner.is_active
    ? "Active"
    : "Inactive"
}
</b>
</p>

<button
onclick="toggleBannerStatus('${banner.id}', ${banner.is_active})"
style="width:100%;margin-bottom:10px;background:#D4AF37;color:#fff;border:none;padding:10px;border-radius:10px;">

${banner.is_active ? "Deactivate" : "Activate"}

</button>

<button
onclick="deleteBanner('${banner.id}')">

🗑 Delete

</button>

                </div>

            </div>

            `;

        });

    }

    catch(error){

        console.log(error);

        document.getElementById("bannerList").innerHTML =
        "❌ Failed to Load Banners";

    }

}



// ===============================
// INITIAL LOAD
// ===============================

loadBanners();

// ===============================
// DELETE BANNER
// ===============================

window.deleteBanner = async function(id){

    const confirmDelete =
    confirm("Delete this banner?");

    if(!confirmDelete){

        return;

    }

    try{

        const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", id);

        if(error){

            throw error;

        }

        alert("✅ Banner Deleted");

        loadBanners();

    }

    catch(error){

        console.log(error);

        alert("❌ " + error.message);

    }

};



// ===============================
// TOGGLE ACTIVE / INACTIVE
// ===============================

window.toggleBannerStatus = async function(id,currentStatus){

    try{

        const { error } = await supabase
        .from("banners")
        .update({
            is_active: !currentStatus
        })
        .eq("id", id);

        if(error){

            throw error;

        }

        loadBanners();

    }

    catch(error){

        console.log(error);

        alert("❌ " + error.message);

    }

};