const MANIFEST_URL = "https://raw.githubusercontent.com/ChadProbert/celerity/HEAD/manifest.json";

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

// Favicon follows the browser's colour scheme
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const favicon = document.getElementById("favicon");
const applyFavicon = () => {
  favicon.href = systemDark.matches ? "assets/tab-icon-dark.png" : "assets/tab-icon-light.png";
};
applyFavicon();
systemDark.addEventListener("change", applyFavicon);

// Showcase link opens whichever image the colour scheme is showing
const showcase = document.getElementById("showcase");
const showcaseImage = showcase.querySelector("img");
const applyShowcaseLink = () => {
  if (showcaseImage.currentSrc) showcase.href = showcaseImage.currentSrc;
};
applyShowcaseLink();
showcaseImage.addEventListener("load", applyShowcaseLink);

// Theme switch
const root = document.documentElement;
const darkSource = showcase.querySelector("source");
const themeColors = document.querySelectorAll('meta[name="theme-color"]');
const applyTheme = (theme) => {
  root.dataset.theme = theme;
  darkSource.media = theme === "dark" ? "all" : "not all";
  themeColors.forEach((meta) => {
    meta.content = theme === "dark" ? "#222222" : "#e9e9e9";
  });
};
const savedTheme = () => {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
};
applyTheme(root.dataset.theme);

document.getElementById("theme-toggle").addEventListener("click", () => {
  const theme = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {}
});

// Defaults to system preference
systemDark.addEventListener("change", () => {
  if (!savedTheme()) applyTheme(systemDark.matches ? "dark" : "light");
});
