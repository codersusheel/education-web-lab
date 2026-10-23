
/* ==========================================
   MODERN HAPROVEN HEADER JS
========================================== */

(() => {
    "use strict";

    const NAVIGATION = [
        { name: "Home", url: "/", icon: "fa-house" },
        { name: "About", url: "/#about-section", icon: "fa-circle-info" },
        { name: "Features", url: "/#features-section", icon: "fa-layer-group" },
        { name: "Projects", url: "/#projects-section", icon: "fa-code" },
        { name: "Docs", url: "/#documentation-section", icon: "fa-book" },
        { name: "Contact", url: "/#contact-section", icon: "fa-envelope" }
    ];

    const APPS = [
        {
            name: "Haproven",
            url: "https://haproven.netlify.app/",
            icon: "fa-globe"
        },
        {
            name: "HaproID",
            url: "https://haproid.netlify.app/",
            icon: "fa-id-card"
        },
        {
            name: "HaproShow",
            url: "https://haproshow.netlify.app/",
            icon: "fa-display"
        },
        {
            name: "HaproBase",
            url: "https://codersusheel.github.io/haprobase/",
            icon: "fa-database"
        },
        {
            name: "GitProHub",
            url: "https://gitprohub.netlify.app/",
            icon: "fa-code-branch"
        },
        {
            name: "GitHub",
            url: "https://github.com/haproven",
            icon: "fa-code"
        }
    ];

    const SOCIAL = [
        {
            name: "GitHub",
            url: "https://github.com/haproven",
            icon: "fa-brands fa-github"
        },
        {
            name: "Website",
            url: "https://haproven.netlify.app/",
            icon: "fa-solid fa-globe"
        }
    ];

    function init() {

        const header = document.getElementById("header");
        if (!header) return;

        const desktop = document.getElementById("header-links");
        const mobile = document.getElementById("mobile-sidebar");
        const apps = document.getElementById("by-haproven");
        const social = header.querySelector(".haproven-sosal-links");

        const menuBtn = document.getElementById("mobile-menu-toggle");
        const mobileNav = document.getElementById("navbar-mobile");
        const closeBtn = document.getElementById("mobile-close");
        const overlay = document.getElementById("header-overlay");

        const appsBtn = document.getElementById("dot6menu");
        const appsMenu = document.getElementById("teamDropdown");

        const themeBtn = document.getElementById("theme-toggle");
        const langBtn = document.getElementById("langBtn");

        const icon = (name) => {
            const i = document.createElement("i");
            i.className = name;
            i.setAttribute("aria-hidden", "true");
            return i;
        };

        function createLink(item, iconClass) {

            const a = document.createElement("a");
            a.href = item.url;

            if (item.icon && iconClass) {
                a.appendChild(icon(iconClass + item.icon));
            }

            const span = document.createElement("span");
            span.textContent = item.name;
            a.appendChild(span);

            const target = new URL(item.url, location.href);

            if (target.origin !== location.origin) {
                a.target = "_blank";
                a.rel = "noopener noreferrer";
            }

            const currentPath =
                location.pathname.replace(/\/+$/, "") || "/";

            const targetPath =
                target.pathname.replace(/\/+$/, "") || "/";

            if (
                target.origin === location.origin &&
                currentPath === targetPath &&
                (!target.hash || target.hash === location.hash)
            ) {
                a.classList.add("active");
            }

            return a;
        }

        /* RENDER DESKTOP */

        if (desktop) {
            desktop.replaceChildren();

            NAVIGATION.slice(0, 5).forEach(item => {
                const li = document.createElement("li");
                li.appendChild(createLink(item));
                desktop.appendChild(li);
            });
        }

        /* RENDER MOBILE */

        if (mobile) {
            mobile.replaceChildren();

            NAVIGATION.forEach(item => {
                const li = document.createElement("li");
                li.appendChild(
                    createLink(item, "fa-solid ")
                );
                mobile.appendChild(li);
            });
        }

        /* RENDER APPS */

        if (apps) {
            apps.replaceChildren();

            APPS.forEach(item => {
                const a = createLink(item, "fa-solid ");
                a.classList.add("app-item");
                apps.appendChild(a);
            });
        }

        /* RENDER SOCIAL */

        if (social) {
            social.replaceChildren();

            SOCIAL.forEach(item => {
                const a = document.createElement("a");
                a.href = item.url;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.title = item.name;
                a.setAttribute("aria-label", item.name);
                a.appendChild(icon(item.icon));
                social.appendChild(a);
            });
        }

        /* MOBILE MENU */

        function closeMobile() {
            mobileNav?.classList.remove("active");
            menuBtn?.classList.remove("active");
            overlay?.classList.remove("active");
            menuBtn?.setAttribute("aria-expanded", "false");
        }

        function closeApps() {
            appsMenu?.classList.remove("active");
            appsBtn?.setAttribute("aria-expanded", "false");
        }

        menuBtn?.addEventListener("click", () => {
            const open = !mobileNav.classList.contains("active");
            closeApps();

            mobileNav.classList.toggle("active", open);
            menuBtn.classList.toggle("active", open);
            overlay?.classList.toggle("active", open);
            menuBtn.setAttribute("aria-expanded", String(open));
        });

        closeBtn?.addEventListener("click", closeMobile);
        overlay?.addEventListener("click", closeMobile);

        mobile?.addEventListener("click", e => {
            if (e.target.closest("a")) closeMobile();
        });

        /* APPS MENU */

        appsBtn?.addEventListener("click", () => {
            const open = !appsMenu.classList.contains("active");
            closeMobile();
            appsMenu.classList.toggle("active", open);
            appsBtn.setAttribute("aria-expanded", String(open));
        });

        document.addEventListener("click", e => {
            if (
                appsMenu &&
                appsBtn &&
                !appsMenu.contains(e.target) &&
                !appsBtn.contains(e.target)
            ) {
                closeApps();
            }
        });

        document.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                closeMobile();
                closeApps();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 1100) closeMobile();
        });

        /* SCROLL EFFECT */

        const onScroll = () => {
            header.classList.toggle("scrolled", window.scrollY > 12);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        /* THEME */

        const root = document.documentElement;

        function setTheme(theme) {
            root.classList.toggle("dark", theme === "dark");
            root.dataset.theme = theme;
            localStorage.setItem("site-theme", theme);

            const i = themeBtn?.querySelector("i");
            if (i) {
                i.className = theme === "dark"
                    ? "fa-solid fa-sun"
                    : "fa-solid fa-moon";
            }
        }

        setTheme(
            localStorage.getItem("site-theme") === "dark"
                ? "dark"
                : "light"
        );

        themeBtn?.addEventListener("click", () => {
            setTheme(
                root.classList.contains("dark")
                    ? "light"
                    : "dark"
            );
        });

        /* LANGUAGE */

        langBtn?.addEventListener("click", () => {
            if (typeof window.toggleLanguage === "function") {
                window.toggleLanguage();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
