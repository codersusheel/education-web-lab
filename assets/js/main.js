
/* ==========================================
   MODULAR WEBSITE SECTION LOADER
========================================== */

const sections = [
    "header",
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

async function loadSection(name) {

    const containerId =
        name === "header" ? "header-container" : name;

    const container = document.getElementById(containerId);

    if (!container) {
        console.warn("Container not found:", containerId);
        return;
    }

    try {

        const response = await fetch(`/sections/${name}.html`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        container.innerHTML = await response.text();

        /* HEADER JS INITIALIZATION */

        if (name === "header") {

            if (typeof window.initHeader === "function") {

                window.initHeader();

                console.log("Header JS initialized");

            } else {

                console.error("Header initHeader function not found");

            }
        }

        document.dispatchEvent(
            new CustomEvent("sectionLoaded", {
                detail: { name, container }
            })
        );

    } catch (error) {

        console.error(`Failed to load ${name}:`, error);

    }
}

async function loadWebsite() {

    await Promise.all(
        sections.map(loadSection)
    );

    document.dispatchEvent(
        new Event("websiteLoaded")
    );
}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        loadWebsite
    );

} else {

    loadWebsite();

}
