
// /* ==========================================
//    MODULAR WEBSITE SECTION LOADER
// ========================================== */

// const sections = [
//     "header",
//     "hero",
//     "about",
//     "skills",
//     "services",
//     "projects",
//     "experience",
//     "contact",
//     "aside",
//     "footer"
// ];

// async function loadSection(name) {

//     const containerId =
//         name === "header" ? "header-container" : name;

//     const container = document.getElementById(containerId);

//     if (!container) {
//         console.warn("Container not found:", containerId);
//         return;
//     }

//     try {

       
//         const response = await fetch(`/sections/${name}.html`);

//         if (!response.ok) {
//             throw new Error(`HTTP ${response.status}`);
//         }

//         container.innerHTML = await response.text();

//         /* HEADER JS INITIALIZATION */

//         if (name === "header") {

//             if (typeof window.initHeader === "function") {

//                 window.initHeader();

//                 console.log("Header JS initialized");

//             } else {

//                 console.error("Header initHeader function not found");

//             }
//         }

//         document.dispatchEvent(
//             new CustomEvent("sectionLoaded", {
//                 detail: { name, container }
//             })
//         );

//     } catch (error) {

//         console.error(`Failed to load ${name}:`, error);

//     }
// }

// async function loadWebsite() {

//     await Promise.all(
//         sections.map(loadSection)
//     );

//     document.dispatchEvent(
//         new Event("websiteLoaded")
//     );
// }

// if (document.readyState === "loading") {

//     document.addEventListener(
//         "DOMContentLoaded",
//         loadWebsite
//     );

// } else {

//     loadWebsite();

// }


// https://ha-web-tool.netlify.app/header agar mujhe alag jahga se lana hai to










/* ==========================================
   MODULAR WEBSITE SECTION LOADER
   EXTERNAL HEADER VIA NETLIFY PROXY
========================================== */

const sections = [
    // "header",
    "hero",
    "about",
    "skills",
    "services",
    "projects",
    "experience",
    "contact",
    "aside",
    "footer"
];

/* ==========================================
   EXTERNAL SECTION CONFIGURATION
========================================== */

const externalSections = {

    // Netlify proxy -> external website
    header: "https://ha-web-tool.netlify.app/sections/header.html"

};

/* ==========================================
   LOAD SINGLE SECTION
========================================== */

async function loadSection(name) {

    const containerId =
        name === "header" ? "header-container" : name;

    const container = document.getElementById(containerId);

    if (!container) {
        console.warn("Container not found:", containerId);
        return false;
    }

    try {

        /* ==================================
           INTERNAL OR EXTERNAL URL
        ================================== */

        const url =
            externalSections[name] ||
            `/sections/${name}.html`;

        console.log("Loading section:", name, url);

        /* ==================================
           FETCH HTML
        ================================== */

        const response = await fetch(url, {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        if (!html.trim()) {
            throw new Error("Empty HTML response");
        }

        /* ==================================
           VALIDATE EXTERNAL HEADER
        ================================== */

        if (name === "header") {

            const doc = new DOMParser().parseFromString(
                html,
                "text/html"
            );

            if (!doc.querySelector("header")) {
                throw new Error(
                    "External response does not contain a header element"
                );
            }
        }

        /* ==================================
           INSERT SECTION
        ================================== */

        container.innerHTML = html;

        /* ==================================
           HEADER JS INITIALIZATION
        ================================== */

        if (name === "header") {

            if (typeof window.initHeader === "function") {

                await window.initHeader();

                console.log("Header JS initialized");

            } else {

                console.warn(
                    "Header HTML loaded, but initHeader() is missing"
                );
            }
        }

        /* ==================================
           SECTION LOADED EVENT
        ================================== */

        document.dispatchEvent(
            new CustomEvent("sectionLoaded", {
                detail: {
                    name,
                    container,
                    url
                }
            })
        );

        console.log("Section loaded:", name);

        return true;

    } catch (error) {

        console.error(
            `Failed to load ${name}:`,
            error
        );

        return false;
    }
}

/* ==========================================
   LOAD COMPLETE WEBSITE
========================================== */

async function loadWebsite() {

    const results = await Promise.all(
        sections.map(loadSection)
    );

    console.log(
        "Loaded sections:",
        results.filter(Boolean).length,
        "/",
        sections.length
    );

    document.dispatchEvent(
        new Event("websiteLoaded")
    );
}

/* ==========================================
   INITIALIZATION
========================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        loadWebsite,
        { once: true }
    );

} else {

    loadWebsite();
}
