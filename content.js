console.log("ChatBlurUI content script loaded.");

const BLUR_CLASS = "ChatBlurUI-blurred-title";
const PROCESSED_ATTR = "data-ChatBlurUI-processed";

function injectBlurStyle() {
  if (document.getElementById("ChatBlurUI-blur-style")) return;

  const style = document.createElement("style");
  style.id = "ChatBlurUI-blur-style";
  style.textContent = `
    .${BLUR_CLASS} {
      filter: blur(6px);
      transition: filter 0.2s ease-out;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

function getPlatformSelectors() {
  const hostname = window.location.hostname;

  if (
    hostname.includes("chat.openai.com") ||
    hostname.includes("chatgpt.com")
  ) {
    return {
      titleElementSelector:
        "#history a > div.flex.flex-col.gap-2, #history a > div",
      sidebarContainerSelector: "#history",
      eventTitleAncestor: "a",
    };
  } else if (hostname.includes("gemini.google.com")) {
    return {
      titleElementSelector: "div.conversation-title",
      sidebarContainerSelector: "div.sidenav-with-history-container",
      eventTitleAncestor: "div.conversation-title",
    };
  } else if (hostname.includes("claude.ai")) {
    return {
      titleElementSelector: "nav ul li a, nav ul li a *",
      sidebarContainerSelector: "nav ul",
      eventTitleAncestor: "a",
    };
  }
  return null;
}

function applyInitialBlurAndMark() {
  const selectors = getPlatformSelectors();
  if (!selectors) return;

  const { sidebarContainerSelector, eventTitleAncestor, titleElementSelector } =
    selectors;

  let titleElements = [];
  if (eventTitleAncestor === "a") {
    titleElements = document.querySelectorAll(`${sidebarContainerSelector} a`);
  } else {
    titleElements = document.querySelectorAll(titleElementSelector);
  }

  titleElements.forEach((el) => {
    if (!el.hasAttribute(PROCESSED_ATTR)) {
      el.classList.add(BLUR_CLASS);
      el.setAttribute(PROCESSED_ATTR, "true");
    }
  });
}

function setupEventDelegation() {
  const selectors = getPlatformSelectors();
  if (!selectors) return;

  const container = document.querySelector(selectors.sidebarContainerSelector);
  if (!container) {
    setTimeout(setupEventDelegation, 1000);
    return;
  }

  container.addEventListener("mouseover", (e) => {
    const target = e.target.closest(
      `${selectors.sidebarContainerSelector} ${selectors.eventTitleAncestor}`
    );
    if (target?.hasAttribute(PROCESSED_ATTR)) {
      target.classList.remove(BLUR_CLASS);
    }
  });

  container.addEventListener("mouseout", (e) => {
    const target = e.target.closest(
      `${selectors.sidebarContainerSelector} ${selectors.eventTitleAncestor}`
    );
    if (
      target?.hasAttribute(PROCESSED_ATTR) &&
      !target.contains(e.relatedTarget)
    ) {
      target.classList.add(BLUR_CLASS);
    }
  });
}

function setupMutationObserver() {
  const selectors = getPlatformSelectors();
  if (!selectors) return;

  const container = document.querySelector(selectors.sidebarContainerSelector);

  if (!container) {
    setTimeout(setupMutationObserver, 1000);
    return;
  }

  const observer = new MutationObserver(() => {
    if (window.requestIdleCallback) {
      requestIdleCallback(() => applyInitialBlurAndMark(), { timeout: 500 });
    } else {
      setTimeout(applyInitialBlurAndMark, 100);
    }
  });

  observer.observe(container, { childList: true, subtree: true });
}

function init() {
  injectBlurStyle();
  applyInitialBlurAndMark();
  setupEventDelegation();
  setupMutationObserver();
}

// Ensure DOM is ready, then initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    requestIdleCallback ? requestIdleCallback(init) : setTimeout(init, 300);
  });
} else {
  requestIdleCallback ? requestIdleCallback(init) : setTimeout(init, 200);
}
