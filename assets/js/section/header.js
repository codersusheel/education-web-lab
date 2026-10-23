
/* ============================================================
   HAPROVEN HEADER SYSTEM — V7.0
   One File • One Config • Easy Debugging

   FEATURES
   01. Desktop Navigation
   02. Mobile Navigation
   03. Navigation Dropdown
   04. Six Dot Apps Menu
   05. Haproven Ecosystem
   06. Mobile Social Icons
   07. Dark / Light Theme
   08. Hindi / English
   09. Page Audio Reader
   10. Animated Brand Logo
   11. Header Scroll Behavior
   12. Active Navigation
   13. Dynamic Header Loading
   14. JSON Fallback
   15. Central Error Reporting
============================================================ */

(() => {
    "use strict";

    if (window.HaprovenHeader?.version === "7.0") return;

    /* ========================================================
       01. CONFIG — CHANGE SETTINGS HERE
    ======================================================== */

    const CONFIG = {
        navigation: [
            "/assets/json/side-link.json"
        ],

        hub: [
            "https://raw.githubusercontent.com/codersusheel/haprobase/main/external/json/hub-menu.json",
            "/external/json/hub-menu.json"
        ],

        storage: {
            theme: "theme",
            language: "lang"
        },

        mobileBreakpoint: 1024,
        scrollThreshold: 80,
        hideOnScroll: true,

        audio: {
            selector: "main",
            rate: 0.95,
            pitch: 1,
            volume: 1,
            chunkLength: 180
        },

        debug: true
    };

    /* ========================================================
       02. STATE
    ======================================================== */

    const state = {
        header: null,
        controller: null,
        language: readStorage(CONFIG.storage.language) === "hi"
            ? "hi"
            : "en",

        data: {
            navigation: null,
            hub: null
        },

        requests: {
            navigation: null,
            hub: null
        },

        audio: {
            active: false,
            token: 0,
            chunks: [],
            index: 0
        },

        lastScroll: window.scrollY || 0
    };

    const englishText = new WeakMap();

    /* ========================================================
       03. DEBUG — ALL ERRORS IN ONE PLACE
    ======================================================== */

    function log(feature, message, error = null) {
        if (!CONFIG.debug) return;

        const prefix = `[Haproven Header / ${feature}]`;

        if (error) {
            console.error(prefix, message, error);
        } else {
            console.info(prefix, message);
        }
    }

    function report() {
        return {
            version: "7.0",
            headerFound: Boolean(document.querySelector("#header")),
            navigationLoaded: Boolean(state.data.navigation),
            hubLoaded: Boolean(state.data.hub),
            language: state.language,
            theme: document.documentElement.dataset.theme,
            audioPlaying: state.audio.active,
            elements: {
                desktopNav: Boolean(document.querySelector("#header-links")),
                mobileNav: Boolean(document.querySelector("#mobile-sidebar")),
                social: Boolean(document.querySelector("#header .haproven-sosal-links")),
                ecosystem: Boolean(document.querySelector("#by-haproven")),
                appsMenu: Boolean(document.querySelector("#dot6menu")),
                theme: Boolean(document.querySelector("#theme-toggle")),
                language: Boolean(document.querySelector("#langBtn")),
                audio: Boolean(document.querySelector("#main-audio-button"))
            }
        };
    }

    /* ========================================================
       04. STORAGE
    ======================================================== */

    function readStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    function saveStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
            log("Storage", "LocalStorage unavailable");
        }
    }

    /* ========================================================
       05. COMMON HELPERS
    ======================================================== */

    function $(selector, root = document) {
        return root.querySelector(selector);
    }

    function $$(selector, root = document) {
        return [...root.querySelectorAll(selector)];
    }

    function safeURL(value) {
        if (typeof value !== "string" || !value.trim()) {
            return null;
        }

        if (value.trim() === "#") return "#";

        try {
            const url = new URL(value.trim(), location.href);

            return ["http:", "https:"].includes(url.protocol)
                ? url.href
                : null;
        } catch {
            return null;
        }
    }

    function setLink(anchor, value) {
        const url = safeURL(value);
        if (!url) return false;

        anchor.href = url;

        if (url !== "#") {
            const parsed = new URL(url);

            if (parsed.origin !== location.origin) {
                anchor.target = "_blank";
                anchor.rel = "noopener noreferrer";
            }
        }

        return true;
    }

    function icon(name = "fa-link") {
        const element = document.createElement("i");
        const value = String(name).trim();

        element.className =
            value.includes(" ") || value.startsWith("ri-")
                ? value
                : value.startsWith("fa-")
                    ? `fa-solid ${value}`
                    : value;

        element.setAttribute("aria-hidden", "true");

        return element;
    }

    function normalizePath(path) {
        let value = String(path || "/")
            .replace(/\/index\.html$/i, "/")
            .replace(/\/+/g, "/");

        if (value.length > 1) {
            value = value.replace(/\/$/, "");
        }

        return value;
    }

    function isActive(url) {
        const href = safeURL(url);

        if (!href || href === "#") return false;

        const target = new URL(href);

        return (
            target.origin === location.origin &&
            normalizePath(target.pathname) === normalizePath(location.pathname) &&
            (!target.hash || target.hash === location.hash)
        );
    }

    /* ========================================================
       06. SHARED JSON LOADER
       Both JSON files are managed here.
    ======================================================== */

    async function fetchSources(sources, validate) {
        let lastError = null;

        for (const source of sources) {
            try {
                const response = await fetch(source, {
                    cache: "no-cache",
                    headers: { Accept: "application/json" }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (!validate(data)) {
                    throw new Error("Invalid JSON structure");
                }

                return data;
            } catch (error) {
                lastError = error;
                log("JSON", `Failed: ${source}`, error);
            }
        }

        throw lastError || new Error("No JSON source available");
    }

    function getData(type, force = false) {
        if (!CONFIG[type]) {
            return Promise.reject(new Error(`Unknown data type: ${type}`));
        }

        if (!force && state.data[type]) {
            return Promise.resolve(state.data[type]);
        }

        if (state.requests[type]) {
            return state.requests[type];
        }

        const validator = type === "navigation"
            ? data => Array.isArray(data?.navigation_system)
            : data => (
                data &&
                typeof data === "object" &&
                (
                    Array.isArray(data["hub-menu"]) ||
                    Array.isArray(data.social_links) ||
                    typeof data.liveText === "string"
                )
            );

        state.requests[type] = fetchSources(
            CONFIG[type],
            validator
        ).then(data => {
            state.data[type] = data;
            return data;
        }).finally(() => {
            state.requests[type] = null;
        });

        return state.requests[type];
    }

    /* ========================================================
       07. NAVIGATION LINK
    ======================================================== */

    function makeNavLink(item, className = "", dropdown = false) {
        if (!item || typeof item !== "object") return null;

        const anchor = document.createElement("a");
        const href = item.url || item.href || (dropdown ? "#" : null);

        if (!setLink(anchor, href)) return null;

        if (className) anchor.className = className;

        if (item.icon) {
            anchor.appendChild(icon(item.icon));
        }

        const label = document.createElement("span");
        label.textContent = item.name || item.title || "Untitled";
        anchor.appendChild(label);

        if (isActive(href)) {
            anchor.classList.add("active");
            anchor.setAttribute("aria-current", "page");
        }

        return anchor;
    }

    /* ========================================================
       08. CREATE DESKTOP / MOBILE ITEMS
    ======================================================== */

    function makeNavItem(item, mobile = false) {
        if (!item || typeof item !== "object") return null;

        const children = Array.isArray(item.dropdown_items)
            ? item.dropdown_items
            : [];

        const isDropdown = children.length > 0;

        const li = document.createElement("li");
        li.className = mobile ? "mobile-nav-item" : "nav-item";

        const link = makeNavLink(
            item,
            isDropdown ? "dropdown-toggle" : "nav-link",
            isDropdown
        );

        if (!link) return null;

        li.appendChild(link);

        if (isDropdown) {
            li.classList.add("dropdown");

            const submenu = document.createElement("ul");
            submenu.className = "dropdown-menu";

            children.forEach(child => {
                const childLink = makeNavLink(child);
                if (!childLink) return;

                const childLi = document.createElement("li");

                if (mobile) {
                    childLi.className = "mobile-sub-item";
                }

                childLi.appendChild(childLink);
                submenu.appendChild(childLi);
            });

            if (submenu.children.length) {
                link.classList.add("dropdown-toggle");
                link.setAttribute("aria-expanded", "false");
                link.appendChild(icon("fa-solid fa-chevron-down"));

                li.appendChild(submenu);

                if (submenu.querySelector(".active")) {
                    li.classList.add("has-active-child");

                    if (mobile) {
                        li.classList.add("open");
                        link.setAttribute("aria-expanded", "true");
                    }
                }
            } else {
                li.classList.remove("dropdown");
                link.classList.remove("dropdown-toggle");
            }
        }

        return li;
    }

    /* ========================================================
       09. RENDER NAVIGATION
    ======================================================== */

    function renderNavigation(data) {
        const desktop = $("#header-links");
        const mobile = $("#mobile-sidebar");

        if (!desktop && !mobile) return;

        const desktopFragment = document.createDocumentFragment();
        const mobileFragment = document.createDocumentFragment();

        data.navigation_system.forEach(category => {
            const items = Array.isArray(category?.items)
                ? category.items
                : [];

            items.forEach(item => {
                const placements = Array.isArray(item.placements)
                    ? item.placements
                    : [];

                if (placements.includes("header")) {
                    const element = makeNavItem(item, false);

                    if (element) desktopFragment.appendChild(element);
                }

                if (placements.includes("sidebar_mobile")) {
                    const element = makeNavItem(item, true);

                    if (element) mobileFragment.appendChild(element);
                }
            });
        });

        // Replace dummy HTML only when real items exist.
        if (desktop && desktopFragment.childNodes.length) {
            desktop.replaceChildren(desktopFragment);
        }

        if (mobile && mobileFragment.childNodes.length) {
            mobile.replaceChildren(mobileFragment);
        }
    }

    async function loadNavigation() {
        if (!$("#header-links") && !$("#mobile-sidebar")) return;

        try {
            const data = await getData("navigation");
            renderNavigation(data);
        } catch (error) {
            log("Navigation", "Keeping existing HTML", error);
        }
    }

    /* ========================================================
       10. HAPROVEN ECOSYSTEM
       Target: #by-haproven
    ======================================================== */

    async function loadEcosystem() {
        const container = $("#by-haproven");
        if (!container) return;

        try {
            const data = await getData("hub");
            const items = data["hub-menu"];

            if (!Array.isArray(items)) return;

            const fragment = document.createDocumentFragment();

            items.forEach(item => {
                if (!item?.name || !item?.url) return;

                const li = document.createElement("li");
                const anchor = document.createElement("a");

                if (!setLink(anchor, item.url)) return;

                anchor.className = "member-box";

                const imageURL = safeURL(item.img);

                if (imageURL && imageURL !== "#") {
                    const image = document.createElement("img");

                    image.src = imageURL;
                    image.alt = item.name;
                    image.loading = "lazy";

                    anchor.appendChild(image);
                }

                const label = document.createElement("span");
                label.textContent = item.name;

                anchor.appendChild(label);
                li.appendChild(anchor);
                fragment.appendChild(li);
            });

            if (fragment.childNodes.length) {
                container.replaceChildren(fragment);
            }
        } catch (error) {
            log("Ecosystem", "Keeping existing HTML", error);
        }
    }

    /* ========================================================
       11. SOCIAL ICONS
       Target: #header .haproven-sosal-links
    ======================================================== */

    async function loadSocial() {
        const containers = $$("#header .haproven-sosal-links");

        if (!containers.length) return;

        try {
            const data = await getData("hub");

            if (!Array.isArray(data.social_links)) return;

            containers.forEach(container => {
                const fragment = document.createDocumentFragment();
                const isList = container.tagName === "UL";

                data.social_links.forEach(item => {
                    if (
                        !item ||
                        item.is_active === false ||
                        !item.platform ||
                        !item.url ||
                        !item.icon
                    ) return;

                    const url = safeURL(item.url);
                    if (!url || url === "#") return;

                    const anchor = document.createElement("a");

                    anchor.href = url;
                    anchor.target = "_blank";
                    anchor.rel = "noopener noreferrer";
                    anchor.className = "social-link-item";
                    anchor.title = item.platform;
                    anchor.setAttribute("aria-label", item.platform);

                    const socialIcon = icon(item.icon);

                    if (item.color) {
                        socialIcon.style.color = item.color;
                        anchor.style.setProperty(
                            "--icon-color",
                            item.color
                        );
                    }

                    anchor.appendChild(socialIcon);

                    if (isList) {
                        const li = document.createElement("li");
                        li.appendChild(anchor);
                        fragment.appendChild(li);
                    } else {
                        fragment.appendChild(anchor);
                    }
                });

                if (fragment.childNodes.length) {
                    container.replaceChildren(fragment);
                }
            });
        } catch (error) {
            log("Social", "Keeping existing HTML", error);
        }
    }

    /* ========================================================
       12. OPTIONAL LIVE TEXT
    ======================================================== */

    async function loadLiveText() {
        const element = $("#live-text");
        if (!element) return;

        try {
            const data = await getData("hub");

            if (typeof data.liveText === "string") {
                element.textContent = data.liveText;
            }
        } catch (error) {
            log("LiveText", "Unable to load", error);
        }
    }

    /* ========================================================
       13. THEME
    ======================================================== */

    function preferredTheme() {
        const saved = readStorage(CONFIG.storage.theme);

        if (saved === "dark" || saved === "light") {
            return saved;
        }

        return window.matchMedia?.("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function updateThemeButton() {
        const button = $("#theme-toggle");
        if (!button) return;

        const dark = document.body.classList.contains("dark-mode");

        const sun = $(".sun", button);
        const moon = $(".moon", button);

        if (sun) sun.style.display = dark ? "none" : "inline";
        if (moon) moon.style.display = dark ? "inline" : "none";
    }

    function setTheme(mode, save = true) {
        const dark = mode === "dark";

        document.body.classList.toggle("dark-mode", dark);
        document.documentElement.classList.toggle("dark", dark);
        document.documentElement.dataset.theme = dark ? "dark" : "light";

        if (save) {
            saveStorage(
                CONFIG.storage.theme,
                dark ? "dark" : "light"
            );
        }

        updateThemeButton();
    }

    function toggleTheme() {
        setTheme(
            document.body.classList.contains("dark-mode")
                ? "light"
                : "dark"
        );
    }

    /* ========================================================
       14. LANGUAGE
    ======================================================== */

    function applyLanguage(root = document) {
        const elements = [];

        if (root instanceof Element && root.matches("[data-hi]")) {
            elements.push(root);
        }

        root.querySelectorAll?.("[data-hi]").forEach(element => {
            elements.push(element);
        });

        elements.forEach(element => {
            if (!englishText.has(element)) {
                englishText.set(
                    element,
                    element.getAttribute("data-en") ?? element.textContent
                );
            }

            element.textContent = state.language === "hi"
                ? element.getAttribute("data-hi") || ""
                : englishText.get(element);
        });

        document.documentElement.lang = state.language;

        $$("#langBtn").forEach(button => {
            button.textContent = state.language === "hi"
                ? "Eng."
                : "हिंदी";
        });
    }

    function toggleLanguage() {
        state.language = state.language === "hi" ? "en" : "hi";

        saveStorage(CONFIG.storage.language, state.language);

        stopAudio();
        applyLanguage();
    }

    /* ========================================================
       15. PAGE AUDIO READER
       Long text is divided into smaller chunks.
    ======================================================== */

    function audioSupported() {
        return (
            "speechSynthesis" in window &&
            "SpeechSynthesisUtterance" in window
        );
    }

    function chooseVoice() {
        const voices = speechSynthesis.getVoices();

        const preferred = state.language === "hi"
            ? "hi-IN"
            : "en-IN";

        return (
            voices.find(v => v.lang === preferred) ||
            voices.find(v => v.lang.startsWith(state.language)) ||
            voices.find(v => v.lang.startsWith("en")) ||
            voices[0] ||
            null
        );
    }

    function updateAudioButton() {
        const button = $("#main-audio-button");
        if (!button) return;

        const playing = state.audio.active;

        const iconElement = $("i", button);
        const label = $("span", button);

        if (iconElement) {
            iconElement.className = playing
                ? "fa-solid fa-stop"
                : "fa-solid fa-volume-low";
        }

        if (label) {
            label.textContent = playing ? "Stop" : "Audio";
        }

        button.classList.toggle("audio-playing", playing);
        button.setAttribute("aria-label", playing ? "Stop audio" : "Read page");
    }

    function splitText(text, maxLength) {
        const sentences = text.match(/[^.!?।]+[.!?।]*/g) || [text];
        const chunks = [];
        let current = "";

        sentences.forEach(sentence => {
            const words = sentence.trim().split(/\s+/);

            words.forEach(word => {
                if (!word) return;

                if ((current + " " + word).trim().length > maxLength) {
                    if (current) chunks.push(current.trim());
                    current = word;
                } else {
                    current += (current ? " " : "") + word;
                }
            });
        });

        if (current.trim()) chunks.push(current.trim());

        return chunks;
    }

    function stopAudio() {
        state.audio.token++;
        state.audio.active = false;
        state.audio.chunks = [];
        state.audio.index = 0;

        if (audioSupported()) {
            speechSynthesis.cancel();
        }

        updateAudioButton();
    }

    function speakNext(token) {
        if (
            !state.audio.active ||
            token !== state.audio.token
        ) return;

        if (state.audio.index >= state.audio.chunks.length) {
            stopAudio();
            return;
        }

        const text = state.audio.chunks[state.audio.index++];
        const speech = new SpeechSynthesisUtterance(text);
        const voice = chooseVoice();

        speech.lang = state.language === "hi" ? "hi-IN" : "en-IN";

        if (voice) {
            speech.voice = voice;
            speech.lang = voice.lang;
        }

        speech.rate = CONFIG.audio.rate;
        speech.pitch = CONFIG.audio.pitch;
        speech.volume = CONFIG.audio.volume;

        speech.onend = () => speakNext(token);

        speech.onerror = event => {
            if (token !== state.audio.token) return;

            log("Audio", `Speech error: ${event.error}`);
            stopAudio();
        };

        speechSynthesis.speak(speech);
    }

    function toggleAudio() {
        if (!audioSupported()) {
            log("Audio", "Speech synthesis not supported");
            return;
        }

        if (state.audio.active) {
            stopAudio();
            return;
        }

        const main = $(CONFIG.audio.selector);

        if (!main) {
            log("Audio", "Main content not found");
            return;
        }

        const text = (main.innerText || main.textContent || "")
            .replace(/\s+/g, " ")
            .trim();

        if (!text) {
            log("Audio", "No readable text found");
            return;
        }

        stopAudio();

        state.audio.chunks = splitText(
            text,
            CONFIG.audio.chunkLength
        );

        state.audio.index = 0;
        state.audio.active = true;

        const token = state.audio.token;

        updateAudioButton();
        speakNext(token);
    }

    /* ========================================================
       16. ANIMATED BRAND LOGO
       Uses existing logo classes and styling.
    ======================================================== */

    function injectBrandCSS() {
        if ($("#haproven-brand-style")) return;

        const style = document.createElement("style");
        style.id = "haproven-brand-style";

        style.textContent = `
            .haproven-brand {
                display:flex;
                align-items:center;
                width:max-content;
                cursor:pointer;
                user-select:none;
            }

            .haproven-icon {
                position:relative;
                width:36px;
                height:48px;
                display:flex;
                align-items:center;
                justify-content:center;
                flex-shrink:0;
            }

            .shadow-layer {
                position:absolute;
                width:33px;
                height:45px;
                top:-2px;
                left:-2px;
                opacity:.35;
                background:linear-gradient(135deg,#bc1be7,#ffffff55);
                clip-path:polygon(0 0,100% 0,100% 100%,50% 88%,0 100%);
                border-radius:6px 6px 0 0;
            }

            .main-bookmark {
                position:relative;
                width:30px;
                height:42px;
                background:linear-gradient(135deg,#bc1be7,#d94dff);
                clip-path:polygon(0 0,100% 0,100% 100%,50% 88%,0 100%);
                border-radius:6px 6px 0 0;
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:2;
                box-shadow:0 7px 16px rgba(188,27,231,.30);
            }

            .haproven-icon svg {
                width:32px;
                height:32px;
                margin-right:-4px;
                fill:none;
            }

            .path-line {
                stroke:#fff;
                stroke-width:6;
                stroke-linecap:round;
                stroke-linejoin:round;
                stroke-dasharray:260;
                stroke-dashoffset:260;
                animation:hapDraw 2.8s ease-in-out infinite;
            }

            .brand-bar {
                min-height:30px;
                padding:2px 7px;
                display:flex;
                align-items:center;
                margin-left:-2px;
                border-radius:0 8px 8px 0;
                border:2px solid #bc1be7;
                border-left:none;
                backdrop-filter:blur(10px);
            }

            .brand-text {
                display:flex;
                flex-direction:column;
                line-height:1;
            }

            .brand-text strong {
                font-size:11px;
                font-weight:900;
                letter-spacing:.25px;
            }

            .brand-text small {
                font-size:8px;
                font-weight:600;
                opacity:.7;
                margin-top:2px;
                text-transform:uppercase;
            }

            .haproven-brand.icon-only .brand-bar {
                display:none;
            }

            @keyframes hapDraw {
                0% {stroke-dashoffset:260;opacity:.6}
                50% {stroke-dashoffset:0;opacity:1}
                100% {stroke-dashoffset:-260;opacity:.6}
            }
        `;

        document.head.appendChild(style);
    }

    function initBrand() {
        const brands = $$("#header .haproven-brand");
        if (!brands.length) return;

        injectBrandCSS();

        brands.forEach(element => {
            if (element.dataset.brandReady === "true") return;

            const fullName = element.dataset.name || "Haproven";
            const parts = fullName.split(/\s+by\s+/i);

            const name = parts[0]?.trim() || "Haproven";
            const by = parts.slice(1).join(" by ").trim();

            const symbol = document.createElement("div");
            symbol.className = "haproven-icon";

            const shadow = document.createElement("div");
            shadow.className = "shadow-layer";

            const bookmark = document.createElement("div");
            bookmark.className = "main-bookmark";

            bookmark.innerHTML = `
                <svg viewBox="0 0 100 100" aria-hidden="true">
                    <path class="path-line"
                        d="M10 0 L10 70 A10 10 0 0 0 30 70
                           L30 20 A10 10 0 0 1 50 20
                           L50 70 A16 9 0 0 0 70 80
                           A13 20 0 0 1 80 94 L100 95"/>
                </svg>
            `;

            symbol.append(shadow, bookmark);

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

            element.replaceChildren(symbol, bar);
            element.dataset.brandReady = "true";
        });
    }

    /* ========================================================
       17. MENU CONTROLS
    ======================================================== */

    function closeAppsMenu() {
        $("#teamDropdown")?.classList.remove("active");

        const button = $("#dot6menu");
        button?.classList.remove("active");
        button?.setAttribute("aria-expanded", "false");
    }

    function closeMobileMenu() {
        $("#navbar-mobile")?.classList.remove("show");

        const button = $("#mobile-menu-toggle");
        button?.classList.remove("active");
        button?.setAttribute("aria-expanded", "false");

        document.body.style.overflow = "";
    }

    function closeMenus() {
        closeAppsMenu();
        closeMobileMenu();
    }

    /* ========================================================
       18. ALL HEADER EVENTS — ONE PLACE
    ======================================================== */

    function bindEvents(header) {
        state.controller?.abort();

        const controller = new AbortController();
        state.controller = controller;

        const { signal } = controller;

        const appsButton = $("#dot6menu", header);
        const appsMenu = $("#teamDropdown", header);

        const mobileButton = $("#mobile-menu-toggle", header);
        const mobileMenu = $("#navbar-mobile", header);

        /* Six Dot Menu */

        appsButton?.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();

            const open = !appsMenu?.classList.contains("active");

            closeMobileMenu();

            appsMenu?.classList.toggle("active", open);
            appsButton.classList.toggle("active", open);
            appsButton.setAttribute("aria-expanded", String(open));
        }, { signal });

        /* Mobile Menu */

        function toggleMobileMenu() {
            if (!mobileMenu) return;

            const open = !mobileMenu.classList.contains("show");

            closeAppsMenu();

            mobileMenu.classList.toggle("show", open);
            mobileButton?.classList.toggle("active", open);
            mobileButton?.setAttribute("aria-expanded", String(open));

            document.body.style.overflow = open ? "hidden" : "";
        }

        if (mobileButton) {
            mobileButton.setAttribute("role", "button");
            mobileButton.setAttribute("tabindex", "0");
            mobileButton.setAttribute("aria-expanded", "false");

            mobileButton.addEventListener(
                "click",
                toggleMobileMenu,
                { signal }
            );

            mobileButton.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleMobileMenu();
                }
            }, { signal });
        }

        /* Dropdown Navigation */

        header.addEventListener("click", event => {
            const trigger = event.target.closest(".dropdown-toggle");

            if (!trigger || !header.contains(trigger)) return;

            const parent = trigger.closest(".dropdown");
            const submenu = parent?.querySelector(".dropdown-menu");

            if (!submenu) return;

            event.preventDefault();

            const open = !parent.classList.contains("open");

            parent.classList.toggle("open", open);
            trigger.setAttribute("aria-expanded", String(open));
        }, { signal });

        /* Mobile Link Click */

        mobileMenu?.addEventListener("click", event => {
            const link = event.target.closest("a");

            if (link && !link.classList.contains("dropdown-toggle")) {
                closeMobileMenu();
            }
        }, { signal });

        /* Outside Click */

        document.addEventListener("click", event => {
            const target = event.target;

            if (
                appsButton &&
                appsMenu &&
                !appsButton.contains(target) &&
                !appsMenu.contains(target)
            ) {
                closeAppsMenu();
            }

            if (
                mobileButton &&
                mobileMenu &&
                !mobileButton.contains(target) &&
                !mobileMenu.contains(target)
            ) {
                closeMobileMenu();
            }
        }, { signal });

        /* Escape */

        document.addEventListener("keydown", event => {
            if (event.key !== "Escape") return;

            closeMenus();

            $$(".dropdown.open", header).forEach(item => {
                item.classList.remove("open");

                $(".dropdown-toggle", item)
                    ?.setAttribute("aria-expanded", "false");
            });
        }, { signal });

        /* Resize */

        window.addEventListener("resize", () => {
            if (window.innerWidth > CONFIG.mobileBreakpoint) {
                closeMobileMenu();
            }
        }, { signal });

        /* Theme */

        $("#theme-toggle", header)?.addEventListener("click", event => {
            event.preventDefault();
            toggleTheme();
        }, { signal });

        /* Language */

        const languageAction = $("#langBtn", header)
            ?.closest(".action-box");

        if (languageAction) {
            // Prevent duplicate toggling from inline onclick.
            languageAction.removeAttribute("onclick");

            languageAction.addEventListener("click", event => {
                event.preventDefault();
                toggleLanguage();
            }, { signal });
        }

        /* Audio */

        $("#main-audio-button", header)?.addEventListener("click", event => {
            event.preventDefault();
            toggleAudio();
        }, { signal });

        /* Login */

        $("#login-action", header)?.addEventListener("click", event => {
            if (
                !event.currentTarget.getAttribute("href") ||
                event.currentTarget.getAttribute("href") === "#"
            ) {
                event.preventDefault();
                log("Login", "Configure the login URL in header HTML");
            }
        }, { signal });
    }

    /* ========================================================
       19. HEADER SCROLL
    ======================================================== */

    function handleScroll() {
        if (!CONFIG.hideOnScroll) return;

        const header = $("#header");
        if (!header) return;

        const current = Math.max(0, window.scrollY || 0);

        if (
            current > state.lastScroll &&
            current > CONFIG.scrollThreshold
        ) {
            header.classList.add("hide");
        } else if (
            current < state.lastScroll ||
            current <= 10
        ) {
            header.classList.remove("hide");
        }

        state.lastScroll = current;
    }

    /* ========================================================
       20. INITIALIZE EVERYTHING
    ======================================================== */

    function init() {
        const header = $("#header");
        if (!header) return false;

        if (state.header !== header) {
            state.header = header;
            bindEvents(header);
        }

        initBrand();
        updateThemeButton();
        updateAudioButton();
        applyLanguage(header);

        // Independent loaders:
        // One failure cannot stop the others.
        loadNavigation();
        loadEcosystem();
        loadSocial();
        loadLiveText();

        handleScroll();

        return true;
    }

    /* ========================================================
       21. REFRESH / RELOAD
    ======================================================== */

    async function reload(type = "all") {
        const valid = ["all", "navigation", "hub"];

        if (!valid.includes(type)) {
            log("Reload", `Unknown type: ${type}`);
            return;
        }

        const tasks = [];

        if (type === "all" || type === "navigation") {
            tasks.push(
                getData("navigation", true)
                    .then(data => renderNavigation(data))
            );
        }

        if (type === "all" || type === "hub") {
            tasks.push(
                getData("hub", true).then(() =>
                    Promise.all([
                        loadEcosystem(),
                        loadSocial(),
                        loadLiveText()
                    ])
                )
            );
        }

        const results = await Promise.allSettled(tasks);

        results.forEach((result, index) => {
            if (result.status === "rejected") {
                log("Reload", `Task ${index + 1} failed`, result.reason);
            }
        });

        return results;
    }

    /* ========================================================
       22. PUBLIC API — CONTROL EVERYTHING HERE
    ======================================================== */

    const API = {
        version: "7.0",
        config: CONFIG,

        init,
        reload,
        report,

        navigation: loadNavigation,
        ecosystem: loadEcosystem,
        social: loadSocial,
        liveText: loadLiveText,

        theme: {
            set: setTheme,
            toggle: toggleTheme
        },

        language: {
            toggle: toggleLanguage,
            apply: applyLanguage
        },

        audio: {
            toggle: toggleAudio,
            stop: stopAudio
        },

        menus: {
            close: closeMenus
        },

        logo: initBrand
    };

    window.HaprovenHeader = API;

    /* Existing compatibility functions */

    window.initHeader = init;
    window.loadHeaderNavigation = loadNavigation;
    window.loadByHaproven = loadEcosystem;
    window.loadHeaderSocialLinks = loadSocial;
    window.loadLiveText = loadLiveText;

    window.toggleLanguage = toggleLanguage;
    window.applyLanguage = applyLanguage;
    window.toggleTheme = toggleTheme;
    window.setTheme = setTheme;
    window.startHaprovenLogo = initBrand;
    window.stopHeaderAudio = stopAudio;

    /* ========================================================
       23. DYNAMIC SECTIONS
    ======================================================== */

    document.addEventListener("sectionLoaded", event => {
        if (event.detail?.name === "header") {
            init();
            return;
        }

        const container = event.detail?.container;

        if (container instanceof Element) {
            applyLanguage(container);
        }

        if (state.audio.active) {
            stopAudio();
        }
    });

    document.addEventListener("websiteLoaded", () => {
        init();
        applyLanguage();
    });

    window.addEventListener("hashchange", () => {
        if (state.data.navigation) {
            renderNavigation(state.data.navigation);
        }
    });

    window.addEventListener("scroll", handleScroll, {
        passive: true
    });

    /* ========================================================
       24. START
    ======================================================== */

    function start() {
        setTheme(preferredTheme(), false);
        init();
        applyLanguage();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, {
            once: true
        });
    } else {
        start();
    }

})();
