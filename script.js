const MANIFEST_URL = "https://raw.githubusercontent.com/ChadProbert/celerity/HEAD/manifest.json";

const root = document.documentElement;
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

const THEME_KEY = "celerity-theme";
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
  root.classList.add("theme-snap");
  root.dataset.theme = theme;
  const ground = getComputedStyle(root).getPropertyValue("--ground").trim();
  themeMetas.forEach((meta) => meta.setAttribute("content", ground));
  themeSwitch.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-snap")));
}

applyTheme(root.dataset.theme);

themeSwitch.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* Private browser */
  }
});

systemDark.addEventListener("change", (event) => {
  const saved = savedTheme();
  if (saved !== "dark" && saved !== "light") applyTheme(event.matches ? "dark" : "light");
});

// Captures the version from the manifest.
// If GitHub is slow, rate-limited or offline, the hardcode markup value is used.
fetch(MANIFEST_URL)
  .then((response) => (response.ok ? response.json() : null))
  .then((manifest) => {
    if (typeof manifest?.version === "string") {
      document.getElementById("version").textContent = manifest.version;
    }
  })
  .catch(() => {});

// Favicon follows the browser's colour scheme.
const favicon = document.getElementById("favicon");
document.querySelectorAll('link[rel="icon"]').forEach((link) => {
  if (link !== favicon) link.remove();
});
favicon.removeAttribute("media");
const applyFavicon = () => {
  favicon.href = systemDark.matches ? "assets/tab-icon.svg" : "assets/tab-icon-light.svg";
};
applyFavicon();
systemDark.addEventListener("change", applyFavicon);
