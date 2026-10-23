
# Single Page Website — Documentation

## 1. Introduction

This project is a modular Single Page Website built using HTML, CSS and JavaScript.

The website is divided into multiple HTML section files, which are dynamically loaded into a single `index.html` page using JavaScript.

This approach makes it easier to build, manage, update and expand a long website without keeping all HTML code in one file.

### Technologies Used

- HTML5 — Website structure
- CSS3 — Design and responsive layout
- JavaScript — Dynamic section loading
- JSON — Optional section configuration

---

## 2. Project Folder Structure

```text
my-website/
│
├── index.html
│
├── sections/
│   ├── header.html
│   ├── hero.html
│   ├── about.html
│   ├── skills.html
│   ├── projects.html
│   ├── experience.html
│   ├── contact.html
│   └── footer.html
│
├── assets/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   └── main.js
│   │
│   └── images/
│
└── README.md
```

### Folder Explanation

| File / Folder | Purpose |
|---|---|
| `index.html` | Main website entry point |
| `sections/` | Contains individual HTML sections |
| `header.html` | Website navigation |
| `hero.html` | Main introduction section |
| `about.html` | About information |
| `skills.html` | Skills and technologies |
| `projects.html` | Project showcase |
| `experience.html` | Experience and education |
| `contact.html` | Contact information |
| `footer.html` | Website footer |
| `style.css` | Website styling |
| `main.js` | Loads HTML sections |
| `images/` | Images and media assets |
| `README.md` | Project documentation |

---

## 3. How the Website Works

When a visitor opens the website, the following process takes place.

### Step 1 — Browser Opens index.html

The browser first loads the main `index.html` file.

This file contains empty containers for the different website sections.

Example:

```html
<div id="header"></div>

<main>
    <div id="hero"></div>
    <div id="about"></div>
    <div id="skills"></div>
    <div id="projects"></div>
    <div id="experience"></div>
    <div id="contact"></div>
</main>

<div id="footer"></div>
```

These containers act as placeholders.

### Step 2 — JavaScript Starts

The browser loads:

```html
<script src="/assets/js/main.js" defer></script>
```

The `defer` attribute allows the browser to parse the HTML before executing the script.

### Step 3 — JavaScript Fetches Sections

The JavaScript uses the Fetch API to retrieve HTML files.

Example:

```javascript
const response = await fetch("/sections/hero.html");
```

The browser requests the `hero.html` file from the server.

### Step 4 — HTML Is Inserted

After the HTML file is successfully fetched, JavaScript inserts its content into the corresponding container.

Example:

```javascript
container.innerHTML = await response.text();
```

The HTML from `hero.html` is inserted into:

```html
<div id="hero"></div>
```

### Step 5 — Complete Website Appears

All sections are loaded into the same document.

The final page contains:

1. Header
2. Hero
3. About
4. Skills
5. Projects
6. Experience
7. Contact
8. Footer

Visitors can scroll through the website without navigating to separate pages.

---

## 4. JavaScript Section Loader

The main JavaScript file controls section loading.

```javascript
const sections = [
    "header",
    "hero",
    "about",
    "skills",
    "projects",
    "experience",
    "contact",
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

        console.error(
            `Failed to load ${name}:`,
            error
        );

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

document.addEventListener(
    "DOMContentLoaded",
    loadWebsite
);
```

### Explanation

**sections Array**

Stores the names of all sections.

**loadSection()**

Fetches an HTML file and inserts it into its matching container.

**fetch()**

Requests an HTML file from the server.

**innerHTML**

Inserts the fetched HTML into the page.

**Promise.all()**

Starts loading all sections concurrently and waits for all loading operations to finish.

**sectionLoaded Event**

Runs after an individual section has been successfully inserted.

**websiteLoaded Event**

Runs after all section-loading operations have finished, including failed attempts.

**DOMContentLoaded**

Starts the loading process after the initial HTML document has been parsed.

---

## 5. How Navigation Works

The navigation uses HTML anchor links.

Example:

```html
<a href="#about-section">About</a>
```

The corresponding section contains:

```html
<section id="about-section">
    <h2>About</h2>
</section>
```

When the visitor clicks the About link, the browser scrolls to the element with the matching ID.

### Smooth Scrolling

```css
html {
    scroll-behavior: smooth;
    scroll-padding-top: 90px;
}
```

`scroll-behavior: smooth` enables smooth scrolling.

`scroll-padding-top` provides space for the sticky header.

Because sections are loaded asynchronously, a direct URL containing a hash may need additional JavaScript to scroll after loading completes.

---

## 6. How the Sticky Header Works

The website header stays visible while the visitor scrolls.

Example:

```css
#header {
    position: sticky;
    top: 0;
    z-index: 1000;
}
```

### CSS Explanation

**position: sticky**

Keeps the header in its normal document position until it reaches the specified scroll boundary.

**top: 0**

Keeps the header at the top of its scroll container.

**z-index: 1000**

Places the header above most other website elements.

### Important Notes

Sticky positioning may not work as expected if an ancestor has certain overflow settings or insufficient scrollable space.

The sticky header wrapper should remain outside the main content sections.

---

## 7. How to Add a New Section

Example: Adding a Services section.

### Step 1 — Create an HTML File

Create:

`sections/services.html`

```html
<section id="services-section">

    <h2>Our Services</h2>

    <p>
        Explore our professional services.
    </p>

</section>
```

### Step 2 — Add a Container

Open `index.html`.

Add the following inside `<main>`:

```html
<div id="services"></div>
```

### Step 3 — Register the Section

Open `assets/js/main.js`.

Add `"services"` to the sections array.

```javascript
const sections = [
    "header",
    "hero",
    "about",
    "skills",
    "services",
    "projects",
    "experience",
    "contact",
    "footer"
];
```

### Step 4 — Add Navigation

Add the following link to `header.html`:

```html
<a href="#services-section">Services</a>
```

### Step 5 — Add CSS

```css
.services-section {
    padding: 100px 20px;
    background: #f8fafc;
}
```

The new section will now load automatically.

---

## 8. How to Remove a Section

To remove a section:

1. Remove its name from the JavaScript sections array.
2. Remove its container from `index.html`.
3. Remove its navigation link.
4. Delete the HTML file if it is no longer needed.

Unused CSS can also be removed.

---

## 9. How to Change Section Order

The section order is determined by the placement of containers in `index.html`.

Example:

```html
<main>
    <div id="hero"></div>
    <div id="projects"></div>
    <div id="about"></div>
    <div id="skills"></div>
</main>
```

The website will display:

Hero → Projects → About → Skills

Changing the order in the JavaScript array alone does not change the visual order in this version of the loader.

---

## 10. CSS Management

The main stylesheet is:

`assets/css/style.css`

Each section can have its own CSS rules.

Example:

```css
/* Header */
.site-header {
    position: sticky;
    top: 0;
}

/* Hero */
.hero-section {
    min-height: 90vh;
}

/* About */
.about-section {
    padding: 80px 20px;
}

/* Projects */
.projects-section {
    padding: 80px 20px;
}

/* Contact */
.contact-section {
    padding: 80px 20px;
}
```

Use section-specific class names to reduce styling conflicts.

For larger projects, separate CSS files can be created for individual sections.

---

## 11. Responsive Design

The website should work on:

- Desktop computers
- Laptops
- Tablets
- Mobile devices

Example:

```css
@media (max-width: 768px) {

    .hero-section {
        min-height: 75svh;
        padding: 80px 20px;
    }

    .hero-content h1 {
        font-size: 2rem;
    }

}
```

Responsive layouts help ensure that content remains readable on different screen sizes.

---

## 12. Advantages

### Modular Development

Each section has its own HTML file.

### Easy Maintenance

Developers can update one section without editing a large HTML document.

### Expandability

New sections can be added when needed.

### Code Organization

HTML, CSS and JavaScript responsibilities remain separated.

### Team Collaboration

Different developers can work on separate sections.

### Single Page Experience

Visitors can access the main website content within one browser page.

---

## 13. Limitations

### JavaScript Dependency

The current system requires JavaScript to display dynamically loaded sections.

If JavaScript is disabled, the empty containers will not show their content.

### Additional Requests

Each HTML section requires a separate HTTP request.

For very large websites, this can affect loading performance.

### SEO Considerations

Some search engines may not reliably process all dynamically inserted content.

For SEO-focused websites, server-side rendering, static-site generation or build-time HTML assembly may be preferable.

### External Scripts

Scripts inserted using `innerHTML` do not execute automatically.

Interactive sections should use JavaScript initialization after loading.

### Error Handling

If a section cannot be fetched, it will remain empty in the current implementation.

A production website should display useful fallback content.

---

## 14. Local Development

Do not open the website directly using:

`file:///`

The Fetch API may be blocked by browser security restrictions.

Instead, use a local HTTP server.

### VS Code

Install the Live Server extension.

Open the project folder and start Live Server.

Example:

`http://127.0.0.1:5500/`

The website should now load its sections correctly.

---

## 15. Deployment

The website can be deployed to static hosting platforms such as:

- GitHub Pages
- Netlify
- Render Static Sites

The current code uses root-relative paths such as:

`/sections/hero.html`

These work when the website is hosted at the domain root.

For GitHub Pages project repositories hosted under a subpath, update the paths or configure a base path.

---

## 16. Future Improvements

The project can be extended with:

- JSON-based section configuration
- Automatic navigation generation
- Section visibility controls
- Dynamic CSS loading
- Section-specific JavaScript
- Loading indicators
- Error fallback content
- Active navigation highlighting
- Dark and light mode
- Lazy loading for heavy media
- SEO improvements
- Build-time HTML generation

---

## 17. Conclusion

This modular Single Page Website architecture allows developers to build large websites using small, manageable HTML components.

Instead of writing thousands of lines inside a single HTML file, the website is divided into independent sections and assembled dynamically using JavaScript.

The result is a flexible and maintainable website structure suitable for personal portfolios, landing pages, project showcases and other content-focused websites.

---

**Project Type:** Modular Single Page Website

**Technologies:** HTML5, CSS3, JavaScript

**Architecture:** Dynamic HTML Section Loading

**Documentation Version:** 1.0.0

**Last Updated:** 23 October 2026
