(() => {
    "use strict";

    const START_YEAR = 2025;
    const CURRENT_YEAR = new Date().getFullYear();

    const YEAR_FORMATS = {
        full: `${START_YEAR}–${CURRENT_YEAR}`,
        short: `${START_YEAR}–${String(CURRENT_YEAR).slice(-2)}`,
        single: `${CURRENT_YEAR}`,
        since: `Since ${START_YEAR}`
    };

    function updateFooterYear() {
        document.querySelectorAll("[data-year-format]").forEach(element => {
            const format = element.dataset.yearFormat || "full";
            element.textContent = YEAR_FORMATS[format] || YEAR_FORMATS.full;
        });
    }

    document.addEventListener("DOMContentLoaded", updateFooterYear);

    document.addEventListener("sectionLoaded", event => {
        if (event.detail?.name === "footer") {
            updateFooterYear();
        }
    });

    document.addEventListener("websiteLoaded", updateFooterYear);

    if (document.readyState !== "loading") {
        updateFooterYear();
    }
})();