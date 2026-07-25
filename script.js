/* Celerity — site behavior
   ------------------------
   1. Config
   2. Theme — toggle, persistence, "T" shortcut
   3. Favicon — follows the browser color scheme
   4. Reveals — sections fade in on scroll
   5. Footer year
*/

/* 1. Config ------------------------------------------------------------ */

// Replace with Celerity's listing URL once published. The HTML anchors keep
// the same URL as a no-JavaScript fallback.
const CHROME_STORE_URL = "https://chromewebstore.google.com/";

const root = document.documentElement;
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll("[data-store-link]").forEach((link) => {
  link.href = CHROME_STORE_URL;
});

/* 2. Theme ------------------------------------------------------------- */

const THEME_KEY = "celerity-theme";
const themeToggle = document.getElementById("theme-toggle");
const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');

let storedTheme = null;
try {
  storedTheme = localStorage.getItem(THEME_KEY);
} catch {
  storedTheme = null;
}

const resolveTheme = (saved, prefersDark) =>
  saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";

const applyTheme = (theme, persist = false) => {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  themeToggle?.setAttribute("aria-pressed", String(theme === "dark"));
  themeColorMetas.forEach((meta) =>
    meta.setAttribute("content", theme === "dark" ? "#222222" : "#e9e9e9"),
  );

  if (persist) {
    storedTheme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* private browsing — theme still applies for this visit */
    }
  }
};

const toggleTheme = () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
};

applyTheme(resolveTheme(storedTheme, systemTheme.matches));

themeToggle?.addEventListener("click", toggleTheme);

systemTheme.addEventListener("change", (event) => {
  if (!storedTheme) applyTheme(resolveTheme(null, event.matches));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "t" && event.key !== "T") return;
  if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return;
  const target = event.target;
  if (
    target instanceof Element &&
    target.closest("a, button, input, textarea, select, [contenteditable]")
  ) {
    return;
  }
  toggleTheme();
});

/* 3. Favicon ----------------------------------------------------------- */

// The tab strip is drawn by the browser, so the icon follows the browser's
// color scheme rather than the site theme.
const favicon = document.getElementById("favicon");
if (favicon) {
  document.querySelectorAll('link[rel="icon"]').forEach((link) => {
    if (link !== favicon) link.remove();
  });
  favicon.removeAttribute("media");

  const applyFavicon = () => {
    favicon.href = systemTheme.matches
      ? "assets/tab-icon.svg"
      : "assets/tab-icon-light.svg";
  };

  applyFavicon();
  systemTheme.addEventListener("change", applyFavicon);
}

/* 4. Reveals ----------------------------------------------------------- */

const revealItems = document.querySelectorAll("[data-reveal]");
if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -6%", threshold: 0.1 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
  root.classList.add("reveal-ready");
}

/* 5. Footer year ------------------------------------------------------- */

const year = document.getElementById("current-year");
if (year) year.textContent = String(new Date().getFullYear());
