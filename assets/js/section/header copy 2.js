
/* ============================================================
   HAPROVEN COMPLETE HEADER SYSTEM
   Version: 6.0

   JSON DATA SOURCES
   ------------------------------------------------------------
   hub-menu.json:
      - hub-menu
      - social_links
      - liveText

   side-link.json:
      - navigation_system

   HEADER FEATURES
   ------------------------------------------------------------
   01. Dynamic Header Initialization
   02. Header Navigation
   03. Mobile Navigation
   04. Six Dot Apps Menu
   05. Haproven Ecosystem
   06. Social Media Links
   07. Hindi / English
   08. Dark / Light Theme
   09. Main Content Audio
   10. Animated Haproven Logo
   11. Header Scroll Hide / Show
   12. Active Navigation
   13. Dropdown Navigation
   14. Local Storage Preferences
   15. JSON Error Fallback
   16. Modular Single Page Support
============================================================ */

(() => {
    "use strict";

    /* ========================================================
       01. CONFIGURATION
    ======================================================== */

    const CONFIG = {

        hubSources: [
            "https://raw.githubusercontent.com/codersusheel/haprobase/main/external/json/hub-menu.json",
            "/external/json/hub-menu.json"
        ],

        navigationSources: [
            "/assets/json/side-link.json"
        ],

        favicon:
            "https://haprobase.netlify.app/external/img/logo/haproven.png",

        themeKey: "theme",

        languageKey: "lang",

        mobileBreakpoint: 1024,

        scrollThreshold: 80,

        hideOnScroll: true
    };

    /* ========================================================
       02. GLOBAL STATE
    ======================================================== */

    let currentHeader = null;
    let headerController = null;

    let hubData = null;
    let hubPromise = null;

    let navigationData = null;
    let navigationPromise = null;

    let lastScroll = window.scrollY || 0;

    let selectedVoice = null;
    let activeSpeech = null;
    let speechToken = 0;

    const originalEnglish = new WeakMap();

    let currentLanguage =
        readStorage(CONFIG.languageKey) === "hi"
            ? "hi"
            : "en";

    /* ========================================================
       03. STORAGE HELPERS
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
            // Storage is unavailable.
        }
    }

    /* ========================================================
       04. SAFE URL HELPERS
    ======================================================== */

    function safeURL(value, allowHash = true) {

        if (typeof value !== "string") {
            return null;
        }

        const raw = value.trim();

        if (!raw) return null;

        if (allowHash && raw === "#") {
            return "#";
        }

        try {

            const url = new URL(raw, location.href);

            if (!["http:", "https:"].includes(url.protocol)) {
                return null;
            }

            return url.href;

        } catch {
            return null;
        }
    }

    function setLinkURL(link, value) {

        const url = safeURL(value);

        if (!url) return false;

        link.href = url;

        if (url !== "#") {

            const parsed = new URL(url);

            if (parsed.origin !== location.origin) {

                link.target = "_blank";
                link.rel = "noopener noreferrer";
            }
        }

        return true;
    }

    function normalizePath(path) {

        let result = String(path || "/")
            .split("?")[0]
            .split("#")[0]
            .replace(/\/index\.html$/i, "/")
            .replace(/\/+/g, "/");

        if (result.length > 1) {
            result = result.replace(/\/+$/, "");
        }

        return result || "/";
    }

    function isActiveURL(value) {

        const url = safeURL(value);

        if (!url || url === "#") return false;

        try {

            const target = new URL(url);

            if (target.origin !== location.origin) {
                return false;
            }

            if (
                normalizePath(target.pathname) !==
                normalizePath(location.pathname)
            ) {
                return false;
            }

            if (target.hash) {
                return target.hash === location.hash;
            }

            return !location.hash;

        } catch {
            return false;
        }
    }

    /* ========================================================
       05. ICON HELPER
    ======================================================== */

    function createIcon(value) {

        const icon = document.createElement("i");

        const name = String(value || "").trim();

        if (!name) {
            icon.className = "fa-solid fa-link";
        } else if (
            name.includes(" ") ||
            name.startsWith("ri-")
        ) {
            icon.className = name;
        } else if (name.startsWith("fa-")) {
            icon.className = `fa-solid ${name}`;
        } else {
            icon.className = name;
        }

        icon.setAttribute("aria-hidden", "true");

        return icon;
    }

    /* ========================================================
       06. JSON FETCH WITH FALLBACK
    ======================================================== */

    async function fetchJSON(sources, validator) {

        let lastError = null;

        for (const source of sources) {

            try {

                const response = await fetch(source, {
                    cache: "no-cache",
                    headers: {
                        Accept: "application/json"
                    }
                });

                if (!response.ok) {

                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }

                const data = await response.json();

                if (!validator(data)) {

                    throw new Error(
                        "Invalid JSON structure"
                    );
                }

                return data;

            } catch (error) {

                lastError = error;

                console.warn(
                    "[Header] JSON failed:",
                    source,
                    error
                );
            }
        }

        throw lastError ||
            new Error("All JSON sources failed");
    }

    /* ========================================================
       07. HUB JSON DATA
    ======================================================== */

    async function getHubData() {

        if (hubData) {
            return hubData;
        }

        if (hubPromise) {
            return hubPromise;
        }

        hubPromise = fetchJSON(
            CONFIG.hubSources,
            data => (
                data &&
                typeof data === "object" &&
                (
                    Array.isArray(data["hub-menu"]) ||
                    Array.isArray(data.social_links) ||
                    typeof data.liveText === "string"
                )
            )
        );

        try {

            hubData = await hubPromise;

            return hubData;

        } finally {

            hubPromise = null;
        }
    }

    /* ========================================================
       08. NAVIGATION JSON DATA
    ======================================================== */

    async function getNavigationData() {

        if (navigationData) {
            return navigationData;
        }

        if (navigationPromise) {
            return navigationPromise;
        }

        navigationPromise = fetchJSON(
            CONFIG.navigationSources,
            data => (
                data &&
                Array.isArray(data.navigation_system)
            )
        );

        try {

            navigationData = await navigationPromise;

            return navigationData;

        } finally {

            navigationPromise = null;
        }
    }

    /* ========================================================
       09. CREATE NAVIGATION LINK
    ======================================================== */

    function createNavigationLink(item, className = "") {

        if (!item || typeof item !== "object") {
            return null;
        }

        const link = document.createElement("a");

        if (!setLinkURL(
            link,
            item.url || item.href
        )) {
            return null;
        }

        if (className) {
            link.className = className;
        }

        if (item.icon) {

            link.appendChild(
                createIcon(item.icon)
            );
        }

        const label = document.createElement("span");

        label.textContent =
            item.name ||
            item.title ||
            "Untitled";

        link.appendChild(label);

        if (isActiveURL(item.url || item.href)) {

            link.classList.add("active");

            link.setAttribute(
                "aria-current",
                "page"
            );
        }

        return link;
    }

    /* ========================================================
       10. CREATE DESKTOP NAVIGATION ITEM
    ======================================================== */

    function createDesktopItem(item) {

        const li = document.createElement("li");

        const children = Array.isArray(item.dropdown_items)
            ? item.dropdown_items
            : [];

        if (
            item.type === "dropdown" &&
            children.length
        ) {

            li.className = "nav-item dropdown";

            const trigger = createNavigationLink(
                item,
                "dropdown-toggle"
            );

            if (!trigger) return null;

            trigger.setAttribute(
                "aria-expanded",
                "false"
            );

            trigger.appendChild(
                createIcon("fa-solid fa-chevron-down")
            );

            const submenu = document.createElement("ul");

            submenu.className = "dropdown-menu";

            children.forEach(child => {

                const link = createNavigationLink(child);

                if (!link) return;

                const subLi = document.createElement("li");

                subLi.appendChild(link);

                submenu.appendChild(subLi);
            });

            if (!submenu.children.length) {
                return null;
            }

            li.append(trigger, submenu);

            if (submenu.querySelector(".active")) {
                li.classList.add("has-active-child");
            }

        } else {

            const link = createNavigationLink(
                item,
                "nav-link"
            );

            if (!link) return null;

            li.appendChild(link);
        }

        return li;
    }

    /* ========================================================
       11. CREATE MOBILE NAVIGATION ITEM
    ======================================================== */

    function createMobileItem(item) {

        const li = document.createElement("li");

        li.className = "mobile-nav-item";

        const link = createNavigationLink(item);

        if (!link) return null;

        const children = Array.isArray(item.dropdown_items)
            ? item.dropdown_items
            : [];

        if (children.length) {

            li.classList.add("dropdown");

            link.classList.add("dropdown-toggle");

            link.setAttribute(
                "aria-expanded",
                "false"
            );

            link.appendChild(
                createIcon("fa-solid fa-chevron-down")
            );

            const submenu = document.createElement("ul");

            submenu.className = "dropdown-menu";

            children.forEach(child => {

                const childLink =
                    createNavigationLink(child);

                if (!childLink) return;

                const childLi =
                    document.createElement("li");

                childLi.className = "mobile-sub-item";

                childLi.appendChild(childLink);

                submenu.appendChild(childLi);
            });

            li.append(link, submenu);

            if (submenu.querySelector(".active")) {
                li.classList.add("has-active-child");
                li.classList.add("open");

                link.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }

        } else {

            li.appendChild(link);
        }

        return li;
    }

    /* ========================================================
       12. RENDER HEADER + MOBILE NAVIGATION
    ======================================================== */

    function renderNavigation(data) {

        const headerContainer =
            document.getElementById("header-links");

        const mobileContainer =
            document.getElementById("mobile-sidebar");

        if (!headerContainer && !mobileContainer) {
            return;
        }

        const headerFragment =
            document.createDocumentFragment();

        const mobileFragment =
            document.createDocumentFragment();

        data.forEach(category => {

            const items = Array.isArray(category.items)
                ? category.items
                : [];

            items.forEach(item => {

                const placements =
                    Array.isArray(item.placements)
                        ? item.placements
                        : [];

                /* Desktop Header */

                if (placements.includes("header")) {

                    const li = createDesktopItem(item);

                    if (li) {
                        headerFragment.appendChild(li);
                    }
                }

                /* Mobile Sidebar */

                if (placements.includes("sidebar_mobile")) {

                    const li = createMobileItem(item);

                    if (li) {
                        mobileFragment.appendChild(li);
                    }
                }
            });
        });

        if (
            headerContainer &&
            headerFragment.childNodes.length
        ) {

            headerContainer.replaceChildren(
                headerFragment
            );
        }

        if (
            mobileContainer &&
            mobileFragment.childNodes.length
        ) {

            mobileContainer.replaceChildren(
                mobileFragment
            );
        }
    }

    /* ========================================================
       13. LOAD HEADER NAVIGATION
    ======================================================== */

    async function loadHeaderNavigation() {

        if (
            !document.getElementById("header-links") &&
            !document.getElementById("mobile-sidebar")
        ) {
            return;
        }

        try {

            const data = await getNavigationData();

            renderNavigation(
                data.navigation_system
            );

        } catch (error) {

            console.error(
                "[Header] Navigation failed:",
                error
            );

            // Keep existing HTML fallback.
        }
    }

    /* ========================================================
       14. HAPROVEN ECOSYSTEM
       Target: #by-haproven
    ======================================================== */

    async function loadByHaproven() {

        const container =
            document.getElementById("by-haproven");

        if (!container) return;

        try {

            const data = await getHubData();

            const items = data["hub-menu"];

            if (!Array.isArray(items)) {
                return;
            }

            const fragment =
                document.createDocumentFragment();

            items.forEach(item => {

                if (!item || !item.name || !item.url) {
                    return;
                }

                const li = document.createElement("li");

                const link = document.createElement("a");

                if (!setLinkURL(link, item.url)) {
                    return;
                }

                link.className = "member-box";

                if (item.img) {

                    const imageURL = safeURL(item.img, false);

                    if (imageURL) {

                        const img =
                            document.createElement("img");

                        img.src = imageURL;
                        img.alt = item.name;
                        img.loading = "lazy";

                        link.appendChild(img);
                    }
                }

                const name = document.createElement("span");

                name.textContent = item.name;

                link.appendChild(name);

                li.appendChild(link);

                fragment.appendChild(li);
            });

            if (fragment.childNodes.length) {

                container.replaceChildren(fragment);
            }

        } catch (error) {

            console.error(
                "[Header] Ecosystem failed:",
                error
            );
        }
    }

    /* ========================================================
       15. SOCIAL MEDIA LINKS
       Target: .haproven-sosal-links
    ======================================================== */

    async function loadHeaderSocialLinks() {

        const containers = document.querySelectorAll(
            "#header .haproven-sosal-links"
        );

        if (!containers.length) return;

        try {

            const data = await getHubData();

            const links = data.social_links;

            if (!Array.isArray(links)) {
                return;
            }

            containers.forEach(container => {

                const fragment =
                    document.createDocumentFragment();

                const isList =
                    container.tagName.toLowerCase() === "ul";

                links.forEach(item => {

                    if (
                        !item ||
                        item.is_active === false ||
                        !item.platform ||
                        !item.url ||
                        !item.icon
                    ) {
                        return;
                    }

                    const url = safeURL(item.url, false);

                    if (!url) return;

                    const link = document.createElement("a");

                    link.href = url;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";

                    link.title = item.platform;

                    link.setAttribute(
                        "aria-label",
                        item.platform
                    );

                    link.className = "social-link-item";

                    const icon = createIcon(item.icon);

                    if (item.color) {

                        icon.style.color = item.color;

                        link.style.setProperty(
                            "--icon-color",
                            item.color
                        );
                    }

                    link.appendChild(icon);

                    if (isList) {

                        const li = document.createElement("li");

                        li.appendChild(link);

                        fragment.appendChild(li);

                    } else {

                        fragment.appendChild(link);
                    }
                });

                if (fragment.childNodes.length) {

                    container.replaceChildren(fragment);
                }
            });

        } catch (error) {

            console.error(
                "[Header] Social links failed:",
                error
            );
        }
    }

    /* ========================================================
       16. LIVE TEXT
       Optional Target: #live-text
    ======================================================== */

    async function loadLiveText() {

        const element =
            document.getElementById("live-text");

        if (!element) return;

        try {

            const data = await getHubData();

            if (typeof data.liveText === "string") {

                element.textContent = data.liveText;
            }

        } catch (error) {

            console.warn(
                "[Header] Live text failed:",
                error
            );
        }
    }

    /* ========================================================
       17. THEME SYSTEM
    ======================================================== */

    function preferredTheme() {

        const saved = readStorage(CONFIG.themeKey);

        if (saved === "dark" || saved === "light") {
            return saved;
        }

        if (
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
        ) {
            return "dark";
        }

        return "light";
    }

    function updateThemeIcons() {

        const dark =
            document.body.classList.contains("dark-mode");

        const button =
            document.getElementById("theme-toggle");

        if (!button) return;

        const sun = button.querySelector(".sun");
        const moon = button.querySelector(".moon");

        if (sun) {
            sun.style.display =
                dark ? "none" : "inline";
        }

        if (moon) {
            moon.style.display =
                dark ? "inline" : "none";
        }
    }

    function setTheme(mode, save = true) {

        const dark = mode === "dark";

        document.body.classList.toggle(
            "dark-mode",
            dark
        );

        document.documentElement.classList.toggle(
            "dark",
            dark
        );

        document.documentElement.setAttribute(
            "data-theme",
            dark ? "dark" : "light"
        );

        if (save) {

            writeStorage(
                CONFIG.themeKey,
                dark ? "dark" : "light"
            );
        }

        updateThemeIcons();
    }

    function toggleTheme() {

        const isDark =
            document.body.classList.contains("dark-mode");

        setTheme(
            isDark ? "light" : "dark"
        );
    }

    /* ========================================================
       18. LANGUAGE SYSTEM
       Uses data-hi and optional data-en
    ======================================================== */

    function applyLanguage(root = document) {

        const isHindi =
            currentLanguage === "hi";

        document.documentElement.lang =
            currentLanguage;

        const elements = [];

        if (
            root instanceof Element &&
            root.matches("[data-hi]")
        ) {
            elements.push(root);
        }

        root.querySelectorAll?.("[data-hi]").forEach(
            element => elements.push(element)
        );

        elements.forEach(element => {

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

        document.querySelectorAll("#langBtn").forEach(
            button => {

                button.textContent =
                    isHindi ? "Eng." : "हिंदी";
            }
        );
    }

    function toggleLanguage() {

        currentLanguage =
            currentLanguage === "hi"
                ? "en"
                : "hi";

        writeStorage(
            CONFIG.languageKey,
            currentLanguage
        );

        applyLanguage();
    }

    /* ========================================================
       19. AUDIO READER
    ======================================================== */

    function audioSupported() {

        return (
            "speechSynthesis" in window &&
            "SpeechSynthesisUtterance" in window
        );
    }

    function chooseVoice() {

        if (!audioSupported()) return null;

        const voices =
            speechSynthesis.getVoices();

        const preferred =
            currentLanguage === "hi"
                ? "hi-IN"
                : "en-IN";

        selectedVoice =
            voices.find(v => v.lang === preferred) ||
            voices.find(v => v.lang === "en-IN") ||
            voices.find(v => v.lang === "hi-IN") ||
            voices.find(v => v.lang.startsWith("en")) ||
            voices[0] ||
            null;

        return selectedVoice;
    }

    function updateAudioButton(playing = false) {

        const button =
            document.getElementById("main-audio-button");

        if (!button) return;

        const icon = button.querySelector("i");
        const text = button.querySelector("span");

        if (icon) {

            icon.className = playing
                ? "fa-solid fa-stop"
                : "fa-solid fa-volume-low";
        }

        if (text) {

            text.textContent =
                playing ? "Stop" : "Audio";
        }

        button.classList.toggle(
            "audio-playing",
            playing
        );
    }

    function stopAudio() {

        speechToken++;

        if (audioSupported()) {

            speechSynthesis.cancel();
        }

        activeSpeech = null;

        updateAudioButton(false);
    }

    function toggleAudio() {

        if (!audioSupported()) {

            console.warn(
                "[Header] Speech synthesis not supported."
            );

            return;
        }

        if (activeSpeech) {

            stopAudio();

            return;
        }

        const main = document.querySelector("main");

        if (!main) return;

        const text = (
            main.innerText ||
            main.textContent ||
            ""
        ).replace(/\s+/g, " ").trim();

        if (!text) return;

        const voice = chooseVoice();

        speechSynthesis.cancel();

        const utterance =
            new SpeechSynthesisUtterance(text);

        utterance.lang =
            currentLanguage === "hi"
                ? "hi-IN"
                : "en-IN";

        if (voice) {

            utterance.voice = voice;
            utterance.lang = voice.lang;
        }

        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        const token = ++speechToken;

        activeSpeech = utterance;

        utterance.onstart = () => {

            if (token === speechToken) {

                updateAudioButton(true);
            }
        };

        utterance.onend = () => {

            if (token !== speechToken) return;

            activeSpeech = null;

            updateAudioButton(false);
        };

        utterance.onerror = event => {

            if (token !== speechToken) return;

            if (event.error !== "canceled") {

                console.warn(
                    "[Header] Audio error:",
                    event.error
                );
            }

            activeSpeech = null;

            updateAudioButton(false);
        };

        updateAudioButton(true);

        speechSynthesis.speak(utterance);
    }

    /* ========================================================
       20. ANIMATED HAPROVEN BRAND
    ======================================================== */

    function injectBrandCSS() {

        if (
            document.getElementById(
                "haproven-brand-style"
            )
        ) {
            return;
        }

        const style = document.createElement("style");

        style.id = "haproven-brand-style";

        style.textContent = `
            :root {
                --hap-purple: #bc1be7;
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
        `;

        document.head.appendChild(style);
    }

    function createBrand(element) {

        if (element.dataset.brandReady === "true") {
            return;
        }

        const fullName =
            element.dataset.name || "Haproven";

        const parts =
            fullName.split(/\s+by\s+/i);

        const name =
            parts[0]?.trim() || "Haproven";

        const by =
            parts.slice(1).join(" by ").trim();

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

        strong.textContent = name;

        text.appendChild(strong);

        if (by) {

            const small = document.createElement("small");

            small.textContent = `by ${by}`;

            text.appendChild(small);
        }

        bar.appendChild(text);

        element.append(icon, bar);

        element.dataset.brandReady = "true";
    }

    function startHaprovenLogo() {

        injectBrandCSS();

        document.querySelectorAll(
            "#header .haproven-brand"
        ).forEach(createBrand);
    }

    /* ========================================================
       21. HEADER SCROLL BEHAVIOR
    ======================================================== */

    function handleHeaderScroll() {

        if (!CONFIG.hideOnScroll) return;

        const header =
            document.getElementById("header");

        if (!header) return;

        const current = Math.max(
            0,
            window.scrollY || 0
        );

        if (
            current > lastScroll &&
            current > CONFIG.scrollThreshold
        ) {

            header.classList.add("hide");

        } else if (
            current < lastScroll ||
            current <= 10
        ) {

            header.classList.remove("hide");
        }

        lastScroll = current;
    }

    /* ========================================================
       22. CLOSE HEADER MENUS
    ======================================================== */

    function closeAppsMenu() {

        const dropdown =
            document.getElementById("teamDropdown");

        const button =
            document.getElementById("dot6menu");

        dropdown?.classList.remove("active");

        button?.classList.remove("active");

        button?.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    function closeMobileMenu() {

        const navbar =
            document.getElementById("navbar-mobile");

        const toggle =
            document.getElementById("mobile-menu-toggle");

        navbar?.classList.remove("show");

        toggle?.classList.remove("active");

        toggle?.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.style.overflow = "";
    }

    function closeAllMenus() {

        closeAppsMenu();

        closeMobileMenu();
    }

    /* ========================================================
       23. HEADER INTERACTIONS
    ======================================================== */

    function initHeaderInteractions(header) {

        if (headerController) {

            headerController.abort();
        }

        const controller = new AbortController();

        headerController = controller;

        const { signal } = controller;

        const appsButton =
            header.querySelector("#dot6menu");

        const appsDropdown =
            header.querySelector("#teamDropdown");

        const mobileToggle =
            header.querySelector("#mobile-menu-toggle");

        const mobileNavbar =
            header.querySelector("#navbar-mobile");

        const themeButton =
            header.querySelector("#theme-toggle");

        const languageButton =
            header.querySelector("#langBtn");

        const audioButton =
            header.querySelector("#main-audio-button");

        /* Six Dot Apps Menu */

        appsButton?.setAttribute(
            "aria-expanded",
            "false"
        );

        appsButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                const open =
                    !appsDropdown?.classList.contains(
                        "active"
                    );

                closeMobileMenu();

                appsDropdown?.classList.toggle(
                    "active",
                    open
                );

                appsButton.classList.toggle(
                    "active",
                    open
                );

                appsButton.setAttribute(
                    "aria-expanded",
                    String(open)
                );
            },
            { signal }
        );

        /* Mobile Menu */

        mobileToggle?.setAttribute(
            "role",
            "button"
        );

        mobileToggle?.setAttribute(
            "tabindex",
            "0"
        );

        mobileToggle?.setAttribute(
            "aria-expanded",
            "false"
        );

        function toggleMobileMenu() {

            const open =
                !mobileNavbar?.classList.contains(
                    "show"
                );

            closeAppsMenu();

            mobileNavbar?.classList.toggle(
                "show",
                open
            );

            mobileToggle?.classList.toggle(
                "active",
                open
            );

            mobileToggle?.setAttribute(
                "aria-expanded",
                String(open)
            );

            document.body.style.overflow =
                open ? "hidden" : "";
        }

        mobileToggle?.addEventListener(
            "click",
            toggleMobileMenu,
            { signal }
        );

        mobileToggle?.addEventListener(
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

        /* Mobile Navigation Link Click */

        mobileNavbar?.addEventListener(
            "click",
            event => {

                const link =
                    event.target.closest("a");

                if (
                    !link ||
                    link.classList.contains(
                        "dropdown-toggle"
                    )
                ) {
                    return;
                }

                closeMobileMenu();
            },
            { signal }
        );

        /* Navigation Dropdowns */

        header.addEventListener(
            "click",
            event => {

                const trigger =
                    event.target.closest(
                        ".dropdown-toggle"
                    );

                if (
                    !trigger ||
                    !header.contains(trigger)
                ) {
                    return;
                }

                const item =
                    trigger.closest(".dropdown");

                if (!item) return;

                const submenu =
                    item.querySelector(".dropdown-menu");

                if (!submenu) return;

                event.preventDefault();

                const open =
                    !item.classList.contains("open");

                item.classList.toggle(
                    "open",
                    open
                );

                trigger.setAttribute(
                    "aria-expanded",
                    String(open)
                );
            },
            { signal }
        );

        /* Outside Click */

        document.addEventListener(
            "click",
            event => {

                const target = event.target;

                if (
                    appsDropdown &&
                    appsButton &&
                    !appsDropdown.contains(target) &&
                    !appsButton.contains(target)
                ) {

                    closeAppsMenu();
                }

                if (
                    mobileNavbar &&
                    mobileToggle &&
                    !mobileNavbar.contains(target) &&
                    !mobileToggle.contains(target)
                ) {

                    closeMobileMenu();
                }
            },
            { signal }
        );

        /* Escape Key */

        document.addEventListener(
            "keydown",
            event => {

                if (event.key !== "Escape") {
                    return;
                }

                closeAllMenus();

                header.querySelectorAll(
                    ".dropdown.open"
                ).forEach(item => {

                    item.classList.remove("open");

                    item.querySelector(
                        ".dropdown-toggle"
                    )?.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                });
            },
            { signal }
        );

        /* Resize */

        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth >
                    CONFIG.mobileBreakpoint
                ) {

                    closeMobileMenu();
                }
            },
            { signal }
        );

        /* Theme */

        themeButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                toggleTheme();
            },
            { signal }
        );

        /* Language */

        const languageAction =
            languageButton?.closest(".action-box");

        if (languageAction) {

            // Existing inline onclick already calls toggleLanguage().
            // Remove it to prevent double toggling.
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

        /* Audio */

        audioButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                toggleAudio();
            },
            { signal }
        );

        /* Login Action */

        const loginAction =
            header.querySelector("#login-action");

        loginAction?.addEventListener(
            "click",
            event => {

                const href =
                    loginAction.getAttribute("href");

                if (!href || href === "#") {

                    event.preventDefault();

                    console.info(
                        "[Header] Set the login URL in #login-action."
                    );
                }
            },
            { signal }
        );
    }

    /* ========================================================
       24. INITIALIZE HEADER
    ======================================================== */

    function initHeader() {

        const header =
            document.getElementById("header");

        if (!header) return false;

        if (currentHeader !== header) {

            currentHeader = header;

            initHeaderInteractions(header);
        }

        startHaprovenLogo();

        updateThemeIcons();

        applyLanguage(header);

        updateAudioButton(
            Boolean(activeSpeech)
        );

        loadHeaderNavigation();

        loadByHaproven();

        loadHeaderSocialLinks();

        loadLiveText();

        handleHeaderScroll();

        return true;
    }

    /* ========================================================
       25. REFRESH ACTIVE NAVIGATION
    ======================================================== */

    function refreshActiveNavigation() {

        if (!navigationData) return;

        renderNavigation(
            navigationData.navigation_system
        );
    }

    /* ========================================================
       26. GLOBAL FUNCTIONS
    ======================================================== */

    window.initHeader = initHeader;

    window.loadHeaderNavigation =
        loadHeaderNavigation;

    window.loadByHaproven =
        loadByHaproven;

    window.loadHeaderSocialLinks =
        loadHeaderSocialLinks;

    window.loadLiveText =
        loadLiveText;

    window.toggleLanguage =
        toggleLanguage;

    window.applyLanguage =
        applyLanguage;

    window.toggleTheme =
        toggleTheme;

    window.setTheme =
        setTheme;

    window.startHaprovenLogo =
        startHaprovenLogo;

    window.stopHeaderAudio =
        stopAudio;

    /* ========================================================
       27. DYNAMIC SECTION EVENTS
    ======================================================== */

    document.addEventListener(
        "sectionLoaded",
        event => {

            const name = event.detail?.name;

            if (name === "header") {

                initHeader();

                return;
            }

            // Translate newly loaded sections.
            applyLanguage(
                event.detail?.container || document
            );

            // Refresh speech content when needed.
            if (activeSpeech) {
                stopAudio();
            }
        }
    );

    document.addEventListener(
        "websiteLoaded",
        () => {

            initHeader();

            applyLanguage();
        }
    );

    /* ========================================================
       28. HASH CHANGE
    ======================================================== */

    window.addEventListener(
        "hashchange",
        refreshActiveNavigation
    );

    /* ========================================================
       29. SCROLL
    ======================================================== */

    window.addEventListener(
        "scroll",
        handleHeaderScroll,
        { passive: true }
    );

    /* ========================================================
       30. SPEECH VOICES
    ======================================================== */

    if (audioSupported()) {

        speechSynthesis.addEventListener?.(
            "voiceschanged",
            chooseVoice
        );

        chooseVoice();
    }

    /* ========================================================
       31. INITIAL START
    ======================================================== */

    function start() {

        setTheme(
            preferredTheme(),
            false
        );

        initHeader();

        applyLanguage();
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
