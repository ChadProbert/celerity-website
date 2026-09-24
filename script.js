/* Celerity — site behaviour
   -------------------------
   1. Config
   2. Theme switch
   3. GitHub stars
   4. Small things
*/

/* 1. Config ------------------------------------------------------------ */

// Once Celerity is listed on the Chrome Web Store, put the listing URL here.
// The main button then reads "Add to Chrome" and points at the listing.
const CHROME_STORE_URL = "";
const REPO_API = "https://api.github.com/repos/ChadProbert/celerity";

const root = document.documentElement;
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

/* 2. Theme switch ------------------------------------------------------ */

// Follows the system until you use the switch; after that your choice sticks.
const THEME_KEY = "celerity-theme";
const THEME_GROUNDS = { dark: "#222222", light: "#e9e9e9" };
const themeSwitch = document.getElementById("theme-switch");
const themeMetas = document.querySelectorAll('meta[name="theme-color"]');

const savedTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
};

function applyTheme(theme) {
  // Repaint as one unit: transitions off for the frame the colours change.
  root.classList.add("theme-snap");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  themeMetas.forEach((meta) => meta.setAttribute("content", THEME_GROUNDS[theme]));
  themeSwitch.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-snap")));
}

applyTheme(root.dataset.theme === "dark" ? "dark" : "light");

themeSwitch.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* private browsing: the switch still works for this visit */
  }
});

systemDark.addEventListener("change", (event) => {
  const saved = savedTheme();
  if (saved !== "dark" && saved !== "light") applyTheme(event.matches ? "dark" : "light");
});

/* 3. GitHub stars ------------------------------------------------------ */

// The count is a nicety: if the API is slow, rate-limited or offline, the
// button simply shows no number.
fetch(REPO_API, { headers: { Accept: "application/vnd.github+json" } })
  .then((response) => (response.ok ? response.json() : null))
  .then((repo) => {
    if (!repo || typeof repo.stargazers_count !== "number") return;
    const count = document.getElementById("star-count");
    count.textContent = new Intl.NumberFormat("en", { notation: "compact" }).format(repo.stargazers_count);
    count.hidden = false;
  })
  .catch(() => {});

/* 4. Small things ------------------------------------------------------ */

if (CHROME_STORE_URL) {
  document.querySelectorAll("[data-install-link]").forEach((link) => {
    link.href = CHROME_STORE_URL;
    const label = link.querySelector("[data-install-label]");
    if (label) label.textContent = "Add to Chrome";
  });
}

// The tab strip is drawn by the browser, so the favicon follows the
// browser's colour scheme rather than this page's theme.
const favicon = document.getElementById("favicon");
if (favicon) {
  document.querySelectorAll('link[rel="icon"]').forEach((link) => {
    if (link !== favicon) link.remove();
  });
  favicon.removeAttribute("media");
  const applyFavicon = () => {
    favicon.href = systemDark.matches ? "assets/tab-icon.svg" : "assets/tab-icon-light.svg";
  };
  applyFavicon();
  systemDark.addEventListener("change", applyFavicon);
}

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());
