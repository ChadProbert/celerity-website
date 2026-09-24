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
document.querySelectorAll('link[rel="icon"]').forEach((link) => {
  if (link !== favicon) link.remove();
});
favicon.removeAttribute("media");
const applyFavicon = () => {
  favicon.href = systemDark.matches ? "assets/tab-icon.svg" : "assets/tab-icon-light.svg";
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
