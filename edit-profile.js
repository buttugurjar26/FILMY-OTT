import { applyLanguage } from "./language.js";

/* FILMY OTT - EDIT PROFILE JS */


const avatars = document.querySelectorAll(".avatar");

const currentAvatar = document.getElementById("currentAvatar");

const userName = document.getElementById("userName");

const userContact = document.getElementById("userContact");

const saveProfile = document.getElementById("saveProfile");



// Load Login User Data

const loginName = localStorage.getItem("userName");

const loginEmail = localStorage.getItem("userEmail");


// Show Existing Name

if(loginName && userName){

    userName.value = loginName;

}


// Show Login Email (Cannot Change)

if(loginEmail && userContact){

    userContact.value = loginEmail;

}



// Load Saved Avatar

const savedAvatar = localStorage.getItem("userAvatar");


if(savedAvatar && currentAvatar){

    currentAvatar.src = savedAvatar;

}



// Avatar Change

avatars.forEach((avatar)=>{


    avatar.addEventListener("click",()=>{


        avatars.forEach(item=>{

            item.classList.remove("active");

        });


        avatar.classList.add("active");


        let img = avatar.querySelector("img");


        if(img){

            currentAvatar.src = img.src;

        }


    });


});




// Save Profile

saveProfile.addEventListener("click",()=>{


    // Name Update

    localStorage.setItem(
        "userName",
        userName.value
    );



    // Avatar Update

    localStorage.setItem(
        "userAvatar",
        currentAvatar.src
    );



    alert("Profile Saved Successfully");


});

applyLanguage();