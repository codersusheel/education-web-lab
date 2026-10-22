
/* ============================================================
   EDUCATION WEBSITE — COMPLETE JSON DATA ENGINE
   File: assets/js/website-data.js

   Supports:
   - Home / Services / About / Contact
   - Dummy HTML fallback
   - Text, images, links and icons
   - Dynamic cards, lists and FAQ
   - Header and footer navigation
   - Institution branding and theme
   - Contact information and office hours
   - Contact form configuration and mailto
   - Complete SEO and social metadata
   - JSON-LD structured data
   - GitHub Pages project subpaths

   IMPORTANT:
   Keep dummy information inside HTML.
   JavaScript replaces only valid JSON values.
============================================================ */

(() => {
    "use strict";

    /* ================= SETTINGS ================= */

    const SETTINGS = {
        dataFile: "assets/data/website.json",
        timeout: 12000,
        debug: false
    };

    const loaderScript =
        document.currentScript ||
        document.querySelector("script[data-website-loader]");

    const siteRoot = new URL(
        loaderScript?.dataset.root ||
        (loaderScript?.src
            ? "../../"
            : "./"),
        loaderScript?.src || document.baseURI
    );

    /*
       data-root is resolved relative to the JS file URL.
       Therefore the recommended configuration is simply:

       <script src="assets/js/website-data.js" defer></script>

       or from a nested page:

       <script src="../assets/js/website-data.js" defer></script>

       The script automatically locates the website root.
    */

    const dataURL = new URL(SETTINGS.dataFile, siteRoot);

    const page =
        document.body?.dataset.page ||
        detectPage();

    let DATA = null;

    /* ================= BASIC UTILITIES ================= */

    function debug(...args) {
        if (SETTINGS.debug) {
            console.log("[Website JSON]", ...args);
        }
    }

    function detectPage() {
        const path = location.pathname
            .replace(/\/index\.html$/i, "/")
            .replace(/\/+$/, "");

        const last = path.split("/").pop();

        if (last === "services") return "services";
        if (last === "about") return "about";
        if (last === "contact") return "contact";

        return "home";
    }

    function get(path, source = DATA) {
        if (!path || !source) return undefined;

        return String(path)
            .split(".")
            .reduce((current, key) => {
                if (
                    current === null ||
                    current === undefined
                ) {
                    return undefined;
                }

                return Object.prototype.hasOwnProperty.call(
                    Object(current),
                    key
                )
                    ? current[key]
                    : undefined;
            }, source);
    }

    function valid(value) {
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === "string") {
            return value.trim() !== "";
        }

        return true;
    }

    function validText(value) {
        return (
            typeof value === "string" ||
            typeof value === "number"
        ) && valid(value);
    }

    function text(element, value) {
        if (!element || !validText(value)) return false;

        element.textContent = String(value);
        return true;
    }

    function each(selector, callback, root = document) {
        root.querySelectorAll(selector).forEach(callback);
    }

    function safeHTTP(value) {
        try {
            const url = new URL(value, siteRoot);

            return ["http:", "https:"].includes(url.protocol);
        } catch {
            return false;
        }
    }

    function absoluteAsset(value) {
        if (!validText(value)) return null;

        try {
            const raw = String(value).trim();

            const url = new URL(
                raw.startsWith("/") && !raw.startsWith("//")
                    ? raw.slice(1)
                    : raw,
                siteRoot
            );

            return ["http:", "https:"].includes(url.protocol)
                ? url.href
                : null;
        } catch {
            return null;
        }
    }

    function linkURL(value) {
        if (!validText(value)) return null;

        const raw = String(value).trim();

        if (raw.startsWith("#")) {
            return raw;
        }

        if (/^(mailto:|tel:)/i.test(raw)) {
            return raw;
        }

        return absoluteAsset(raw);
    }

    function absolutePublicURL(value) {
        const websiteURL = get("website.websiteUrl");

        if (!validText(websiteURL)) return null;

        try {
            const base = new URL(websiteURL);

            if (!["http:", "https:"].includes(base.protocol)) {
                return null;
            }

            const normalizedBase = base.href.endsWith("/")
                ? base.href
                : base.href + "/";

            const raw = String(value || "").trim();

            const resolved = new URL(
                raw.startsWith("/") ? raw.slice(1) : raw,
                normalizedBase
            );

            return ["http:", "https:"].includes(resolved.protocol)
                ? resolved.href
                : null;
        } catch {
            return null;
        }
    }

    function publicAsset(value) {
        if (!validText(value)) return null;

        if (/^https?:\/\//i.test(value)) {
            return safeHTTP(value) ? value : null;
        }

        return absolutePublicURL(value);
    }

    function iconClass(value) {
        if (
            typeof value !== "string" ||
            !/^(fa-(?:solid|regular|brands)\s+)?fa-[\w-]+$/.test(
                value.trim()
            )
        ) {
            return null;
        }

        return value.trim();
    }

    function applyIcon(element, value) {
        const classes = iconClass(value);

        if (!element || !classes) return;

        element.className = classes;
    }

    function setVisibility(element, value) {
        if (value === false) {
            element.hidden = true;
            element.style.display = "none";
        } else if (value === true) {
            element.hidden = false;
            element.style.removeProperty("display");
        }
    }

    /* ================= LOAD JSON ================= */

    async function loadData() {
        const controller = new AbortController();

        const timer = setTimeout(
            () => controller.abort(),
            SETTINGS.timeout
        );

        try {
            const response = await fetch(dataURL.href, {
                cache: "no-cache",
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(
                    `Unable to load JSON: ${response.status}`
                );
            }

            const json = await response.json();

            if (
                !json ||
                typeof json !== "object" ||
                Array.isArray(json)
            ) {
                throw new Error("Invalid JSON structure");
            }

            return json;

        } catch (error) {
            debug("HTML fallback active:", error.message);
            return null;

        } finally {
            clearTimeout(timer);
        }
    }

    /* ================= TEXT BINDINGS ================= */

    function updateText() {
        each("[data-bind]", element => {
            text(element, get(element.dataset.bind));
        });
    }

    /* ================= IMAGES ================= */

    function updateImages() {
        each("[data-image]", element => {
            if (element.tagName !== "IMG") return;

            const image = absoluteAsset(
                get(element.dataset.image)
            );

            if (image) {
                element.src = image;
            }

            const alt = get(element.dataset.imageAlt);

            if (validText(alt)) {
                element.alt = String(alt);
            }
        });
    }

    /* ================= LINKS ================= */

    function updateLinks() {
        each("[data-link]", element => {
            const url = linkURL(
                get(element.dataset.link)
            );

            if (url) {
                element.setAttribute("href", url);
            }
        });
    }

    /* ================= ICONS ================= */

    function updateIcons() {
        each("[data-icon]", element => {
            applyIcon(
                element,
                get(element.dataset.icon)
            );
        });
    }

    /* ================= CUSTOM ATTRIBUTES ================= */

    function updateAttributes() {
        const allowed = new Set([
            "placeholder",
            "title",
            "alt",
            "aria-label",
            "content"
        ]);

        each("[data-attr]", element => {
            const rules = element.dataset.attr.split(";");

            rules.forEach(rule => {
                const separator = rule.indexOf(":");

                if (separator < 0) return;

                const attribute = rule
                    .slice(0, separator)
                    .trim();

                const path = rule
                    .slice(separator + 1)
                    .trim();

                if (!allowed.has(attribute)) return;

                const value = get(path);

                if (validText(value)) {
                    element.setAttribute(
                        attribute,
                        String(value)
                    );
                }
            });
        });
    }

    /* ================= SECTION VISIBILITY ================= */

    function updateVisibility() {
        each("[data-enabled]", element => {
            setVisibility(
                element,
                get(element.dataset.enabled)
            );
        });

        each("[data-visible]", element => {
            setVisibility(
                element,
                get(element.dataset.visible)
            );
        });
    }

    /* ================= THEME ================= */

    function updateTheme() {
        const theme = get("website.theme");

        if (!theme || typeof theme !== "object") {
            return;
        }

        const variables = {
            primary: "--primary",
            primaryDark: "--primary-dark",
            secondary: "--secondary",
            text: "--text",
            muted: "--muted",
            background: "--background",
            surface: "--surface",
            border: "--border"
        };

        Object.entries(variables).forEach(([key, cssName]) => {
            const value = theme[key];

            if (
                typeof value === "string" &&
                /^#[0-9a-fA-F]{3,8}$/.test(value)
            ) {
                document.documentElement.style.setProperty(
                    cssName,
                    value
                );
            }
        });
    }

    /* ================= REPEATED CONTENT ================= */

    function updateRepeaters() {
        each("[data-repeat]", container => {
            const items = get(container.dataset.repeat);

            if (
                !Array.isArray(items) ||
                items.length === 0
            ) {
                return;
            }

            const template = Array.from(
                container.children
            ).find(child =>
                child.matches?.("template[data-item-template]")
            );

            if (!template) return;

            const fragment = document.createDocumentFragment();
            let rendered = 0;

            items.forEach(raw => {
                if (raw === null || raw === undefined) {
                    return;
                }

                const item = typeof raw === "string"
                    ? { value: raw }
                    : raw;

                if (
                    typeof item !== "object" ||
                    item.visible === false
                ) {
                    return;
                }

                const clone = template.content.cloneNode(true);

                each("[data-item-text]", element => {
                    text(
                        element,
                        get(element.dataset.itemText, item)
                    );
                }, clone);

                each("[data-item-image]", element => {
                    if (element.tagName !== "IMG") return;

                    const src = absoluteAsset(
                        get(element.dataset.itemImage, item)
                    );

                    if (src) element.src = src;

                    const alt = get(
                        element.dataset.itemAlt,
                        item
                    );

                    if (validText(alt)) {
                        element.alt = String(alt);
                    }
                }, clone);

                each("[data-item-icon]", element => {
                    applyIcon(
                        element,
                        get(element.dataset.itemIcon, item)
                    );
                }, clone);

                each("[data-item-link]", element => {
                    const url = linkURL(
                        get(element.dataset.itemLink, item)
                    );

                    if (url) element.href = url;
                }, clone);

                fragment.appendChild(clone);
                rendered++;
            });

            /*
               Dummy cards are removed only after at least
               one valid JSON item has been generated.
            */

            if (rendered > 0) {
                Array.from(container.children).forEach(child => {
                    if (child !== template) {
                        child.remove();
                    }
                });

                container.appendChild(fragment);
            }
        });
    }

    /* ================= NAVIGATION ================= */

    function updateNavigation() {
        const items = get("navigation.items");

        if (!Array.isArray(items) || !items.length) {
            return;
        }

        const navigation = document.getElementById("navLinks");

        if (!navigation) return;

        const fragment = document.createDocumentFragment();
        let count = 0;

        items.forEach(item => {
            if (
                !item ||
                item.visible === false ||
                !validText(item.name)
            ) {
                return;
            }

            const url = linkURL(item.url);

            if (!url) return;

            const li = document.createElement("li");
            const anchor = document.createElement("a");

            anchor.href = url;
            anchor.textContent = item.name;

            if (item.page === page) {
                anchor.classList.add("active");
                anchor.setAttribute("aria-current", "page");
            }

            if (item.page === "contact") {
                anchor.classList.add("contact-link");
            }

            li.appendChild(anchor);
            fragment.appendChild(li);
            count++;
        });

        if (count) {
            navigation.replaceChildren(fragment);
        }
    }

    /* ================= FOOTER QUICK LINKS ================= */

    function updateFooterLinks() {
        const items = get("footer.quickLinks");

        if (!Array.isArray(items) || !items.length) {
            return;
        }

        each("[data-footer-links]", container => {
            const fragment = document.createDocumentFragment();
            let count = 0;

            items.forEach(item => {
                if (
                    !item ||
                    item.visible === false ||
                    !validText(item.name)
                ) {
                    return;
                }

                const url = linkURL(item.url);

                if (!url) return;

                const li = document.createElement("li");
                const anchor = document.createElement("a");

                anchor.href = url;
                anchor.textContent = item.name;

                li.appendChild(anchor);
                fragment.appendChild(li);
                count++;
            });

            if (count) {
                container.replaceChildren(fragment);
            }
        });
    }

    /* ================= BRANDING ================= */

    function updateBranding() {
        const name = get("website.name");
        const shortName = get("website.shortName");
        const logo = get("website.logo");

        each("[data-site-name]", element => {
            text(element, name);
        });

        each("[data-site-short-name]", element => {
            text(element, shortName);
        });

        if (logo && typeof logo === "object") {
            each("[data-logo-icon]", element => {
                applyIcon(element, logo.icon);
            });

            each("[data-logo-image]", element => {
                if (element.tagName !== "IMG") return;

                const src = absoluteAsset(logo.image);

                if (src && logo.type === "image") {
                    element.src = src;
                    element.hidden = false;
                }

                if (validText(logo.alt)) {
                    element.alt = logo.alt;
                }
            });
        }
    }

    /* ================= CONTACT INFORMATION ================= */

    function updateContact() {
        const email = get("contact.email");
        const phone = get("contact.phone");
        const displayPhone = get("contact.displayPhone");
        const address = get("contact.address.fullAddress");

        if (
            typeof email === "string" &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            each("[data-contact-email]", element => {
                element.textContent = email;

                if (element.tagName === "A") {
                    element.href = `mailto:${email}`;
                }
            });
        }

        if (validText(phone)) {
            const normalized = String(phone)
                .replace(/[^\d+]/g, "");

            if (/^\+?\d{7,15}$/.test(normalized)) {
                each("[data-contact-phone]", element => {
                    text(
                        element,
                        displayPhone || phone
                    );

                    if (element.tagName === "A") {
                        element.href = `tel:${normalized}`;
                    }
                });
            }
        }

        each("[data-contact-address]", element => {
            text(element, address);
        });

        const whatsapp = get("contact.whatsapp");

        if (validText(whatsapp)) {
            const number = String(whatsapp)
                .replace(/\D/g, "");

            if (/^\d{7,15}$/.test(number)) {
                each("[data-contact-whatsapp]", element => {
                    if (element.tagName === "A") {
                        element.href =
                            `https://wa.me/${number}`;
                    }
                });
            }
        }
    }

    /* ================= OFFICE HOURS ================= */

    function updateOfficeHours() {
        const hours = get("contact.officeHours");

        if (!Array.isArray(hours) || !hours.length) {
            return;
        }

        each("[data-office-hours]", container => {
            const fragment = document.createDocumentFragment();

            hours.forEach(item => {
                if (
                    !item ||
                    !validText(item.day) ||
                    !validText(item.time)
                ) {
                    return;
                }

                const row = document.createElement("div");
                row.className = "office-hours-row";

                const day = document.createElement("span");
                const time = document.createElement("span");

                day.textContent = item.day;
                time.textContent = item.time;

                row.append(day, time);
                fragment.appendChild(row);
            });

            if (fragment.childNodes.length) {
                container.replaceChildren(fragment);
            }
        });
    }

    /* ================= GOOGLE MAPS ================= */

    function updateMaps() {
        const place = get("contact.googleMaps.placeUrl");
        const embed = get("contact.googleMaps.embedUrl");

        if (safeHTTP(place)) {
            each("[data-map-link]", element => {
                if (element.tagName === "A") {
                    element.href = place;
                }
            });
        }

        if (
            typeof embed === "string" &&
            /^https:\/\/www\.google\.com\/maps\/embed\?/i.test(embed)
        ) {
            each("[data-map-embed]", element => {
                if (element.tagName !== "IFRAME") return;

                element.src = embed;
                element.hidden = false;
            });
        }

        const mapEnabled = get(
            "contactPage.location.mapEnabled"
        );

        each("[data-map-enabled]", element => {
            setVisibility(element, mapEnabled);
        });
    }

    /* ================= SOCIAL MEDIA ================= */

    function updateSocialMedia() {
        const platforms = [
            "facebook",
            "instagram",
            "youtube",
            "linkedin",
            "twitter",
            "whatsapp",
            "telegram"
        ];

        platforms.forEach(platform => {
            const value = get(`socialMedia.${platform}`);

            if (!safeHTTP(value)) return;

            each(`[data-social="${platform}"]`, element => {
                if (element.tagName === "A") {
                    element.href = value;
                    element.hidden = false;
                }
            });
        });
    }

    /* ================= CONTACT FORM ================= */

    function updateContactForm() {
        const form = document.getElementById("contactForm");

        if (!form) return;

        const config = get("contactPage.form") || {};

        if (config.enabled === false) {
            setVisibility(form, false);
            return;
        }

        const fields = config.fields || {};

        Object.entries(fields).forEach(([name, field]) => {
            if (!field || typeof field !== "object") return;

            const control = form.elements.namedItem(name);

            if (
                !control ||
                !("tagName" in control)
            ) {
                return;
            }

            if (typeof field.required === "boolean") {
                control.required = field.required;
            }

            if (Number.isInteger(field.minLength)) {
                control.minLength = field.minLength;
            }

            if (Number.isInteger(field.maxLength)) {
                control.maxLength = field.maxLength;
            }

            const label = form.querySelector(
                `label[for="${control.id}"]`
            );

            if (label && validText(field.label)) {
                label.textContent = field.label;
            }

            if (
                control.tagName === "SELECT" &&
                Array.isArray(field.options) &&
                field.options.length
            ) {
                const fragment =
                    document.createDocumentFragment();

                field.options.forEach(option => {
                    if (!validText(option)) return;

                    const element =
                        document.createElement("option");

                    element.value = String(option);
                    element.textContent = String(option);

                    fragment.appendChild(element);
                });

                if (fragment.childNodes.length) {
                    control.replaceChildren(fragment);
                }
            }
        });

        const submit = form.querySelector(
            '[type="submit"]'
        );

        if (submit && validText(config.submitText)) {
            const textElement = submit.querySelector(
                "[data-submit-text]"
            );

            if (textElement) {
                text(textElement, config.submitText);
            } else {
                submit.textContent = config.submitText;
            }
        }

        /*
           Mailto is the only delivery method currently
           supported. It opens the user's email application.

           Remove any old page-specific submit listener
           before using this shared handler.
        */

        if (config.deliveryMethod !== "mailto") {
            return;
        }

        const recipient =
            config.recipientEmail ||
            get("contact.email");

        if (
            typeof recipient !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) ||
            recipient === "contact@example.com"
        ) {
            return;
        }

        form.addEventListener("submit", event => {
            event.preventDefault();

            if (!form.reportValidity()) return;

            const formData = new FormData(form);

            const name = String(
                formData.get("name") || ""
            ).trim();

            const email = String(
                formData.get("email") || ""
            ).trim();

            const phone = String(
                formData.get("phone") || ""
            ).trim();

            const subject = String(
                formData.get("subject") || "General Enquiry"
            ).trim();

            const message = String(
                formData.get("message") || ""
            ).trim();

            const body = [
                "Institution Enquiry",
                "",
                `Name: ${name}`,
                `Email: ${email}`,
                `Phone: ${phone || "Not provided"}`,
                `Enquiry Type: ${subject}`,
                "",
                "Message:",
                message
            ].join("\n");

            const url =
                `mailto:${recipient}` +
                `?subject=${encodeURIComponent(subject)}` +
                `&body=${encodeURIComponent(body)}`;

            const status = document.getElementById(
                "contactFormStatus"
            );

            if (status) {
                status.textContent =
                    "Your email application will open. Please review and send your message.";
            }

            window.location.href = url;
        });
    }

    /* ================= SEO HELPERS ================= */

    function setMeta(attribute, key, value) {
        if (!validText(value)) return;

        let element = Array.from(
            document.head.querySelectorAll("meta")
        ).find(item =>
            item.getAttribute(attribute) === key
        );

        if (!element) {
            element = document.createElement("meta");
            element.setAttribute(attribute, key);
            document.head.appendChild(element);
        }

        element.content = String(value);
    }

    function setHeadLink(rel, href) {
        if (!validText(href)) return;

        let element = Array.from(
            document.head.querySelectorAll("link")
        ).find(item => item.rel === rel);

        if (!element) {
            element = document.createElement("link");
            element.rel = rel;
            document.head.appendChild(element);
        }

        element.href = href;
    }

    /* ================= COMPLETE SEO ================= */

    function updateSEO() {
        const website = get("website") || {};
        const seo = get("seo") || {};
        const pageSEO = get(`seo.pages.${page}`) || {};

        const title =
            pageSEO.title ||
            seo.defaultTitle;

        const description =
            pageSEO.description ||
            seo.defaultDescription;

        const robots =
            pageSEO.robots ||
            seo.robots;

        const canonical = absolutePublicURL(
            pageSEO.path || "/"
        );

        const ogTitle =
            pageSEO.ogTitle ||
            title;

        const ogDescription =
            pageSEO.ogDescription ||
            description;

        const ogImage = publicAsset(
            pageSEO.ogImage ||
            seo.ogImage
        );

        const twitterImage = publicAsset(
            pageSEO.twitterImage ||
            pageSEO.ogImage ||
            seo.ogImage
        );

        /* ================= DOCUMENT ================= */

        if (validText(title)) {
            document.title = title;
        }

        if (validText(website.language)) {
            document.documentElement.lang =
                website.language;
        }

        /* ================= BASIC META ================= */

        setMeta("name", "description", description);
        setMeta("name", "robots", robots);

        setMeta(
            "name",
            "googlebot",
            seo.googlebot
        );

        setMeta(
            "name",
            "bingbot",
            seo.bingbot
        );

        setMeta(
            "name",
            "keywords",
            pageSEO.keywords
        );

        setMeta(
            "name",
            "author",
            seo.author
        );

        setMeta(
            "name",
            "publisher",
            seo.publisher
        );

        setMeta(
            "name",
            "theme-color",
            website.theme?.primary
        );

        /* ================= CANONICAL ================= */

        if (canonical) {
            setHeadLink("canonical", canonical);
        }

        /* ================= OPEN GRAPH ================= */

        setMeta(
            "property",
            "og:type",
            seo.ogType || "website"
        );

        setMeta(
            "property",
            "og:site_name",
            seo.siteName || website.name
        );

        setMeta(
            "property",
            "og:locale",
            seo.ogLocale
        );

        setMeta(
            "property",
            "og:title",
            ogTitle
        );

        setMeta(
            "property",
            "og:description",
            ogDescription
        );

        if (canonical) {
            setMeta(
                "property",
                "og:url",
                canonical
            );
        }

        if (ogImage) {
            setMeta(
                "property",
                "og:image",
                ogImage
            );
        }

        setMeta(
            "property",
            "og:image:alt",
            pageSEO.ogImageAlt
        );

        /* ================= TWITTER ================= */

        setMeta(
            "name",
            "twitter:card",
            seo.twitterCard || "summary_large_image"
        );

        setMeta(
            "name",
            "twitter:site",
            seo.twitterSite
        );

        setMeta(
            "name",
            "twitter:creator",
            seo.twitterCreator
        );

        setMeta(
            "name",
            "twitter:title",
            pageSEO.twitterTitle ||
            ogTitle
        );

        setMeta(
            "name",
            "twitter:description",
            pageSEO.twitterDescription ||
            ogDescription
        );

        if (twitterImage) {
            setMeta(
                "name",
                "twitter:image",
                twitterImage
            );
        }

        /* ================= FAVICON ================= */

        const favicon = absoluteAsset(
            website.favicon
        );

        if (favicon) {
            setHeadLink("icon", favicon);
            setHeadLink("apple-touch-icon", favicon);
        }

        /* ================= JSON-LD ================= */

        updateStructuredData(
            website,
            pageSEO,
            canonical
        );
    }

    /* ================= STRUCTURED DATA ================= */

    function updateStructuredData(
        website,
        pageSEO,
        canonical
    ) {
        const websiteURL = absolutePublicURL("/");

        if (
            !websiteURL ||
            !validText(website.name)
        ) {
            return;
        }

        const organizationTypes = {
            school: "School",
            college: "CollegeOrUniversity",
            university: "CollegeOrUniversity",
            coaching: "EducationalOrganization",
            institute: "EducationalOrganization"
        };

        const organizationType =
            organizationTypes[website.type] ||
            "EducationalOrganization";

        const organization = {
            "@type": organizationType,
            "@id": `${websiteURL}#organization`,
            "name": website.name,
            "url": websiteURL
        };

        const logo = publicAsset(
            website.logo?.image
        );

        if (logo) {
            organization.logo = logo;
        }

        const email = get("contact.email");
        const phone = get("contact.phone");

        if (
            validText(email) &&
            email !== "contact@example.com"
        ) {
            organization.email = email;
        }

        if (
            validText(phone) &&
            phone !== "+910000000000"
        ) {
            organization.telephone = phone;
        }

        const address = get("contact.address");

        if (
            address &&
            typeof address === "object" &&
            validText(address.postalCode)
        ) {
            organization.address = {
                "@type": "PostalAddress",
                "streetAddress": [
                    address.line1,
                    address.line2
                ].filter(validText).join(", "),
                "addressLocality": address.city || "",
                "addressRegion": address.state || "",
                "postalCode": address.postalCode,
                "addressCountry": address.country || "India"
            };
        }

        const pageType = [
            "WebPage",
            "AboutPage",
            "ContactPage",
            "CollectionPage"
        ].includes(pageSEO.schemaType)
            ? pageSEO.schemaType
            : "WebPage";

        const webPage = {
            "@type": pageType,
            "@id": canonical
                ? `${canonical}#webpage`
                : `${websiteURL}#webpage`,
            "name": pageSEO.title ||
                get("seo.defaultTitle") ||
                website.name,
            "isPartOf": {
                "@id": `${websiteURL}#website`
            },
            "about": {
                "@id": `${websiteURL}#organization`
            }
        };

        if (canonical) {
            webPage.url = canonical;
        }

        const pageDescription =
            pageSEO.description ||
            get("seo.defaultDescription");

        if (validText(pageDescription)) {
            webPage.description = pageDescription;
        }

        const websiteNode = {
            "@type": "WebSite",
            "@id": `${websiteURL}#website`,
            "name": website.name,
            "url": websiteURL,
            "publisher": {
                "@id": `${websiteURL}#organization`
            }
        };

        const schema = {
            "@context": "https://schema.org",
            "@graph": [
                organization,
                websiteNode,
                webPage
            ]
        };

        let script = document.getElementById(
            "website-structured-data"
        );

        if (!script) {
            script = document.createElement("script");
            script.id = "website-structured-data";
            script.type = "application/ld+json";
            document.head.appendChild(script);
        }

        script.textContent = JSON.stringify(schema);
    }

    /* ================= FOOTER ================= */

    function updateFooter() {
        const footer = get("footer") || {};

        if (footer.enabled === false) {
            each(".footer", element => {
                setVisibility(element, false);
            });
        }

        each("[data-footer-about]", element => {
            text(element, footer.aboutText);
        });

        each("[data-footer-copyright]", element => {
            text(element, footer.copyrightText);
        });

        each("[data-footer-contact]", element => {
            setVisibility(
                element,
                footer.showContact
            );
        });

        each("[data-footer-social]", element => {
            setVisibility(
                element,
                footer.showSocialLinks
            );
        });

        const year = document.getElementById("year");

        if (year) {
            if (footer.showCurrentYear !== false) {
                year.textContent =
                    new Date().getFullYear();
            } else {
                year.textContent = "";
            }
        }
    }

    /* ================= FAQ ================= */

    function updateFAQ() {
        /*
           FAQ is rendered through data-repeat.

           Example:
           data-repeat="contactPage.faq.items"

           Template fields:
           data-item-text="question"
           data-item-text="answer"

           This method only handles the section visibility.
        */

        each("[data-faq-section]", element => {
            setVisibility(
                element,
                get("contactPage.faq.enabled")
            );
        });
    }

    /* ================= INITIALIZE ================= */

    async function initialize() {
        DATA = await loadData();

        if (!DATA) {
            document.documentElement.dataset.websiteData =
                "fallback";

            document.dispatchEvent(
                new CustomEvent("website:data-fallback")
            );

            return;
        }

        /*
           First apply basic bindings,
           then render repeated components.
        */

        updateTheme();
        updateSEO();

        updateBranding();
        updateText();
        updateImages();
        updateLinks();
        updateIcons();
        updateAttributes();
        updateVisibility();

        updateNavigation();
        updateFooterLinks();

        updateContact();
        updateOfficeHours();
        updateMaps();
        updateSocialMedia();

        updateRepeaters();
        updateFAQ();

        updateContactForm();
        updateFooter();

        document.documentElement.dataset.websiteData =
            "loaded";

        debug("All website JSON data applied.", page);

        document.dispatchEvent(
            new CustomEvent("website:data-loaded", {
                detail: {
                    page,
                    data: DATA
                }
            })
        );
    }

    /* ================= START ================= */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

})();
