
/* ============================================================
   HAPROVEN HEADER & WEBSITE UTILITIES
   Dynamic Section Loader Compatible
   Original Features Preserved
   Version: 4.0
============================================================ */

(() => {
    "use strict";

    /* ========================================================
       CONFIGURATION
    ======================================================== */

    const CONFIG = {
        socialJSON: "/Assets/json/side-link.json",
        favicon: "https://haprobase.netlify.app/external/img/logo/haproven.png",
        themeKey: "theme",
        languageKey: "lang",
        mobileBreakpoint: 1024,
        brandColor: "#bc1be7"
    };

    let currentHeader = null;
    let headerController = null;
    let lastScrollTop = window.scrollY || 0;

    let isHindi = readStorage(CONFIG.languageKey) === "hi";

    let currentSpeech = null;
    let selectedVoice = null;
    let audioButton = null;
    let speechSession = 0;

    const originalEnglish = new WeakMap();

    /* ========================================================
       STORAGE HELPERS
    ======================================================== */

    function readStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Storage may be unavailable.
        }
    }

    /* ========================================================
       AUTO COPYRIGHT YEAR
    ======================================================== */

    function updateYear() {
        document.querySelectorAll("#year").forEach(element => {
            element.textContent = new Date().getFullYear();
        });
    }

    /* ========================================================
       LIVE PAGE TITLE
    ======================================================== */

    function loadLivePage() {

        document.querySelectorAll("#liv-open-page").forEach(element => {

            const title = document.title.trim();

            element.textContent = `Now viewing: ${title}`;

            element.style.display = "-webkit-box";
            element.style.webkitBoxOrient = "vertical";
            element.style.webkitLineClamp = "2";
            element.style.overflow = "hidden";
            element.style.textOverflow = "ellipsis";
        });
    }

    /* ========================================================
       FAVICON
    ======================================================== */

    function initFavicon() {

        if (document.querySelector('link[rel~="icon"]')) {
            return;
        }

        const favicon = document.createElement("link");

        favicon.rel = "icon";
        favicon.type = "image/png";
        favicon.href = CONFIG.favicon;

        document.head.appendChild(favicon);
    }

    /* ========================================================
       HAPROVEN BRAND STYLES
    ======================================================== */

    function injectBrandStyles() {

        if (document.getElementById("haproven-brand-style")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "haproven-brand-style";

        style.textContent = `
            :root {
                --hap-purple: ${CONFIG.brandColor};
            }

            .haproven-brand {
                display: flex;
                align-items: center;
                width: max-content;
                font-family: Inter, system-ui, sans-serif;
                cursor: pointer;
                user-select: none;
                transition: transform .25s ease;
            }

            .haproven-brand:active {
                transform: scale(.96);
            }

            .haproven-icon {
                position: relative;
                width: 36px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: transform .3s ease;
            }

            .haproven-brand:hover .haproven-icon {
                transform: scale(1.04);
            }

            .shadow-layer {
                position: absolute;
                width: 33px;
                height: 45px;
                top: -2px;
                left: -2px;
                opacity: .35;
                background: linear-gradient(
                    135deg,
                    var(--hap-purple),
                    #ffffff55
                );
                clip-path: polygon(
                    0 0,
                    100% 0,
                    100% 100%,
                    50% 88%,
                    0 100%
                );
                border-radius: 6px 6px 0 0;
            }

            .main-bookmark {
                position: relative;
                width: 30px;
                height: 42px;
                background: linear-gradient(
                    135deg,
                    var(--hap-purple),
                    #d94dff
                );
                clip-path: polygon(
                    0 0,
                    100% 0,
                    100% 100%,
                    50% 88%,
                    0 100%
                );
                border-radius: 6px 6px 0 0;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
                box-shadow: 0 7px 16px rgba(188,27,231,.30);
            }

            .haproven-icon svg {
                width: 32px;
                height: 32px;
                margin-right: -4px;
                fill: none;
            }

            .path-line {
                stroke: #fff;
                stroke-width: 6;
                stroke-linecap: round;
                stroke-linejoin: round;
                stroke-dasharray: 260;
                stroke-dashoffset: 260;
                animation: hapDraw 2.8s ease-in-out infinite;
            }

            .brand-bar {
                min-height: 30px;
                padding: 2px 7px;
                display: flex;
                align-items: center;
                margin-left: -2px;
                border-radius: 0 8px 8px 0;
                border: 2px solid var(--hap-purple);
                border-left: none;
                backdrop-filter: blur(10px);
            }

            .brand-text {
                display: flex;
                flex-direction: column;
                line-height: 1;
            }

            .brand-text strong {
                font-size: 11px;
                font-weight: 900;
                letter-spacing: .25px;
            }

            .brand-text small {
                font-size: 8px;
                font-weight: 600;
                opacity: .7;
                margin-top: 2px;
                letter-spacing: .3px;
                text-transform: uppercase;
            }

            .haproven-brand:hover .main-bookmark {
                box-shadow:
                    0 0 18px rgba(188,27,231,.55),
                    0 7px 20px rgba(188,27,231,.25);
            }

            .haproven-brand.icon-only .brand-bar {
                display: none;
            }

            @keyframes hapDraw {
                0% {
                    stroke-dashoffset: 260;
                    opacity: .6;
                }
                50% {
                    stroke-dashoffset: 0;
                    opacity: 1;
                }
                100% {
                    stroke-dashoffset: -260;
                    opacity: .6;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .path-line {
                    animation: none;
                    stroke-dashoffset: 0;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ========================================================
       HAPROVEN ANIMATED LOGO
    ======================================================== */

    function initBrand(element) {

        if (element.dataset.brandReady === "true") {
            return;
        }

        const brandName =
            element.dataset.name || "Haproven";

        const parts = brandName.split(/\s+by\s+/i);

        const mainName = parts[0]?.trim() || "Haproven";
        const subName = parts.slice(1).join(" by ").trim();

        element.replaceChildren();

        const icon = document.createElement("div");
        icon.className = "haproven-icon";

        const shadow = document.createElement("div");
        shadow.className = "shadow-layer";

        const bookmark = document.createElement("div");
        bookmark.className = "main-bookmark";

        bookmark.innerHTML = `
            <svg viewBox="0 0 100 100"
                 xmlns="http://www.w3.org/2000/svg"
                 aria-hidden="true">
                <path class="path-line"
                    d="
                        M10 0 L10 70
                        A10 10 0 0 0 30 70
                        L30 20
                        A10 10 0 0 1 50 20
                        L50 70
                        A16 9 0 0 0 70 80
                        A13 20 0 0 1 80 94
                        L100 95
                    "
                />
            </svg>
        `;

        icon.append(shadow, bookmark);

        const bar = document.createElement("div");
        bar.className = "brand-bar";

        const text = document.createElement("span");
        text.className = "brand-text";

        const strong = document.createElement("strong");
        strong.textContent = mainName;

        text.appendChild(strong);

        if (subName) {
            const small = document.createElement("small");
            small.textContent = `by ${subName}`;
            text.appendChild(small);
        }

        bar.appendChild(text);
        element.append(icon, bar);

        element.dataset.brandReady = "true";
    }

    function startHaprovenLogo() {

        injectBrandStyles();

        document
            .querySelectorAll(".haproven-brand")
            .forEach(initBrand);
    }

    /* ========================================================
       HEADER SCROLL HIDE / SHOW
    ======================================================== */

    function handleHeaderScroll() {

        const header = document.getElementById("header");

        if (!header) return;

        const currentScroll = Math.max(
            0,
            window.scrollY || document.documentElement.scrollTop
        );

        if (currentScroll > lastScrollTop && currentScroll > 80) {
            header.classList.add("hide");
        } else if (currentScroll < lastScrollTop || currentScroll <= 10) {
            header.classList.remove("hide");
        }

        lastScrollTop = currentScroll;
    }

    /* ========================================================
       THEME SYSTEM
       Compatible with original .dark-mode CSS
    ======================================================== */

    function getPreferredTheme() {

        const saved = readStorage(CONFIG.themeKey);

        if (saved === "dark" || saved === "light") {
            return saved;
        }

        return window.matchMedia?.(
            "(prefers-color-scheme: dark)"
        ).matches ? "dark" : "light";
    }

    function updateThemeIcons() {

        const dark = document.body.classList.contains("dark-mode");

        document.querySelectorAll("#theme-toggle").forEach(button => {

            const sun = button.querySelector(".sun");
            const moon = button.querySelector(".moon");

            if (sun) {
                sun.style.display = dark ? "none" : "inline";
            }

            if (moon) {
                moon.style.display = dark ? "inline" : "none";
            }

            button.setAttribute(
                "aria-label",
                dark ? "Switch to light mode" : "Switch to dark mode"
            );
        });
    }

    function setTheme(mode) {

        const dark = mode === "dark";

        document.body.classList.toggle("dark-mode", dark);

        document.documentElement.classList.toggle("dark", dark);

        document.documentElement.setAttribute(
            "data-theme",
            dark ? "dark" : "light"
        );

        writeStorage(
            CONFIG.themeKey,
            dark ? "dark" : "light"
        );

        updateThemeIcons();
    }

    function toggleTheme() {

        const dark = document.body.classList.contains("dark-mode");

        setTheme(dark ? "light" : "dark");
    }

    /* ========================================================
       HINDI / ENGLISH LANGUAGE SYSTEM
       Original data-hi Support
    ======================================================== */

    function applyLanguage() {

        document.documentElement.lang = isHindi ? "hi" : "en";

        document.querySelectorAll("[data-hi]").forEach(element => {

            if (!originalEnglish.has(element)) {

                originalEnglish.set(
                    element,
                    element.getAttribute("data-en") ??
                    element.textContent
                );
            }

            if (isHindi) {

                element.textContent =
                    element.getAttribute("data-hi") || "";

            } else {

                element.textContent =
                    originalEnglish.get(element) || "";
            }
        });

        document.querySelectorAll("#langBtn").forEach(button => {
            button.textContent = isHindi ? "Eng." : "हिंदी";
        });
    }

    function toggleLanguage() {

        isHindi = !isHindi;

        writeStorage(
            CONFIG.languageKey,
            isHindi ? "hi" : "en"
        );

        applyLanguage();
    }

    // Supports external language controls too.
    window.toggleLanguage = toggleLanguage;
    window.applyLanguage = applyLanguage;

    /* ========================================================
       SOCIAL LINKS FROM JSON
       /Assets/json/side-link.json
    ======================================================== */

    let socialCache = null;
    let socialRequest = null;

    async function getSocialData() {

        if (socialCache) return socialCache;

        if (socialRequest) return socialRequest;

        socialRequest = (async () => {

            const response = await fetch(CONFIG.socialJSON);

            if (!response.ok) {
                throw new Error(`Social JSON HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data.social_links)) {
                throw new Error("social_links must be an array");
            }

            socialCache = data.social_links;

            return socialCache;

        })();

        try {
            return await socialRequest;
        } finally {
            socialRequest = null;
        }
    }

    async function renderSocialLinks() {

        const containers = document.querySelectorAll(
            ".haproven-sosal-links"
        );

        if (!containers.length) return;

        try {

            const links = await getSocialData();

            // Find containers again after fetch completes.
            document.querySelectorAll(
                ".haproven-sosal-links"
            ).forEach(container => {

                container.replaceChildren();

                links.forEach(item => {

                    if (!item.is_active || !item.url) return;

                    let url;

                    try {
                        url = new URL(item.url, location.href);

                        if (!["http:", "https:"].includes(url.protocol)) {
                            return;
                        }
                    } catch {
                        return;
                    }

                    const link = document.createElement("a");

                    link.href = url.href;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";

                    link.title = item.platform || "Social link";

                    link.className = "social-link-item";

                    link.setAttribute(
                        "aria-label",
                        item.platform || "Social link"
                    );

                    if (item.color) {
                        link.style.setProperty(
                            "--icon-color",
                            item.color
                        );
                    }

                    const icon = document.createElement("i");

                    icon.className = item.icon || "fa-solid fa-link";

                    icon.setAttribute("aria-hidden", "true");

                    link.appendChild(icon);

                    container.appendChild(link);
                });
            });

        } catch (error) {

            console.error(
                "[Social Links] JSON loading failed:",
                error
            );

            // Existing fallback HTML stays visible on failure.
        }
    }

    /* ========================================================
       MAIN AUDIO READER
       Read only <main> content
       Voice selection + Play / Stop
    ======================================================== */

    function speechSupported() {

        return (
            "speechSynthesis" in window &&
            "SpeechSynthesisUtterance" in window
        );
    }

    function loadVoice() {

        if (!speechSupported()) return;

        const voices = window.speechSynthesis.getVoices();

        if (!voices.length) return;

        const preferredLanguage = isHindi ? "hi-IN" : "en-IN";

        selectedVoice =
            voices.find(v => v.lang === preferredLanguage) ||
            voices.find(v => v.lang === "en-IN") ||
            voices.find(v => v.lang === "hi-IN") ||
            voices.find(v => v.lang.startsWith("en")) ||
            voices[0];
    }

    function updateAudioButton(active = false) {

        if (!audioButton || !audioButton.isConnected) {
            return;
        }

        const icon = audioButton.querySelector("i");
        const label = audioButton.querySelector("span");

        if (icon) {
            icon.className = active
                ? "fa-solid fa-stop"
                : "fa-solid fa-volume-low";
        }

        if (label) {
            label.textContent = active ? "Stop" : "Audio";
        }

        audioButton.classList.toggle(
            "audio-playing",
            active
        );

        audioButton.setAttribute(
            "aria-label",
            active ? "Stop audio" : "Read page aloud"
        );
    }

    function stopAudio() {

        speechSession++;

        if (speechSupported()) {
            window.speechSynthesis.cancel();
        }

        currentSpeech = null;

        updateAudioButton(false);
    }

    function toggleAudio(event) {

        event?.preventDefault();

        if (!speechSupported()) {

            console.warn(
                "[Audio] Speech synthesis not supported."
            );

            return;
        }

        if (currentSpeech) {

            stopAudio();

            return;
        }

        const main = document.querySelector("main");

        if (!main) {

            console.warn("[Audio] <main> not found.");

            return;
        }

        const text = (main.innerText || main.textContent || "")
            .replace(/\s+/g, " ")
            .trim();

        if (!text) {

            console.warn("[Audio] No readable text found.");

            return;
        }

        window.speechSynthesis.cancel();

        loadVoice();

        const speech = new SpeechSynthesisUtterance(text);

        if (selectedVoice) {

            speech.voice = selectedVoice;
            speech.lang = selectedVoice.lang;

        } else {

            speech.lang = isHindi ? "hi-IN" : "en-IN";
        }

        speech.rate = 0.95;
        speech.pitch = 1;
        speech.volume = 1;

        const session = ++speechSession;

        currentSpeech = speech;

        speech.onstart = () => {

            if (session === speechSession) {
                updateAudioButton(true);
            }
        };

        speech.onend = () => {

            if (session !== speechSession) return;

            currentSpeech = null;
            updateAudioButton(false);
        };

        speech.onerror = error => {

            if (session !== speechSession) return;

            if (error.error !== "canceled") {
                console.warn("[Audio] Speech error:", error.error);
            }

            currentSpeech = null;
            updateAudioButton(false);
        };

        updateAudioButton(true);

        window.speechSynthesis.speak(speech);
    }

    /* ========================================================
       INITIALIZE HEADER
    ======================================================== */

    function initHeader() {

        const header = document.getElementById("header");

        if (!header) return false;

        // Prevent duplicate listeners on the same element.
        if (currentHeader === header) {
            return true;
        }

        // Cleanup listeners from previous header.
        if (headerController) {
            headerController.abort();
        }

        if (currentSpeech) {
            stopAudio();
        }

        const controller = new AbortController();
        headerController = controller;

        const { signal } = controller;

        currentHeader = header;

        /* ----------------------------------------------------
           ELEMENT REFERENCES
        ---------------------------------------------------- */

        const menuBtn = header.querySelector("#dot6menu");

        const dropdown = header.querySelector("#teamDropdown");

        const toggleBtn = header.querySelector(
            "#mobile-menu-toggle"
        );

        const nav = header.querySelector("#navbar-mobile");

        const themeButton = header.querySelector("#theme-toggle");

        const langButton = header.querySelector("#langBtn");

        audioButton = header.querySelector("#main-audio-button");

        /* ====================================================
           6 DOT MENU
        ==================================================== */

        function closeAppsMenu() {

            dropdown?.classList.remove("active");

            menuBtn?.classList.remove("active");

            menuBtn?.setAttribute(
                "aria-expanded",
                "false"
            );
        }

        function openAppsMenu() {

            closeMobileMenu();

            dropdown?.classList.add("active");

            menuBtn?.classList.add("active");

            menuBtn?.setAttribute(
                "aria-expanded",
                "true"
            );
        }

        function toggleAppsMenu() {

            if (!dropdown) return;

            if (dropdown.classList.contains("active")) {

                closeAppsMenu();

            } else {

                openAppsMenu();
            }
        }

        menuBtn?.setAttribute("aria-expanded", "false");

        menuBtn?.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                toggleAppsMenu();
            },
            { signal }
        );

        /* ====================================================
           MOBILE MENU
           Original CSS uses .show
        ==================================================== */

        function closeMobileMenu() {

            nav?.classList.remove("show");

            toggleBtn?.classList.remove("active");

            toggleBtn?.setAttribute(
                "aria-expanded",
                "false"
            );

            document.body.style.overflow = "";
        }

        function openMobileMenu() {

            closeAppsMenu();

            nav?.classList.add("show");

            toggleBtn?.classList.add("active");

            toggleBtn?.setAttribute(
                "aria-expanded",
                "true"
            );

            document.body.style.overflow = "hidden";
        }

        function toggleMobileMenu() {

            if (!nav) return;

            if (nav.classList.contains("show")) {

                closeMobileMenu();

            } else {

                openMobileMenu();
            }
        }

        if (toggleBtn) {

            toggleBtn.setAttribute("role", "button");
            toggleBtn.setAttribute("tabindex", "0");

            toggleBtn.setAttribute(
                "aria-label",
                "Toggle mobile menu"
            );

            toggleBtn.setAttribute(
                "aria-expanded",
                "false"
            );

            toggleBtn.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    toggleMobileMenu();
                },
                { signal }
            );

            toggleBtn.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        toggleMobileMenu();
                    }
                },
                { signal }
            );
        }

        /* ====================================================
           CLOSE MENUS ON OUTSIDE CLICK
        ==================================================== */

        document.addEventListener(
            "click",
            event => {

                const target = event.target;

                if (
                    dropdown &&
                    menuBtn &&
                    !dropdown.contains(target) &&
                    !menuBtn.contains(target)
                ) {
                    closeAppsMenu();
                }

                if (
                    nav &&
                    toggleBtn &&
                    !nav.contains(target) &&
                    !toggleBtn.contains(target)
                ) {
                    closeMobileMenu();
                }
            },
            { signal }
        );

        /* ====================================================
           CLOSE MENUS WITH ESC
        ==================================================== */

        document.addEventListener(
            "keydown",
            event => {

                if (event.key === "Escape") {

                    closeAppsMenu();

                    closeMobileMenu();
                }
            },
            { signal }
        );

        /* ====================================================
           CLOSE MOBILE MENU ON LINK CLICK
        ==================================================== */

        nav?.addEventListener(
            "click",
            event => {

                if (event.target.closest("a")) {
                    closeMobileMenu();
                }
            },
            { signal }
        );

        /* ====================================================
           DROPDOWN SUPPORT
        ==================================================== */

        header.querySelectorAll(".dropdown").forEach(element => {

            element.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    element.classList.toggle("open");
                },
                { signal }
            );
        });

        /* ====================================================
           RESPONSIVE RESIZE
        ==================================================== */

        window.addEventListener(
            "resize",
            () => {

                if (window.innerWidth > CONFIG.mobileBreakpoint) {
                    closeMobileMenu();
                }
            },
            { signal }
        );

        /* ====================================================
           THEME BUTTON
        ==================================================== */

        themeButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                toggleTheme();
            },
            { signal }
        );

        updateThemeIcons();

        /* ====================================================
           LANGUAGE BUTTON
           Handles original inline onclick safely
        ==================================================== */

        const languageAction =
            langButton?.closest(".action-box");

        if (languageAction) {

            languageAction.removeAttribute("onclick");

            languageAction.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    toggleLanguage();
                },
                { signal }
            );
        }

        /* ====================================================
           AUDIO BUTTON
        ==================================================== */

        audioButton?.addEventListener(
            "click",
            toggleAudio,
            { signal }
        );

        updateAudioButton(false);

        /* ====================================================
           REINITIALIZE DYNAMIC CONTENT
        ==================================================== */

        startHaprovenLogo();

        applyLanguage();

        renderSocialLinks();

        handleHeaderScroll();

        console.log(
            "%cHaproven Header Initialized Successfully",
            "color:#2563eb;font-weight:bold"
        );

        return true;
    }

    /* ========================================================
       GLOBAL ACCESS FOR main.js
    ======================================================== */

    window.initHeader = initHeader;
    window.setTheme = setTheme;
    window.toggleTheme = toggleTheme;
    window.renderSocialLinks = renderSocialLinks;
    window.startHaprovenLogo = startHaprovenLogo;

    /* ========================================================
       INITIALIZE GENERAL PAGE FEATURES
    ======================================================== */

    function initGeneralFeatures() {

        updateYear();

        loadLivePage();

        initFavicon();

        startHaprovenLogo();

        applyLanguage();

        renderSocialLinks();

        initHeader();
    }

    /* ========================================================
       DYNAMIC SECTION LOADED
    ======================================================== */

    document.addEventListener(
        "sectionLoaded",
        event => {

            const name = event.detail?.name;

            if (name === "header") {
                initHeader();
            }

            if (name === "footer") {
                updateYear();
            }

            // Reapply translations to newly loaded sections.
            applyLanguage();

            loadLivePage();

            startHaprovenLogo();

            renderSocialLinks();
        }
    );

    /* ========================================================
       ALL WEBSITE SECTIONS LOADED
    ======================================================== */

    document.addEventListener(
        "websiteLoaded",
        () => {

            initGeneralFeatures();
        }
    );

    /* ========================================================
       GLOBAL SCROLL LISTENER
    ======================================================== */

    window.addEventListener(
        "scroll",
        handleHeaderScroll,
        { passive: true }
    );

    /* ========================================================
       SPEECH VOICES
    ======================================================== */

    if (speechSupported()) {

        window.speechSynthesis.addEventListener?.(
            "voiceschanged",
            loadVoice
        );

        loadVoice();
    }

    /* ========================================================
       INITIAL THEME
    ======================================================== */

    function initializeTheme() {

        setTheme(getPreferredTheme());
    }

    /* ========================================================
       DOM READY
    ======================================================== */

    function start() {

        initializeTheme();

        initGeneralFeatures();
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            { once: true }
        );

    } else {

        start();
    }

})();









/* =========================================================
   HAPROVEN HEADER DATA LOADER
   Dynamic HTML / Modular Single Page Compatible

   JSON:
   1. /external/json/hub-menu.json
   2. /assets/json/side-link.json

   Features:
   - Haproven Ecosystem
   - Live Text
   - Social Links
   - Header Navigation
   - Mobile Navigation
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       JSON CONFIGURATION
    ===================================================== */

    const HUB_JSON_SOURCES = [
        "https://raw.githubusercontent.com/codersusheel/haprobase/main/external/json/hub-menu.json",
        "/external/json/hub-menu.json"
    ];

    const NAVIGATION_JSON = "/assets/json/side-link.json";

    let hubData = null;
    let hubRequest = null;

    let navigationData = null;
    let navigationRequest = null;

    /* =====================================================
       SAFE URL HELPER
    ===================================================== */

    function safeURL(value) {
        if (typeof value !== "string" || !value.trim()) {
            return null;
        }

        try {
            const url = new URL(value, window.location.href);

            if (!["http:", "https:"].includes(url.protocol)) {
                return null;
            }

            return url;
        } catch {
            return null;
        }
    }

    function setLinkURL(link, value) {
        const url = safeURL(value);

        if (!url) return false;

        link.href = url.href;

        if (url.origin !== window.location.origin) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }

        return true;
    }

    function createIcon(iconClass) {
        const icon = document.createElement("i");

        const classes = String(iconClass || "").trim();

        if (classes) {
            icon.className = classes.includes(" ")
                ? classes
                : `fa ${classes}`;
        }

        icon.setAttribute("aria-hidden", "true");

        return icon;
    }

    function createNavigationLink(item, className = "") {
        const link = document.createElement("a");

        if (!setLinkURL(link, item.url)) {
            return null;
        }

        if (className) {
            link.className = className;
        }

        if (item.icon) {
            link.appendChild(createIcon(item.icon));
        }

        const label = document.createElement("span");
        label.textContent = item.name || "Untitled";

        link.appendChild(label);

        return link;
    }

    /* =====================================================
       FETCH HUB JSON WITH FALLBACK
    ===================================================== */

    async function getHubData() {
        if (hubData) return hubData;
        if (hubRequest) return hubRequest;

        hubRequest = (async () => {
            for (const source of HUB_JSON_SOURCES) {
                try {
                    const response = await fetch(source, {
                        cache: "no-cache"
                    });

                    if (!response.ok) continue;

                    const data = await response.json();

                    if (
                        data &&
                        typeof data === "object" &&
                        (
                            Array.isArray(data["hub-menu"]) ||
                            Array.isArray(data.social_links) ||
                            typeof data.liveText === "string"
                        )
                    ) {
                        hubData = data;
                        return data;
                    }

                } catch (error) {
                    console.warn(
                        "Failed to load hub JSON:",
                        source,
                        error
                    );
                }
            }

            throw new Error("All hub JSON sources failed");
        })();

        try {
            return await hubRequest;
        } finally {
            hubRequest = null;
        }
    }

    /* =====================================================
       1. HAPROVEN ECOSYSTEM
       Target: #by-haproven
    ===================================================== */

    async function loadByHaproven() {
        if (!document.getElementById("by-haproven")) return;

        try {
            const data = await getHubData();
            const menu = data["hub-menu"];

            if (!Array.isArray(menu)) return;

            const container =
                document.getElementById("by-haproven");

            if (!container) return;

            const fragment = document.createDocumentFragment();

            menu.forEach(item => {
                if (!item.name || !item.url) return;

                const li = document.createElement("li");
                const link = document.createElement("a");

                if (!setLinkURL(link, item.url)) return;

                link.className = "member-box";

                if (item.img) {
                    const imageURL = safeURL(item.img);

                    if (imageURL) {
                        const image = document.createElement("img");

                        image.src = imageURL.href;
                        image.alt = item.name;
                        image.loading = "lazy";

                        link.appendChild(image);
                    }
                }

                const name = document.createElement("span");
                name.textContent = item.name;

                link.appendChild(name);
                li.appendChild(link);
                fragment.appendChild(li);
            });

            container.replaceChildren(fragment);

        } catch (error) {
            console.error("Failed to load hub-menu:", error);
            // Keep original HTML fallback.
        }
    }

    /* =====================================================
       2. HAPROVEN LIVE TEXT
       Target: #live-text
    ===================================================== */

    async function loadLiveText() {
        if (!document.getElementById("live-text")) return;

        try {
            const data = await getHubData();

            if (!data.liveText) return;

            const element = document.getElementById("live-text");

            if (element) {
                element.textContent = data.liveText;
            }

        } catch (error) {
            console.warn("Failed to load liveText:", error);
        }
    }

    /* =====================================================
       3. HAPROVEN SOCIAL LINKS
       Target: .haproven-sosal-links
    ===================================================== */

    async function loadSocialLinks() {
        if (
            !document.querySelector(".haproven-sosal-links")
        ) {
            return;
        }

        try {
            const data = await getHubData();
            const links = data.social_links;

            if (!Array.isArray(links)) return;

            document.querySelectorAll(
                ".haproven-sosal-links"
            ).forEach(container => {
                const fragment =
                    document.createDocumentFragment();

                const isList =
                    container.tagName.toLowerCase() === "ul";

                links.forEach(item => {
                    if (
                        !item.platform ||
                        !item.url ||
                        !item.icon ||
                        item.is_active !== true
                    ) {
                        return;
                    }

                    const link = document.createElement("a");

                    if (!setLinkURL(link, item.url)) return;

                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.title = item.platform;
                    link.setAttribute(
                        "aria-label",
                        item.platform
                    );

                    const icon = document.createElement("i");
                    icon.className = item.icon;

                    link.appendChild(icon);

                    if (isList) {
                        const li = document.createElement("li");
                        li.appendChild(link);
                        fragment.appendChild(li);
                    } else {
                        fragment.appendChild(link);
                    }
                });

                container.replaceChildren(fragment);
            });

        } catch (error) {
            console.warn("Failed to load social links:", error);
            // Keep original HTML fallback.
        }
    }

    /* =====================================================
       FETCH NAVIGATION JSON
    ===================================================== */

    async function getNavigationData() {
        if (navigationData) return navigationData;
        if (navigationRequest) return navigationRequest;

        navigationRequest = (async () => {
            const response = await fetch(NAVIGATION_JSON, {
                cache: "no-cache"
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data.navigation_system)) {
                throw new Error("Invalid navigation_system JSON");
            }

            navigationData = data.navigation_system;

            return navigationData;
        })();

        try {
            return await navigationRequest;
        } finally {
            navigationRequest = null;
        }
    }

    /* =====================================================
       4. HEADER + MOBILE NAVIGATION
    ===================================================== */

    function renderNavigation(navigationSystem) {
        const headerContainer =
            document.getElementById("header-links");

        const mobileContainer =
            document.getElementById("mobile-sidebar");

        const headerFragment =
            document.createDocumentFragment();

        const mobileFragment =
            document.createDocumentFragment();

        navigationSystem.forEach(category => {
            const items = Array.isArray(category.items)
                ? category.items
                : [];

            items.forEach(item => {
                const placements = Array.isArray(item.placements)
                    ? item.placements
                    : [];

                /* ==========================================
                   HEADER NAVIGATION
                ========================================== */

                if (placements.includes("header")) {
                    const li = document.createElement("li");

                    if (
                        item.type === "dropdown" &&
                        Array.isArray(item.dropdown_items)
                    ) {
                        li.className = "nav-item dropdown";

                        const link = createNavigationLink(
                            item,
                            "dropdown-toggle"
                        );

                        if (link) {
                            link.appendChild(
                                createIcon("fa fa-chevron-down")
                            );

                            li.appendChild(link);

                            const submenu =
                                document.createElement("ul");

                            submenu.className = "dropdown-menu";

                            item.dropdown_items.forEach(sub => {
                                const subLink =
                                    createNavigationLink(sub);

                                if (!subLink) return;

                                const subLi =
                                    document.createElement("li");

                                subLi.appendChild(subLink);
                                submenu.appendChild(subLi);
                            });

                            li.appendChild(submenu);
                            headerFragment.appendChild(li);
                        }

                    } else {
                        const link = createNavigationLink(
                            item,
                            "nav-link"
                        );

                        if (link) {
                            li.appendChild(link);
                            headerFragment.appendChild(li);
                        }
                    }
                }

                /* ==========================================
                   MOBILE SIDEBAR
                ========================================== */

                if (placements.includes("sidebar_mobile")) {
                    const li = document.createElement("li");
                    const link = createNavigationLink(item);

                    if (link) {
                        li.appendChild(link);
                        mobileFragment.appendChild(li);
                    }

                    if (Array.isArray(item.dropdown_items)) {
                        item.dropdown_items.forEach(sub => {
                            const subLink =
                                createNavigationLink(sub);

                            if (!subLink) return;

                            const subLi =
                                document.createElement("li");

                            subLi.className = "mobile-sub-item";
                            subLi.appendChild(subLink);

                            mobileFragment.appendChild(subLi);
                        });
                    }
                }
            });
        });

        if (headerContainer) {
            headerContainer.replaceChildren(headerFragment);
        }

        if (mobileContainer) {
            mobileContainer.replaceChildren(mobileFragment);
        }
    }

    async function loadNavigation() {
        if (
            !document.getElementById("header-links") &&
            !document.getElementById("mobile-sidebar")
        ) {
            return;
        }

        try {
            const data = await getNavigationData();
            renderNavigation(data);

        } catch (error) {
            console.error("Navigation JSON Loading Error:", error);
            // Keep original HTML fallback.
        }
    }

    /* =====================================================
       HEADER DATA INITIALIZER
    ===================================================== */

    function initHeaderData() {
        loadByHaproven();
        loadLiveText();
        loadSocialLinks();
        loadNavigation();
    }

    window.initHeaderData = initHeaderData;

    /* =====================================================
       DYNAMIC SECTION SUPPORT
    ===================================================== */

    document.addEventListener("sectionLoaded", event => {
        if (event.detail?.name === "header") {
            initHeaderData();
        }
    });

    document.addEventListener("websiteLoaded", () => {
        initHeaderData();
    });

    /* =====================================================
       STATIC HEADER FALLBACK
    ===================================================== */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initHeaderData,
            { once: true }
        );
    } else {
        initHeaderData();
    }

})();





/* ==========================================================
   HAPROVEN HEADER SOCIAL LINKS
   JSON: hub-menu.json
   Target: .haproven-sosal-links
========================================================== */

(() => {
    "use strict";

    const SOCIAL_JSON_SOURCES = [
        "https://raw.githubusercontent.com/codersusheel/haprobase/main/external/json/hub-menu.json",
        "/external/json/hub-menu.json"
    ];

    let socialData = null;
    let socialRequest = null;

    /* ======================================================
       FETCH JSON WITH FALLBACK
    ====================================================== */

    async function getSocialLinks() {

        if (socialData) return socialData;

        if (socialRequest) return socialRequest;

        socialRequest = (async () => {

            for (const source of SOCIAL_JSON_SOURCES) {

                try {

                    const response = await fetch(source, {
                        cache: "no-cache"
                    });

                    if (!response.ok) continue;

                    const data = await response.json();

                    if (Array.isArray(data.social_links)) {
                        socialData = data.social_links;
                        return socialData;
                    }

                } catch (error) {

                    console.warn(
                        "Social JSON loading failed:",
                        source,
                        error
                    );
                }
            }

            throw new Error("Social links JSON not found");

        })();

        try {
            return await socialRequest;
        } finally {
            socialRequest = null;
        }
    }

    /* ======================================================
       SAFE URL
    ====================================================== */

    function safeSocialURL(value) {

        if (typeof value !== "string") return null;

        try {

            const url = new URL(value, location.href);

            return ["https:", "http:"].includes(url.protocol)
                ? url.href
                : null;

        } catch {
            return null;
        }
    }

    /* ======================================================
       RENDER SOCIAL LINKS
    ====================================================== */

    async function loadHeaderSocialLinks() {

        if (!document.querySelector(".haproven-sosal-links")) {
            return;
        }

        try {

            const links = await getSocialLinks();

            document.querySelectorAll(
                ".haproven-sosal-links"
            ).forEach(container => {

                const fragment = document.createDocumentFragment();

                links.forEach(item => {

                    if (
                        item.is_active !== true ||
                        !item.platform ||
                        !item.url ||
                        !item.icon
                    ) {
                        return;
                    }

                    const url = safeSocialURL(item.url);

                    if (!url) return;

                    const a = document.createElement("a");

                    a.href = url;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.title = item.platform;
                    a.className = "social-link-item";

                    a.setAttribute(
                        "aria-label",
                        item.platform
                    );

                    if (item.color) {
                        a.style.setProperty(
                            "--icon-color",
                            item.color
                        );
                    }

                    const icon = document.createElement("i");

                    icon.className = item.icon;

                    if (item.color) {
                        icon.style.color = item.color;
                    }

                    icon.setAttribute("aria-hidden", "true");

                    a.appendChild(icon);

                    if (container.tagName.toLowerCase() === "ul") {

                        const li = document.createElement("li");

                        li.appendChild(a);
                        fragment.appendChild(li);

                    } else {

                        fragment.appendChild(a);
                    }
                });

                if (fragment.childNodes.length) {
                    container.replaceChildren(fragment);
                }
            });

        } catch (error) {

            console.error(
                "Header Social Links Error:",
                error
            );

            // JSON fails: existing HTML remains visible.
        }
    }

    /* ======================================================
       GLOBAL FUNCTION
    ====================================================== */

    window.loadHeaderSocialLinks = loadHeaderSocialLinks;

    /* ======================================================
       DYNAMIC HEADER SUPPORT
    ====================================================== */

    document.addEventListener("sectionLoaded", event => {

        if (event.detail?.name === "header") {
            loadHeaderSocialLinks();
        }

    });

    document.addEventListener("websiteLoaded", () => {
        loadHeaderSocialLinks();
    });

    /* ======================================================
       STATIC HTML SUPPORT
    ====================================================== */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            loadHeaderSocialLinks,
            { once: true }
        );

    } else {

        loadHeaderSocialLinks();
    }

})();











