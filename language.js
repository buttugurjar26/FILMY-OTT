// ===============================
// FILMY OTT LANGUAGE SYSTEM
// ===============================

import en from "./en.js";
import hi from "./hi.js";
import kn from "./kn.js";
import ml from "./ml.js";
import ta from "./ta.js";
import te from "./te.js";

const languages = {

    en: en,
    hi: hi,
    kn: kn,
    ml: ml,
    ta: ta,
    te: te

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
    .forEach(element => {

        const key =
            element.getAttribute("data-lang");

        if(element.tagName === "INPUT"){

            element.placeholder = t(key);

        }
        else if(element.tagName === "TEXTAREA"){

            element.placeholder = t(key);

        }
        else{

            element.innerHTML = t(key);

        }

    });

}


// AUTO LOAD

document.addEventListener(
    "DOMContentLoaded",
    () => {

        applyLanguage();

    }
);
