// ===============================
// FILMY OTT LANGUAGE SYSTEM
// ===============================

import en from "./languages/en.js";

const languages = {

    en: en

};

// DEFAULT LANGUAGE

let currentLanguage =
localStorage.getItem("language") || "en";




// CHANGE LANGUAGE

export function changeLanguage(lang){

    if(languages[lang]){

        localStorage.setItem("language", lang);

        currentLanguage = lang;

        applyLanguage();

    }

}





// GET TEXT

export function t(key){

    return languages[currentLanguage]?.[key] || key;

}





// APPLY LANGUAGE

export function applyLanguage(){

    document.querySelectorAll("[data-lang]")
    .forEach(element=>{


        const key =
        element.getAttribute("data-lang");


        if (element.tagName === "INPUT") {

    element.placeholder = t(key);

} else if (element.tagName === "TEXTAREA") {

    element.placeholder = t(key);

} else {

    element.innerHTML = t(key);

}


    });

}





// AUTO LOAD

document.addEventListener(
"DOMContentLoaded",
()=>{

    applyLanguage();

});
