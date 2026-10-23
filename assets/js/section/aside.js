/* ============================================================
   HAPROVEN ASIDE SYSTEM — V2.0
   Complete Sidebar Controller

   HTML TARGETS:
   #aside
   #live-text
   #liv-open-page
   #laptop-sidebar
   #aside .haproven-sosal-links

   JSON SOURCES:
   /assets/json/side-link.json
   /assets/json/page-sidebar.json
   /external/json/hub-menu.json

   FEATURES:
   01. Live Status
   02. Current Open Page
   03. Laptop Sidebar Navigation
   04. Nested Submenus
   05. Active Page Detection
   06. Page-Specific Sidebar
   07. Social Media Icons
   08. JSON Fallback
   09. Dynamic HTML Support
   10. Central Debugging
   11. Manual Refresh
============================================================ */

(() => {
    "use strict";

    /* ========================================================
       01. PREVENT DUPLICATE INITIALIZATION
    ======================================================== */

    if (window.HaprovenAside?.version === "2.0") return;

    /* ========================================================
       02. CONFIGURATION
       Change URLs and settings here.
    ======================================================== */

    const CONFIG = {
        sources: {
            navigation: [
                "/assets/json/side-link.json"
            ],

            pageSidebar: [
                "/assets/json/page-sidebar.json"
            ],

            hub: [
                "https://raw.githubusercontent.com/codersusheel/haprobase/main/external/json/hub-menu.json",
                "/external/json/hub-menu.json"
            ]
        },

        selectors: {
            aside: "#aside",
            liveText: "#live-text",
            currentPage: "#liv-open-page",
            navigation: "#laptop-sidebar",
            social: "#aside .haproven-sosal-links"
        },

        maxMenuDepth: 8,
        debug: true
    };

    /* ========================================================
       03. INTERNAL STATE
    ======================================================== */

    const state = {
        aside: null,
        controller: null,
        renderVersion: 0,

        data: {
            navigation: null,
            pageSidebar: null,
            hub: null
        },

        requests: {
            navigation: null,
            pageSidebar: null,
            hub: null
        }
    };

    /* ========================================================
       04. DEBUGGING
    ======================================================== */

    function log(feature, message, error = null) {
        if (!CONFIG.debug) return;

        const prefix = `[Haproven Aside / ${feature}]`;

        if (error) {
            console.error(prefix, message, error);
        } else {
            console.info(prefix, message);
        }
    }

    function report() {
        return {
            version: "2.0",
            asideFound: Boolean(find(CONFIG.selectors.aside)),
            currentURL: location.href,

            loaded: {
                navigation: Boolean(state.data.navigation),
                pageSidebar: Boolean(state.data.pageSidebar),
                hub: Boolean(state.data.hub)
            },

            elements: {
                liveText: Boolean(find(CONFIG.selectors.liveText)),
                currentPage: Boolean(find(CONFIG.selectors.currentPage)),
                navigation: Boolean(find(CONFIG.selectors.navigation)),
                social: Boolean(find(CONFIG.selectors.social))
            },

            currentPage: getCurrentPageInfo()
        };
    }

    /* ========================================================
       05. DOM HELPERS
    ======================================================== */

    function find(selector, root = document) {
        return root.querySelector(selector);
    }

    function findAll(selector, root = document) {
        return Array.from(root.querySelectorAll(selector));
    }

    function cleanText(value, fallback = "") {
        if (typeof value !== "string") return fallback;

        return value.trim() || fallback;
    }

    function safeURL(value) {
        if (typeof value !== "string" || !value.trim()) {
            return null;
        }

        if (value.trim() === "#") return "#";

        try {
            const url = new URL(value.trim(), location.href);

            if (!["http:", "https:"].includes(url.protocol)) {
                return null;
            }

            return url.href;
        } catch {
            return null;
        }
    }

    function setLink(anchor, value) {
        const url = safeURL(value);

        if (!url) return false;

        anchor.href = url;

        if (url !== "#") {
            const target = new URL(url);

            if (target.origin !== location.origin) {
                anchor.target = "_blank";
                anchor.rel = "noopener noreferrer";
            }
        }

        return true;
    }

    function createIcon(name, fallback = "fa-solid fa-link") {
        const element = document.createElement("i");
        const value = cleanText(name, fallback);

        if (
            value.includes(" ") ||
            value.startsWith("ri-")
        ) {
            element.className = value;
        } else if (value.startsWith("fa-")) {
            element.className = `fa-solid ${value}`;
        } else {
            element.className = value;
        }

        element.setAttribute("aria-hidden", "true");

        return element;
    }

    /* ========================================================
       06. URL / ACTIVE PAGE HELPERS
    ======================================================== */

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
        const href = safeURL(value);

        if (!href || href === "#") return false;

        try {
            const url = new URL(href);

            if (url.origin !== location.origin) return false;

            if (
                normalizePath(url.pathname) !==
                normalizePath(location.pathname)
            ) {
                return false;
            }

            return !url.hash || url.hash === location.hash;
        } catch {
            return false;
        }
    }

    /* ========================================================
       07. JSON FETCHER
       All JSON requests are managed here.
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
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (!validator(data)) {
                    throw new Error("Invalid JSON structure");
                }

                return data;

            } catch (error) {
                lastError = error;
                log("JSON", `Unable to load ${source}`, error);
            }
        }

        throw lastError || new Error("No valid JSON source");
    }

    function getData(type, force = false) {
        const sources = CONFIG.sources[type];

        if (!sources) {
            return Promise.reject(
                new Error(`Unknown data source: ${type}`)
            );
        }

        if (!force && state.data[type]) {
            return Promise.resolve(state.data[type]);
        }

        if (state.requests[type]) {
            return state.requests[type];
        }

        const validators = {
            navigation: data =>
                Array.isArray(data?.navigation_system),

            pageSidebar: data =>
                data !== null &&
                typeof data === "object",

            hub: data =>
                data !== null &&
                typeof data === "object" &&
                (
                    Array.isArray(data.social_links) ||
                    typeof data.liveText === "string" ||
                    Array.isArray(data["hub-menu"])
                )
        };

        const request = fetchJSON(
            sources,
            validators[type]
        ).then(data => {
            state.data[type] = data;
            return data;
        }).finally(() => {
            if (state.requests[type] === request) {
                state.requests[type] = null;
            }
        });

        state.requests[type] = request;

        return request;
    }

    /* ========================================================
       08. LIVE STATUS
       HTML: #live-text
    ======================================================== */

    async function loadLiveText() {
        const element = find(CONFIG.selectors.liveText);

        if (!element) return;

        try {
            const data = await getData("hub");

            // Supports string liveText.
            if (
                typeof data.liveText === "string" &&
                data.liveText.trim()
            ) {
                element.textContent = data.liveText.trim();
                return;
            }

            // Supports object liveText with text/message.
            if (
                data.liveText &&
                typeof data.liveText === "object"
            ) {
                const value = cleanText(
                    data.liveText.text ||
                    data.liveText.message ||
                    data.liveText.status
                );

                if (value) {
                    element.textContent = value;
                }
            }

        } catch (error) {
            log("Live Status", "Existing HTML retained", error);
        }
    }

    /* ========================================================
       09. CURRENT PAGE DETECTION
       HTML: #liv-open-page

       Priority:
       1. Active navigation link
       2. Main H1
       3. Document title
       4. URL pathname
    ======================================================== */

    function getCurrentPageInfo() {

        /* 1. Active navigation */

        const activeLink = find(
            "#laptop-sidebar a.active:not(.submenu-toggle), " +
            "#header-links a.active:not(.dropdown-toggle), " +
            "#mobile-sidebar a.active:not(.dropdown-toggle)"
        );

        if (activeLink) {
            const span = find("span", activeLink);

            const name = cleanText(
                span?.textContent ||
                activeLink.textContent
            );

            if (name) {
                const pageIcon = find("i", activeLink);

                return {
                    name,
                    icon: pageIcon?.className ||
                        "fa-solid fa-file-lines",
                    source: "navigation"
                };
            }
        }

        /* 2. Main heading */

        const heading = find(
            "main h1, .main h1"
        );

        if (heading) {
            const name = cleanText(heading.textContent);

            if (name) {
                return {
                    name,
                    icon: "fa-solid fa-file-lines",
                    source: "heading"
                };
            }
        }

        /* 3. Document title */

        const title = cleanText(
            document.title
                .split("|")[0]
                .split("—")[0]
        );

        if (title) {
            return {
                name: title,
                icon: "fa-solid fa-file-lines",
                source: "document-title"
            };
        }

        /* 4. URL fallback */

        const path = normalizePath(location.pathname);

        if (path === "/") {
            return {
                name: "Home",
                icon: "fa-solid fa-house",
                source: "url"
            };
        }

        const segment = path
            .split("/")
            .filter(Boolean)
            .pop();

        let name = "Current Page";

        if (segment) {
            try {
                name = decodeURIComponent(segment)
                    .replace(/[-_]+/g, " ")
                    .replace(/\b\w/g, letter => letter.toUpperCase());
            } catch {
                name = segment;
            }
        }

        return {
            name,
            icon: "fa-solid fa-file-lines",
            source: "url"
        };
    }

    /* ========================================================
       10. RENDER CURRENT PAGE
       HTML: #liv-open-page
    ======================================================== */

    function loadCurrentPage() {
        const container = find(CONFIG.selectors.currentPage);

        if (!container) return;

        const page = getCurrentPageInfo();

        if (!page.name) return;

        const pageIcon = createIcon(
            page.icon,
            "fa-solid fa-file-lines"
        );

        const label = document.createElement("span");
        label.className = "current-page-name";
        label.textContent = page.name;

        container.replaceChildren(pageIcon, label);

        container.title = `Current Page: ${page.name}`;
        container.dataset.pageSource = page.source;
    }

    /* ========================================================
       11. NAVIGATION LINK
    ======================================================== */

    function createNavLink(item, hasChildren = false) {
        if (!item || typeof item !== "object") return null;

        const anchor = document.createElement("a");

        const href =
            item.url ||
            item.href ||
            (hasChildren ? "#" : null);

        if (!setLink(anchor, href)) return null;

        if (item.icon) {
            anchor.appendChild(createIcon(item.icon));
        }

        const label = document.createElement("span");

        label.textContent =
            item.name ||
            item.title ||
            item.label ||
            "Untitled";

        anchor.appendChild(label);

        if (isActiveURL(href)) {
            anchor.classList.add("active");
            anchor.setAttribute("aria-current", "page");
        }

        return anchor;
    }

    /* ========================================================
       12. NESTED NAVIGATION
    ======================================================== */

    function createNavItem(item, depth = 0) {
        if (!item || typeof item !== "object") return null;

        if (depth >= CONFIG.maxMenuDepth) return null;

        const children =
            Array.isArray(item.dropdown_items)
                ? item.dropdown_items
                : Array.isArray(item.children)
                    ? item.children
                    : Array.isArray(item.items)
                        ? item.items
                        : [];

        const hasChildren = children.length > 0;

        const li = document.createElement("li");
        li.className = "nav-item";

        const anchor = createNavLink(item, hasChildren);

        if (!anchor) return null;

        li.appendChild(anchor);

        if (hasChildren) {
            const submenu = document.createElement("ul");
            submenu.className = "submenu";

            children.forEach(child => {
                const childElement = createNavItem(
                    child,
                    depth + 1
                );

                if (childElement) {
                    submenu.appendChild(childElement);
                }
            });

            if (submenu.children.length) {
                li.classList.add("has-submenu");

                anchor.classList.add("submenu-toggle");
                anchor.setAttribute("aria-expanded", "false");

                anchor.appendChild(
                    createIcon("fa-solid fa-chevron-down")
                );

                li.appendChild(submenu);

                if (submenu.querySelector("a.active")) {
                    li.classList.add("active-parent", "open");
                    anchor.setAttribute("aria-expanded", "true");
                }
            }
        }

        return li;
    }

    /* ========================================================
       13. MAIN SIDEBAR NAVIGATION
       Source: side-link.json
       Placement: sidebar_laptop
    ======================================================== */

    function buildMainNavigation(data) {
        const fragment = document.createDocumentFragment();

        if (!Array.isArray(data?.navigation_system)) {
            return fragment;
        }

        data.navigation_system.forEach(category => {
            const items = Array.isArray(category?.items)
                ? category.items
                : [];

            items.forEach(item => {
                const placements = Array.isArray(item.placements)
                    ? item.placements
                    : [];

                if (!placements.includes("sidebar_laptop")) {
                    return;
                }

                const element = createNavItem(item);

                if (element) {
                    fragment.appendChild(element);
                }
            });
        });

        return fragment;
    }

    /* ========================================================
       14. PAGE-SPECIFIC NAVIGATION
       Source: page-sidebar.json

       Supported formats:
       {
           "default": [...],
           "pages": {
               "/about/": [...]
           }
       }

       OR:
       {
           "pages": {
               "/about/": {
                   "items": [...]
               }
           }
       }
    ======================================================== */

    function extractItems(value) {
        if (Array.isArray(value)) return value;

        if (!value || typeof value !== "object") {
            return [];
        }

        if (Array.isArray(value.items)) {
            return value.items;
        }

        if (Array.isArray(value.links)) {
            return value.links;
        }

        if (Array.isArray(value.navigation)) {
            return value.navigation;
        }

        return [];
    }

    function getPageSpecificItems(data) {
        if (!data || typeof data !== "object") {
            return [];
        }

        const current = normalizePath(location.pathname);

        const pages =
            data.pages ||
            data.routes ||
            data.paths ||
            {};

        let match = null;
        let longest = -1;

        if (pages && typeof pages === "object") {
            Object.entries(pages).forEach(([path, value]) => {
                const target = normalizePath(path);

                const matches =
                    current === target ||
                    (
                        target !== "/" &&
                        current.startsWith(target + "/")
                    );

                if (matches && target.length > longest) {
                    match = value;
                    longest = target.length;
                }
            });
        }

        const defaults = extractItems(
            data.default ||
            data.default_navigation ||
            data.global
        );

        const specific = extractItems(match);

        return [...defaults, ...specific];
    }

    function buildPageNavigation(data) {
        const fragment = document.createDocumentFragment();

        const items = getPageSpecificItems(data);

        items.forEach(item => {
            const element = createNavItem(item);

            if (element) {
                fragment.appendChild(element);
            }
        });

        return fragment;
    }

    /* ========================================================
       15. RENDER LAPTOP SIDEBAR
    ======================================================== */

    async function loadSidebarNavigation() {
        const container = find(CONFIG.selectors.navigation);

        if (!container) return;

        const version = ++state.renderVersion;

        try {
            const data = await getData("navigation");

            const fragment = buildMainNavigation(data);

            // Page-specific links are optional.
            try {
                const pageData = await getData("pageSidebar");

                const pageFragment = buildPageNavigation(pageData);

                fragment.appendChild(pageFragment);

            } catch (error) {
                log(
                    "Page Sidebar",
                    "Optional page links unavailable",
                    error
                );
            }

            // Prevent an old request from replacing newer HTML.
            if (version !== state.renderVersion) return;

            if (
                !container.isConnected ||
                container !== find(CONFIG.selectors.navigation)
            ) return;

            // Keep dummy HTML when no valid links are available.
            if (fragment.childNodes.length) {
                container.replaceChildren(fragment);

                refreshActiveNavigation();
                loadCurrentPage();
            }

        } catch (error) {
            log(
                "Sidebar Navigation",
                "Keeping existing HTML",
                error
            );
        }
    }

    /* ========================================================
       16. SOCIAL MEDIA ICONS
       HTML: #aside .haproven-sosal-links
    ======================================================== */

    async function loadSocialLinks() {
        const containers = findAll(CONFIG.selectors.social);

        if (!containers.length) return;

        try {
            const data = await getData("hub");

            if (!Array.isArray(data.social_links)) return;

            containers.forEach(container => {
                const fragment = document.createDocumentFragment();

                const isList =
                    container.tagName.toLowerCase() === "ul";

                data.social_links.forEach(item => {
                    if (
                        !item ||
                        item.is_active === false ||
                        !item.platform ||
                        !item.url ||
                        !item.icon
                    ) return;

                    const href = safeURL(item.url);

                    if (!href || href === "#") return;

                    const anchor = document.createElement("a");

                    anchor.href = href;
                    anchor.target = "_blank";
                    anchor.rel = "noopener noreferrer";
                    anchor.className = "social-link-item";
                    anchor.title = item.platform;

                    anchor.setAttribute(
                        "aria-label",
                        item.platform
                    );

                    const socialIcon = createIcon(item.icon);

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
            log(
                "Social Icons",
                "Keeping existing HTML",
                error
            );
        }
    }

    /* ========================================================
       17. ACTIVE NAVIGATION
    ======================================================== */

    function refreshActiveNavigation() {
        const container = find(CONFIG.selectors.navigation);

        if (!container) return;

        findAll("a[href]", container).forEach(anchor => {
            const active = isActiveURL(
                anchor.getAttribute("href")
            );

            anchor.classList.toggle("active", active);

            if (active) {
                anchor.setAttribute("aria-current", "page");
            } else {
                anchor.removeAttribute("aria-current");
            }
        });

        findAll(".has-submenu", container).forEach(item => {
            const hasActive = Boolean(
                item.querySelector("a.active")
            );

            item.classList.toggle(
                "active-parent",
                hasActive
            );

            if (hasActive) {
                item.classList.add("open");

                const toggle = item.querySelector(
                    ":scope > .submenu-toggle"
                );

                toggle?.setAttribute("aria-expanded", "true");
            }
        });
    }

    /* ========================================================
       18. SUBMENU CLICK EVENTS
    ======================================================== */

    function bindEvents(aside) {
        state.controller?.abort();

        const controller = new AbortController();
        state.controller = controller;

        aside.addEventListener("click", event => {
            const toggle = event.target.closest(
                ".submenu-toggle"
            );

            if (!toggle || !aside.contains(toggle)) {
                return;
            }

            const item = toggle.closest(".has-submenu");

            if (!item) return;

            const submenu = item.querySelector(
                ":scope > .submenu"
            );

            if (!submenu) return;

            event.preventDefault();

            const open = !item.classList.contains("open");

            item.classList.toggle("open", open);

            toggle.setAttribute(
                "aria-expanded",
                String(open)
            );

        }, {
            signal: controller.signal
        });
    }

    /* ========================================================
       19. INITIALIZE ASIDE
    ======================================================== */

    function init() {
        const aside = find(CONFIG.selectors.aside);

        if (!aside) return false;

        if (state.aside !== aside) {
            state.aside = aside;
            bindEvents(aside);
        }

        loadLiveText();
        loadCurrentPage();
        loadSidebarNavigation();
        loadSocialLinks();

        return true;
    }

    /* ========================================================
       20. MANUAL RELOAD
    ======================================================== */

    async function reload(type = "all") {
        const validTypes = [
            "all",
            "navigation",
            "pageSidebar",
            "hub"
        ];

        if (!validTypes.includes(type)) {
            log("Reload", `Unknown type: ${type}`);
            return [];
        }

        const types = type === "all"
            ? ["navigation", "pageSidebar", "hub"]
            : [type];

        const results = await Promise.allSettled(
            types.map(name => getData(name, true))
        );

        // Render with the latest available data.
        if (type === "all" || type === "navigation" || type === "pageSidebar") {
            await loadSidebarNavigation();
        }

        if (type === "all" || type === "hub") {
            await Promise.allSettled([
                loadLiveText(),
                loadSocialLinks()
            ]);
        }

        loadCurrentPage();

        return results;
    }

    /* ========================================================
       21. PUBLIC API
    ======================================================== */

    const API = {
        version: "2.0",

        config: CONFIG,

        init,
        reload,
        report,

        liveText: loadLiveText,
        currentPage: loadCurrentPage,
        navigation: loadSidebarNavigation,
        social: loadSocialLinks,
        refreshActive: refreshActiveNavigation,

        getCurrentPageInfo
    };

    window.HaprovenAside = API;

    /* ========================================================
       22. BACKWARD COMPATIBILITY
    ======================================================== */

    window.initAside = init;
    window.loadAsideNavigation = loadSidebarNavigation;
    window.loadAsideSocialLinks = loadSocialLinks;
    window.loadAsideLiveText = loadLiveText;
    window.loadCurrentPage = loadCurrentPage;

    /* ========================================================
       23. DYNAMIC SECTION EVENTS
    ======================================================== */

    document.addEventListener("sectionLoaded", event => {
        const name = event.detail?.name;

        if (name === "aside") {
            init();
            return;
        }

        if (
            name === "main" ||
            name === "content" ||
            name === "page" ||
            name === "header"
        ) {
            loadCurrentPage();
            refreshActiveNavigation();
        }
    });

    document.addEventListener("websiteLoaded", () => {
        init();
        loadCurrentPage();
    });

    window.addEventListener("hashchange", () => {
        refreshActiveNavigation();
        loadCurrentPage();
    });

    window.addEventListener("popstate", () => {
        refreshActiveNavigation();
        loadCurrentPage();
    });

    /* ========================================================
       24. START
    ======================================================== */

    function start() {
        init();
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