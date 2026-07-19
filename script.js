/* Celerity — site behavior
   ------------------------
   1. Config
   2. Theme — toggle, persistence, "T" shortcut
   3. Favicon — follows the browser color scheme
   4. Header — hairline appears on scroll
   5. Demo — the recreated new tab in the hero
   6. Reveals — sections fade in on scroll
   7. Footer year
*/

/* 1. Config ------------------------------------------------------------ */

// Replace with Celerity's listing URL once published. The HTML anchors keep
// the same URL as a no-JavaScript fallback.
const CHROME_STORE_URL = "https://chromewebstore.google.com/";

const DEMO_STEPS = [
  {
    input: "g",
    label: "Gmail",
    detail: "shortcut matched",
    url: "mail.google.com",
  },
  {
    input: "y ambient focus",
    label: "YouTube",
    detail: "site search",
    url: "youtube.com/results?q=ambient+focus",
  },
  {
    input: "best split keyboard",
    label: "Web search",
    detail: "default fallback",
    url: "google.com/search?q=best+split+keyboard",
  },
];

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

/* 4. Header ------------------------------------------------------------ */

const header = document.getElementById("site-header");
const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
};
syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

/* 5. Demo -------------------------------------------------------------- */

const demoInput = document.getElementById("demo-input");
const demoResultLine = document.getElementById("demo-result-line");
const demoResult = document.getElementById("demo-result");
const demoDetail = document.getElementById("demo-detail");
const demoEnter = document.getElementById("demo-enter");
const demoBoard = document.getElementById("demo-board");
const omniboxText = document.getElementById("omnibox-text");
const newtab = document.querySelector(".newtab");
const demoToggle = document.getElementById("demo-toggle");
const demoToggleLabel = demoToggle?.querySelector(".demo-toggle-label");

const boardCells = new Map();
demoBoard?.querySelectorAll(".board-cell").forEach((cell) => {
  boardCells.set(cell.dataset.key, cell);
});
const boardKeys = [...boardCells.keys()];

// The first whitespace-separated token decides the match, mirroring how the
// extension resolves shortcuts ("y ambient focus" → the "y" shortcut).
const matchShortcut = (input) => {
  const token = input.trim().split(/\s+/)[0] ?? "";
  return boardKeys.includes(token) ? token : null;
};

if (demoInput && demoResultLine && demoResult && demoDetail && demoEnter && omniboxText) {
  let stepIndex = 0;
  let timer = null;
  let userPaused = false;

  const setHighlight = (input) => {
    const hit = matchShortcut(input);
    boardCells.forEach((cell, key) => {
      cell.classList.toggle("is-hit", key === hit);
    });
  };

  const showResult = (step) => {
    demoResult.textContent = step.label;
    demoDetail.textContent = step.detail;
    demoResultLine.dataset.state = "match";
  };

  const resetStage = () => {
    demoInput.textContent = "";
    demoResultLine.dataset.state = "idle";
    demoEnter.classList.remove("is-pressed");
    omniboxText.textContent = "";
    newtab?.classList.remove("is-leaving");
    setHighlight("");
  };

  const schedule = (fn, ms) => {
    timer = window.setTimeout(fn, ms);
  };

  const runStep = () => {
    const step = DEMO_STEPS[stepIndex];
    resetStage();

    let typed = 0;
    const typeNext = () => {
      typed += 1;
      const partial = step.input.slice(0, typed);
      demoInput.textContent = partial;
      setHighlight(partial);

      if (typed < step.input.length) {
        schedule(typeNext, 62 + (typed % 3) * 26);
        return;
      }

      schedule(() => {
        showResult(step);
        schedule(pressEnter, 850);
      }, 420);
    };

    const pressEnter = () => {
      demoEnter.classList.add("is-pressed");
      schedule(() => {
        demoEnter.classList.remove("is-pressed");
        omniboxText.textContent = step.url;
        newtab?.classList.add("is-leaving");
        schedule(advance, 1350);
      }, 170);
    };

    const advance = () => {
      stepIndex = (stepIndex + 1) % DEMO_STEPS.length;
      runStep();
    };

    schedule(typeNext, 420);
  };

  const stopDemo = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  const startDemo = () => {
    stopDemo();
    if (userPaused || document.hidden || reducedMotion.matches) return;
    runStep();
  };

  // Reduced motion gets the first step's outcome as a still frame.
  const showStaticState = () => {
    const step = DEMO_STEPS[0];
    demoInput.textContent = step.input;
    setHighlight(step.input);
    showResult(step);
  };

  if (reducedMotion.matches) {
    showStaticState();
    demoToggle?.setAttribute("hidden", "");
  } else {
    startDemo();
  }

  demoToggle?.addEventListener("click", () => {
    userPaused = !userPaused;
    if (demoToggleLabel) demoToggleLabel.textContent = userPaused ? "Play" : "Pause";
    if (userPaused) stopDemo();
    else startDemo();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopDemo();
    else startDemo();
  });
}

/* 6. Reveals ----------------------------------------------------------- */

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

/* 7. Footer year ------------------------------------------------------- */

const year = document.getElementById("current-year");
if (year) year.textContent = String(new Date().getFullYear());
