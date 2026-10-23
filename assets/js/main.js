
const sections = [
    // "header",
    // "hero",
    // "about",
    // "skills",
    // "services",
    // "projects",
    // "experience",
    // "contact",
    "aside",
    "footer"
];

async function loadSection(name) {
    const container = document.getElementById(name);

    if (!container) return;

    try {
        const response = await fetch(`/sections/${name}.html`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        container.innerHTML = await response.text();

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
    await Promise.all(sections.map(loadSection));

    document.dispatchEvent(
        new Event("websiteLoaded")
    );
}

document.addEventListener("DOMContentLoaded", loadWebsite);
